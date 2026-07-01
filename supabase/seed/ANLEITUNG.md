# Schritt-für-Schritt: erste Rezept-Charge live bringen

Ziel: 8 eigene Rezepte (DE+EN) mit Bildern in deine Datenbank — ohne externe Anbindung zur Laufzeit. Alle Befehle im **Terminal**, aus dem Projektordner.

Zuerst einmal ins Projekt wechseln:

```bash
cd ~/Desktop/Culinse
```

Kurz prüfen, dass die Werkzeuge da sind (sollten Versionen ausgeben):

```bash
node --version && python3 --version
```

---

## Schritt 1 — Bild-Anbieter wählen (einmalig)

**Variante A — Together AI (empfohlen, beste Qualität, gratis):**

- [ ] Auf **together.ai** kostenlos registrieren
- [ ] Dort unter **Settings → API Keys** einen Key erstellen und kopieren
- [ ] In die Datei `.env.local` (im Projektordner) unten anhängen:

  ```
  TOGETHER_API_KEY=dein_kopierter_key
  ```

**Variante B — ohne Key (Pollinations):** nichts tun. Das Script nutzt automatisch Pollinations. Etwas variabler, aber sofort startklar.

---

## Schritt 2 — Prompts ansehen (optional, 10 Sekunden)

Zeigt nur, was generiert würde — erstellt noch nichts:

```bash
DRY_RUN=1 node supabase/seed/generate_images.mjs
```

---

## Schritt 3 — Bilder erzeugen

```bash
node supabase/seed/generate_images.mjs
```

Das erzeugt 8 Bilder, lädt sie in deinen `recipe-media`-Bucket und schreibt `images.json`. Die Bilder liegen auch lokal zum Ansehen.

- [ ] Lief durch ohne „FEHLER"-Zeilen

---

## Schritt 4 — Bilder ansehen

Im Finder öffnen:

```bash
open supabase/seed/images/
```

- [ ] Bilder gefallen dir

Eins gefällt nicht? Einzeln neu würfeln (neuer Zufalls-Seed):

```bash
ONLY=spaghetti-carbonara node supabase/seed/generate_images.mjs
```

(Slugs stehen in `recipes.json` bzw. als Dateiname.)

---

## Schritt 5 — Seed-SQL bauen

Zieht die Bild-URLs aus `images.json` in das SQL:

```bash
python3 supabase/seed/build_seed.py
```

- [ ] Ausgabe zeigt „Bilder: 8/8 Rezepte mit Foto"

---

## Schritt 6 — In Supabase einspielen

- [ ] **supabase.com** öffnen → dein Culinse-Projekt → links **SQL Editor**
- [ ] Inhalt von `supabase/seed/00_add_language.sql` einfügen → **Run** (legt 2 Spalten an)
- [ ] Inhalt von `supabase/seed/01_seed_recipes.sql` einfügen → **Run**
- [ ] Unten erscheint die Meldung „✓ 16 Seed-Rezepte … angelegt"

---

## Schritt 7 — In der App prüfen

- [ ] Bei Culinse als **peter@hoelzer.xyz** einloggen
- [ ] Seite **„Meine Rezepte"** öffnen → die 8 Rezepte (je DE+EN) stehen da, mit Bild
- [ ] Ein Rezept öffnen → Zutaten, Schritte und Nährwerte sind da

Sie sind noch **privat** (Entwurf) — du siehst sie, sonst niemand. Spoonacular ist unberührt.

---

## Schritt 8 — Öffentlich schalten (wenn zufrieden)

Damit sie neben den Spoonacular-Rezepten in Suche & Discover auftauchen. Im **SQL Editor** ausführen:

```sql
UPDATE user_recipes
SET is_public = true, status = 'published'
WHERE source_name = 'Culinse' AND source_type = 'created' AND image_url IS NOT NULL;
```

- [ ] Fertig — die Rezepte sind live

> Nur Mut zum langsamen Tempo: Du kannst auch erst 2–3 öffentlich schalten (im Editor pro Rezept den Schalter) und den Rest später.

---

## Wenn etwas klemmt

- **`python3: command not found`** → stattdessen `python` probieren.
- **`Cannot find package '@supabase/supabase-js'`** → einmal `npm install` im Projektordner.
- **Fehler beim 2. SQL auf `tags`** (Typkonflikt) → in `build_seed.py` `TAGS_AS_JSONB = False` setzen, `python3 supabase/seed/build_seed.py` erneut, SQL neu einspielen.
- **`Supabase-Zugang fehlt`** → in `.env.local` müssen `NEXT_PUBLIC_SUPABASE_URL` und `SUPABASE_SERVICE_ROLE_KEY` stehen (dieselben, die das Backup-Script nutzt).
- **Rezepte aus Versehen doppelt** (SQL zweimal eingespielt)? → im SQL Editor: `DELETE FROM user_recipes WHERE source_name = 'Culinse';` und sauber neu einspielen.
