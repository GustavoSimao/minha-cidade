/**
 * Gera os ícones do PWA (PNG real, sem dependência de biblioteca de imagem).
 *
 * Uso:  node apps/web/scripts/generate-pwa-icons.mjs
 * Saída: apps/web/public/icons/{icon-192,icon-512,maskable-512,apple-touch-icon}.png
 *
 * O desenho é uma "casa" (bairro) em brand-600 com Glyph branco — os tokens de cor
 * estão em apps/web/src/app/globals.css. Trocar a paleta exige regerar os ícones.
 */

import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BRAND = [11, 108, 112]; // --color-brand-600 #0b6c70
const BRAND_DARK = [7, 81, 85]; // --color-brand-700 #075155
const WHITE = [255, 255, 255];

function crc32(buffer) {
  let crc = ~0;
  for (let index = 0; index < buffer.length; index += 1) {
    crc ^= buffer[index];
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return ~crc >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeAndData = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);

  return Buffer.concat([length, typeAndData, crc]);
}

/** Codifica um buffer RGBA (width*height*4) em PNG. */
function encodePng(width, height, rgba) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // color type: RGBA
  header[10] = 0; // compression
  header[11] = 0; // filter
  header[12] = 0; // interlace

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0; // filtro "none" por linha
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function insideRoundedRect(x, y, left, top, size, radius) {
  const localX = Math.max(left - x, x - (left + size), 0);
  const localY = Math.max(top - y, y - (top + size), 0);
  const cornerX = Math.max(left + radius - x, x - (left + size - radius), 0);
  const cornerY = Math.max(top + radius - y, y - (top + size - radius), 0);

  if (localX > 0 || localY > 0) {
    return false;
  }

  return cornerX * cornerX + cornerY * cornerY <= radius * radius;
}

function insideTriangle(x, y, ax, ay, bx, by, cx, cy) {
  const sign = (px, py, qx, qy, rx, ry) =>
    (px - rx) * (qy - ry) - (qx - rx) * (py - ry);

  const d1 = sign(x, y, ax, ay, bx, by);
  const d2 = sign(x, y, bx, by, cx, cy);
  const d3 = sign(x, y, cx, cy, ax, ay);

  const hasNegative = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPositive = d1 > 0 || d2 > 0 || d3 > 0;

  return !(hasNegative && hasPositive);
}

/** Desenha o ícone: fundo brand + casa branca centralizada (tudo em espaço 0..512). */
function render(size, { maskable = false } = {}) {
  const rgba = Buffer.alloc(size * size * 4);

  // Área segura do maskable: 80% central (o resto pode ser cortado pela máscara).
  const half = (maskable ? 0.31 : 0.39) * 512;

  const apexX = 256;
  const apexY = 256 - half;
  const baseY = 256 + half * 0.15;

  const bodyLeft = 256 - half * 0.8;
  const bodyRight = 256 + half * 0.8;
  const bodyBottom = 256 + half * 0.9;

  const doorLeft = 256 - half * 0.16;
  const doorRight = 256 + half * 0.16;
  const doorTop = 256 + half * 0.35;

  const radius = maskable ? 0 : 110;

  for (let pixelY = 0; pixelY < size; pixelY += 1) {
    const y = ((pixelY + 0.5) / size) * 512;

    for (let pixelX = 0; pixelX < size; pixelX += 1) {
      const x = ((pixelX + 0.5) / size) * 512;
      const offset = (pixelY * size + pixelX) * 4;

      const inBackground = maskable
        ? insideRoundedRect(x, y, 0, 0, 512, 0)
        : insideRoundedRect(x, y, 0, 0, 512, radius);

      if (!inBackground) {
        rgba[offset + 3] = 0;
        continue;
      }

      const background = maskable ? BRAND_DARK : BRAND;
      const inRoof = insideTriangle(
        x,
        y,
        apexX,
        apexY,
        256 - half,
        baseY,
        256 + half,
        baseY,
      );
      const inBody = x >= bodyLeft && x <= bodyRight && y >= baseY && y <= bodyBottom;
      const inDoor = x >= doorLeft && x <= doorRight && y >= doorTop && y <= bodyBottom;

      const color = inRoof || inBody ? (inDoor && !inRoof ? background : WHITE) : background;

      rgba[offset] = color[0];
      rgba[offset + 1] = color[1];
      rgba[offset + 2] = color[2];
      rgba[offset + 3] = 255;
    }
  }

  return encodePng(size, size, rgba);
}

const here = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(here, "..", "public", "icons");
const appIconsDir = join(here, "..", "src", "app");
mkdirSync(iconsDir, { recursive: true });

const targets = [
  { name: "icon-192.png", size: 192, maskable: false },
  { name: "icon-512.png", size: 512, maskable: false },
  { name: "maskable-512.png", size: 512, maskable: true },
  { name: "apple-touch-icon.png", size: 180, maskable: false },
];

for (const target of targets) {
  const png = render(target.size, { maskable: target.maskable });
  writeFileSync(join(iconsDir, target.name), png);
  console.log(`${target.name} — ${png.length} bytes`);
}

const appIcon = render(512);
const appleIcon = render(180);
writeFileSync(join(appIconsDir, "icon.png"), appIcon);
writeFileSync(join(appIconsDir, "apple-icon.png"), appleIcon);

const faviconPng = render(256);
const favicon = Buffer.alloc(22 + faviconPng.length);
favicon.writeUInt16LE(1, 2); // ICO resource type
favicon.writeUInt16LE(1, 4); // one image
favicon[6] = 0; // 256px
favicon[7] = 0; // 256px
favicon.writeUInt16LE(1, 10); // color planes
favicon.writeUInt16LE(32, 12); // bits per pixel
favicon.writeUInt32LE(faviconPng.length, 14);
favicon.writeUInt32LE(22, 18);
faviconPng.copy(favicon, 22);
writeFileSync(join(appIconsDir, "favicon.ico"), favicon);
console.log(`App Router icons updated — ${appIcon.length}, ${appleIcon.length}, ${favicon.length} bytes`);
