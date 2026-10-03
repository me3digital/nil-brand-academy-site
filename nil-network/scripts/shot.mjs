import { chromium } from 'playwright';
const [,, path, out, w = '1280', full = '1'] = process.argv;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(() => chromium.launch());
const p = await b.newPage({ viewport: { width: +w, height: +w < 600 ? 844 : 900 }, deviceScaleFactor: 1 });
await p.goto('http://localhost:4321' + path, { waitUntil: 'networkidle' });
await p.screenshot({ path: out, fullPage: full === '1' });
await b.close();
