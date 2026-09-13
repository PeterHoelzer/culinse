#!/usr/bin/env python3
"""TikTok-VIDEO-Generator (Serien-Design v3 — Format-Eskalation ab W9,
siehe culinse_tiktok_neustart_plan.md §6).

Ersetzt die Foto-Carousels: erzeugt je Post ein 15-Sekunden-MP4 (1080x1920,
30 fps, H.264 + stiller AAC-Tonspur) mit vier Szenen, Ken-Burns-Zoom,
eingeblendeten Listenzeilen und einer hochzaehlenden Kernzahl.

Aufruf:  python3 scripts/generate-tiktok-video.py <posts.json> <src_dir> <out_dir>

posts.json — Liste von Posts:
[{
  "key": "w9-familie",                # Dateiname -> <key>.mp4
  "photo": "w9-schnitzel-papa.jpg",   # Datei in <src_dir>
  "badge": "FAMILIENREZEPT",          # FAMILIENREZEPT | PREIS-CHECK | PROTEIN
  "hook": "…",                        # Szene A (max ~5 Zeilen)
  "list_title": "Was reinkommt:",     # Szene B
  "list_items": ["…"]                 # ODER "price_items": [["Zutat", "0,80 €"], …]
  "list_footnote": null,
  "punch": {"title": "…", "big": "2,15 €", "sub": "…", "extra": null},   # Szene C
  "cta": "…"                          # Szene D
}]

"big" wird hochgezaehlt, wenn es eine Zahl enthaelt ("2,15 €", "30 g Protein").
Benoetigt ffmpeg im PATH.
"""
import json
import re
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

W, H = 1080, 1920
FPS = 30
DUR = 15.0
NFRAMES = int(FPS * DUR)

ORANGE = (249, 115, 22)
ORANGE_D = (194, 84, 12)
DARK = (31, 41, 55)
GRAY = (107, 114, 128)
CREAM = (255, 247, 237)
PEACH = (255, 237, 213)

FB = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

# Szenengrenzen (Sekunden) + Ueberblendung
SCENES = [(0.0, 3.6), (3.6, 8.2), (8.2, 12.4), (12.4, 15.0)]
XFADE = 0.40

_fonts = {}


def font(bold, size):
    k = (bold, size)
    if k not in _fonts:
        _fonts[k] = ImageFont.truetype(FB if bold else FR, size)
    return _fonts[k]


def ease_out(x):
    x = max(0.0, min(1.0, x))
    return 1 - (1 - x) ** 3


def cover(img, w, h):
    r = max(w / img.width, h / img.height)
    im = img.resize((max(w, round(img.width * r)), max(h, round(img.height * r))), Image.LANCZOS)
    x = (im.width - w) // 2
    y = (im.height - h) // 2
    return im.crop((x, y, x + w, y + h))


def wrap(d, text, f, maxw):
    words, lines, cur = text.split(), [], ""
    for w_ in words:
        t = (cur + " " + w_).strip()
        if d.textlength(t, font=f) <= maxw:
            cur = t
        else:
            if cur:
                lines.append(cur)
            cur = w_
    if cur:
        lines.append(cur)
    return lines


def centered(d, lines, f, y, fill, lh, shadow=None):
    for ln in lines:
        x = W // 2 - d.textlength(ln, font=f) / 2
        if shadow:
            d.text((x + 3, y + 3), ln, font=f, fill=shadow)
        d.text((x, y), ln, font=f, fill=fill)
        y += lh
    return y


def badge(d, text, cx, y):
    f = font(True, 36)
    tw = d.textlength(text, font=f)
    d.rounded_rectangle([cx - tw / 2 - 30, y, cx + tw / 2 + 30, y + 68], 34,
                        fill=(255, 255, 255, 240))
    d.text((cx - tw / 2, y + 14), text, font=f, fill=ORANGE)


def blurred_bg(photo):
    bg = cover(photo, W, H).filter(ImageFilter.GaussianBlur(48))
    ov = Image.new("RGB", (W, H), (20, 14, 10))
    return Image.blend(bg, ov, 0.45)


def photo_card(photo, width, zoom):
    """Foto auf Kartenbreite, leichter Zoom, abgerundete Ecken."""
    ratio = photo.height / photo.width
    cw = width
    ch = int(round(width * ratio))
    if ch > 1080:
        ch = 1080
    src = cover(photo, int(cw * zoom), int(ch * zoom))
    x = (src.width - cw) // 2
    y = (src.height - ch) // 2
    card = src.crop((x, y, x + cw, y + ch))
    mask = Image.new("L", (cw, ch), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, cw - 1, ch - 1], 36, fill=255)
    return card, mask


# --------------------------------------------------------------------------- A
def scene_hook(p, photo, bg, u):
    img = bg.copy()
    zoom = 1.0 + 0.08 * u
    card, mask = photo_card(photo, 980, zoom)
    cy = 300
    img.paste(card, (50, cy), mask)
    d = ImageDraw.Draw(img, "RGBA")
    badge(d, p["badge"], W // 2, 190)

    f = font(True, 64)
    lines = wrap(d, p["hook"], f, W - 130)
    ty = max(cy + card.height + 70, 1250)
    block = len(lines) * 80
    if ty + block > 1770:
        ty = 1770 - block
    d.rounded_rectangle([40, ty - 44, W - 40, ty + block + 30], 34, fill=(0, 0, 0, 120))
    # Pop-in der Hook-Zeilen
    for i, ln in enumerate(lines):
        a = ease_out((u * 3.6 - 0.15 - i * 0.10) / 0.35)
        if a <= 0:
            continue
        x = W // 2 - d.textlength(ln, font=f) / 2
        yy = ty + i * 80 + (1 - a) * 18
        d.text((x + 3, yy + 3), ln, font=f, fill=(0, 0, 0, int(150 * a)))
        d.text((x, yy), ln, font=f, fill=(255, 255, 255, int(255 * a)))
    d.text((W // 2 - d.textlength("culinse.com", font=font(True, 32)) / 2, 1830),
           "culinse.com", font=font(True, 32), fill=PEACH)
    return img


# --------------------------------------------------------------------------- B
def scene_list(p, photo, u, dur):
    img = Image.new("RGB", (W, H), "white")
    top = cover(photo, W, 640)
    img.paste(top, (0, 0))
    d = ImageDraw.Draw(img, "RGBA")
    d.rectangle([0, 628, W, 640], fill=ORANGE)

    prices = "price_items" in p
    rows = p.get("price_items") or p.get("list_items") or []
    fn = font(False, 44)
    fp = font(True, 44)

    # Blockhoehe vorab messen und den Block im Restbild vertikal zentrieren
    wrapped = [wrap(d, (r[0] if prices else r), fn, 640 if prices else W - 190) for r in rows]
    block = 76 + 64 + sum((len(ls) - 1) * 56 + 88 for ls in wrapped)
    top_y = max(710, 640 + (H - 230 - 640 - block) // 2)

    d.text((70, top_y), p["list_title"], font=font(True, 56), fill=DARK)
    y = top_y + 140
    for i, row in enumerate(rows):
        a = ease_out((u * dur - 0.5 - i * 0.32) / 0.35)
        if a <= 0:
            break
        off = (1 - a) * 26
        al = int(255 * a)
        d.ellipse([70, y + 16 + off, 90, y + 36 + off], fill=(249, 115, 22, al))
        lines = wrapped[i]
        for j, ln in enumerate(lines):
            d.text((118, y + off + j * 56), ln, font=fn, fill=DARK + (al,))
        if prices:
            d.text((W - 70 - d.textlength(row[1], font=fp), y + off), row[1], font=fp,
                   fill=ORANGE + (al,))
        y += (len(lines) - 1) * 56 + 88

    if p.get("list_footnote"):
        fnt = font(False, 30)
        yy = H - 150
        for ln in wrap(d, p["list_footnote"], fnt, W - 140):
            d.text((70, yy), ln, font=fnt, fill=GRAY)
            yy += 40
    d.text((W - 70 - d.textlength("culinse.com", font=font(True, 32)), H - 80),
           "culinse.com", font=font(True, 32), fill=ORANGE)
    return img


# --------------------------------------------------------------------------- C
NUM_RE = re.compile(r"(\d+(?:[.,]\d+)?)")


def count_text(template, u):
    """Zaehlt die erste Zahl im Text hoch (Nachkommastellen bleiben erhalten)."""
    m = NUM_RE.search(template)
    if not m:
        return template
    raw = m.group(1)
    dec = len(raw.split(",")[1]) if "," in raw else (len(raw.split(".")[1]) if "." in raw else 0)
    target = float(raw.replace(",", "."))
    cur = target * ease_out(u)
    s = f"{cur:.{dec}f}".replace(".", ",")
    return template[:m.start(1)] + s + template[m.end(1):]


def scene_punch(p, u, dur):
    pu = p["punch"]
    img = Image.new("RGB", (W, H), CREAM)
    d = ImageDraw.Draw(img, "RGBA")
    d.rectangle([0, 0, W, 16], fill=ORANGE)

    ft = font(True, 54)
    fb = font(True, 130)
    fs = font(False, 46)
    fe = font(False, 36)
    l_title = wrap(d, pu["title"], ft, W - 140)
    # Zielbreite an der Endzahl messen, damit der Block beim Zaehlen nicht springt
    l_big = wrap(d, pu["big"], fb, W - 140)
    l_sub = wrap(d, pu["sub"], fs, W - 140)
    l_extra = wrap(d, pu["extra"], fe, W - 140) if pu.get("extra") else []
    block = (len(l_title) * 72 + 90 + len(l_big) * 158 + 50
             + len(l_sub) * 64 + (34 + len(l_extra) * 50 if l_extra else 0))
    y = max(230, (H - 140 - block) // 2)

    for ln in l_title:
        d.text((70, y), ln, font=ft, fill=DARK)
        y += 72

    # Grosse Zahl, hochgezaehlt
    y += 90
    prog = min(1.0, max(0.0, (u * dur - 0.45) / 1.30))
    for ln in wrap(d, count_text(pu["big"], prog), fb, W - 140):
        d.text((70, y), ln, font=fb, fill=ORANGE)
        y += 158

    y += 50
    a = int(255 * ease_out((u * dur - 1.7) / 0.5))
    if a > 0:
        for ln in l_sub:
            d.text((70, y), ln, font=fs, fill=DARK + (a,))
            y += 64
        if l_extra:
            y += 34
            for ln in l_extra:
                d.text((70, y), ln, font=fe, fill=GRAY + (a,))
                y += 50
    d.text((70, H - 90), "culinse.com", font=font(True, 34), fill=ORANGE)
    return img


# --------------------------------------------------------------------------- D
def scene_cta(p, u, dur):
    img = Image.new("RGB", (W, H), ORANGE)
    d = ImageDraw.Draw(img, "RGBA")
    f = font(True, 82)
    lines = wrap(d, p["cta"], f, W - 150)
    y = 560
    y = centered(d, lines, f, y, "white", 106, shadow=ORANGE_D)

    y += 90
    a = ease_out((u * dur - 0.35) / 0.5)
    if a > 0:
        pw = 640
        ph = 128
        pop = 1.0 + 0.04 * (1 - a)
        pw2, ph2 = int(pw * pop), int(ph * pop)
        d.rounded_rectangle([W // 2 - pw2 // 2, y, W // 2 + pw2 // 2, y + ph2], 64,
                            fill=(255, 255, 255, int(255 * a)))
        fp = font(True, 60)
        d.text((W // 2 - d.textlength("culinse.com", font=fp) / 2, y + ph2 // 2 - 40),
               "culinse.com", font=fp, fill=ORANGE + (int(255 * a),))
        y += ph2 + 80
        fs = font(False, 42)
        sub = "Gratis: 7-Tage-Meal-Prep-Plan (PDF)"
        d.text((W // 2 - d.textlength(sub, font=fs) / 2, y), sub, font=fs,
               fill=PEACH + (int(255 * a),))
    return img


# ---------------------------------------------------------------------- render
def frame_at(p, photo, bg, t):
    def render(idx, tt):
        s, e = SCENES[idx]
        dur = e - s
        u = max(0.0, min(1.0, (tt - s) / dur))
        if idx == 0:
            return scene_hook(p, photo, bg, u)
        if idx == 1:
            return scene_list(p, photo, u, dur)
        if idx == 2:
            return scene_punch(p, u, dur)
        return scene_cta(p, u, dur)

    idx = 0
    for i, (s, e) in enumerate(SCENES):
        if t >= s:
            idx = i
    s, _ = SCENES[idx]
    if idx > 0 and t - s < XFADE:
        a = (t - s) / XFADE
        return Image.blend(render(idx - 1, t), render(idx, t), a)
    return render(idx, t)


def build(p, src, out):
    photo = ImageOps.exif_transpose(Image.open(f"{src}/{p['photo']}").convert("RGB"))
    bg = blurred_bg(photo)
    path = f"{out}/{p['key']}.mp4"
    cmd = [
        "ffmpeg", "-y", "-loglevel", "error",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
        "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
        "-shortest",
        "-c:v", "libx264", "-preset", "medium", "-crf", "23", "-pix_fmt", "yuv420p",
        "-profile:v", "high", "-level", "4.0", "-movflags", "+faststart",
        "-c:a", "aac", "-b:a", "96k",
        path,
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for i in range(NFRAMES):
        proc.stdin.write(frame_at(p, photo, bg, i / FPS).tobytes())
    proc.stdin.close()
    rc = proc.wait()
    if rc != 0:
        raise SystemExit(f"ffmpeg failed for {p['key']} (rc={rc})")
    print("✓", path)


def main():
    posts_file, src, out = sys.argv[1], sys.argv[2], sys.argv[3]
    for p in json.load(open(posts_file, encoding="utf-8")):
        build(p, src, out)


if __name__ == "__main__":
    main()
