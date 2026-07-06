# Culinse Rezept-Agent

Entkoppelte Worker (Plan v3), die Original-Rezepte inkl. Bild erzeugen und als
Entwurf zur Bestätigung vorlegen. Regeln: `Produkt & Strategie/culinse_rezept_playbook.md`.

```
Scout → Autor → Prüfer → Fotograf → DU (Review) → Distributor
        (KI)   (Gate+Dedup)  (FLUX)
```

Rezepte leben als Datei-Queue in `state/queue/<slug>.json`, bis sie **komplett
(inkl. gesichtetem Bild)** sind — erst dann DB-Insert als Entwurf mit
`pipeline_status='pending_review'`. Keys kommen ausschließlich aus `.env.local`.

## Einmalig

`sql/02_add_pipeline_status.sql` im Supabase SQL-Editor ausführen (additiv, wie `00_add_language.sql`).

## Tageslauf (auf dem Mac, im Repo-Root)

```bash
node recipe-agent/orchestrator.mjs            # Scout → Autor → Prüfer → Fotograf (lokal)
node recipe-agent/sichtung.mjs                # Browser-Sichtung: klicken statt löschen
node recipe-agent/workers/distributor.mjs     # NUR nach Freigabe (approved → published)
```

**Sichtung im Browser (der bequeme Weg):** `node recipe-agent/sichtung.mjs` öffnet
http://127.0.0.1:4711 — dort per Klick: Bilder erzeugen (falls noch keine da),
beste Variante antippen, einzelne Gerichte neu würfeln, dann **Hochladen**
(macht exakt dasselbe wie `UPLOAD=1 photographer.mjs`: Bucket + DB-Entwurf als
`pending_review`). Danach freigeben auf culinse.com/de/admin/review.

**CLI-Fallback:** Der Fotograf erzeugt pro Gericht `VARIANTS` Bilder (Default 3,
`<slug>-v1..3.jpg`). Wahl beim Upload: Klick auf der Sichtungs-Seite ODER
`PICK=<slug>:<n>` ODER schlechte Dateien löschen (die einzige übrige zählt).
3 Varianten × 10 Rezepte ≈ 23 % des Cloudflare-Gratis-Kontingents (~130 Bilder/Tag).

`SCOUT_COUNT=10` für den vollen Tageslauf (Default 1). Stau-Guard: `MAX_OPEN` (Default 15).

## Review (Phase 2)

Admin-Seite **`/de/admin/review`** (hinter Login, noindex). Zugriff haben das
Culinse-Owner-Konto **und** Reviewer aus der Env-Var
`CULINSE_REVIEWER_EMAILS` (kommagetrennte E-Mails, in Vercel + `.env.local`
pflegen; Reviewer brauchen ein normales Culinse-Konto mit genau dieser
E-Mail). Reviewer können freigeben/verwerfen — Bearbeiten bleibt dem Owner
vorbehalten. Die Seite:
zeigt die `pending_review`-Queue mit Bild, Zutaten, Schritten, Nährwerten
(inkl. 4/4/9-Check). **Freigeben** veröffentlicht DE+EN gemeinsam (identisch zum
Distributor), **Verwerfen** setzt `discarded` (bleibt privater Entwurf),
**Bearbeiten** öffnet den normalen Rezept-Editor. Der Distributor-Worker bleibt
für CLI-Freigaben (`approved`) und die spätere Social-Andockung bestehen.

## Autor ohne API-Key (manueller Weg, gleicher Muster-Prompt)

Solange `ANTHROPIC_API_KEY` nicht in `.env.local` steht:

```bash
node recipe-agent/workers/author.mjs --print-prompt        # befüllten Prompt ausgeben
# → in Claude einfügen, Antwort speichern als state/queue/<slug>.response.json
node recipe-agent/workers/author.mjs --ingest <slug>       # einlesen → composed
```

Mit Key läuft `author.mjs` automatisch (Modell via `AUTHOR_MODEL`, Default `claude-sonnet-5`).
Der Muster-Prompt liegt in `prompts/author.md` — Regeln nur dort pflegen.

## Worker einzeln (jeder ist idempotent neu startbar)

| Worker | Übergang | Aufruf |
|---|---|---|
| Scout | (neu) → trend_candidate | `node recipe-agent/workers/scout.mjs` |
| Autor | trend_candidate → composed | `node recipe-agent/workers/author.mjs` |
| Prüfer | composed → ready_for_image \| rejected | `node recipe-agent/workers/checker.mjs` |
| Fotograf | ready_for_image → image_ready → pending_review | s. oben (2 Stufen: lokal, dann `UPLOAD=1`) |
| Distributor | approved → published (DE+EN gemeinsam) | `node recipe-agent/workers/distributor.mjs` |

Status ansehen: `cat recipe-agent/state/queue/<slug>.json` · Logs: `state/log/`.

## Feste Regeln (Kurzfassung — im Zweifel gilt das Playbook)

- Original schreiben, kein Scraping. DE+EN nativ, verknüpft über `translation_group`.
- Metrisch (g/kg/ml/l/Stück/Prise/Zehe/Bund/Dose/Päckchen), `amount` als String.
- Nährwerte pro Portion, 4/4/9-plausibel (±12 %) → kein Spoonacular-Call.
- `tags` = text[] · `source_name='Culinse'` · `source_type='created'` · `status='draft'` · `is_public=false`.
- Bild: Cloudflare FLUX.1-schnell, steps 6, Prompt rein positiv, ein Bild pro Gericht,
  Bucket-Pfad `{user_id}/agent/{slug}.jpg`. **Erst sichten, dann `UPLOAD=1`.**
- Öffentlich wird ein Rezept nur durch Peters Freigabe (approved) + Distributor.
