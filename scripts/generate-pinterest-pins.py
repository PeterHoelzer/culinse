#!/usr/bin/env python3
"""Pinterest-Pin-Generator (1000x1500, 2:3) — Schwester des TikTok-Generators.

Aufruf:  python3 scripts/generate-pinterest-pins.py <pins.json> <src_dir> <out_dir>

pins.json — Liste von Pins:
[{"key": "pin-01", "photo": "datei.jpg", "badge": "MEAL PREP", "hook": "…"}]

Layout: Foto oben (cover, ~62 %), unten Cream-Panel mit Hook (groß, Culinse-
Dunkelgrau), Badge oben links (Orange), Footer "culinse.com" im Panel.
"""
import json
import sys

from PIL import Image, ImageDraw, ImageFont

W, H = 1000, 1500
PANEL_H = 560
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


def make_pin(pin, src_dir, out_dir):
    canvas = Image.new("RGB", (W, H), CREAM)
    photo = Image.open(f"{src_dir}/{pin['photo']}").convert("RGB")
    canvas.paste(cover(photo, W, H - PANEL_H), (0, 0))
    d = ImageDraw.Draw(canvas)

    # Badge oben links
    bf = font(True, 34)
    btxt = pin["badge"]
    bw = d.textlength(btxt, font=bf)
    d.rounded_rectangle([36, 36, 36 + bw + 48, 36 + 64], radius=16, fill=ORANGE)
    d.text((36 + 24, 36 + 14), btxt, font=bf, fill=(255, 255, 255))

    # Panel-Inhalt
    hf = font(True, 62)
    lines = wrap(d, pin["hook"], hf, W - 140)
    y = H - PANEL_H + 64
    for ln in lines[:5]:
        d.text((70, y), ln, font=hf, fill=DARK)
        y += 76

    # Orange Akzent-Linie + Footer
    d.rectangle([70, H - 118, 70 + 120, H - 110], fill=ORANGE)
    d.text((70, H - 92), "culinse.com", font=font(True, 40), fill=ORANGE)
    d.text((W - 70 - d.textlength("Rezepte · Wochenplan · Einkaufsliste", font=font(False, 30)), H - 86),
           "Rezepte · Wochenplan · Einkaufsliste", font=font(False, 30), fill=GRAY)

    out = f"{out_dir}/{pin['key']}.jpg"
    canvas.save(out, "JPEG", quality=90)
    return out


def main():
    pins_file, src_dir, out_dir = sys.argv[1], sys.argv[2], sys.argv[3]
    with open(pins_file) as f:
        pins = json.load(f)
    for pin in pins:
        print(make_pin(pin, src_dir, out_dir))


if __name__ == "__main__":
    main()
