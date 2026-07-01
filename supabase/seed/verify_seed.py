#!/usr/bin/env python3
"""
Qualitäts- und Konsistenzprüfung für den Rezept-Seed.

Prüft recipes.json (Inhalt) und 01_seed_recipes.sql (generiertes SQL):
  1. Struktur — alle Pflichtfelder, de + en vorhanden
  2. Nährwerte — plausibel nach der 4/4/9-Regel (kcal ≈ 4P + 4C + 9F)
  3. Einheiten — rein metrisch, keine imperialen/Löffel-Einheiten (Culinse-Regel)
  4. jsonb — jedes ::jsonb-Literal im SQL parst sauber
  5. SQL-Syntax — echte Postgres-Validierung via pglast (falls installiert)

Beendet mit Exit-Code 0 (alles ok) oder 1 (Fehler gefunden).
Aufruf:  python3 verify_seed.py
"""

import json
import re
import sys
import pathlib

HERE = pathlib.Path(__file__).parent
recipes = json.loads((HERE / "recipes.json").read_text(encoding="utf-8"))["recipes"]
sql = (HERE / "01_seed_recipes.sql").read_text(encoding="utf-8")

errors, warnings = [], []

# Verbotene Einheiten (imperial + Löffel), exakt auf das unit-Feld geprüft.
FORBIDDEN = {
    "cup", "cups", "tbsp", "tbs", "tablespoon", "tablespoons",
    "tsp", "teaspoon", "teaspoons", "oz", "ounce", "ounces",
    "lb", "lbs", "pound", "pounds", "fl oz", "floz", "pint", "quart",
    "el", "tl", "esslöffel", "teelöffel", "essl.", "teel.",
}
MACRO_TOL = 0.12  # 12 % Toleranz (Ballaststoffe/Rundung)


def check_locale(slug, lang, loc):
    for field in ("title", "description", "ingredients", "instructions", "tags"):
        if not loc.get(field):
            errors.append(f"[{slug}/{lang}] Feld fehlt oder leer: {field}")
    # Einheiten
    for ing in loc.get("ingredients", []):
        unit = (ing.get("unit") or "").strip().lower()
        if unit in FORBIDDEN:
            errors.append(f"[{slug}/{lang}] verbotene Einheit '{ing['unit']}' bei '{ing.get('name')}'")
        if not ing.get("name"):
            errors.append(f"[{slug}/{lang}] Zutat ohne Namen")
    # Schritte fortlaufend nummeriert
    steps = [s.get("step") for s in loc.get("instructions", [])]
    if steps != list(range(1, len(steps) + 1)):
        errors.append(f"[{slug}/{lang}] Schritte nicht fortlaufend 1..n: {steps}")
    # Tags lowercase
    for t in loc.get("tags", []):
        if t != t.lower():
            warnings.append(f"[{slug}/{lang}] Tag nicht lowercase: '{t}'")


slugs = set()
for r in recipes:
    slug = r.get("slug", "?")
    if slug in slugs:
        errors.append(f"Doppelter slug: {slug}")
    slugs.add(slug)

    for f in ("prep_time", "cook_time", "servings", "nutrition", "de", "en"):
        if f not in r:
            errors.append(f"[{slug}] Pflichtfeld fehlt: {f}")

    n = r.get("nutrition", {})
    cal, p, fat, c = (n.get(k) for k in ("calories", "protein", "fat", "carbs"))
    if None in (cal, p, fat, c):
        errors.append(f"[{slug}] Nährwerte unvollständig: {n}")
    else:
        calc = 4 * p + 4 * c + 9 * fat
        dev = abs(calc - cal) / cal if cal else 1
        tag = "OK " if dev <= MACRO_TOL else "!! "
        print(f"  {tag}{slug:<28} angeg. {cal:>4} kcal | 4/4/9 = {calc:>4} | Abw. {dev*100:4.1f} %")
        if dev > MACRO_TOL:
            errors.append(f"[{slug}] Makros unplausibel: angegeben {cal}, gerechnet {calc} ({dev*100:.1f} %)")

    check_locale(slug, "de", r.get("de", {}))
    check_locale(slug, "en", r.get("en", {}))

# ── jsonb-Literale im SQL parsen ──────────────────────────────────────────────
jsonb_blocks = re.findall(r"'((?:[^']|'')*)'::jsonb", sql)
bad = 0
for b in jsonb_blocks:
    try:
        json.loads(b.replace("''", "'"))
    except json.JSONDecodeError as e:
        bad += 1
        errors.append(f"Ungültiges jsonb-Literal: {e}")
print(f"\n  jsonb-Literale geprüft: {len(jsonb_blocks)} ({bad} fehlerhaft)")

rows = sql.count("(v_author,")
expected = 2 * len(recipes)
print(f"  INSERT-Zeilen: {rows} (erwartet {expected})")
if rows != expected:
    errors.append(f"Zeilenzahl falsch: {rows} statt {expected}")

# ── Echte Postgres-Syntaxprüfung (optional) ───────────────────────────────────
try:
    import pglast
    pglast.parse_sql(sql)
    print("  Postgres-Syntax (pglast): OK")
except ImportError:
    print("  Postgres-Syntax: übersprungen (pglast nicht installiert)")
except Exception as e:
    errors.append(f"Postgres-Syntaxfehler: {e}")

# ── Ergebnis ──────────────────────────────────────────────────────────────────
print()
for w in warnings:
    print(f"  WARN  {w}")
if errors:
    print(f"\n✗ {len(errors)} FEHLER:")
    for e in errors:
        print(f"   - {e}")
    sys.exit(1)
print(f"✓ Alle Prüfungen bestanden ({len(recipes)} Rezepte, {rows} Zeilen, {len(warnings)} Warnungen).")
