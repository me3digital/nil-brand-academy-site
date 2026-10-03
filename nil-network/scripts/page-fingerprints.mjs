// Fingerprints every built page (content, title, canonical, robots) so the hosted site can be compared with this build.
// The same FN runs in a browser against the hosted site; the staging banner (data source, build time) is left out.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
export const FN = `async (paths) => { const out = {}; for (const p of paths) { const r = await fetch(p, { cache: 'no-store' }); const html = await r.text();
  const d = new DOMParser().parseFromString(html, 'text/html'); d.querySelectorAll('.staging, script, style').forEach((e) => e.remove());
  const s = [d.title, d.querySelector('link[rel=canonical]')?.getAttribute('href'), d.querySelector('meta[name=robots]')?.content, d.querySelector('meta[name=description]')?.content, d.body.textContent.replace(/\\s+/g, ' ').trim()].join('|');
  let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  out[p] = r.status + ':' + s.length + ':' + h.toString(16) + ':' + (r.headers.get('x-robots-tag') || '-'); } return out; }`;
const paths = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (f === 'index.html') paths.push('/' + path.relative('dist', path.dirname(p)).split(path.sep).join('/') + '/'); } })('dist/nil');
paths.sort();
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(() => chromium.launch());
const p = await b.newPage(); await p.goto('http://localhost:4321/nil/');
const map = await p.evaluate(`(${FN})(${JSON.stringify(paths)})`);
await b.close();
const strip = Object.fromEntries(Object.entries(map).map(([k, v]) => [k, v.split(':').slice(0, 3).join(':')]));
fs.writeFileSync('db/deploy/page-fingerprints.json', JSON.stringify({ fn: FN, pages: strip }, null, 1));
console.log('fingerprinted', paths.length, 'pages');
