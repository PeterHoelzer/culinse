# Website-Verbesserungsplan — Live-Review 26.07.2026

Grundlage: kompletter Desktop-Durchgang der Live-Site (eingeloggt), GSC-Daten vom 20.07., bekannte Mobil-Befunde vom 17.07.

> **Stand 26.07. abends: Paket A komplett live (Commit ca713cb) ✓ · B6 Navbar komplett live (Commit 5259b03) ✓ — Voll-Leiste erst ab 1024px (darunter Burger), ein Primär-Button, „Über uns" nur noch Footer/Menü, kurze Labels. Nächster Schritt: C10 Rezeptseiten.**

> **Update 26.07. spät: C10 Rezeptseiten LIVE (security-hardening 3afdd27 → main c0b8045) ✓ — „Ähnliche Rezepte“-Sektion (server-gerendert via /api/similar-recipes: Korpus/Community zuerst per Tag- und Titel-Match, bei Spoonacular-IDs +3 Provider-Rezepte, DE-Titel aus Übersetzungs-Cache) und Sticky „+ In den Wochenplan“-Button (erscheint ab 250 px Scroll, AddToPlanModal wie Video-Karten, Login-Gate) auf allen Rezeptseiten DE+EN. Nächster Schritt: B9 Video-Titel.**

> **Update 27.07. abends: B9 Video-Titel LIVE (10a7514 → main b78a2e4) — /api/videos und /api/tasty-related übersetzen Tasty-Titel bei lang=de über den Übersetzungs-Cache; VideoSection und Rezept-Carousel angebunden, live verifiziert (deutsche Titel). Zusätzlich GSC-Empfehlung vom Montags-Lauf umgesetzt: In-Text-Anchor „Einkaufsrechner für Lebensmittel“ im Artikel einkaufsliste-fuer-die-woche-erstellen → /de/grocery-list-calculator (die frisch indexierten Rechner-LPs sollen das Query-Cluster übernehmen). Nächster Schritt: C12 Onboarding-Wizard.**

> **Update 27.07. spät: C12 Onboarding-Wizard LIVE (ca954fe → main af21787) — neue Route /onboarding (Middleware-geschützt, noindex): Schritt 1 Ernährungsweise (schreibt user_preferences mit den Profil-Werten → personalisiert ForYou; die Zeile markiert zugleich „onboarded“ für den Auth-Callback), Schritt 2 fünf Korpus-Vorschläge via /api/similar-recipes als Abendessen Mo–Fr in den Wochenplan (legt „Mein Wochenplan“ an, falls keiner existiert; Woche = aktueller Montag wie AddToPlanModal), Schritt 3 ShoppingListDrawer mit der fertigen Einkaufsliste. Einstiege: Signup mit Sofort-Session (LoginClient) und E-Mail-Bestätigung (auth/callback, ersetzt /profile?welcome=1). Live verifiziert DE+EN: Render Schritt 1, Middleware-Redirect für Anonyme, Vorschlags-API (vegan/quick je 5 Treffer). Schreibpfade (prefs-Upsert, meal_plans/meal_plan_entries) bewusst nicht am Live-Account getestet — folgen 1:1 den AddToPlanModal-/Profil-Mustern. Nächster Schritt: C11 Wochenplan-Sharing.**

> **Update 31.07.: C13 CWV-Runde LIVE (df7320f → main 505f031) — erster Lighthouse-Lauf überhaupt (mobil): SEO 100, Best Practices 96, aber LCP Startseite 7,5 s und Rezeptseite 15,4 s. Ursache: Supabase Storage lieferte Original-Uploads (~800 KB pro Bild, Rezeptseite lud 4–5 MB). Fix: lib/imageUrl.ts biegt alle Anzeige-URLs auf die Supabase-Render-API um (gemessen 822 → 138 KB; Hero width=1200, Karten width=640 — greift in /api/recipe, /api/similar-recipes, /api/community-recipes und damit auch in Schema-/og-Bildern), dazu preconnect auf die Bild-CDNs im Layout, fetchpriority=high auf den Rezept-Hero, erste 3 Discover-Karten eager, und die stale public/robots.txt ist aus dem Repo entfernt (app/robots.ts ist die einzige Quelle). Zwischenmessung direkt nach Deploy: Rezept-LCP 15,4 → 6,9 s, Speed Index 4,5 → 2,8 s — Alt-Bilder hängen noch bis zu 24 h im ISR-Data-Cache (übersteht Deploys!); frisch gerenderte Seiten liefern ausschließlich Render-URLs (verifiziert). Nachmessung beim GSC-Lauf 03.08. Außerdem: searchfit-seo-Plugin (offizieller Anthropic-Marketplace) installiert — zweites SEO-Toolkit neben marketing-skills. Nächster Schritt: C11 Wochenplan-Sharing.**

## Paket A — Quick Wins (sofort umsetzbar, je < 30 Min) → ERLEDIGT ✓

1. **Footer-Logo ist ein weißer Klotz.** `culinse-logo.png` hat weißen Hintergrund und liegt auf dunklem Footer — wirkt kaputt. Fix: Text-Wortmarke („culi" weiß + „nse" orange) statt PNG.
2. **Eingeloggte sehen „Kostenloses Konto erstellen".** Der Schluss-CTA der Startseite ignoriert den Login-Status. Fix: eingeloggt → „Öffne deinen Wochenplaner →".
3. **Hero-Redundanz.** Unter der Trust-Zeile („✓ Kostenlos nutzbar · ✓ Keine Werbebanner · ✓ Echte Discounter-Preise") wiederholt die Quellen-Zeile „Kostenlos nutzbar · Keine Werbebanner". Fix: Duplikat aus der Quellen-Zeile entfernen.
4. **Absurde Zeiten auf Video-Karten.** „250 min" / „195 min" (Gefrier-/Ruhezeiten) schrecken ab und wirken wie Bugs. Fix: Zeit-Badge nur bis 90 Min anzeigen.
5. **„Sofort einkaufen — Demnächst" in How-it-works.** Ein Drittel der Sektion bewirbt ein nicht existierendes Feature. Fix: Kachel ersetzen durch das echte Alleinstellungsmerkmal „Einkaufsliste mit €-Summe — automatisch aus deinem Wochenplan, mit echten Discounter-Preisen".

## Paket B — Mittlere Pakete (je ~1 Arbeitssitzung)

6. **Navbar verdichten.** „Über uns", „Meine Rezepte", „♥ Gespeichert" brechen zweizeilig um (schon bei 1456 px; bekannter Randfall 900–1100 px). Vorschlag: kürzere Labels („Über", „Rezepte", „♥"), „Über uns" nur im Footer, EIN Primär-Button (Wochenplaner) statt zwei konkurrierender Buttons — Sammlungen als normaler Link.
7. **Quellen-Badges harmonisieren.** „blogspot.com" als Badge wirkt billig neben „Culinse"/„Full Belly Sisters". Mapping auf lesbare Blog-Namen bzw. Fallback „Food-Blog".
8. **Filter-Wildwuchs im Trend-Block.** Drei Chip-Reihen (Themen + Küche + Zeit/Diät) über nur 6 Karten. Vorschlag: eine Reihe Kern-Chips, Rest hinter „Filter"-Button ausklappbar.
9. **Video-Titel eindeutschen.** Tasty liefert EN-Titel auf der DE-Seite („One-Pot Bacon And Wild Mushroom Risotto"). Die vorhandene Übersetzungs-Route (MyMemory + Cache aus der i18n-Vorbereitung) auf die Video-Titel anwenden.

## Paket C — Größere Chancen (je 1–2 Sitzungen, nach Wirkung priorisiert)

10. **Rezeptseiten als Landeseiten ernst nehmen.** GSC zeigt: Rezept-Long-Tail wächst (Community-Rezept auf Pos 5,5 mit 50 % CTR). Ausbau: „Ähnliche Rezepte"-Sektion (interne Links + Verweildauer), Sticky-Button „+ In den Wochenplan" beim Scrollen, ggf. Kommentar-/Bewertungsfunktion später.
11. **Wochenplan-Sharing (viraler Loop).** Öffentliche Plan-URL mit OG-Bild („Meine Woche für 26,50 €") — jede geteilte Woche ist Werbung mit eingebautem Preis-USP.
12. **Onboarding-Wizard nach Signup.** Neue Nutzer landen aktuell ohne Führung. 3-Schritte-Wizard: Ernährungsweise wählen → 5 Vorschläge in den Plan → fertige Einkaufsliste zeigen. Verwandelt Signups in aktive Planer-Nutzer.
13. **Core Web Vitals prüfen.** GSC-Bereich bisher nicht ausgewertet; Startseite lädt viele Sektionen. Einmal Lighthouse/CWV-Report ziehen, Bilder-Lazy-Loading und Payload checken.

## Empfohlene Reihenfolge
Paket A sofort (passiert direkt) → B6 Navbar (nervt sichtbar auf jeder Seite) → C10 Rezeptseiten (größter SEO-Hebel laut GSC) → B9 Video-Titel → C12 Onboarding → C11 Sharing → B7/B8 kosmetisch → C13 als Prüfpunkt in den GSC-Montags-Task.
