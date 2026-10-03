// Writes Netlify _redirects and _headers for the /nil/ site from the redirects table.
import fs from 'node:fs';
import { q } from '../src/lib/db.mjs';
const rows = await q('select * from redirects order by from_path');
fs.writeFileSync('dist/_redirects', rows.map((r) => `${r.from_path} ${r.to_path} ${r.status}`).join('\n') + '\n');
const staging = process.env.NIL_STAGING !== '0';
fs.writeFileSync('dist/_headers', `/nil/_assets/*\n  Cache-Control: public, max-age=31536000, immutable\n${staging ? '/*\n  X-Robots-Tag: noindex\n' : ''}`);
console.log('wrote _redirects and _headers', rows.length);
