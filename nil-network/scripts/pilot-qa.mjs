// Pilot-wide QA. Runs against every built page, not a sample.
//   QA_BASE=http://localhost:4321 node scripts/pilot-qa.mjs            (local build served from dist/)
//   QA_BASE=https://<staging host> node scripts/pilot-qa.mjs           (hosted staging; needs network access)
// The list of pages comes from dist/, so run a build first. Writes qa/pilot-qa.json and prints a summary.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const base = (process.env.QA_BASE || 'http://localhost:4321').replace(/\/$/, '');
const SITE = 'https://nilbrandacademy.com';
const paths = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (f === 'index.html') paths.push('/' + path.relative('dist', path.dirname(p)).split(path.sep).join('/') + '/'); } })('dist/nil');
paths.sort();
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(() => chromium.launch());
const out = { base, pages: {}, problems: [], external: new Set(), internal: new Set() };
const bad = (p, what, detail) => out.problems.push({ page: p, what, detail });

for (const w of [390, 1280]) {
  const ctx = await b.newContext({ viewport: { width: w, height: w < 600 ? 844 : 900 } });
  const p = await ctx.newPage();
  let errs = [];
  p.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.location()?.url || '')) errs.push(m.text().slice(0, 160)); });
  p.on('pageerror', (e) => errs.push('pageerror ' + String(e).slice(0, 160)));
  p.on('requestfailed', (r) => { if (r.url().startsWith(base)) errs.push('requestfailed ' + r.url()); });
  for (const pth of paths) {
    errs = [];
    const res = await p.goto(base + pth, { waitUntil: 'load' });
    const status = res.status();
    const xrobots = res.headers()['x-robots-tag'] || null;
    const r = await p.evaluate(() => {
      const de = document.documentElement;
      const over = [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return r.right > de.clientWidth + 1 && r.width > 0 && !e.closest('.jump') && !e.closest('[hidden]') && !e.closest('details:not([open])'); }).slice(0, 3).map((e) => e.tagName + '.' + e.className);
      const hs = [...document.querySelectorAll('h1,h2,h3,h4')].map((h) => +h.tagName[1]);
      let skip = 0; for (let i = 1; i < hs.length; i++) if (hs[i] - hs[i - 1] > 1) skip++;
      const ids = [...document.querySelectorAll('[id]')].map((e) => e.id); const dup = [...new Set(ids.filter((x, i) => ids.indexOf(x) !== i))];
      const badAnchors = [...new Set([...document.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute('href').slice(1)).filter((h) => h && !document.getElementById(h)))];
      // verbatim source quotes are exempt from the no-em-dash rule; everything we wrote is not
      const clone = document.body.cloneNode(true); clone.querySelectorAll('q, blockquote, .quote, .srcq').forEach((e) => e.remove());
      const text = clone.innerText;
      const junk = (text.match(/\bundefined\b|\bNaN\b|\[object Object\]|\bnull\b/g) || []).slice(0, 3);
      const emptyFields = [...document.querySelectorAll('dd, .summary dd')].filter((d) => !d.innerText.trim()).length;
      const links = [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'));
      return { scrollW: de.scrollWidth, clientW: de.clientWidth, over, h1: document.querySelectorAll('h1').length, headingSkips: skip, dupIds: dup, badAnchors,
        title: document.title, desc: document.querySelector('meta[name=description]')?.content || '', canonical: document.querySelector('link[rel=canonical]')?.getAttribute('href') || '',
        robots: document.querySelector('meta[name=robots]')?.content || '', emdash: (text.match(/—/g) || []).length, junk, emptyFields,
        ld: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => { try { JSON.parse(s.textContent); return 'ok'; } catch { return 'INVALID'; } }),
        details: document.querySelectorAll('details').length, links, banner: document.querySelector('.staging')?.dataset || null, gate: !!document.getElementById('gate') };
    });
    // accordions: every <details> must open and close from its summary
    const acc = await p.evaluate(() => { let broken = 0; document.querySelectorAll('details').forEach((d) => { const s = d.querySelector(':scope > summary'); if (!s) { broken++; return; } const was = d.open; s.click(); if (d.open === was) broken++; s.click(); }); return broken; });
    if (status !== 200) bad(pth, 'http status', status);
    if (r.scrollW > r.clientW + 1) bad(pth, `horizontal overflow at ${w}px`, r.over.join(' '));
    if (r.h1 !== 1) bad(pth, 'h1 count', r.h1);
    if (r.headingSkips) bad(pth, 'heading level skipped', r.headingSkips);
    if (r.dupIds.length) bad(pth, 'duplicate ids', r.dupIds.join(','));
    if (r.badAnchors.length) bad(pth, 'in-page links with no target', r.badAnchors.join(','));
    if (r.junk.length) bad(pth, 'placeholder text on page', r.junk.join(','));
    if (r.emptyFields) bad(pth, 'empty fields', r.emptyFields);
    if (r.emdash) bad(pth, 'em dash outside a verbatim quote', r.emdash);
    if (r.ld.includes('INVALID')) bad(pth, 'invalid JSON-LD', '');
    if (acc) bad(pth, 'broken accordions', acc);
    if (errs.length) bad(pth, `console or network errors at ${w}px`, [...new Set(errs)].slice(0, 3).join(' | '));
    if (w === 1280) {
      if (!r.title || r.title.length > 70) bad(pth, 'title missing or over 70 characters', r.title.length);
      if (!r.desc || r.desc.length < 70 || r.desc.length > 175) bad(pth, 'meta description length', r.desc.length);
      if (r.canonical !== SITE + pth) bad(pth, 'canonical', r.canonical);
      if (!/noindex/.test(r.robots)) bad(pth, 'robots meta is not noindex', r.robots);
      if (base.startsWith('https') && !/noindex/.test(xrobots || '')) bad(pth, 'X-Robots-Tag header missing', xrobots);
      for (const h of r.links) { if (h.startsWith('/')) out.internal.add(h.split('#')[0]); else if (/^https?:/.test(h)) out.external.add(h); }
      out.pages[pth] = { title: r.title, desc: r.desc, canonical: r.canonical, robots: r.robots, xrobots, details: r.details, banner: r.banner, gate: r.gate };
    }
  }
  await ctx.close();
}

// duplicates across the whole pilot
const dupOf = (k) => { const m = new Map(); for (const [p, v] of Object.entries(out.pages)) { if (!m.has(v[k])) m.set(v[k], []); m.get(v[k]).push(p); } return [...m.entries()].filter(([, v]) => v.length > 1); };
for (const [t, ps] of dupOf('title')) bad(ps.join(' '), 'duplicate title', t);
for (const [t, ps] of dupOf('desc')) bad(ps.join(' '), 'duplicate meta description', t.slice(0, 60));

// internal links: every one must resolve to a built page, a redirect or a file
const redirects = fs.readFileSync('dist/_redirects', 'utf8').split('\n').map((l) => l.split(' ')[0]);
const brokenInternal = [...out.internal].filter((h) => {
  if (!h.startsWith('/nil/')) return false;                                  // main-site links are checked separately
  return !(paths.includes(h) || redirects.includes(h) || fs.existsSync(path.join('dist', h)));
});
for (const h of brokenInternal) bad('(site)', 'broken internal link', h);

// 404 behaviour
{ const ctx = await b.newContext(); const p = await ctx.newPage();
  const res = await p.goto(base + '/nil/florida/colleges/not-a-real-school/', { waitUntil: 'domcontentloaded' });
  out.notFound = { status: res.status(), branded: await p.evaluate(() => /not find|not found|404/i.test(document.body.innerText) && !!document.querySelector('a[href="/nil/"]')) };
  if (base.startsWith('https') && res.status() !== 404) bad('(site)', '404 status', res.status());

  // Find My School
  await p.goto(base + '/nil/', { waitUntil: 'networkidle' });
  const find = async (qv, type = '') => p.evaluate(({ qv, type }) => { const root = document.querySelector('[data-find]'); const q = root.querySelector('[data-find-q]'); const t = root.querySelector('[data-find-type]');
    t.value = type; q.value = qv; q.dispatchEvent(new Event('input', { bubbles: true }));
    return [...root.querySelectorAll('.findlist li')].filter((li) => !li.hidden).map((li) => li.querySelector('.fn').textContent + ' [' + li.dataset.type + ']'); }, { qv, type });
  const T = []; const hubs = () => Object.keys(out.pages).filter((x) => /\/(colleges|high-schools)\/[^/]+\/$/.test(x));
  const expect = async (label, qv, type, test) => { const r = await find(qv, type); const ok = test(r); T.push({ label, query: qv, type: type || 'all', results: r.length, ok, sample: r.slice(0, 4) }); if (!ok) bad('/nil/', 'Find My School: ' + label, `${qv} -> ${r.join('; ')}`); };
  const names = (r) => r.map((x) => x.replace(/ \[.*$/, ''));
  await expect('everything listed with no filter', '', '', (r) => r.length === Object.keys(out.pages).filter((x) => /\/(colleges|high-schools)\/[^/]+\/$/.test(x)).length);
  await expect('full school name', 'Florida State University', '', (r) => r.length === 1 && /Florida State/.test(r[0]));
  await expect('high school by name', 'Boone High School', '', (r) => r.length === 1 && /Boone/.test(r[0]));
  await expect('partial name', 'winder', '', (r) => r.length === 1 && /Windermere/.test(r[0]));
  await expect('partial, several matches', 'lake', '', (r) => names(r).includes('Lake Nona High School'));
  await expect('abbreviation', 'FAMU', '', (r) => r.length === 1 && /Florida A&M/.test(r[0]));
  await expect('abbreviation, lower case', 'ucf', '', (r) => r.length === 1 && /Central Florida/.test(r[0]));
  await expect('punctuation ignored', 'dr phillips', '', (r) => r.length === 1 && /Dr\. Phillips/.test(r[0]));
  await expect('city', 'Tallahassee', '', (r) => r.length === 2 && r.every((x) => /college/.test(x)));
  await expect('city with many schools', 'Orlando', '', (r) => r.length >= 10 && r.some((x) => /college/.test(x)) && r.some((x) => /high_school/.test(x)));
  await expect('city plus type words', 'orlando high school', '', (r) => r.length >= 9 && r.every((x) => /high_school/.test(x)));
  await expect('type filter: college only', '', 'college', (r) => r.length === hubs().filter((x) => /colleges/.test(x)).length && r.every((x) => /college/.test(x)));
  await expect('type filter: high school only', '', 'high_school', (r) => r.length === hubs().filter((x) => /high-schools/.test(x)).length && r.every((x) => /high_school/.test(x)));
  await expect('name match ranks above county match', 'Seminole High School', '', (r) => /^Seminole High School/.test(r[0]) && r.every((x) => /high_school/.test(x)));
  await expect('county search', 'seminole county', 'high_school', (r) => r.length === 9);
  await expect('same place name: school named for it comes first', 'Winter Park', '', (r) => /^Winter Park High School/.test(r[0]) && r.length === 2);
  await expect('two schools in one city, name match first', 'Oviedo', '', (r) => /^Oviedo High School/.test(r[0]) && r.length === 2);
  await expect('same city, two colleges', 'Jacksonville', 'college', (r) => r.length === 2);
  await expect('same place name in a college and a high school filter', 'Winter Park', 'college', (r) => r.length === 0);
  await expect('"Miami" finds both Miami schools', 'Miami', '', (r) => r.length === 2);
  await expect('two words in any order', 'high apopka', '', (r) => r.length === 2);
  await expect('no match shows the fallback', 'zzzz', '', (r) => r.length === 0);
  out.findNoneShown = await p.evaluate(() => !document.querySelector('[data-find-none]').hidden);
  if (!out.findNoneShown) bad('/nil/', 'Find My School: fallback message hidden on no match', '');
  out.find = T;
  await ctx.close(); }

// sitemaps and robots
out.sitemaps = {};
for (const f of fs.readdirSync('dist/nil').filter((f) => f.startsWith('sitemap'))) { const x = fs.readFileSync('dist/nil/' + f, 'utf8'); out.sitemaps[f] = (x.match(/<loc>/g) || []).length; if (out.sitemaps[f]) bad('(site)', 'sitemap is not empty', f); }
out.robotsTxt = fs.readFileSync('dist/robots.txt', 'utf8').includes('Disallow: /');
out.headers = fs.readFileSync('dist/_headers', 'utf8').includes('X-Robots-Tag: noindex, nofollow');
await b.close();

out.external = [...out.external].sort(); out.internal = [...out.internal].sort();
fs.mkdirSync('qa', { recursive: true });
fs.writeFileSync('qa/pilot-qa.json', JSON.stringify(out, null, 1));
const hubs = Object.keys(out.pages).filter((x) => /\/(colleges|high-schools)\/[^/]+\/$/.test(x));
console.log(`base ${base}`);
console.log(`pages checked: ${paths.length} at 390px and 1280px (${hubs.length} school hubs)`);
console.log(`internal links: ${out.internal.length} unique, broken: ${brokenInternal.length}`);
console.log(`external links: ${out.external.length} unique (checked separately)`);
console.log(`noindex meta on every page: ${Object.values(out.pages).every((v) => /noindex/.test(v.robots))}; sitemap entries: ${Object.values(out.sitemaps).reduce((a, c) => a + c, 0)}; robots.txt disallow all: ${out.robotsTxt}; X-Robots-Tag header rule: ${out.headers}`);
console.log(`accordions exercised: ${Object.values(out.pages).reduce((a, v) => a + v.details, 0)}`);
console.log(`404: ${JSON.stringify(out.notFound)}`);
console.log(`Find My School: ${out.find.filter((t) => t.ok).length} of ${out.find.length} passed`);
console.log(`problems: ${out.problems.length}`);
for (const x of out.problems.slice(0, 60)) console.log('  -', x.page, '|', x.what, '|', x.detail);
process.exit(out.problems.length ? 1 : 0);
