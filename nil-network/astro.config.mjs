import { defineConfig } from 'astro/config';

// Pages live under src/pages/nil/ so the built output mirrors the public URL structure.
// Production serves this site at nilbrandacademy.com/nil/ through one proxy rule on the main site.
export default defineConfig({
  site: 'https://nilbrandacademy.com',
  trailingSlash: 'always',
  build: { format: 'directory', assets: 'nil/_assets', inlineStylesheets: 'always' },
  compressHTML: true,
  devToolbar: { enabled: false },
});
