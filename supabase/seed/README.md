# Culinse — eigener Rezept-Korpus (Seed)

Erste Charge **eigener Rezepte ohne externe Anbindung**: original geschrieben, zweisprachig (DE + EN), metrisch, mit vorab berechneten Nährwerten. Landet direkt in `user_recipes` — derselben Tabelle, die Editor, Import und Community-Suche schon nutzen.

**Warum das die API-Abhängigkeit löst:** Die Recipe-Detail-API berechnet Nährwerte sonst _lazy über Spoonacular_ (`computeUserRecipeNutrition` → `parseIngredients`). Hier ist `nutrition` schon gesetzt, also wird Spoonacular **nie** aufgerufen. Inhalt, Schritte, Nährwerte — alles aus deiner DB.

## Dateien

| Datei | Zweck |
|---|---|
| `recipes.json` | Quelle der Wahrheit — hier Rezepte pflegen/ergänzen |
| `build_seed.py` | erzeugt `01_seed_recipes.sql` aus `recipes.json` (+ Bilder aus `images.json`) |
| `generate_images.mjs` | erzeugt Rezeptbilder (FLUX, kostenlos), lädt sie in `recipe-media`, schreibt `images.json` |
| `verify_seed.py` | prüft Inhalt + SQL (Makros, Einheiten, jsonb, Postgres-Syntax) |
| `00_add_language.sql` | additive Migration: Spalten `language` + `translation_group` |
| `01_seed_recipes.sql` | **generiert** — das eigentliche Insert-Skript |
| `images.json` | **generiert** — slug → Bild-URL (von `generate_images.mjs`) |

## Einspielen (Supabase SQL Editor)

1. **`00_add_language.sql`** ausführen — fügt zwei Spalten hinzu, ändert nichts Bestehendes.
2. **`01_seed_recipes.sql`** ausführen — legt 8 Rezepte × 2 Sprachen = **16 Einträge** an.

Die Rezepte gehören dem Konto `peter@hoelzer.xyz` (per E-Mail-Lookup im SQL). Andere E-Mail? In `recipes.json` → `author_email` ändern und `python3 build_seed.py` neu laufen lassen.

Alles läuft in einem `DO`-Block: Existiert das Konto nicht, bricht es sauber mit Fehlermeldung ab, statt halb einzuspielen.

## Sichtbarkeit: Entwurf → öffentlich

Die Rezepte kommen als **private Entwürfe** (`is_public = false`) rein — du siehst sie sofort unter **„Meine Rezepte"**, prüfen und kochen kannst du sie direkt.

Für den öffentlichen Discover-Feed brauchen sie ein **Foto** (Suche und Homepage blenden bildlose Rezepte aus — `image_url is not null`). Am einfachsten über `generate_images.mjs` (siehe nächster Abschnitt) — alternativ pro Rezept im Editor ein Foto hochladen.

## Bilder generieren (FLUX, kostenlos)

`generate_images.mjs` erzeugt zu jedem Rezept ein appetitliches Foto mit **FLUX.1 [schnell]**, speichert es lokal in `images/`, lädt es in deinen Supabase-Bucket `recipe-media` (denselben wie der Editor) und schreibt `images.json` (slug → URL). **Ein Bild pro Gericht — DE und EN teilen es sich.** Lokal auf dem Mac ausführen (dort ist Supabase erreichbar).

**Lizenz:** FLUX.1 [schnell] steht unter **Apache 2.0** — die erzeugten Bilder sind **kommerziell frei nutzbar** (anders als Google Imagen oder FLUX.1-dev). Bei Pollinations hängt die Lizenz vom gewählten Modell + deren AGB ab; für die kommerzielle Nutzung ist der Together-Weg mit FLUX.1-schnell die saubere Wahl.

**Zwei Anbieter:**

- **Together AI** (empfohlen, beste Qualität): kostenlosen API-Key auf `together.ai` holen → als `TOGETHER_API_KEY=...` in `.env.local`. Nutzt `FLUX.1-schnell-Free`.
- **Pollinations** (kein Key, sofort): einfach ohne Key laufen lassen — etwas variabler, fair-use-Limits (das Script pausiert automatisch zwischen Bildern).

**Ablauf:**

```bash
# 1. Prompts vorab ansehen (nichts wird erzeugt)
DRY_RUN=1 node supabase/seed/generate_images.mjs

# 2. Erst lokal erzeugen und sichten (kein Upload)
NO_UPLOAD=1 node supabase/seed/generate_images.mjs   # Bilder landen in supabase/seed/images/

# 3. Wenn sie gefallen: erzeugen + in recipe-media hochladen + images.json schreiben
node supabase/seed/generate_images.mjs

# 4. Seed neu bauen — jetzt mit Bildern
python3 supabase/seed/build_seed.py
```

**Optionen (Umgebungsvariablen):**

| Variable | Wirkung |
|---|---|
| `IMAGE_PROVIDER=together\|pollinations` | Anbieter erzwingen (Default: together wenn Key, sonst pollinations) |
| `DRY_RUN=1` | nur Prompts ausgeben |
| `NO_UPLOAD=1` | nur lokal erzeugen, kein Upload / kein `images.json` |
| `ONLY=slug1,slug2` | nur bestimmte Rezepte (nachgenerieren) |
| `UPDATE_DB=1` | `image_url` direkt in `user_recipes` schreiben + `is_public=true` (für bereits eingespielte Rezepte) |

**Öffentlich schalten:** Liegt `images.json` vor und setzt du in `build_seed.py` `PUBLISH_IF_IMAGE = True`, werden Rezepte **mit** Bild direkt `is_public=true` / `published` — die ohne bleiben Entwurf. So schaltest du Charge für Charge live.

Bildformat ist 4:3 (1024×768), passend zu den Rezeptkarten. Stil/Prompt steuerst du oben in `generate_images.mjs` (`STYLE`); pro Rezept lässt sich in `recipes.json` ein `image_prompt` als Override ergänzen.

## Mehr Rezepte (skalieren)

1. In `recipes.json` weitere Einträge nach dem gleichen Schema ergänzen.
2. `python3 verify_seed.py` → Qualität prüfen (sollte „Alle Prüfungen bestanden" zeigen).
3. Bilder für die Neuen: `ONLY=neuer-slug,zweiter-slug node supabase/seed/generate_images.mjs`.
4. `python3 build_seed.py` → neues SQL (mit Bildern).
5. `01_seed_recipes.sql` im SQL Editor ausführen.

Mehrfaches Ausführen legt die Rezepte **erneut** an (keine Dedup). Beim Nachladen nur die _neuen_ Einträge in `recipes.json` lassen oder vorher die alte Charge löschen.

## Zweisprachigkeit & Suche

Jedes Rezept gibt es als DE- und EN-Zeile, verknüpft über `translation_group` (= Slug). Die `language`-Spalte ist gesetzt, aber die Community-Suche filtert noch **nicht** danach — d. h. veröffentlichte Paare würden in beiden Sprachversionen auftauchen.

Sauberer nächster Schritt (kleiner Patch, keine externe Anbindung): in `fetchCommunityMatches` (`app/api/recipes/route.ts`) und `app/api/community-recipes/route.ts` nach Sprache filtern, z. B. `.or('language.eq.' + lang + ',language.is.null')`. Damit sieht jede Sprachversion nur ihre eigenen Rezepte — und Altbestand (language = NULL) bleibt überall sichtbar.

## Hinweis zu `tags`

Das SQL schreibt `tags` als **jsonb** (konsistent mit `ingredients`/`instructions`). Falls dein Schema `tags` als `text[]` führt und der Insert mit einem Typfehler auf `tags` abbricht: in `build_seed.py` `TAGS_AS_JSONB = False` setzen und neu generieren.
