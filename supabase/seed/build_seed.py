#!/usr/bin/env python3
"""
Culinse Seed-Generator.

Liest recipes.json und erzeugt 01_seed_recipes.sql — ein atomares INSERT-Skript
für die user_recipes-Tabelle. Jedes Rezept wird zweisprachig (de + en) als zwei
Zeilen angelegt, verknüpft über translation_group (= slug).

Wichtig:
  * nutrition wird VORAB gesetzt → die Recipe-API berechnet sie NICHT mehr lazy
    über Spoonacular (computeUserRecipeNutrition). Damit sind diese Rezepte
    end-to-end ohne externe Anbindung.
  * is_public = false (Draft): Rezepte landen in "Meine Rezepte". Erst nach dem
    Hinzufügen eines Fotos im Editor sinnvoll öffentlich schaltbar (die
    Community-Suche blendet bildlose Rezepte aus).

Aufruf:  python3 build_seed.py
"""

import json
import pathlib

HERE = pathlib.Path(__file__).parent
SRC = HERE / "recipes.json"
OUT = HERE / "01_seed_recipes.sql"

# ── Schalter ──────────────────────────────────────────────────────────────────
# tags ist im Schema entweder jsonb oder text[]. Konsistent mit
# ingredients/instructions/nutrition ist jsonb am wahrscheinlichsten. Falls der
# Insert mit einem Typfehler auf "tags" abbricht: auf False setzen und neu bauen.
TAGS_AS_JSONB = False

IS_PUBLIC = "false"      # Draft. Auf "true" stellen, sobald Fotos gesetzt sind.
STATUS = "draft"         # "published" zusammen mit IS_PUBLIC=true verwenden.
SOURCE_NAME = "Culinse"
SOURCE_TYPE = "created"

# Wenn True: Rezepte, für die in images.json ein Bild vorliegt, werden direkt
# öffentlich (is_public=true, status=published) — der Rest bleibt Entwurf.
# So kannst du Charge für Charge live schalten, sobald die Bilder da sind.
PUBLISH_IF_IMAGE = False


def sql_str(s: str) -> str:
    """Single-quote-String für SQL (Quotes verdoppeln)."""
    return "'" + s.replace("'", "''") + "'"


def jsonb_lit(obj) -> str:
    """jsonb-Literal aus einem Python-Objekt."""
    raw = json.dumps(obj, ensure_ascii=False, separators=(",", ":"))
    return "'" + raw.replace("'", "''") + "'::jsonb"


def tags_lit(tags) -> str:
    if TAGS_AS_JSONB:
        return jsonb_lit(tags)
    # Postgres text[]-Literal: '{"a","b"}'::text[]
    inner = ",".join('"' + t.replace('\\', '\\\\').replace('"', '\\"') + '"' for t in tags)
    return "'{" + inner.replace("'", "''") + "}'::text[]"


def row(author_var: str, slug: str, lang: str, loc: dict, common: dict, image_url) -> str:
    cook = common.get("cook_time")
    prep = common.get("prep_time")
    serv = common.get("servings")

    has_image = bool(image_url)
    if has_image and PUBLISH_IF_IMAGE:
        is_public, status = "true", "published"
    else:
        is_public, status = IS_PUBLIC, STATUS

    cols = [
        author_var,
        sql_str(lang),
        sql_str(slug),
        sql_str(loc["title"]),
        sql_str(loc.get("description", "")),
        sql_str(image_url) if has_image else "NULL",   # image_url aus images.json
        "'50% 50%'",                  # image_position
        "NULL",                       # video_url
        jsonb_lit(loc["ingredients"]),
        jsonb_lit(loc["instructions"]),
        str(cook) if cook is not None else "NULL",
        str(prep) if prep is not None else "NULL",
        str(serv) if serv is not None else "NULL",
        tags_lit(loc.get("tags", [])),
        sql_str(status),
        is_public,
        sql_str(SOURCE_TYPE),
        sql_str(SOURCE_NAME),
        jsonb_lit(common["nutrition"]),
        "now()",                      # created_at
        "now()",                      # updated_at
    ]
    return "    (" + ", ".join(cols) + ")"


def main() -> None:
    data = json.loads(SRC.read_text(encoding="utf-8"))
    email = data.get("author_email", "peter@hoelzer.xyz")
    recipes = data["recipes"]

    # Bilder (slug → URL), falls generate_images.mjs schon gelaufen ist.
    images_path = HERE / "images.json"
    images = json.loads(images_path.read_text(encoding="utf-8")) if images_path.exists() else {}

    columns = (
        "user_id, language, translation_group, title, description, image_url, "
        "image_position, video_url, ingredients, instructions, cook_time, "
        "prep_time, servings, tags, status, is_public, source_type, "
        "source_name, nutrition, created_at, updated_at"
    )

    rows = []
    for r in recipes:
        common = {
            "cook_time": r.get("cook_time"),
            "prep_time": r.get("prep_time"),
            "servings": r.get("servings"),
            "nutrition": r["nutrition"],
        }
        img = images.get(r["slug"])
        rows.append(row("v_author", r["slug"], "de", r["de"], common, img))
        rows.append(row("v_author", r["slug"], "en", r["en"], common, img))

    body = ",\n".join(rows)

    n_img = sum(1 for r in recipes if images.get(r["slug"]))
    img_note = (
        f"-- Bilder: {n_img}/{len(recipes)} Rezepte mit Foto"
        + (" → öffentlich" if (n_img and PUBLISH_IF_IMAGE) else " (alle als Entwurf)")
        + "."
    )

    sql = f"""-- ── Culinse eigener Rezept-Korpus: Seed ──────────────────────────────────────
-- AUTOMATISCH ERZEUGT von build_seed.py — nicht von Hand editieren.
-- Quelle: recipes.json · Rezepte: {len(recipes)} × 2 Sprachen = {len(rows)} Zeilen
{img_note}
--
-- Reihenfolge: ZUERST 00_add_language.sql, DANN diese Datei (Supabase SQL Editor).
-- nutrition ist vorausgefüllt → KEINE Spoonacular-Berechnung beim ersten Aufruf.

DO $seed$
DECLARE
  v_author uuid;
BEGIN
  SELECT id INTO v_author
  FROM auth.users
  WHERE lower(email) = lower({sql_str(email)})
  LIMIT 1;

  IF v_author IS NULL THEN
    RAISE EXCEPTION 'Kein Nutzer mit E-Mail % gefunden — author_email in recipes.json anpassen und neu generieren.', {sql_str(email)};
  END IF;

  INSERT INTO user_recipes (
    {columns}
  )
  VALUES
{body};

  RAISE NOTICE '✓ {len(rows)} Seed-Rezepte für % angelegt.', {sql_str(email)};
END
$seed$;
"""

    OUT.write_text(sql, encoding="utf-8")
    print(f"✓ {OUT.name} geschrieben: {len(recipes)} Rezepte → {len(rows)} Zeilen")


if __name__ == "__main__":
    main()
