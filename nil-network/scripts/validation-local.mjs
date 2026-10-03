// Prints the validation fingerprint from the local reference database (fresh PGlite built from migrations + seed).
import fs from 'node:fs';
import { q } from '../src/lib/db.mjs';
const rows = await q(fs.readFileSync('db/deploy/validate.sql', 'utf8'));
console.log(rows.map((r) => `${r.k}=${r.v}`).join('\n'));
