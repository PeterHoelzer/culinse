#!/usr/bin/env python3
"""
Run once to replace the Vercel favicon.ico with a Culinse-branded icon.

Usage (from the culinse project root):
  pip3 install Pillow --break-system-packages
  python3 scripts/generate-favicon.py
"""
from PIL import Image, ImageDraw
import struct, os, io

ORANGE = (249, 115, 22, 255)   # #f97316
DARK   = (234, 88, 12, 255)    # #ea580c

def make_frame(size):
    scale = 8
    S = size * scale
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Orange circle background
    pad = S // 16
    draw.ellipse([pad, pad, S - pad, S - pad], fill=ORANGE)

    # Pan body
    cx, cy = int(S * 0.44), int(S * 0.50)
    r = int(S * 0.28)
    pw, ph = int(r * 1.1), int(r * 0.72)
    draw.ellipse([cx - pw, cy - ph, cx + pw, cy + ph], fill=(255, 255, 255, 255))

    # Handle
    hx1, hy1 = cx + pw - int(r * 0.15), cy - int(r * 0.14)
    hx2, hy2 = cx + pw + int(r * 0.65), cy + int(r * 0.14)
    draw.rectangle([hx1, hy1, hx2, hy2], fill=(255, 255, 255, 255))
    draw.ellipse([hx2 - int(r * 0.12), hy1, hx2 + int(r * 0.12), hy2], fill=(255, 255, 255, 255))

    # Inner pan (darker)
    iw, ih = int(r * 0.85), int(r * 0.52)
    draw.ellipse([cx - iw, cy - ih, cx + iw, cy + ih], fill=DARK)

    return img.resize((size, size), Image.LANCZOS)


def make_ico(frames):
    """Build an ICO file with embedded PNG images."""
    buffers = []
    for frame in frames:
        buf = io.BytesIO()
        frame.save(buf, format="PNG")
        buffers.append(buf.getvalue())

    header = struct.pack("<HHH", 0, 1, len(frames))
    offset = 6 + 16 * len(frames)
    directory = b""
    for frame, data in zip(frames, buffers):
        w, h = frame.size
        directory += struct.pack(
            "<BBBBHHII",
            w if w < 256 else 0,
            h if h < 256 else 0,
            0, 0, 1, 32,
            len(data), offset
        )
        offset += len(data)

    return header + directory + b"".join(buffers)


out_dir = os.path.join(os.path.dirname(__file__), "..", "app")
out_path = os.path.join(out_dir, "favicon.ico")

frames = [make_frame(s) for s in [16, 32, 48]]
ico_data = make_ico(frames)

with open(out_path, "wb") as f:
    f.write(ico_data)

print(f"✓ {out_path} ({len(ico_data):,} bytes, sizes: 16×16, 32×32, 48×48)")
print("  Done — deploy and do a hard refresh (⌘+Shift+R) to see the new icon.")
