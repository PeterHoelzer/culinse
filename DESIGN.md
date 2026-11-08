# Culinse – Design-Richtung (DESIGN.md)

Stand: 08.11.2026 · Status: **Entwurf zur Freigabe durch Peter** (noch nicht umgesetzt)

Grundlage: Bestandsaufnahme der Live-Seite culinse.com am 08.11.2026
(`Notizen/design-bestandsaufnahme-2026-11-08.md`) und Vergleich mit NYT Cooking,
Chefkoch und Kitchen Stories. Diese Datei ist die verbindliche Vorgabe für den
Umbau. Jede Seite und Komponente folgt ihr; Abweichungen werden hier eingetragen,
nicht im Code versteckt.

---

## 0. Die Richtung in drei Sätzen

**Culinse ist eine Rezept-Zeitung, kein SaaS-Dashboard.** Das Essen ist der Held:
große, ruhige Fotos, eine kräftige Serifen-Überschrift, viel Weiß, wenig Chrom.
Orange bleibt die Marke, wird aber zum einen Signal für „hier klicken“ statt zur
Tapete. Es gibt keine Farbverläufe, keine Emojis, keine Schatten-Karten und keine
Pfeile in Buttons mehr.

Das eine Element, in das wir Mut investieren: **die Überschriften-Typografie**
(Source Serif 4, eng gesetzt, sehr groß auf dem Foto). Alles andere bleibt
diszipliniert.

Warum nicht Creme-Hintergrund + Terrakotta (der aktuelle KI-Look)? Weil genau
dieses Trio inzwischen das Erkennungsmerkmal generierter Seiten ist. Wir nutzen
reines Weiß als Bühne, warme Neutraltöne nur für Text und Linien, und Orange
in einer eigenen, dunkleren Nuance, die auf Weiß lesbar ist.

---

## 1. Farbe

Jede Farbe hat eine Rolle. Keine Tailwind-Standardwerte (`orange-500`, `gray-400`)
mehr im Markup; nur die Tokens unten.

### Neutrale Skala (warm, leicht ins Braune)

| Token | Hex | Rolle |
|---|---|---|
| `--c-bg` | `#FFFFFF` | Seitenhintergrund. Immer weiß, keine Creme-Flächen. |
| `--c-bg-soft` | `#FAF7F2` | Einzige getönte Fläche: Zutatenliste, Nährwerte-Block, Fußzeile der Rezeptkarte, Code-/Hinweiskästen. Sparsam. |
| `--c-ink` | `#23201C` | Überschriften, Fließtext. 16,2:1 auf Weiß. |
| `--c-ink-2` | `#5C564E` | Zweittext (Teaser, Beschreibungen). 7,3:1. |
| `--c-ink-3` | `#6F685E` | Metadaten (Zeit, Portionen, Datum, Lesezeit). 5,5:1. Dunkelste erlaubte Stufe für Fließtext-Kleingedrucktes. |
| `--c-line` | `#E6E0D6` | Trennlinien, Kartenränder (rein dekorativ). |
| `--c-line-strong` | `#8A8378` | Rahmen von Eingabefeldern, Icon-Strichfarbe, Fokus-Hilfslinien. 3,75:1 (erfüllt 3:1 für UI). |

Verboten ab sofort: `text-gray-400` (`#9ca3af`, 2,5:1 auf Weiß) als Textfarbe.
Es ist aktuell 143-mal im Code und der häufigste Kontrastfehler der Seite.

### Marke / Aktion

| Token | Hex | Rolle |
|---|---|---|
| `--c-brand` | `#BF4A14` | **Die** Aktionsfarbe: Primär-Button, Links, aktiver Filter-Chip, Logo-Akzent. 4,99:1 mit Weiß in beide Richtungen, also auch als Linktext auf Weiß zulässig. |
| `--c-brand-hover` | `#A33F10` | Hover/Active von Primär-Buttons und Links. |
| `--c-brand-soft` | `#FBEDE4` | Hintergrund für aktiven Chip-Zustand im Stillmodus, Tag „Community“, Info-Hinweise. Text darauf immer `--c-brand` oder `--c-ink`. |
| `--c-brand-on-dark` | `#F3A074` | Orange-Akzent auf dunklen Flächen (Fußzeile, Video-Bereich). 8,2:1 auf `--c-dark`. |

Das bisherige `#f97316` (Tailwind orange-500) entfällt: weißer Text darauf hat
2,8:1 und fällt in jedem Button durch den WCAG-Test. Das Logo-PNG wird einmalig
auf das neue Orange angepasst (SVG liegt in `public/culinse-logo.svg`).

### Akzent

| Token | Hex | Rolle |
|---|---|---|
| `--c-green` | `#3F6B3A` | Einziger Zweitakzent: vegetarisch/vegan-Kennzeichnung, „gespeichert“-Zustand, Erfolgsmeldung. 6,2:1 auf Weiß. |
| `--c-green-soft` | `#EEF3EA` | Hintergrund für grüne Tags; Text darauf `#2F5E2B`. |

Keine weiteren Akzente (kein Violett, Cyan, Rosa). Die sechs Verlaufs-Paletten in
`home-types.ts` (`GRADIENTS`) werden gelöscht.

### Status

| Token | Hex | Rolle |
|---|---|---|
| `--c-error` | `#B3261E` | Fehlertext und -rahmen. |
| `--c-error-soft` | `#FBEAE8` | Fehlerhintergrund. |
| `--c-warn` | `#8A5A00` | Warnhinweis (Quota, Katalog wird aktualisiert). |
| `--c-warn-soft` | `#FBF3E0` | Warnhintergrund. |

### Dunkle Flächen

| Token | Hex | Rolle |
|---|---|---|
| `--c-dark` | `#1F1C19` | Fußzeile, Video-Bereich. Warm-schwarz, kein `gray-900`-Blau. |
| `--c-dark-text` | `#CFC8BE` | Zweittext auf dunkel. 10,2:1. |

Kein Dark Mode in dieser Runde. Die Seite hat keinen und die Fotografie lebt vom
weißen Rahmen. Falls später gewünscht: eigene Tabelle in diesem Abschnitt, nicht
`invert`.

### Verbote

- Keine `linear-gradient`-Hintergründe (aktuell 65 Vorkommen, darunter der Hero,
  der CTA-Block, die Pro-Buttons, der Video-Bereich).
- Keine Farbverlaufs-Platzhalter mit Emoji für fehlende Bilder.
- Orange nie als Flächenfarbe über mehr als eine Button-Breite (Ausnahme: aktiver
  Chip). Der orange Vollflächen-CTA („Entdecke jetzt Rezepte“) entfällt.

---

## 2. Typografie

### Schriftpaar

| Rolle | Schrift | Laden | Warum |
|---|---|---|---|
| Display / Überschriften (h1–h3, Rezepttitel auf Karten, Zahlen in Nährwerten) | **Source Serif 4** (variable, optische Größe) | `next/font/google`, `axes: ['opsz']`, `weight: '500 700'`, `subsets: ['latin','latin-ext','cyrillic','vietnamese']`, `display: 'swap'` | Sturdy, warm, lesbar bei 56 px und bei 20 px dank opsz-Achse. Serifen sind auf echten Food-Seiten (NYT Cooking, Chefkoch) der Standard für Überschriften und trennen Culinse sofort vom SaaS-Look. Gleiche Superfamilie wie die Textschrift, dadurch gleiche x-Höhe und Rhythmus. |
| Text / UI (Fließtext, Buttons, Chips, Formulare, Navigation) | **Source Sans 3** (variable) | `next/font/google`, `weight: '400 700'`, gleiche Subsets | Humanistische Sans mit guten Umlauten und Tabellenziffern (`font-variant-numeric: tabular-nums` für Mengen und Zeiten). Nicht Geist (aktuell), nicht Inter: beides sind Entwickler-Defaults und das derzeit größte „Next.js-Starter“-Signal der Seite. |

Fallbacks: `Georgia, 'Times New Roman', serif` bzw. `system-ui, -apple-system,
'Segoe UI', sans-serif`. Für Bengali, Chinesisch, Japanisch greift die
System-Schrift (Noto Sans / PingFang / Hiragino); die `font-family`-Kette endet
deshalb immer auf `sans-serif`/`serif`, nie auf einer festen Schrift.

### Größenstufen (rem, Basis 16 px)

| Stufe | Größe | Zeilenhöhe | Schrift | Verwendung |
|---|---|---|---|---|
| `display` | 3,5 rem (56 px) mobil 2,25 rem (36 px) | 1,02 | Serif 600, Laufweite −0,02em | h1 auf Start- und Rezeptseite, direkt auf oder neben dem Foto |
| `h1` | 2,5 rem (40 px) mobil 2 rem (32 px) | 1,1 | Serif 600 | Blogartikel-Titel, Seitentitel |
| `h2` | 1,75 rem (28 px) mobil 1,5 rem | 1,2 | Serif 600 | Abschnittstitel („Heute im Trend“, „Zutaten“) |
| `h3` | 1,25 rem (20 px) | 1,3 | Serif 600 | Kartentitel, Teilüberschriften im Artikel |
| `body-lg` | 1,125 rem (18 px) | 1,55 | Sans 400 | Einleitung, Teaser, Zubereitungsschritte |
| `body` | 1 rem (16 px) | 1,55 | Sans 400 | Fließtext, Zutaten, Formulare, Buttons |
| `small` | 0,875 rem (14 px) | 1,45 | Sans 400/600 | Metadaten, Chips, Navigation |
| `caption` | 0,8125 rem (13 px) | 1,4 | Sans 400 | Bildunterschrift, KI-Hinweis, Fußzeile. **Kleinste erlaubte Größe.** |

Aktuell sind `text-xs` (12 px) 224-mal und 9–11 px weitere 17-mal im Einsatz;
alles unter 13 px wird angehoben.

### Regeln

- Zeilenlänge für Fließtext 60–72 Zeichen: Artikel- und Zubereitungsspalte
  `max-width: 38rem` (≈ 68 Zeichen Source Sans bei 18 px).
- Eine Überschrift hat **eine** Farbe. Kein orangefarbener zweiter Halbsatz
  („Rezept, das du liebst.“), kein Hervorheben einzelner Wörter.
- Keine Versal-Eyebrows mit Laufweite (`uppercase tracking-widest`, aktuell 23×).
  Kategorie steht als normales Wort in `small`/`--c-ink-3` über dem Titel.
- Keine Pfeile `→ ↓ ↗` und keine Emojis in Überschriften, Buttons, Labels.
- Zahlen in Mengen, Zeiten, Nährwerten: `tabular-nums`, Einheit mit schmalem
  Leerzeichen („45 Min.“, „4 Portionen“, „66 kcal“).
- Gewichte: nur 400, 600 (Sans) und 600, 700 (Serif). `font-semibold` als
  Default-Gewicht für alles (aktuell 227×) endet; Fließtext ist 400.

---

## 3. Abstände, Raster, Breiten

Eine 4-Pixel-Skala, benannt, nichts dazwischen:

| Token | Wert | Verwendung |
|---|---|---|
| `--s-1` | 4 px | Icon-zu-Text, Chip-Innenabstand vertikal |
| `--s-2` | 8 px | Abstand zwischen Metadaten, Chip-Lücke |
| `--s-3` | 12 px | Karten-Innenabstand klein, Formularfeld vertikal |
| `--s-4` | 16 px | Standard-Innenabstand, Seitenrand mobil |
| `--s-6` | 24 px | Rasterlücke Karten, Absatzabstand |
| `--s-8` | 32 px | Abstand Überschrift → Inhalt |
| `--s-12` | 48 px | Abschnittsabstand mobil |
| `--s-16` | 64 px | Abschnittsabstand Desktop |
| `--s-24` | 96 px | Nur Hero-Unterkante → erster Abschnitt |

- Inhaltsbreite: `--w-content: 72rem` (1152 px, entspricht heutigem `max-w-6xl`),
  Lesebreite `--w-prose: 38rem`. Nur diese zwei; die aktuell elf verschiedenen
  `max-w-*`-Container werden zusammengeführt.
- Seitenrand: 16 px mobil, 24 px Tablet, 40 px Desktop.
- Raster Rezeptkarten: 1 Spalte < 640 px, 2 Spalten < 1024 px, 3 Spalten darüber
  (4 nur in reinen Listenansichten ohne Seitenleiste). Lücke `--s-6`.
- Abschnitte sind **linksbündig** ausgerichtet (Überschrift + Unterzeile links,
  wie bei NYT Cooking und Chefkoch). Nichts mehr `text-center` außer der Suchzeile
  im Hero und Leerzuständen.

---

## 4. Form und Tiefe

| Token | Wert | Verwendung |
|---|---|---|
| `--r-1` | 4 px | Eingabefelder, Tags, Primär- und Sekundär-Buttons |
| `--r-2` | 8 px | Bilder, Rezeptkarten, Hinweiskästen |
| `--r-pill` | 999 px | **Nur** Filter-Chips (horizontale Scrollreihe) und Speichern-Herz |

Weg sind `rounded-2xl`/`3xl` als Default (aktuell 98×) und Pillen-Buttons.

Schatten: genau einer, nur für schwebende Ebenen (Dropdown, Modal, Drawer):
`--shadow-float: 0 8px 24px rgba(35,32,28,.14)`. Karten haben **keinen** Schatten
und **keine** Hover-Anhebung (`translateY(-4px)` in `globals.css` entfällt). Karten
grenzen sich durch Bild + Weißraum ab; ein Rahmen `--c-line` ist nur bei
textlastigen Karten erlaubt (Blog-Übersicht).

---

## 5. Komponenten

### Buttons

| Variante | Aussehen | Zustände |
|---|---|---|
| Primär | Fläche `--c-brand`, Text Weiß 600, Höhe 44 px, Innenabstand 0 20 px, Radius `--r-1` | Hover `--c-brand-hover`; Fokus 2 px Ring `--c-brand` mit 2 px Offset; Disabled Fläche `--c-line`, Text `--c-ink-3`; Loading: Spinner ersetzt Text, Breite bleibt |
| Sekundär | Weiß, 1 px Rahmen `--c-line-strong`, Text `--c-ink` 600 | Hover Fläche `--c-bg-soft`; Fokus wie Primär |
| Leise (Quiet) | Nur Text `--c-brand` 600, kein Rahmen | Hover unterstrichen; Fokus wie Primär |
| Icon-Button | 40 × 40 px, Rahmen wie Sekundär, Icon 20 px, **immer** `aria-label` | Toggle-Zustand (gespeichert): Icon gefüllt in `--c-green` |

Ein Primär-Button pro Sichtbereich. Beschriftung sagt, was passiert („Woche
planen“, „Rezept speichern“, „Suchen“), ohne Pfeil, ohne Emoji, ohne „kostenlos“
als Füllwort im Button (steht daneben als `caption`, wenn nötig).

### Links

Fließtext-Links: `--c-brand`, unterstrichen (`text-underline-offset: 3px`). Navigation
und Kartentitel: `--c-ink`, Hover unterstrichen, kein Farbwechsel ins Orange.

### Eingabefelder

Höhe 44 px, Rahmen 1 px `--c-line-strong`, Radius `--r-1`, Hintergrund Weiß,
Text `--c-ink`, Platzhalter `--c-ink-3`. Fokus: Rahmen `--c-brand` 2 px (ersetzt
den heutigen `box-shadow`-Ring). Jedes Feld hat ein sichtbares `<label>`; Fehler
stehen unter dem Feld in `--c-error` und sind per `aria-describedby` verknüpft.

### Suche (Hero)

Eine Zeile, 56 px hoch, Lupe als Lucide-Icon links, Button „Suchen“ rechts
innerhalb des Feldes. Vorschläge als Liste unter dem Feld mit `--shadow-float`.
Keine „Versuche: …“-Zeile mit orangen Links; stattdessen vier bis sechs
**Chips** (`--r-pill`, Rahmen `--c-line-strong`) darunter.

### Filter-Chips

`--r-pill`, 36 px hoch, Text `small` 600. Inaktiv: Weiß, Rahmen `--c-line-strong`,
Text `--c-ink`. Aktiv: Fläche `--c-brand`, Text Weiß. Keine Emojis vor dem Label
(aktuell 🔥 💪 ⚡ 🥑 🥛 🫒). Höchstens **eine** Chip-Reihe sichtbar; weitere Filter
(Zeit, Diät) hinter einem „Filter“-Button in einem Drawer. Heute sind es drei
Reihen übereinander plus eine vierte bei „Deutsche Küche“.

### Rezeptkarte

```
┌──────────────────────┐
│  Foto 4:3, r-2       │  ♡ (Icon-Button, oben rechts, 40 px)
│                      │
├──────────────────────┤
  Kategorie · Vegetarisch       small, --c-ink-3 (Kategorie als Wort, kein Emoji)
  Rote-Bete-Salat mit           h3 Serif, --c-ink, max 2 Zeilen
  Meerrettich
  45 Min. · 4 Portionen         small, --c-ink-3, tabular-nums
```

Kein Rahmen, kein Schatten, kein „Details →“, kein Quellen-Badge im Bild (Quelle
steht als Wort in der Metazeile: „Culinse“, „Community“). Ganze Karte ist der Link;
Herz ist ein separater Button mit `aria-label`. Fehlt das Bild: Fläche `--c-bg-soft`
mit Lucide-Icon `utensils` in `--c-line-strong`, kein Emoji, kein Verlauf.

### Rezeptseite

1. Foto 3:2 volle Inhaltsbreite, darüber **kein** Badge; KI-Hinweis als `caption`
   unter dem Bild (bleibt, ist Pflicht und Vertrauenssignal).
2. Titel `display` Serif links, darunter Einleitung `body-lg` in `--w-prose`.
3. Metazeile: Zeit · Portionen · Zutaten als Text mit Lucide-Icons, keine
   getönten Kacheln.
4. Aktionsleiste: Primär „Rezept speichern“, Sekundär „Zum Wochenplan“,
   Icon-Buttons Teilen/Drucken. Nicht fünf gleichwertige Pillen.
5. Zwei Spalten ab 1024 px: Zutaten links (sticky, `--c-bg-soft`, Checkboxen),
   Zubereitung rechts (`body-lg`, Schrittnummern als Serif-Ziffer in `--c-ink-3`,
   nicht als oranger Kreis).
6. Nährwerte als schlichte Tabelle unter den Zutaten.

### Navigation

Höhe 64 px, Weiß, 1 px Linie `--c-line` unten, **nicht** halbtransparent mit
Blur. Logo links, Links `small` 600 in `--c-ink`, Sprachwahl als Icon-Button mit
Globus + Kürzel, ein Primär-Button „Anmelden“ (eingeloggt: Avatar). Mobil:
Hamburger-Button mit `aria-label="Menü"` (fehlt aktuell, Lighthouse-Fehler) und
Vollbild-Sheet.

### Fußzeile

`--c-dark`, dreispaltig ab 768 px: Entdecken / Werkzeuge / Rechtliches.
Text `--c-dark-text`, Links Weiß bei Hover. Logo in Weiß mit Akzent `--c-brand-on-dark`.
Copyright `caption`, mindestens `--c-dark-text` (heute `gray-600` mit 2,35:1).

### Zustände

Jede datengetriebene Liste hat vier gestaltete Zustände: Laden (Skeleton in
`--c-bg-soft`, keine Pulsanimation bei `prefers-reduced-motion`), Leer (ein Satz
+ eine Handlung, kein 🍳), Fehler (Satz, was passiert ist, + „Erneut versuchen“),
Erfolg (Toast unten, `role="status"`).

---

## 6. Bild- und Icon-Regeln

- **Icons:** Lucide (ein Set), Strich 1,5 px, Größe 20 px in Text, 24 px in
  Buttons. Dekorative Icons `aria-hidden`. Emojis sind im UI verboten; sie stehen
  aktuell in 15 Dateien (Spitze: Profil 34, Sammlungen 23, Rezeptseite 20) und in
  53 Stellen der deutschen Sprachdatei. Auch in `messages/*.json` werden sie
  entfernt, damit kein Übersetzer sie zurückbringt.
- **Fotos:** Seitenverhältnisse fest: Karte 4:3, Rezept-Hero 3:2, Blog 1,91:1,
  Community-Kachel 1:1. Immer `width`/`height` oder `aspect-ratio` im Markup
  (gegen Layoutsprünge), `loading="lazy"` außer dem ersten sichtbaren Bild,
  Formate AVIF/WebP über den Bilddienst (die drei Video-Poster sind heute
  JPG mit 157–182 KB und kosten mobil ~1,2 s).
- **KI-Bilder:** Die vorhandenen Fotos sind KI-generiert und einheitlich im
  „rustikales Leinen, Seitenlicht“-Stil. Das ist erkennbar und wird zur Regel
  gemacht, nicht versteckt: ein Stil-Prompt im Bild-Workflow (hartes Tageslicht,
  Draufsicht oder 45°, neutraler Untergrund, kein Leinen, kein Dekor-Kräuterzweig),
  und der Hinweis „KI-generiert“ bleibt als `caption` unter dem Bild statt als
  Wasserzeichen im Bild.
- Keine Stock-Illustrationen, keine abstrakten Blob-Formen, kein Logo-Wall.

---

## 7. Bewegung

- Übergänge nur auf `color`, `background-color`, `border-color`, `opacity`
  und `transform`; Dauer 150 ms (Hover) bzw. 200 ms (Öffnen/Schließen),
  `ease-out`.
- Keine Hover-Anhebung, kein `scale` auf Karten oder Buttons (aktuell 5 Stellen
  plus die `.recipe-card:hover`-Regel).
- Eine einzige nicht-ausgelöste Bewegung ist erlaubt: der Skeleton-Puls beim
  Laden. Alles andere antwortet auf eine Handlung (Drawer schiebt, Toast fährt ein,
  Herz füllt sich).
- `@media (prefers-reduced-motion: reduce)` schaltet alle Übergänge auf 0 ms.
  Aktuell gibt es diese Abfrage nirgends im Code.
- `scroll-behavior: smooth` nur innerhalb von `prefers-reduced-motion: no-preference`.

---

## 8. Ton der Texte

Die Stimme ist Peter: Fleischermeister und Küchenchef, der erklärt, wie man es
macht. Knapp, konkret, ohne Marketing-Dampf.

- Sätze statt Schlagwort-Ketten. „Rezepte aus deiner Küche, deinem Supermarkt
  und deiner Familie“ statt „Kostenlos nutzbar · Keine Werbebanner · Echte
  Discounter-Preise“.
- Keine Häkchen-Reihen (`✓ ✓ ✓`), keine Badges mit Selbstlob („Entwickelt von einem
  Fleischermeister & Küchenchef“ wird ein Satz im Über-uns-Teaser, nicht ein Pill).
- Buttons nennen die Handlung in zwei bis drei Wörtern, konsistent über den
  ganzen Ablauf („Rezept speichern“ → Toast „Gespeichert“).
- Zahlen nur, wenn sie stimmen und wehtun würden, wenn sie fehlen: „993 Rezepte“
  statt „Millionen Rezepte aus den besten Food-Seiten der Welt“ (die Zahl
  „Millionen“ ist aktuell dreimal auf der Startseite und stimmt nicht mit dem
  Katalog überein).
- Leerzustände laden ein („Noch nichts gespeichert. Tippe auf das Herz bei einem
  Rezept.“), Fehler sagen, was war und was hilft.
- Deutsch zuerst schreiben, dann übersetzen. Mitteldots „·“ nur in Metazeilen,
  Gedankenstriche sparsam, nie als Satzschmuck.

---

## 9. Umsetzung im Code (Kurzregel)

- Tokens leben in `app/globals.css` im Tailwind-v4-Block `@theme { --color-brand: …;
  --font-display: …; --radius-1: …; }`, damit `bg-brand`, `font-display`,
  `rounded-1` als Klassen entstehen. Keine Hex-Werte im Markup (aktuell 102
  Inline-`#f97316`).
- Schriften über `next/font/google` im Locale-Layout mit `variable:` und in
  `@theme` als `--font-sans`/`--font-display` referenziert.
- Komponenten für Button, Chip, Input, RecipeCard, SectionHeader, EmptyState in
  `components/ui/`; bestehende Seiten werden darauf umgestellt statt neue Varianten
  zu bekommen.
- Vor jedem Merge: Lighthouse Mobile Accessibility ≥ 95, keine `color-contrast`-
  Fehler, kein `button-name`-Fehler; Screenshots bei 375/768/1440 angesehen.

---

## 10. Nachtrag 08.11.2026: Hero nur Foto

Nach Peters Rückmeldungen („zu weiß, zu plain; schau dir Apple an; der graue Teil ist zu düster; können wir nur das Bild nehmen?“) ist der Startseiten-Hero **ein einziges Foto über die volle Breite** (70–78 vh). Titel, Metazeile und zwei Buttons liegen unten links direkt auf dem Foto, lesbar durch einen Schleier von unten (`--c-dark` 90 % → transparent). Das ist die eine Ausnahme vom Verlaufsverbot: der Schleier dient der Lesbarkeit, nicht der Dekoration. Der KI-Hinweis steht oben rechts im Bild in `caption`. Das Foto blendet beim Laden in 900 ms ein (`.animate-hero-in`, bei `prefers-reduced-motion` aus). Die Suche folgt zentriert auf Weiß direkt darunter.

Rhythmus der Startseite: Hero-Foto → Suche weiß → Rezeptkarten weiß (9) → Familienrezepte dunkles Band mit vier Fotos → Kochschule weiß mit großem Hauptvideo → So funktioniert warm → Newsletter weiße Box → Fußzeile dunkel. Abschnittstitel tragen einen 40 × 3 px Markenstrich. Dieselbe Logik gilt künftig für das Rezeptfoto auf der Rezeptseite.
