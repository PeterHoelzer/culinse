#!/usr/bin/env python3
"""TikTok-Carousel-Generator (Serien-Design v2, siehe culinse_tiktok_neustart_plan.md).

Aufruf:  python3 scripts/generate-tiktok-slides.py <posts.json> <src_dir> <out_dir>

posts.json — Liste von Posts:
[{
  "key": "w2-familie",                # Dateiname-Präfix
  "photo": "klopse.jpg",              # Datei in <src_dir>
  "badge": "FAMILIENREZEPT",          # FAMILIENREZEPT | PREIS-CHECK | PROTEIN
  "hook": "…",                        # Slide 1
  "list_title": "Was reinkommt:",     # Slide 2
  "list_items": ["…"]                 # ODER "price_items": [["Zutat", "0,80 €"], …]
  "list_footnote": null,
  "punch": {"title": "…", "big": "…", "sub": "…", "extra": null},  # Slide 3
  "cta": "…"                          # Slide 4 (Headline; culinse.com + PDF-Zeile automatisch)
}]

Erzeugt je Post 4 Slides: <key>-s1.jpg … <key>-s4.jpg (1080×1350, JPEG q90).
"""
import json
import sys

from PIL import Image, ImageDraw, ImageFont

W, H = 1080, 1350
ORANGE = (249, 115, 22)
DARK = (31, 41, 55)
GRAY = (107, 114, 128)
CREAM = (255, 247, 237)
FB = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"


def font(bold, size):
    return ImageFont.truetype(FB if bold else FR, size)


def cover(img, w, h):
    r = max(w / img.width, h / img.height)
    img = img.resize((round(img.width * r), round(img.height * r)))
    x = (img.width - w) // 2
    y = (img.height - h) // 2
    return img.crop((x, y, x + w, y + h))


def wrap(draw, text, f, maxw):
    words, lines, cur = text.split(), [], ""
    for w_ in words:
        t = (cur + " " + w_).strip()
        if draw.textlength(t, font=f) <= maxw:
            cur = t
        else:
            lines.append(cur)
            cur = w_
    if cur:
        lines.append(cur)
    return lines


def slide_hook(photo, badge_text, hook, out):
    img = Image.new("RGB", (W, H), "white")
    img.paste(cover(Image.open(photo).convert("RGB"), W, 1010), (0, 0))
    d = ImageDraw.Draw(img, "RGBA")
    f = font(True, 34)
    tw = d.textlength(badge_text, font=f)
    d.rounded_rectangle([40, 40, 40 + tw + 56, 102], 31, fill=(255, 255, 255, 235))
    d.text((68, 53), badge_text, font=f, fill=ORANGE)
    d.rectangle([0, 1010, W, H], fill=ORANGE)
    f = font(True, 58)
    lines = wrap(d, hook, f, W - 120)
    y = 1010 + (H - 1010 - len(lines) * 70 - 40) // 2
    for ln in lines:
        d.text((W // 2 - d.textlength(ln, font=f) // 2, y), ln, font=f, fill="white")
        y += 70
    d.text((W // 2 - d.textlength("culinse.com", font=font(True, 30)) // 2, H - 52),
           "culinse.com", font=font(True, 30), fill=(255, 237, 213))
    img.save(out, quality=90)


def slide_list(photo, title, rows, out, prices=False, footnote=None):
    img = Image.new("RGB", (W, H), "white")
    img.paste(cover(Image.open(photo).convert("RGB"), W, 400), (0, 0))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 400, W, 412], fill=ORANGE)
    d.text((60, 460), title, font=font(True, 54), fill=DARK)
    y = 580
    for row in rows:
        d.ellipse([60, y + 14, 78, y + 32], fill=ORANGE)
        if prices:
            name, price = row
            d.text((104, y), name, font=font(False, 42), fill=DARK)
            d.text((W - 60 - d.textlength(price, font=font(True, 42)), y), price, font=font(True, 42), fill=ORANGE)
        else:
            d.text((104, y), row, font=font(False, 42), fill=DARK)
        y += 84
    if footnote:
        d.text((60, H - 110), footnote, font=font(False, 28), fill=GRAY)
    d.text((W - 60 - d.textlength("culinse.com", font=font(True, 30)), H - 60),
           "culinse.com", font=font(True, 30), fill=ORANGE)
    img.save(out, quality=90)


def slide_punch(title, big, sub, out, extra=None):
    img = Image.new("RGB", (W, H), CREAM)
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, W, 12], fill=ORANGE)
    d.text((60, 120), title, font=font(True, 50), fill=DARK)
    y = 320
    f = font(True, 120)
    for ln in wrap(d, big, f, W - 120):
        d.text((60, y), ln, font=f, fill=ORANGE)
        y += 140
    y += 40
    for ln in wrap(d, sub, font(False, 42), W - 120):
        d.text((60, y), ln, font=font(False, 42), fill=DARK)
        y += 58
    if extra:
        y += 30
        for ln in wrap(d, extra, font(False, 34), W - 120):
            d.text((60, y), ln, font=font(False, 34), fill=GRAY)
            y += 46
    d.text((60, H - 70), "culinse.com", font=font(True, 32), fill=ORANGE)
    img.save(out, quality=90)


def slide_cta(headline, out):
    img = Image.new("RGB", (W, H), ORANGE)
    d = ImageDraw.Draw(img)
    y = 340
    f = font(True, 76)
    for ln in wrap(d, headline, f, W - 140):
        d.text((W // 2 - d.textlength(ln, font=f) // 2, y), ln, font=f, fill="white")
        y += 96
    y += 60
    d.rounded_rectangle([W // 2 - 300, y, W // 2 + 300, y + 110], 55, fill="white")
    d.text((W // 2 - d.textlength("culinse.com", font=font(True, 56)) // 2, y + 22),
           "culinse.com", font=font(True, 56), fill=ORANGE)
    y += 190
    sub = "Gratis: 7-Tage-Meal-Prep-Plan (PDF)"
    d.text((W // 2 - d.textlength(sub, font=font(False, 38)) // 2, y), sub, font=font(False, 38), fill=(255, 237, 213))
    img.save(out, quality=90)


def main():
    posts_file, src, out = sys.argv[1], sys.argv[2], sys.argv[3]
    posts = json.load(open(posts_file, encoding="utf-8"))
    for p in posts:
        photo = f"{src}/{p['photo']}"
        slide_hook(photo, p["badge"], p["hook"], f"{out}/{p['key']}-s1.jpg")
        if "price_items" in p:
            slide_list(photo, p["list_title"], [tuple(r) for r in p["price_items"]],
                       f"{out}/{p['key']}-s2.jpg", prices=True, footnote=p.get("list_footnote"))
        else:
            slide_list(photo, p["list_title"], p["list_items"],
                       f"{out}/{p['key']}-s2.jpg", footnote=p.get("list_footnote"))
        pu = p["punch"]
        slide_punch(pu["title"], pu["big"], pu["sub"], f"{out}/{p['key']}-s3.jpg", extra=pu.get("extra"))
        slide_cta(p["cta"], f"{out}/{p['key']}-s4.jpg")
        print("✓", p["key"])


if __name__ == "__main__":
    main()
