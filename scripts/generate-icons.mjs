// Regenerates PWA icons and favicon from the project logo.
// Usage: node scripts/generate-icons.mjs
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'PrairieGNAT-logo.png');
const OUT = join(root, 'public');

const png = { compressionLevel: 9, palette: true };

await sharp(SRC).resize(192, 192).png(png).toFile(join(OUT, 'icons/192.png'));
await sharp(SRC).resize(512, 512).png(png).toFile(join(OUT, 'icons/512.png'));
await sharp(SRC).resize(64, 64).png(png).toFile(join(OUT, 'favicon.png'));

// Maskable: logo scaled to the ~80% safe zone on a dark canvas so circular
// masks don't clip the artwork.
const inner = await sharp(SRC).resize(410, 410).png().toBuffer();
await sharp({
  create: { width: 512, height: 512, channels: 4, background: '#0b0d10' },
})
  .composite([{ input: inner, gravity: 'center' }])
  .png(png)
  .toFile(join(OUT, 'icons/maskable.png'));

console.log('icons written to public/');
