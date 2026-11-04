#!/usr/bin/env node
/**
 * generate-favicon.mjs
 *
 * Draws the Blue Seas fish mark (rounded deep-blue square + white fish) and
 * encodes it as a real favicon.ico (32x32 BMP-based ICO) and an
 * images/apple-touch-icon.png (180x180). No external dependencies.
 *
 * Run:  node tools/generate-favicon.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/* ------------------------------------------------------------- drawing */
const BG = [11, 61, 92, 255];    // deep sea blue #0B3D5C
const FG = [255, 255, 255, 255]; // white fish

function makeCanvas(size) {
  return { size, px: new Uint8ClampedArray(size * size * 4) };
}

function setPx(c, x, y, col) {
  if (x < 0 || y < 0 || x >= c.size || y >= c.size) return;
  const i = (y * c.size + x) * 4;
  c.px[i] = col[0]; c.px[i + 1] = col[1]; c.px[i + 2] = col[2]; c.px[i + 3] = col[3];
}

function roundedSquare(c, r) {
  const s = c.size, rr = r * s;
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      // distance test against rounded-rect interior
      const cx = Math.min(Math.max(x + 0.5, rr), s - rr);
      const cy = Math.min(Math.max(y + 0.5, rr), s - rr);
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
      if (dx * dx + dy * dy <= rr * rr || (x >= rr && x < s - rr) || (y >= rr && y < s - rr)) {
        setPx(c, x, y, BG);
      }
    }
  }
}

function ellipse(c, cx, cy, rx, ry, col) {
  const s = c.size;
  for (let y = Math.floor((cy - ry) * s); y <= Math.ceil((cy + ry) * s); y++) {
    for (let x = Math.floor((cx - rx) * s); x <= Math.ceil((cx + rx) * s); x++) {
      const nx = (x + 0.5) / s - cx, ny = (y + 0.5) / s - cy;
      if ((nx * nx) / (rx * rx) + (ny * ny) / (ry * ry) <= 1) setPx(c, x, y, col);
    }
  }
}

function triangle(c, p1, p2, p3, col) {
  const s = c.size;
  const minX = Math.min(p1[0], p2[0], p3[0]), maxX = Math.max(p1[0], p2[0], p3[0]);
  const minY = Math.min(p1[1], p2[1], p3[1]), maxY = Math.max(p1[1], p2[1], p3[1]);
  const sign = (ax, ay, bx, by, cx2, cy2) => (ax - cx2) * (by - cy2) - (bx - cx2) * (ay - cy2);
  for (let y = Math.floor(minY * s); y <= Math.ceil(maxY * s); y++) {
    for (let x = Math.floor(minX * s); x <= Math.ceil(maxX * s); x++) {
      const px = (x + 0.5) / s, py = (y + 0.5) / s;
      const d1 = sign(px, py, p1[0], p1[1], p2[0], p2[1]);
      const d2 = sign(px, py, p2[0], p2[1], p3[0], p3[1]);
      const d3 = sign(px, py, p3[0], p3[1], p1[0], p1[1]);
      const neg = d1 < 0 || d2 < 0 || d3 < 0;
      const pos = d1 > 0 || d2 > 0 || d3 > 0;
      if (!(neg && pos)) setPx(c, x, y, col);
    }
  }
}

function circle(c, cx, cy, r, col) {
  ellipse(c, cx, cy, r, r, col);
}

function drawFish(size) {
  const c = makeCanvas(size);
  roundedSquare(c, 0.20);
  // tail (drawn first so body overlaps its joint)
  triangle(c, [0.70, 0.50], [0.92, 0.32], [0.92, 0.68], FG);
  // body
  ellipse(c, 0.52, 0.50, 0.26, 0.155, FG);
  // eye
  circle(c, 0.40, 0.455, 0.030, BG);
  return c;
}

/* ------------------------------------------------------------------ ICO */
function icoFromCanvas(c) {
  const s = c.size;
  const xorSize = s * s * 4;
  const andRowBytes = Math.ceil(s / 32) * 4;
  const andSize = andRowBytes * s;
  const bmpSize = 40 + xorSize + andSize;

  const buf = Buffer.alloc(6 + 16 + bmpSize);
  let o = 0;

  // ICONDIR
  buf.writeUInt16LE(0, o); o += 2; // reserved
  buf.writeUInt16LE(1, o); o += 2; // type: icon
  buf.writeUInt16LE(1, o); o += 2; // count

  // ICONDIRENTRY
  buf.writeUInt8(s, o); o += 1;          // width
  buf.writeUInt8(s, o); o += 1;          // height
  buf.writeUInt8(0, o); o += 1;          // palette
  buf.writeUInt8(0, o); o += 1;          // reserved
  buf.writeUInt16LE(1, o); o += 2;       // planes
  buf.writeUInt16LE(32, o); o += 2;      // bpp
  buf.writeUInt32LE(bmpSize, o); o += 4; // bytes in resource
  buf.writeUInt32LE(22, o); o += 4;      // offset (6 + 16)

  // BITMAPINFOHEADER (height doubled for XOR+AND)
  buf.writeUInt32LE(40, o); o += 4;
  buf.writeInt32LE(s, o); o += 4;
  buf.writeInt32LE(s * 2, o); o += 4;
  buf.writeUInt16LE(1, o); o += 2;
  buf.writeUInt16LE(32, o); o += 2;
  buf.writeUInt32LE(0, o); o += 4;              // BI_RGB
  buf.writeUInt32LE(xorSize + andSize, o); o += 4;
  buf.writeUInt32LE(0, o); o += 4;
  buf.writeUInt32LE(0, o); o += 4;
  buf.writeUInt32LE(0, o); o += 4;
  buf.writeUInt32LE(0, o); o += 4;

  // XOR pixel data, bottom-up, BGRA
  for (let y = s - 1; y >= 0; y--) {
    for (let x = 0; x < s; x++) {
      const i = (y * s + x) * 4;
      buf[o++] = c.px[i + 2]; // B
      buf[o++] = c.px[i + 1]; // G
      buf[o++] = c.px[i];     // R
      buf[o++] = c.px[i + 3]; // A
    }
  }
  // AND mask (unused with 32bpp alpha)
  o = 6 + 16 + 40 + xorSize;
  buf.fill(0, o, o + andSize);

  return buf;
}

/* ------------------------------------------------------------------ PNG */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function pngFromCanvas(c) {
  const s = c.size;
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(s, 0);
  ihdr.writeUInt32BE(s, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const raw = Buffer.alloc(s * (s * 4 + 1));
  for (let y = 0; y < s; y++) {
    raw[y * (s * 4 + 1)] = 0; // filter: none
    for (let x = 0; x < s; x++) {
      const i = (y * s + x) * 4, j = y * (s * 4 + 1) + 1 + x * 4;
      raw[j] = c.px[i]; raw[j + 1] = c.px[i + 1]; raw[j + 2] = c.px[i + 2]; raw[j + 3] = c.px[i + 3];
    }
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ----------------------------------------------------------------- main */
mkdirSync(join(ROOT, 'images'), { recursive: true });

const ico = icoFromCanvas(drawFish(32));
writeFileSync(join(ROOT, 'favicon.ico'), ico);
console.log(`favicon.ico written (${ico.length} bytes)`);

const png = pngFromCanvas(drawFish(180));
writeFileSync(join(ROOT, 'images', 'apple-touch-icon.png'), png);
console.log(`images/apple-touch-icon.png written (${png.length} bytes)`);
