// Writes Netlify _redirects and _headers for the /nil/ site from the redirects table.
import fs from 'node:fs';
import { q } from '../src/lib/db.mjs';
const rows = await q('select * from redirects order by from_path');
fs.writeFileSync('dist/_redirects', rows.map((r) => `${r.from_path} ${r.to_path} ${r.status}`).join('\n') + '\n');
const staging = process.env.NIL_STAGING !== '0';
fs.writeFileSync('dist/_headers', `/nil/_assets/*\n  Cache-Control: public, max-age=31536000, immutable\n${staging ? '/*\n  X-Robots-Tag: noindex, nofollow\n' : ''}`);
console.log('wrote _redirects and _headers', rows.length);

// Launch guard: a launch build must not contain staging-only markup or a blanket noindex.
if (!staging) {
  const bad = [];
  (function walk(d) { for (const f of fs.readdirSync(d)) { const p = d + '/' + f; if (fs.statSync(p).isDirectory()) walk(p); else if (p.endsWith('.html')) { const h = fs.readFileSync(p, 'utf8'); if (h.includes('id="gate"') || h.includes('class="staging"') || h.includes('noindex, nofollow')) bad.push(p); } } })('dist');
  if (bad.length) { console.error('Launch build contains staging-only output:', bad.slice(0, 5)); process.exit(1); }
  console.log('launch guard passed: no staging-only markup');
}
