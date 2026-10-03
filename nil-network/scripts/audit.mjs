// QA pass over the built site: overflow, headings, links, canonicals, robots, JSON-LD, images, a11y basics.
import { chromium } from 'playwright';
import fs from 'node:fs';
const pages = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
for (const w of [390, 1280]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  for (const path of pages) {
    await p.goto('http://localhost:4321' + path, { waitUntil: 'networkidle' });
    const r = await p.evaluate(() => {
      const de = document.documentElement;
      const over = [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return r.right > de.clientWidth + 1 && !e.closest('.tablewrap') && !e.closest('.jump'); }).slice(0, 4).map((e) => e.tagName + '.' + e.className + ':' + Math.round(e.getBoundingClientRect().right));
      const hs = [...document.querySelectorAll('h1,h2,h3,h4')].map((h) => +h.tagName[1]);
      let skip = 0; for (let i = 1; i < hs.length; i++) if (hs[i] - hs[i - 1] > 1) skip++;
      const ids = [...document.querySelectorAll('[id]')].map((e) => e.id); const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
      const badAnchors = [...document.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute('href').slice(1)).filter((h) => h && !document.getElementById(h));
      const small = [...document.querySelectorAll('a,summary')].filter((a) => { const r = a.getBoundingClientRect(); return r.width > 0 && r.height < 24 && !a.closest('p,li,td,small,.foot,.crumbs'); }).length;
      return { scrollW: de.scrollWidth, clientW: de.clientWidth, over, h1: document.querySelectorAll('h1').length, headingSkips: skip, dupIds: [...new Set(dup)], badAnchors: [...new Set(badAnchors)],
        canonical: document.querySelector('link[rel=canonical]')?.href, robots: document.querySelector('meta[name=robots]')?.content, title: document.title.length, desc: document.querySelector('meta[name=description]')?.content.length,
        ld: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => { try { return JSON.parse(s.textContent)['@type']; } catch { return 'INVALID'; } }),
        imgsNoAlt: [...document.querySelectorAll('img:not([alt])')].length, smallTargets: small, emdash: (document.body.innerText.match(/—/g) || []).length, lang: de.lang };
    });
    console.log(w, path, JSON.stringify(r));
  }
  await p.close();
}
await b.close();
