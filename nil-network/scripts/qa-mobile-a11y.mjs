// Mobile navigation at real device sizes, keyboard operation of accordions, and quick-answer link targets.
import { chromium, devices } from 'playwright';
const base = process.env.QA_BASE || 'http://localhost:4321';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const pages = ['/nil/florida/colleges/university-of-florida/', '/nil/florida/high-schools/seminole-high-school-sanford/', '/nil/states/florida/'];
for (const name of ['iPhone SE', 'iPhone 14', 'Pixel 7', 'Galaxy S9+', 'iPad Mini']) {
  const ctx = await b.newContext({ ...devices[name] }); const p = await ctx.newPage();
  for (const path of pages) {
    await p.goto(base + path, { waitUntil: 'domcontentloaded' });
    const r = await p.evaluate(async () => {
      const de = document.documentElement, nav = document.querySelector('.jump'), bar = document.querySelector('[data-jump]');
      window.scrollTo(0, 2500); await new Promise((r) => setTimeout(r, 400));
      const nr = nav.getBoundingClientRect(); const hdr = document.querySelector('header.site').getBoundingClientRect();
      const links = [...bar.querySelectorAll('a')]; const minH = Math.min(...links.map((a) => a.getBoundingClientRect().height));
      const cur = bar.querySelector('a[aria-current]'); const cr = cur ? cur.getBoundingClientRect() : null;
      // tap the last pill: scroll it into view inside the bar, click, confirm the section is at the top under the sticky bars
      const last = links[links.length - 1]; bar.scrollLeft = bar.scrollWidth; last.click(); await new Promise((r) => setTimeout(r, 400));
      const target = document.getElementById(last.getAttribute('href').slice(1)); const tr = target.getBoundingClientRect();
      return { vw: de.clientWidth, sideScroll: de.scrollWidth > de.clientWidth, stuck: Math.round(nr.top) === Math.round(hdr.bottom), navH: Math.round(nr.height), minTapH: Math.round(minH),
        currentVisible: cr ? cr.left >= 0 && cr.right <= de.clientWidth + 1 : null, barScrolls: bar.scrollWidth > bar.clientWidth,
        lastLands: tr.top < innerHeight * 0.6, headingNotCovered: tr.top >= document.querySelector('.jump').getBoundingClientRect().bottom - 1, gapUnderHeader: Math.round(nr.top - hdr.bottom) };
    });
    console.log(name.padEnd(11), path.split('/').slice(-2, -1)[0].slice(0, 22).padEnd(22), JSON.stringify(r));
  }
  await ctx.close();
}
// keyboard
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
for (const path of pages) {
  await p.goto(base + path, { waitUntil: 'domcontentloaded' });
  const k = await p.evaluate(() => {
    const ds = [...document.querySelectorAll('details')];
    const bad = ds.filter((d) => !d.querySelector(':scope > summary')).length;
    ds.forEach((d) => { d.open = true; }); const focusable = ds.filter((d) => { const s = d.querySelector(':scope > summary'); s.focus(); return document.activeElement === s; }).length; ds.forEach((d) => { d.open = false; });
    const interactiveInSummary = ds.filter((d) => d.querySelector(':scope > summary a, :scope > summary button')).length;
    return { details: ds.length, missingSummary: bad, summariesFocusable: focusable, interactiveInsideSummary: interactiveInSummary };
  });
  // real key presses on the first collapsed accordion
  const first = await p.$('details:not([open]) > summary'); await first.focus();
  const before = await first.evaluate((s) => s.parentElement.open); await p.keyboard.press('Enter');
  const afterEnter = await first.evaluate((s) => s.parentElement.open); await p.keyboard.press('Space');
  const afterSpace = await first.evaluate((s) => s.parentElement.open);
  const ring = await first.evaluate((s) => getComputedStyle(s).outlineStyle);
  // quick answers: each links to a rule card whose topic matches the question's deciding rule
  const quick = await p.evaluate(() => [...document.querySelectorAll('ul.quick li')].map((li) => { const a = li.querySelector('a.qlink'); const t = a && document.getElementById(a.getAttribute('href').slice(1)); return { q: li.querySelector('h3').textContent, ok: !!t, hasSource: !!(t && t.querySelector('.cite a')), rule: t ? t.querySelector('h3').textContent : null }; }));
  console.log('KEYBOARD', path.split('/').slice(-2, -1)[0], JSON.stringify({ ...k, enterOpens: !before && afterEnter, spaceCloses: !afterSpace, focusRing: ring }));
  if (quick.length) console.log('QUICK', JSON.stringify({ n: quick.length, allResolve: quick.every((x) => x.ok), allHaveSource: quick.every((x) => x.hasSource), map: quick.map((x) => x.q.replace('Can I ', '').replace('?', '') + ' -> ' + x.rule) }));
}
await b.close();
