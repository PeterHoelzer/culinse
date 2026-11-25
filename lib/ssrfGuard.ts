// ── SSRF guard ────────────────────────────────────────────────────────────────
// Validates user-supplied URLs before the server fetches them. A plain
// hostname-regex check is not enough: "http://2130706433/" (decimal),
// "http://0x7f000001/" (hex), "::ffff:127.0.0.1" (v4-mapped IPv6) and domains
// that simply RESOLVE to a private address all reach internal services.
// We therefore resolve the hostname via DNS (getaddrinfo also normalises the
// numeric trick forms) and reject when ANY resolved address is non-public.
// Redirect targets must be re-validated per hop by the caller.
//
// Stand 25.11.2026 (Sicherheitsprüfung):
// - Die Adressprüfung läuft über net.BlockList statt über Textvergleiche. Vorher
//   kam "http://[::ffff:7f00:1]/" durch: Das ist 127.0.0.1 in der Hex-Schreibweise,
//   in die der URL-Parser jede v4-in-v6-Adresse umwandelt.
// - fetchPublicText prüft die Adresse im selben Schritt, in dem die Verbindung
//   aufgebaut wird. Vorher wurde der Name zweimal aufgelöst (prüfen, dann
//   abrufen); ein Angreifer mit eigenem DNS konnte beim zweiten Mal eine interne
//   Adresse liefern (DNS-Rebinding).
// - Der Abruf bricht nach einer festen Datenmenge ab, statt alles in den
//   Speicher zu laden und erst danach zu kürzen.

import { lookup as lookupCallback, type LookupAddress } from "node:dns";
import { lookup } from "node:dns/promises";
import http, { type IncomingHttpHeaders } from "node:http";
import https from "node:https";
import { BlockList, isIP, type LookupFunction } from "node:net";
import { createBrotliDecompress, createGunzip, createInflate } from "node:zlib";

const blocked = new BlockList();
const BLOCKED_V4: [string, number][] = [
  ["0.0.0.0", 8], // "this network"
  ["10.0.0.0", 8], // private
  ["100.64.0.0", 10], // CGNAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local + cloud metadata
  ["172.16.0.0", 12], // private (Docker-Netze liegen hier)
  ["192.0.0.0", 16], // IETF reserved 192.0.0/24 + 192.0.2/24 (docs)
  ["192.168.0.0", 16], // private
  ["198.18.0.0", 15], // benchmarking
  ["198.51.100.0", 24], // docs
  ["203.0.113.0", 24], // docs
  ["224.0.0.0", 3], // multicast, reserved, broadcast
];
const BLOCKED_V6: [string, number][] = [
  ["::", 96], // unspecified, loopback, alte v4-kompatible Adressen
  ["64:ff9b::", 96], // NAT64: zeigt auf eine v4-Adresse
  ["100::", 64], // discard
  ["2001:db8::", 32], // docs
  ["2002::", 16], // 6to4: enthält eine v4-Adresse
  ["fc00::", 7], // unique local
  ["fe80::", 10], // link-local
  ["ff00::", 8], // multicast
];
for (const [net, prefix] of BLOCKED_V4) blocked.addSubnet(net, prefix, "ipv4");
for (const [net, prefix] of BLOCKED_V6) blocked.addSubnet(net, prefix, "ipv6");

/** True für alles, was keine öffentliche Adresse ist; im Zweifel gesperrt. */
export function isPrivateIp(ip: string): boolean {
  const family = isIP(ip);
  if (family === 4) return blocked.check(ip, "ipv4");
  // v4-in-v6 (::ffff:a.b.c.d und ::ffff:hhhh:hhhh) prüft BlockList gegen die v4-Regeln.
  if (family === 6) return blocked.check(ip, "ipv6");
  return true;
}

function isBlockedHostname(host: string): boolean {
  return !host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal");
}

function bareHost(url: URL): string {
  return url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
}

/**
 * True when the URL is http(s) and its host resolves exclusively to public
 * addresses. DNS failures count as unsafe (fetch would fail anyway).
 */
export async function isSafePublicUrl(url: URL): Promise<boolean> {
  if (!/^https?:$/.test(url.protocol)) return false;
  const host = bareHost(url);
  if (isBlockedHostname(host)) return false;
  try {
    const addrs = await lookup(host, { all: true, verbatim: true });
    return addrs.length > 0 && addrs.every((a) => !isPrivateIp(a.address));
  } catch {
    return false;
  }
}

// Namensauflösung für die Verbindung selbst: liefert nur öffentliche Adressen,
// sonst einen Fehler. Damit gilt die Prüfung für genau die Adresse, zu der die
// Verbindung aufgebaut wird.
const guardedLookup: LookupFunction = (hostname, options, callback) => {
  lookupCallback(hostname, { ...options, all: true, verbatim: true }, (err, result) => {
    const addresses = (result ?? []) as LookupAddress[];
    if (err) return callback(err, "", 4);
    if (addresses.length === 0 || addresses.some((a) => isPrivateIp(a.address))) {
      return callback(new Error("Adresse gesperrt"), "", 4);
    }
    if (options.all) return callback(null, addresses);
    callback(null, addresses[0].address, addresses[0].family);
  });
};

export type PublicResponse = { status: number; headers: IncomingHttpHeaders; text: string };

/**
 * Ruft eine fremde Adresse ab, ohne Weiterleitungen zu folgen. Liefert null,
 * wenn die Adresse nicht öffentlich ist, der Abruf scheitert oder zu lange
 * dauert. Der Text endet spätestens nach `maxBytes` (entpackt gezählt).
 */
export async function fetchPublicText(
  url: URL,
  options: { headers?: Record<string, string>; timeoutMs: number; maxBytes: number }
): Promise<PublicResponse | null> {
  if (!(await isSafePublicUrl(url))) return null;
  const client = url.protocol === "https:" ? https : http;

  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: PublicResponse | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      req.destroy();
      resolve(value);
    };

    const req = client.request(
      url,
      {
        method: "GET",
        headers: { ...options.headers, "Accept-Encoding": "gzip, deflate, br" },
        lookup: guardedLookup,
      },
      (res) => {
        const status = res.statusCode ?? 0;
        // Weiterleitungen und Fehler: Kopfzeilen genügen, den Inhalt braucht niemand.
        if (status < 200 || status >= 300) {
          res.resume();
          return finish({ status, headers: res.headers, text: "" });
        }
        const encoding = String(res.headers["content-encoding"] ?? "").toLowerCase();
        const body =
          encoding === "gzip" || encoding === "x-gzip"
            ? res.pipe(createGunzip())
            : encoding === "br"
              ? res.pipe(createBrotliDecompress())
              : encoding === "deflate"
                ? res.pipe(createInflate())
                : res;
        const chunks: Buffer[] = [];
        let size = 0;
        const done = () => finish({ status, headers: res.headers, text: Buffer.concat(chunks).toString("utf8") });
        body.on("data", (chunk: Buffer) => {
          const room = options.maxBytes - size;
          if (chunk.length >= room) {
            chunks.push(chunk.subarray(0, room));
            size = options.maxBytes;
            return done(); // genug gelesen, Verbindung schließen
          }
          chunks.push(chunk);
          size += chunk.length;
        });
        body.on("end", done);
        // Abgebrochene oder kaputt gepackte Antwort: nehmen, was bis dahin da ist.
        body.on("error", () => (size > 0 ? done() : finish(null)));
        res.on("error", () => (size > 0 ? done() : finish(null)));
      }
    );
    const timer = setTimeout(() => finish(null), options.timeoutMs);
    req.on("error", () => finish(null));
    req.end();
  });
}
