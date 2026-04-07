/**
 * 1) Zooms artwork to fill canvas (removes RFG padding).
 * 2) Crops bottom strip (wordmark) — viewBox height 717px of 1024.
 * 3) Re-exports raster favicons from the updated SVG.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const svgPath = path.join(__dirname, "favicon.svg");

let svg = fs.readFileSync(svgPath, "utf8");

const OLD_OPEN =
  '<g clip-path="url(#SvgjsClipPath1005)"><rect width="1000" height="1000" fill="#ffffff"></rect><g transform="matrix(0.68359375,0,0,0.68359375,150,150)">';
const CROP_H = 717;
const s = 1000 / CROP_H;
const tx = (1000 - 1024 * s) / 2;
const NEW_OPEN = `<g clip-path="url(#SvgjsClipPath1005)"><g transform="translate(${tx},0) scale(${s})">`;

if (svg.includes(OLD_OPEN)) {
  svg = svg.replace(OLD_OPEN, NEW_OPEN);
  svg = svg.replace(
    'viewBox="0 0 1024 1024"',
    `viewBox="0 0 1024 ${CROP_H}"`,
  );
  fs.writeFileSync(svgPath, svg);
  console.log("Updated favicon.svg (full-bleed + crop)");
} else if (!svg.includes(`viewBox="0 0 1024 ${CROP_H}"`)) {
  console.warn("SVG already edited; viewBox unexpected — check favicon.svg");
}

const buf = Buffer.from(svg, "utf8");

async function outPng(px, name) {
  await sharp(buf, { density: 300 })
    .resize(px, px, { fit: "cover", position: "centre" })
    .png({ compressionLevel: 9 })
    .toFile(path.join(__dirname, name));
  console.log("wrote", name);
}

await outPng(96, "favicon-96x96.png");
await outPng(180, "apple-touch-icon.png");
await outPng(192, "web-app-manifest-192x192.png");
await outPng(512, "web-app-manifest-512x512.png");

const b16 = await sharp(buf, { density: 300 })
  .resize(16, 16, { fit: "cover", position: "centre" })
  .png()
  .toBuffer();
const b32 = await sharp(buf, { density: 300 })
  .resize(32, 32, { fit: "cover", position: "centre" })
  .png()
  .toBuffer();
const b48 = await sharp(buf, { density: 300 })
  .resize(48, 48, { fit: "cover", position: "centre" })
  .png()
  .toBuffer();
const ico = await pngToIco([b16, b32, b48]);
fs.writeFileSync(path.join(__dirname, "favicon.ico"), ico);
console.log("wrote favicon.ico");
