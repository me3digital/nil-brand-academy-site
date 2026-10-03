import { indexablePaths } from '../../lib/data.mjs';
import { SITE, STAGING } from '../../lib/site.mjs';
export const SEGMENTS = { hubs: (p) => !/\/(colleges|high-schools)\/[^/]+\/$/.test(p), colleges: (p) => /\/colleges\/[^/]+\/$/.test(p), 'high-schools': (p) => /\/high-schools\/[^/]+\/$/.test(p) };
export async function GET() {
  const paths = STAGING ? [] : await indexablePaths();
  const segs = Object.entries(SEGMENTS).filter(([, f]) => paths.some((p) => f(p.path))).map(([k]) => k);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${segs.map((s) => `  <sitemap><loc>${SITE}/nil/sitemap-${s}.xml</loc></sitemap>`).join('\n')}\n</sitemapindex>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
}
