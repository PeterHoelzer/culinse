#!/usr/bin/env node
/**
 * Generates app/favicon.ico with no external dependencies.
 * Uses BMP format (no PNG/deflate), so it always builds cleanly.
 * Run: node scripts/gen-favicon.js
 */
const fs   = require("fs");
const path = require("path");

const W = 32, H = 32;

// Colours in BGRA order
const ORANGE = [22,  115, 249, 255];  // #f97316
const WHITE  = [255, 255, 255, 255];
const DARK   = [12,   88, 234, 255];  // #ea580c

// ── Canvas ──────────────────────────────────────────────────────────────────
const pixels = Array.from({ length: W * H }, () => [...ORANGE]);

function setPixel(x, y, c) {
  if (x >= 0 && x < W && y >= 0 && y < H) pixels[y * W + x] = [...c];
}

function ellipse(cx, cy, rx, ry, c) {
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) setPixel(x, y, c);
    }
}

function rect(x1, y1, x2, y2, c) {
  for (let y = y1; y <= y2; y++)
    for (let x = x1; x <= x2; x++)
      setPixel(x, y, c);
}

// Pan body (white), handle (white), inner pan (dark orange)
ellipse(13, 17, 10, 7, WHITE);
rect(22, 15, 29, 19, WHITE);
ellipse(28, 17, 3, 2, WHITE);   // handle end cap
ellipse(13, 17,  7, 5, DARK);

// ── Build BMP ────────────────────────────────────────────────────────────────
const andRowBytes = Math.ceil(W / 32) * 4;   // AND-mask row, DWORD-aligned
const andMaskSize = H * andRowBytes;
const imageDataSize = W * H * 4;
const bmpSize = 40 + imageDataSize + andMaskSize;

const bmp = Buffer.alloc(bmpSize, 0);
let o = 0;

bmp.writeUInt32LE(40, o);           o += 4;  // BITMAPINFOHEADER size
bmp.writeInt32LE(W, o);             o += 4;  // width
bmp.writeInt32LE(H * 2, o);         o += 4;  // height (×2 for ICO convention)
bmp.writeUInt16LE(1, o);            o += 2;  // planes
bmp.writeUInt16LE(32, o);           o += 2;  // bit count
bmp.writeUInt32LE(0, o);            o += 4;  // compression
bmp.writeUInt32LE(imageDataSize, o);o += 4;
bmp.writeInt32LE(0, o);             o += 4;
bmp.writeInt32LE(0, o);             o += 4;
bmp.writeUInt32LE(0, o);            o += 4;
bmp.writeUInt32LE(0, o);            o += 4;

// Pixel rows — BMP is bottom-to-top
for (let y = H - 1; y >= 0; y--)
  for (let x = 0; x < W; x++) {
    const [b, g, r, a] = pixels[y * W + x];
    bmp[o++] = b; bmp[o++] = g; bmp[o++] = r; bmp[o++] = a;
  }
// AND mask already zeroed (all opaque)

// ── Build ICO ────────────────────────────────────────────────────────────────
const dataOffset = 6 + 16;
const ico = Buffer.alloc(dataOffset + bmpSize, 0);
let i = 0;

ico.writeUInt16LE(0, i); i += 2;   // reserved
ico.writeUInt16LE(1, i); i += 2;   // type: ICO
ico.writeUInt16LE(1, i); i += 2;   // count

ico[i++] = W;   // width  (0 = 256)
ico[i++] = H;   // height
ico[i++] = 0;   // color count
ico[i++] = 0;   // reserved
ico.writeUInt16LE(1,  i); i += 2;  // planes
ico.writeUInt16LE(32, i); i += 2;  // bits
ico.writeUInt32LE(bmpSize, i); i += 4;
ico.writeUInt32LE(dataOffset, i);  // offset to BMP data

bmp.copy(ico, dataOffset);

// ── Write ────────────────────────────────────────────────────────────────────
const out = path.join(__dirname, "..", "app", "favicon.ico");
fs.writeFileSync(out, ico);
console.log(`✓  app/favicon.ico  (${ico.length} bytes, 32×32 BMP, no external deps)`);
