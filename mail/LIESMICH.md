# Mails von culinse.com

Stand 17.11.2026. Die Vorlagen sind seit 17.11.2026, 12:15 Uhr, auf dem Server.
Peter hat eine Probe-Mail im Postfach angesehen und für gut befunden; die alte
Vorlage `email-confirm.html` ist vom Server gelöscht. Nicht ausdrücklich geprüft
sind die englische Passwort-Mail und eine Registrierung mit echter
Bestätigungs-Mail.

## Welche Mails es gibt

Alle Mails an Besucher kommen vom Anmeldedienst (GoTrue `v2.197.0`, eigener
Server, `/opt/supabase`). Versand über Resend, Absender „Culinse“
`noreply@culinse.com`. Die Website selbst verschickt keine Mails: Der Newsletter
speichert nur Adressen, Rechnungen kämen von Stripe, die Störungs-Mails der
Überwachung gehen nur an Peter.

| Vorlage | Wann | Wird heute ausgelöst von |
|---|---|---|
| `confirmation` | nach der Registrierung mit E-Mail und Passwort | `app/[locale]/login/LoginClient.tsx` |
| `recovery` | „Passwort vergessen“ | `app/[locale]/reset-password/page.tsx` |
| `magic_link` | Anmelden per Link ohne Passwort | nichts auf der Website (über die Schnittstelle des Dienstes möglich) |
| `email_change` | E-Mail-Adresse des Kontos ändern | nichts auf der Website |
| `invite` | Einladung aus der Verwaltung | nichts auf der Website |
| `reauthentication` | Code zur Bestätigung heikler Änderungen | nichts auf der Website |

Die vier unteren sind mitgestaltet, damit nie eine englische Standard-Mail ohne
Culinse-Aussehen ankommt. Die Hinweis-Mails des Dienstes („Passwort wurde
geändert“ und ähnliche) sind ausgeschaltet und haben keine Vorlage.

## Aufbau

| Ort | Inhalt |
|---|---|
| `texte/<sprache>.json` | Texte je Sprache. Deutsch zuerst schreiben, dann die anderen 15 nachziehen. |
| `gerichte.json` | je Mail ein Foto, dessen Farben nach der Regel aus `lib/dishColor.ts` und der Name des Gerichts in allen Sprachen |
| `bauen.mjs` | erzeugt daraus die Vorlagen |
| `vorlagen/<mail>.html` | erzeugt: eine Vorlage je Mail, alle 16 Sprachen darin |
| `vorlagen/mailer.env` | erzeugt: Betreffzeilen und Adressen der Vorlagen für den Anmeldedienst |
| `text/<sprache>/<mail>.txt` | erzeugt: reine Textfassung (siehe „Grenzen“) |
| `pruefen.go` | füllt Vorlagen und Betreff genau wie der Anmeldedienst und prüft das Ergebnis |
| `vorschau.mjs` | Vorschaubilder: Desktop und Handy, hell und dunkel |
| `../public/mail/` | Fotos und die Schrift Fraunces (Lizenz: `Fraunces-OFL.txt`) |

```bash
node mail/bauen.mjs        # nach jeder Textänderung
go run mail/pruefen.go     # muss "Alles in Ordnung" melden
node mail/vorschau.mjs     # Bilder nach mail/vorschau/ (de); andere Sprache: node mail/vorschau.mjs ja
```

In den Texten sind `" \ ` $ < > { }` und Zeilenumbrüche nicht erlaubt (`bauen.mjs`
bricht sonst ab).

## Aussehen

Nach `DESIGN.md` §11: Jede Mail zeigt ein Gericht und trägt dessen Farbe. Oben
das Foto, darunter die Bühne in der dunklen Farbe des Gerichts mit Titel in
Fraunces, weißem Knopf und den zwei großen Zahlen (24 Stunden gültig, einmal
verwendbar). Darunter auf Weiß der Link als Text, der Hinweis und die Fußzeile.
Im dunklen Modus wird nur der weiße Teil dunkel.

Fraunces sehen Apple Mail (Mac, iPhone, iPad) und Thunderbird. Gmail, Outlook,
GMX und Web.de zeigen die Überschrift in Georgia. Kyrillisch, Chinesisch,
Japanisch und Bengalisch fallen wie auf der Website auf Systemschriften zurück.

## Sprache

Die Vorlage wählt die Sprache selbst:

1. `recovery`: Sprache der Seite, auf der das Passwort angefordert wurde. Die
   Seite gibt `https://culinse.com/<sprache>/update-password` als Rücksprung mit,
   die Vorlage erkennt die Sprache daran.
2. Sonst: `locale` in den Angaben des Kontos. Die Registrierung trägt dort die
   Sprache der Seite ein (`LoginClient.tsx`).
3. Fehlt beides (Konten von vor dem 17.11.2026, Google-Konten): Englisch, wie
   die Website.

## Platzhalter

Unverändert vom Anmeldedienst übernommen: `{{ .ConfirmationURL }}` (Knopf und
Link als Text), `{{ .Token }}` (Code), `{{ .Email }}`, `{{ .NewEmail }}`. Der
Link in der Bestätigungs-Mail führt weiter über `/auth/callback` zurück; die
Rücksprung-Adresse der Registrierung ist nicht angefasst.

## Auf den Server bringen

So ist es am 17.11.2026 gelaufen; für spätere Textänderungen reicht Schritt 3.
Schritt 2 und 3 ändern den Server und brauchen Peters Ja. Sicherungen der alten
Fassung: `/root/umzug/mail-vorlagen-vor-umstellung-2026-11-17-121450` und
`/root/umzug/mail-vorlagen-2026-11-17-121531`.

1. **Push auf `main`** (Peter). Danach liegen Fotos und Schrift unter
   `https://culinse.com/mail/…`, und die Website gibt die Sprache mit. An den
   Mails ändert das noch nichts.
2. **Einmalig auf dem Server**, in `/opt/supabase/docker-compose.culinse.yml`
   beim Dienst `auth`: die zwei Zeilen `GOTRUE_MAILER_SUBJECTS_CONFIRMATION` und
   `GOTRUE_MAILER_TEMPLATES_CONFIRMATION` samt ihrem Kommentar entfernen und
   stattdessen eintragen:

   ```yaml
   auth:
     env_file:
       - ./mailer-culinse.env
   ```

   Vorher `touch /opt/supabase/mailer-culinse.env`, sonst startet beim nächsten
   `docker compose up` nichts. Sicherung der alten Datei nach `/root/umzug/`.
   Erledigt am 17.11.2026.
3. **Einspielen** vom Mac:

   ```bash
   deploy/mail-vorlagen-einspielen.sh               # zeigt nur, was sich ändern würde
   deploy/mail-vorlagen-einspielen.sh --ausfuehren  # kopiert, vergleicht, startet den Anmeldedienst neu
   ```

   Der Anmeldedienst ist dabei wenige Sekunden nicht erreichbar. Das Skript
   sichert die alte Fassung und spielt sie zurück, wenn die Einstellungen nicht
   Zeichen für Zeichen dem Repo entsprechen.
4. **Probe** mit echten Mails an eine eigene Adresse: „Passwort vergessen“ auf
   `/de/reset-password` und auf `/en/reset-password`, dazu eine Registrierung
   mit einer zweiten Adresse. Prüfen: Betreff und Text in der richtigen Sprache,
   Foto und Schrift geladen, Knopf führt zurück auf die Website.
5. Aufräumen: `/opt/supabase/mail-vorlagen/email-confirm.html` löschen, den
   Stand im Drehbuch im Vault nachtragen. Erledigt am 17.11.2026.

Spätere Textänderungen brauchen nur noch Schritt 3. Ändern sich nur die
`.html`-Dateien, lädt der Anmeldedienst sie binnen 10 Minuten selbst neu; neue
Betreffzeilen brauchen den Neustart, den das Skript dann macht.

Im Ordner `/opt/supabase/mail-vorlagen/` liegt auch die `robots.txt` der
Daten-Adresse (nur sie ist von außen erreichbar). Nicht löschen.

Rückweg: die gesicherte `docker-compose.culinse.yml` zurückkopieren und
`docker compose up -d auth`. Ist eine Vorlage nicht lesbar, verschickt der Dienst
von sich aus die englische Standard-Mail; es geht also keine Mail verloren.

## Grenzen

- **Keine Textfassung im Versand.** Der Anmeldedienst verschickt nur HTML
  (`mail.SetBody("text/html", …)` in `mailmeclient.go`). Die Dateien unter
  `text/` sind fertig, gehen aber erst hinaus, wenn die Website die Mails selbst
  verschickt („Send Email Hook“ des Dienstes plus Resend-Schnittstelle).
- **Kein Sonderweg für das alte Outlook für Windows.** `html/template` entfernt
  HTML-Kommentare, also auch die Outlook-Weichen. Die Mail ist dort lesbar, läuft
  aber über die ganze Fensterbreite. Nicht getestet.
- **Getestet ist nur die Vorschau in Chrome** sowie das Füllen der Vorlagen mit
  der Technik des Dienstes. Auf dem Server geprüft: Der Dienst läuft, erreicht
  alle sechs Vorlagen und hat die Betreffzeilen übernommen. Echte Postfächer (Apple Mail, Gmail, GMX, Outlook)
  kommen in Schritt 4.
- **Gültigkeit 24 Stunden** steht fest in den Texten und in `bauen.mjs`
  (`STUNDEN`). Sie gilt, solange `GOTRUE_MAILER_OTP_EXP` nicht gesetzt ist.
- Die 14 Übersetzungen sind maschinell entstanden und von keinem Muttersprachler
  gelesen.
