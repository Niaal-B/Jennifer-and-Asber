// Renders scripts/og/og.html with the local Google Chrome and saves the
// WhatsApp / social link-preview image. Run with: npm run og
import { chromium } from 'playwright-core';
import sharp from 'sharp';
import { statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const template = pathToFileURL(fileURLToPath(new URL('./og/og.html', import.meta.url))).href;
const out = 'public/images/og-image.jpg';

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto(template, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
const png = await page.screenshot({ type: 'png' });
await browser.close();

// WhatsApp is most reliable with previews under ~300 KB.
await sharp(png).jpeg({ quality: 84, mozjpeg: true }).toFile(out);
console.log(`${out}: ${Math.round(statSync(out).size / 1024)} KB`);
