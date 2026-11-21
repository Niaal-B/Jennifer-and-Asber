// One-off asset pipeline. Run with: npm run assets
// Reads the original client-supplied files in source-assets/ and writes
// web-ready versions to public/images/. Outputs are committed.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const SRC = 'source-assets';
const OUT = 'public/images';

// Frame ink colour: matches --ink in src/styles/tokens.css
const INK = { r: 0x3b, g: 0x34, b: 0x2b };
// The two frames in frames.png touch at this column.
const FRAME_SPLIT_X = 553;

await mkdir(OUT, { recursive: true });

/** Convert white-on-black line art into ink-coloured lines on transparency. */
async function tintLineArt(input, region, outFile) {
  const { data, info } = await sharp(input)
    .extract(region)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const rgba = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0; i < info.width * info.height; i++) {
    // Brightness becomes opacity; small values are noise from the black backdrop.
    const lum = data[i];
    const alpha = lum < 18 ? 0 : Math.min(255, Math.round((lum - 18) * 1.12));
    rgba[i * 4] = INK.r;
    rgba[i * 4 + 1] = INK.g;
    rgba[i * 4 + 2] = INK.b;
    rgba[i * 4 + 3] = alpha;
  }

  await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim({ threshold: 1 })
    .png({ compressionLevel: 9, palette: false })
    .toFile(path.join(OUT, outFile));

  // A WebP version as well (smaller); the PNG stays as a fallback.
  await sharp(path.join(OUT, outFile))
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(path.join(OUT, outFile.replace(/\.png$/, '.webp')));
}

const framesMeta = await sharp(`${SRC}/frames.png`).metadata();
await tintLineArt(
  `${SRC}/frames.png`,
  { left: 0, top: 0, width: FRAME_SPLIT_X, height: framesMeta.height },
  'frame-cover.png',
);
await tintLineArt(
  `${SRC}/frames.png`,
  { left: FRAME_SPLIT_X, top: 0, width: framesMeta.width - FRAME_SPLIT_X, height: framesMeta.height },
  'frame-invite.png',
);

// Painting background: the full image is needed because phones show it height-fitted.
await sharp(`${SRC}/painting.jpg`).webp({ quality: 74 }).toFile(`${OUT}/painting.webp`);
await sharp(`${SRC}/painting.jpg`).jpeg({ quality: 76, mozjpeg: true }).toFile(`${OUT}/painting.jpg`);
// Small blurred version shown while the full painting loads.
await sharp(`${SRC}/painting.jpg`).resize(48).blur(1).jpeg({ quality: 60 }).toFile(`${OUT}/painting-lqip.jpg`);
// Link-preview image (WhatsApp / social), 1200x630.
await sharp(`${SRC}/painting.jpg`)
  .resize(1200, 630, { fit: 'cover', position: 'centre' })
  .jpeg({ quality: 80, mozjpeg: true })
  .toFile(`${OUT}/og-image.jpg`);

// Tonearm: trim the transparent padding.
await sharp(`${SRC}/tonearm.png`).trim({ threshold: 1 }).webp({ quality: 90, alphaQuality: 100 }).toFile(`${OUT}/tonearm.webp`);
await sharp(`${SRC}/tonearm.png`).trim({ threshold: 1 }).png({ compressionLevel: 9 }).toFile(`${OUT}/tonearm.png`);

// Venue line drawing (client-supplied, cream lines on dark brown).
// Brightness becomes opacity so the drawing sits on the band with no visible box.
{
  const { data, info } = await sharp(`${SRC}/venue.png`)
    .resize(1400)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const BG = 56;   // backdrop brightness (just above the darkest background)
  const LINE = 215; // brightness of the cream lines
  const rgba = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0; i < info.width * info.height; i++) {
    const a = Math.max(0, Math.min(1, (data[i] - BG) / (LINE - BG)));
    rgba[i * 4] = 0xd8;
    rgba[i * 4 + 1] = 0xcc;
    rgba[i * 4 + 2] = 0xb6;
    rgba[i * 4 + 3] = Math.round(a * 255);
  }
  const img = sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } }).trim({ threshold: 1 });
  await img.clone().webp({ quality: 88, alphaQuality: 90 }).toFile(`${OUT}/venue.webp`);
  await img.clone().png({ compressionLevel: 9 }).toFile(`${OUT}/venue.png`);
}

console.log('Assets written to', OUT);
