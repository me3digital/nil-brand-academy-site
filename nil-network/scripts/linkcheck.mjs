// Internal link and anchor check over the built site. External links are listed, not fetched (run those from a browser).
import fs from 'node:fs'; import path from 'node:path';
const root = 'dist'; const files = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') && files.push(p); } })(root);
const exists = (u) => { const p = path.join(root, u); return fs.existsSync(p) && (fs.statSync(p).isFile() || fs.existsSync(path.join(p, 'index.html'))); };
const PROD = [/^\/$/, /^\/blog\//, /^\/privacy$/, /^\/favicon\.ico$/, /^\/apple-touch-icon\.png$/, /^\/og-card\.png$/];   // served by the existing production site
let bad = 0, internal = 0, anchors = 0; const ext = new Set(), prod = new Set();
for (const f of files) {
  const html = fs.readFileSync(f, 'utf8'); const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  for (const m of html.matchAll(/<a\s[^>]*href="([^"]+)"/g)) {
    const h = m[1].replace(/&amp;/g, '&');
    if (h.startsWith('#')) { anchors++; if (h.length > 1 && !ids.has(h.slice(1))) { bad++; console.log('BAD ANCHOR', f, h); } continue; }
    if (/^(https?:|mailto:)/.test(h)) { ext.add(h); continue; }
    const [p, frag] = h.split('#');
    if (PROD.some((r) => r.test(p))) { prod.add(p); continue; }
    internal++;
    if (!exists(p)) { bad++; console.log('BROKEN', f, h); continue; }
    if (frag) { const t = fs.readFileSync(path.join(root, p, 'index.html'), 'utf8'); if (!t.includes(`id="${frag}"`)) { bad++; console.log('BAD CROSS-PAGE ANCHOR', f, h); } }
  }
}
console.log(JSON.stringify({ pages: files.length, internalLinks: internal, anchorLinks: anchors, broken: bad, productionLinks: [...prod], externalLinks: ext.size }));
if (process.argv.includes('--ext')) console.log([...ext].join('\n'));
