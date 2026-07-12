// ── SSRF guard ────────────────────────────────────────────────────────────────
// Validates user-supplied URLs before the server fetches them. A plain
// hostname-regex check is not enough: "http://2130706433/" (decimal),
// "http://0x7f000001/" (hex), "::ffff:127.0.0.1" (v4-mapped IPv6) and domains
// that simply RESOLVE to a private address all reach internal services.
// We therefore resolve the hostname via DNS (getaddrinfo also normalises the
// numeric trick forms) and reject when ANY resolved address is non-public.
// Redirect targets must be re-validated per hop by the caller.

import { lookup } from "node:dns/promises";

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  const [a, b] = parts;
  return (
    a === 0 || // "this network"
    a === 10 || // private
    a === 127 || // loopback
    (a === 100 && b >= 64 && b <= 127) || // CGNAT 100.64/10
    (a === 169 && b === 254) || // link-local + cloud metadata
    (a === 172 && b >= 16 && b <= 31) || // private
    (a === 192 && b === 168) || // private
    (a === 192 && b === 0) || // IETF reserved 192.0.0/24 + 192.0.2/24 (docs)
    (a === 198 && (b === 18 || b === 19)) || // benchmarking
    a >= 224 // multicast, reserved, broadcast
  );
}

function isPrivateIp(ip: string): boolean {
  const lower = ip.toLowerCase();
  const v4mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (v4mapped) return isPrivateIPv4(v4mapped[1]);
  if (lower.includes(":")) {
    return (
      lower === "::" ||
      lower === "::1" ||
      lower.startsWith("fc") || // ULA fc00::/7
      lower.startsWith("fd") ||
      /^fe[89ab]/.test(lower) // link-local fe80::/10
    );
  }
  return isPrivateIPv4(lower);
}

/**
 * True when the URL is http(s) and its host resolves exclusively to public
 * addresses. DNS failures count as unsafe (fetch would fail anyway).
 */
export async function isSafePublicUrl(url: URL): Promise<boolean> {
  if (!/^https?:$/.test(url.protocol)) return false;
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!host || host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) {
    return false;
  }
  try {
    const addrs = await lookup(host, { all: true, verbatim: true });
    return addrs.length > 0 && addrs.every((a) => !isPrivateIp(a.address));
  } catch {
    return false;
  }
}
