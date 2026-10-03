import { indexablePaths } from '../../lib/data.mjs';
import { SITE, STAGING } from '../../lib/site.mjs';
import { SEGMENTS } from './sitemap-index.xml.js';
export function getStaticPaths() { return Object.keys(SEGMENTS).map((segment) => ({ params: { segment } })); }
export async function GET({ params }) {
  const paths = (STAGING ? [] : await indexablePaths()).filter((p) => SEGMENTS[params.segment](p.path));
  const d = (x) => (x instanceof Date ? x.toISOString().slice(0, 10) : x);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map((p) => `  <url><loc>${SITE}${p.path}</loc>${p.last_updated ? `<lastmod>${d(p.last_updated)}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
}
