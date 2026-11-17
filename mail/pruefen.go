// Prüft die erzeugten Mail-Vorlagen so, wie der Anmeldedienst sie verarbeitet:
// GoTrue (supabase/auth v2.197.0, internal/mailer/templatemailer) liest Betreff
// und Vorlage mit html/template und füllt sie mit denselben Feldern wie hier.
//
//	go run mail/pruefen.go            prüfen
//	go run mail/pruefen.go <ordner>   prüfen und fertige Mails dorthin schreiben
//	                                  (<mail>.<sprache>.html, für die Vorschau)
//
// Geprüft wird je Mail und Sprache: Die Vorlage lässt sich lesen und füllen,
// Betreff, Titel und Knopf stehen in der richtigen Sprache drin, der Link ist
// unverändert enthalten. Dazu Sonderfälle: Konto ohne Sprache, unbekannte
// Sprache, Unsinn im Feld (Zahl, Liste), Passwort-Mail mit Rücksprung-Adresse.
package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"html"
	"html/template"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

// Wie models.JSONMap im Anmeldedienst.
type JSONMap map[string]interface{}

type mail struct {
	name string
	env  string
	code bool
}

var mails = []mail{
	{"confirmation", "CONFIRMATION", false},
	{"recovery", "RECOVERY", false},
	{"magic_link", "MAGIC_LINK", false},
	{"email_change", "EMAIL_CHANGE", false},
	{"invite", "INVITE", false},
	{"reauthentication", "REAUTHENTICATION", true},
}

const link = "https://daten.culinse.com/auth/v1/verify?token=pkce_0123456789abcdef&type=signup&redirect_to=https://culinse.com/auth/callback"

var fehler int

func melde(format string, a ...interface{}) {
	fehler++
	fmt.Printf("FEHLER  "+format+"\n", a...)
}

// Felder, die der Anmeldedienst je Mail übergibt (templatemailer.go).
func daten(m mail, meta JSONMap, ruecksprung string) map[string]interface{} {
	d := map[string]interface{}{
		"SiteURL": "https://culinse.com",
		"Email":   "anna@example.com",
		"Token":   "482913",
		"Data":    meta,
	}
	if m.code {
		return d
	}
	d["ConfirmationURL"] = link
	d["TokenHash"] = "pkce_0123456789abcdef"
	d["RedirectTo"] = ruecksprung
	if m.name == "email_change" {
		d["NewEmail"] = "anna.neu@example.com"
		d["SendingTo"] = "anna.neu@example.com"
	}
	return d
}

func fuelle(t *template.Template, d map[string]interface{}) (string, error) {
	var b bytes.Buffer
	err := t.Execute(&b, d)
	return b.String(), err
}

func main() {
	hier := "mail"
	if _, err := os.Stat(filepath.Join(hier, "vorlagen")); err != nil {
		hier = "."
	}
	ausgabe := ""
	if len(os.Args) > 1 {
		ausgabe = os.Args[1]
		if err := os.MkdirAll(ausgabe, 0o755); err != nil {
			panic(err)
		}
	}

	// Sprachen und Texte
	dateien, _ := filepath.Glob(filepath.Join(hier, "texte", "*.json"))
	texte := map[string]map[string]map[string]string{}
	for _, f := range dateien {
		roh, err := os.ReadFile(f)
		if err != nil {
			panic(err)
		}
		var t map[string]map[string]string
		if err := json.Unmarshal(roh, &t); err != nil {
			panic(fmt.Sprintf("%s: %v", f, err))
		}
		texte[strings.TrimSuffix(filepath.Base(f), ".json")] = t
	}
	if len(texte) != 16 {
		melde("erwartet 16 Sprachen, gefunden %d", len(texte))
	}

	// Betreffzeilen aus mailer.env
	betreff := map[string]string{}
	vorlageAdresse := map[string]string{}
	env, err := os.Open(filepath.Join(hier, "vorlagen", "mailer.env"))
	if err != nil {
		panic(err)
	}
	zeile := regexp.MustCompile(`^(GOTRUE_MAILER_(SUBJECTS|TEMPLATES)_([A-Z_]+))=(.*)$`)
	sc := bufio.NewScanner(env)
	sc.Buffer(make([]byte, 1<<20), 1<<20)
	for sc.Scan() {
		m := zeile.FindStringSubmatch(sc.Text())
		if m == nil {
			continue
		}
		wert := m[4]
		if m[2] == "SUBJECTS" {
			if !strings.HasPrefix(wert, `"`) || !strings.HasSuffix(wert, `"`) {
				melde("%s: Wert steht nicht in Anführungszeichen", m[1])
			}
			wert = strings.TrimSuffix(strings.TrimPrefix(wert, `"`), `"`)
			if strings.ContainsAny(wert, "\"$\\") {
				melde("%s: enthält \", $ oder \\ (docker compose würde das umdeuten)", m[1])
			}
			betreff[m[3]] = wert
		} else {
			vorlageAdresse[m[3]] = wert
		}
	}
	env.Close()

	sonderfaelle := []struct {
		name string
		meta JSONMap
	}{
		{"Konto ohne Angaben", nil},
		{"Konto ohne Sprache", JSONMap{"full_name": "Anna"}},
		{"unbekannte Sprache", JSONMap{"locale": "xx"}},
		{"Zahl als Sprache", JSONMap{"locale": 5}},
		{"Liste als Sprache", JSONMap{"locale": []interface{}{"de"}}},
		{"leere Sprache", JSONMap{"locale": ""}},
	}

	gesamt := 0
	for _, m := range mails {
		roh, err := os.ReadFile(filepath.Join(hier, "vorlagen", m.name+".html"))
		if err != nil {
			melde("%s: %v", m.name, err)
			continue
		}
		if want := "http://mailvorlagen/" + m.name + ".html"; vorlageAdresse[m.env] != want {
			melde("%s: Adresse der Vorlage in mailer.env ist %q", m.name, vorlageAdresse[m.env])
		}
		// Wie loadEntryBody / loadEntrySubject im Anmeldedienst.
		body, err := template.New("http://mailvorlagen/" + m.name + ".html").Parse(string(roh))
		if err != nil {
			melde("%s: Vorlage nicht lesbar: %v", m.name, err)
			continue
		}
		subj, err := template.New("Subject").Parse(betreff[m.env])
		if err != nil || betreff[m.env] == "" {
			melde("%s: Betreff nicht lesbar: %v", m.name, err)
			continue
		}

		pruefe := func(fall string, d map[string]interface{}, sprache string) string {
			gesamt++
			t := texte[sprache]
			s, err := fuelle(subj, d)
			if err != nil {
				melde("%s / %s: Betreff bricht ab: %v", m.name, fall, err)
				return ""
			}
			if s != t[m.name]["betreff"] {
				melde("%s / %s: Betreff ist %q, erwartet %q", m.name, fall, s, t[m.name]["betreff"])
			}
			out, err := fuelle(body, d)
			if err != nil {
				melde("%s / %s: Vorlage bricht ab: %v", m.name, fall, err)
				return ""
			}
			klar := html.UnescapeString(out)
			muss := []string{t[m.name]["titel"], t[m.name]["text"], t[m.name]["hinweis"], t[m.name]["zeile"], t["gemeinsam"]["grund"], `<html lang="` + sprache + `"`}
			if m.code {
				muss = append(muss, ">482913<")
			} else {
				muss = append(muss, t[m.name]["knopf"], t["gemeinsam"]["knopf_geht_nicht"], `href="`+link+`"`, ">"+link+"<")
			}
			if m.name == "email_change" {
				muss = append(muss, ">anna@example.com<", ">anna.neu@example.com<")
			}
			for _, x := range muss {
				if !strings.Contains(klar, x) {
					melde("%s / %s: in der Mail fehlt %q", m.name, fall, x)
				}
			}
			if !strings.HasPrefix(out, "<!DOCTYPE html>") {
				melde("%s / %s: Mail beginnt nicht mit <!DOCTYPE html>", m.name, fall)
			}
			if strings.Contains(out, "<no value>") || strings.Contains(out, "{{") || strings.Contains(out, "ZgotmplZ") {
				melde("%s / %s: unaufgelöster Platzhalter in der Mail", m.name, fall)
			}
			return out
		}

		for sprache := range texte {
			out := pruefe("Sprache "+sprache, daten(m, JSONMap{"locale": sprache}, "https://culinse.com/auth/callback"), sprache)
			if ausgabe != "" && out != "" {
				os.WriteFile(filepath.Join(ausgabe, m.name+"."+sprache+".html"), []byte(out), 0o644)
			}
		}
		for _, f := range sonderfaelle {
			pruefe(f.name, daten(m, f.meta, "https://culinse.com/auth/callback"), "en")
		}
		if m.name == "recovery" {
			// Die Seite, auf der das Passwort angefordert wurde, bestimmt die Sprache,
			// auch wenn im Konto eine andere oder keine steht.
			for sprache := range texte {
				ziel := "https://culinse.com/" + sprache + "/update-password"
				pruefe("Rücksprung "+sprache+" ohne Sprache im Konto", daten(m, nil, ziel), sprache)
				pruefe("Rücksprung "+sprache+" schlägt Konto", daten(m, JSONMap{"locale": "ja"}, ziel), sprache)
			}
			pruefe("Rücksprung ohne Sprache, Konto de", daten(m, JSONMap{"locale": "de"}, "https://culinse.com/update-password"), "de")
		}
		fmt.Printf("ok      %-17s %5.1f KB\n", m.name, float64(len(roh))/1024)
	}

	if fehler > 0 {
		fmt.Printf("\n%d Fehler in %d Proben\n", fehler, gesamt)
		os.Exit(1)
	}
	fmt.Printf("\nAlles in Ordnung: %d Proben, %d Mails, %d Sprachen\n", gesamt, len(mails), len(texte))
}
