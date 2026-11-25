# Mit Apple anmelden

Stand 25.11.2026. Besucher können sich auf culinse.com mit ihrem Apple-Konto
anmelden, neben E-Mail mit Passwort und Google. Es geht mit dem eigenen
Anmeldedienst (GoTrue v2.197.0 auf `daten.culinse.com`) ohne Zusatzdienst und
ohne Skript von Apple: Der Besucher wird zu Apple weitergeleitet und kommt
angemeldet zurück.

Der Code ist fertig. Der Knopf bleibt unsichtbar, bis Apple am Server
eingeschaltet ist. Es fehlen nur Peters Schritte unten.

## Was Peter tut

Reihenfolge egal bis auf eines: Schritt 2 braucht die Angaben aus Schritt 1.
Den Push (Schritt 3) kann man jederzeit machen, er zeigt vorher nichts Neues.

### 1. Im Apple-Entwicklerportal (in Chrome)

Adresse: <https://developer.apple.com/account/resources/identifiers/list>

**a) App-ID anlegen** (Apple verlangt eine „Haupt-App“, an der die
Website-Anmeldung hängt; es muss keine echte App dahinterstehen. Nicht die IDs
von Copper City oder Kernfusion verwenden, die bleiben unberührt.)

1. Identifiers, Plus-Knopf, „App IDs“, Continue, „App“, Continue.
2. Description: `Culinse`
3. Bundle ID, „Explicit“: `com.culinse.site`
4. In der Liste „Capabilities“ den Haken bei **Sign in with Apple** setzen.
5. Continue, Register.

**b) Services-ID anlegen** (das ist die Kennung der Website)

1. Identifiers, Plus-Knopf, „Services IDs“, Continue.
2. Description: `Culinse` (diesen Namen sehen Besucher im Apple-Fenster)
3. Identifier: `com.culinse.web`
4. Continue, Register. Danach die neue Zeile anklicken.
5. Haken bei **Sign in with Apple**, daneben „Configure“.
6. Primary App ID: `Culinse (com.culinse.site)`
7. Domains and Subdomains: `daten.culinse.com, culinse.com`
8. Return URLs: `https://daten.culinse.com/auth/v1/callback`
9. Next, Done, Continue, Save.

**c) Schlüssel anlegen**

1. Links „Keys“, Plus-Knopf.
2. Key Name: `Culinse Anmeldung`
3. Haken bei **Sign in with Apple**, daneben „Configure“, Primary App ID
   `Culinse (com.culinse.site)` wählen, Save.
4. Continue, Register, **Download**. Die Datei heißt `AuthKey_XXXXXXXXXX.p8`
   und landet im Ordner Downloads. Apple gibt sie nur dieses eine Mal heraus.
   Nicht umbenennen, nicht öffnen, nicht verschicken.

**d) Team-ID ablesen**: oben rechts unter dem Namen oder unter „Membership
details“. Zehn Zeichen, Großbuchstaben und Ziffern.

**e) Mail-Absender eintragen** (sonst kommen Culinse-Mails bei Besuchern nicht
an, die bei Apple „E-Mail-Adresse verbergen“ wählen)

1. Links „Services“, bei „Sign in with Apple for Email Communication“ auf
   „Configure“.
2. Bei „Email Sources“ den Plus-Knopf.
3. Domains and Subdomains: `culinse.com, send.culinse.com`
4. Next, Register. In der Liste muss bei beiden „SPF“ grün sein.

### 2. Am Mac im Terminal, im Projektordner

Erst ansehen, was der Server heute eingestellt hat (liest nur, zeigt keine
Geheimnisse):

```bash
deploy/apple-anmeldung.sh stand
```

Dann einrichten. `XXXXXXXXXX` und `TEAMID` durch die eigenen Werte ersetzen:

```bash
deploy/apple-anmeldung.sh einrichten ~/Downloads/AuthKey_XXXXXXXXXX.p8 TEAMID
```

Das Skript erzeugt das „Client Secret“, lässt es von Apple prüfen, trägt es ein
und startet nur den Anmeldedienst neu (wenige Sekunden ohne Anmeldung). Lehnt
Apple ab oder stimmt etwas nicht, bleibt alles, wie es war. Am Ende steht
„Fertig“.

Danach die .p8-Datei sichern, dann darf sie aus Downloads in den Papierkorb:

```bash
deploy/schluessel-sichern.sh
```

### 3. Push

Den Stand mit dem Knopf auf `main` bringen (Befehl steht im Bericht der
Sitzung). Nach der Auslieferung, rund fünf Minuten, ist der Knopf da.

### 4. Prüfen

1. <https://culinse.com/de/login> öffnen: Unter „Mit Google fortfahren“ steht
   „Mit Apple anmelden“.
2. Klicken, bei Apple anmelden, „E-Mail teilen“ wählen. Man landet angemeldet
   auf Culinse (beim ersten Mal in der Einrichtung des Profils).
3. Abmelden, noch einmal mit Apple anmelden: kein Apple-Fenster mit Fragen mehr,
   gleiches Konto.
4. `deploy/apple-anmeldung.sh stand` zeigt „Apple eingeschaltet: true“ und das
   Ablaufdatum.

Wenn es hakt:

| Was man sieht | Ursache |
|---|---|
| Kein Knopf auf der Login-Seite | Stand noch nicht ausgeliefert, oder Apple am Server nicht eingeschaltet (`stand` zeigt es) |
| Apple-Seite meldet „invalid_request“ oder „Invalid web redirect url“ | Return URL in der Services-ID ist nicht genau `https://daten.culinse.com/auth/v1/callback` |
| Apple-Seite meldet „invalid_client“ | Services-ID vertippt oder noch nicht gespeichert |
| Zurück auf Culinse, aber nicht angemeldet | `ssh culinse docker logs --tail 50 supabase-auth` zeigt den Grund |
| Das Skript meldet „Apple lehnt das Client Secret ab“, obwohl Team-ID, Services-ID und Schlüssel stimmen | Vorprüfung überspringen: denselben Befehl mit `com.culinse.web ohne-probe` am Ende. Scheitert danach die echte Anmeldung: `deploy/apple-anmeldung.sh abschalten` |

## Wiederkehrende Pflege

Apple lässt ein Client Secret höchstens sechs Monate gelten. Das Skript stellt
es auf 180 Tage aus und richtet auf dem Server einen täglichen Wächter ein
(`culinse-apple.timer`, 04:40 Uhr). Der erneuert ab 45 Tagen Restlaufzeit von
selbst; dabei startet der Anmeldedienst kurz neu. Für Peter bleibt nichts zu
tun, solange keine Mail kommt.

Zwei Sicherungen, falls der Wächter scheitert:

- Der Wächter schickt ab 30 Tagen Restlaufzeit täglich eine Mail.
- Die Überwachung (`ueberwachung.sh`) meldet ab 14 Tagen eine Störung.

In beiden Fällen: `deploy/apple-anmeldung.sh erneuern`.

Läuft das Secret doch ab, scheitert nur die Anmeldung mit Apple. E-Mail und
Google laufen weiter, niemand verliert sein Konto.

Abschalten: `deploy/apple-anmeldung.sh abschalten`. Der Knopf verschwindet von
selbst, ohne Push.

## Was man wissen muss

**Versteckte Adressen.** Bei der ersten Anmeldung fragt Apple, ob die echte
E-Mail-Adresse geteilt oder verborgen wird. Bei „verbergen“ bekommt Culinse
eine Adresse wie `abc123@privaterelay.appleid.com`. Mails dorthin leitet Apple
weiter, aber nur von eingetragenen Absendern (Schritt 1e). Culinse verschickt
über Resend: Absender `noreply@culinse.com`, signiert für `culinse.com`,
technische Absender-Domain `send.culinse.com`. Deshalb beide Domains.

**Bestehendes Konto mit derselben Adresse.** Teilt jemand seine echte Adresse
und es gibt bei Culinse schon ein Konto damit (Passwort oder Google), hängt der
Anmeldedienst die Apple-Anmeldung an dieses Konto. Rezepte und Sammlungen
bleiben, der Besucher hat danach zwei Wege ins selbe Konto. Mit verborgener
Adresse entsteht ein neues, getrenntes Konto: Der Anmeldedienst kann nicht
wissen, dass es dieselbe Person ist. Zusammenlegen lässt sich das später nur
von Hand.

**Name.** Apple nennt den Namen nur bei der allerersten Anmeldung, laut
Supabase-Doku über die Weiterleitung womöglich gar nicht. Culinse braucht ihn
nirgends.

**Sprache der Mails.** Wer sich mit Apple anmeldet, bekommt Mails vom
Anmeldedienst auf Englisch, wie bei Google (`mail/LIESMICH.md`, Abschnitt
Sprache).

**Rücksprung-Adressen.** Apple schickt den Besucher an
`https://daten.culinse.com/auth/v1/callback` zurück (dieselbe Adresse wie bei
Google), der Anmeldedienst leitet weiter an `https://culinse.com/auth/callback`.
Beides ist für Google schon erlaubt und gilt für Apple mit.

**Inhalts-Sicherheitsrichtlinie.** Unverändert. Die Seite lädt nichts von
Apple; der Schalter fragt nur den eigenen Datenserver.

**Knopf.** Nach Apples Regeln für eigene Knöpfe gebaut
(`components/AppleSignInButton.tsx`): weiß mit Rahmen, schwarze Systemschrift,
Titel in Apples Wortlaut je Sprache. Für Bengalisch gibt es keinen Titel von
Apple; dort steht eine eigene Übersetzung. Das Apple-Zeichen
(`public/apple-logo.svg`) ist nachgezeichnet und am Original ausgemessen. Apple
wünscht die Datei aus den „Apple Design Resources“; wer es ganz genau nimmt,
tauscht sie aus.

## Technik in Kürze

- Website: `LoginClient.tsx` ruft `signInWithOAuth({ provider: "apple" })` mit
  derselben Rücksprung-Adresse wie Google. `lib/authProviders.ts` fragt
  `/auth/v1/settings`, ob Apple aktiv ist; nur dann erscheint der Knopf.
  `NEXT_PUBLIC_APPLE_LOGIN=on` oder `off` übersteuert das (lokale Vorschau,
  Notbremse).
- Server: Werte in `/opt/supabase/.env` (`APPLE_ENABLED`, `APPLE_CLIENT_ID`,
  `APPLE_SECRET`, `APPLE_SECRET_ABLAUF`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`,
  `APPLE_P8_B64`). Zuordnung in `/opt/supabase/docker-compose.culinse.yml` beim
  Dienst `auth`: `GOTRUE_EXTERNAL_APPLE_ENABLED`, `…_CLIENT_ID`, `…_SECRET`,
  `…_REDIRECT_URI`. Das Skript trägt die vier Zeilen hinter Google ein.
- Client Secret: ein signiertes JWT (ES256) mit Team-ID (`iss`), Key-ID
  (`kid`), Services-ID (`sub`), `aud` `https://appleid.apple.com` und Ablauf
  höchstens 15.777.000 Sekunden nach Ausstellung.
- Die .p8-Datei liegt in `.env` und damit in der nächtlichen Sicherung und im
  Schlüsselbund (`schluessel-sichern.sh`).

## Geprüft und nicht geprüft

Geprüft am 25.11.2026: Der Live-Anmeldedienst meldet Google aktiv und Apple
aus, nimmt den Rücksprung per POST an (so schickt Apple ihn) und leitet Google
über `https://daten.culinse.com/auth/v1/callback`. Das Server-Skript lief in
einer Probeumgebung mit Attrappen für Docker, systemd und Apple durch
(Einrichten, Erneuern, Wächter, Abschalten, Rückweg bei jedem Fehler); die
Unterschrift des Client Secrets wurde dabei echt nachgerechnet.

Nicht geprüft, weil erst nach Peters Schritten möglich: die echte Anmeldung
mit Apple, das Skript auf dem echten Server, Apples Antwort auf die Probe des
Client Secrets, die Zustellung an eine versteckte Adresse.

## Quellen

- Anmeldedienst v2.197.0, Quelltext: `internal/api/provider/apple.go`
  (Weiterleitung, `response_mode=form_post`), `internal/api/api.go` (Rücksprung
  per GET und POST), `internal/api/settings.go` (aktive Anmeldewege),
  `internal/models/linking.go` (Zusammenführen bei gleicher, bestätigter
  Adresse), `internal/conf/configuration.go` (Einstellungen).
  <https://github.com/supabase/auth/tree/v2.197.0>
- Supabase: <https://supabase.com/docs/guides/self-hosting/self-hosted-oauth>,
  <https://supabase.com/docs/guides/auth/social-login/auth-apple>,
  <https://supabase.com/docs/guides/auth/auth-identity-linking>
- Apple, Client Secret:
  <https://developer.apple.com/documentation/accountorganizationaldatasharing/creating-a-client-secret>
- Apple, Website einrichten:
  <https://developer.apple.com/help/account/capabilities/configure-sign-in-with-apple-for-the-web/>
- Apple, Mail-Weiterleitung:
  <https://developer.apple.com/help/account/capabilities/configure-private-email-relay-service/>
- Apple, Fehlermeldungen (TN3107):
  <https://developer.apple.com/documentation/technotes/tn3107-resolving-sign-in-with-apple-response-errors>
- Apple, Knopf:
  <https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple>
