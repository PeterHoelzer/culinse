# Website-Verbesserungsplan — Live-Review 26.07.2026

Grundlage: kompletter Desktop-Durchgang der Live-Site (eingeloggt), GSC-Daten vom 20.07., bekannte Mobil-Befunde vom 17.07.

## Paket A — Quick Wins (sofort umsetzbar, je < 30 Min) → WIRD DIREKT UMGESETZT

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
