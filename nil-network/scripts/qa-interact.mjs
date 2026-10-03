// Interaction QA: anchors into collapsed sections, sticky nav, Find My School. Runs against the local build server.
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const base = 'http://localhost:4321';
for (const [w, h] of [[1280, 900], [390, 844]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  const errs = []; p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (m) => m.type() === 'error' && !/kit\.com|ERR_/.test(m.text()) && errs.push(m.text()));
  for (const path of ['/nil/florida/colleges/university-of-florida/', '/nil/florida/high-schools/seminole-high-school-sanford/', '/nil/states/florida/']) {
    await p.goto(base + path, { waitUntil: 'domcontentloaded' });
    const hrefs = await p.$$eval('a[href^="#"]', (as) => [...new Set(as.map((a) => a.getAttribute('href')))].filter((x) => x.length > 1));
    let fail = [];
    for (const href of hrefs) {
      await p.evaluate(() => { document.querySelectorAll('details').forEach((d) => { d.open = false; }); window.scrollTo(0, 0); });
      await p.evaluate((h) => { document.querySelector(`a[href="${h}"]`).click(); }, href);
      await p.waitForTimeout(250);
      const ok = await p.evaluate((h) => { const r = document.getElementById(h.slice(1)).getBoundingClientRect(); return r.height > 0 && r.bottom > 0 && r.top < innerHeight; }, href);
      if (!ok) fail.push(href);
    }
    const sticky = await p.evaluate(async () => { window.scrollTo(0, 3000); await new Promise((r) => setTimeout(r, 700)); const r = document.querySelector('.jump').getBoundingClientRect(); return { top: Math.round(r.top), current: document.querySelector('[data-jump] a[aria-current]')?.textContent || null, h: Math.round(r.height) }; });
    console.log(w, path, JSON.stringify({ anchorsTested: hrefs.length, anchorFailures: fail, sticky }));
  }
  for (const path of ['/nil/', '/nil/states/florida/', '/nil/florida/colleges/', '/nil/florida/high-schools/']) {
    await p.goto(base + path, { waitUntil: 'domcontentloaded' });
    const vis = () => p.$$eval('.findlist li:not([hidden]) .fn', (e) => e.map((x) => x.textContent));
    const r = { initial: await vis() };
    const q = p.locator('[data-find-q]');
    for (const term of ['seminole', 'gainesville', 'SANFORD', 'ucf', 'central florida', 'zzz']) { await q.fill(term); r[term] = await vis(); }
    r.noneShown = await p.locator('[data-find-none]').isVisible();
    await q.fill(''); await p.locator('[data-find-type]').selectOption('high_school'); r.typeHS = await vis();
    await p.locator('[data-find-type]').selectOption('college'); r.typeCollege = await vis();
    await p.locator('[data-find-type]').selectOption(''); await p.locator('[data-find-state]').selectOption('FL'); r.stateFL = (await vis()).length;
    r.hrefs = await p.$$eval('.findlist a', (as) => as.map((a) => a.getAttribute('href')));
    r.inputH = await p.$eval('[data-find-q]', (e) => Math.round(e.getBoundingClientRect().height));
    console.log(w, 'FIND', path, JSON.stringify(r));
  }
  console.log(w, 'js errors:', JSON.stringify(errs));
  await p.close();
}
await b.close();
