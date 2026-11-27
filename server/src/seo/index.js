/**
 * SEO helpers shared with the client (../../shared/seo-pages.json):
 *  - /sitemap.xml  generated from public pages
 *  - /robots.txt   allows public pages, blocks dashboard/auth/api
 *  - renderIndex   injects per-route <title>, meta, canonical & OG tags into the
 *                  built SPA so crawlers and social previews get correct metadata
 *                  without executing JavaScript.
 */
const fs = require('fs');
const path = require('path');
const env = require('../config/env');
const seo = require('../../../shared/seo-pages.json');

/** Public pages that currently exist (feature-switched pages are left out) */
const PAGES = Object.fromEntries(Object.entries(seo.pages).filter(([p]) => p !== '/referrals' || env.features.referrals));

const PRIVATE_PREFIXES = ['/admin', '/login'];

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function sitemap(_req, res) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = Object.entries(PAGES)
    .map(
      ([p, meta]) => `  <url>
    <loc>${esc(env.siteUrl + (p === '/' ? '/' : p))}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${meta.changefreq}</changefreq>
    <priority>${meta.priority}</priority>
  </url>`
    )
    .join('\n');
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`);
}

function robots(_req, res) {
  res.type('text/plain').send(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /login
Disallow: /api/

Sitemap: ${env.siteUrl}/sitemap.xml
`);
}

let template;
function renderIndex(distDir) {
  return (req, res) => {
    if (!template || !env.isProd) template = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
    const route = req.path.replace(/\/+$/, '') || '/';
    const isPrivate = PRIVATE_PREFIXES.some((p) => route === p || route.startsWith(`${p}/`));
    const meta = PAGES[route];
    let html = template;

    if (isPrivate) {
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
      html = html.replace('<meta name="robots" content="index, follow" />', '<meta name="robots" content="noindex, nofollow" />');
    } else if (meta) {
      const url = env.siteUrl + (route === '/' ? '/' : route);
      const image = env.siteUrl + seo.defaultImage;
      html = html
        .replace(/<title>[^<]*<\/title>/, `<title>${esc(meta.title)}</title>`)
        .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(meta.description)}$2`)
        .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${esc(url)}$2`)
        .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(meta.title)}$2`)
        .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(meta.description)}$2`)
        .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${esc(url)}$2`)
        .replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${esc(image)}$2`)
        .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${esc(meta.title)}$2`)
        .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${esc(meta.description)}$2`)
        .replace(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${esc(image)}$2`);
    } else {
      res.status(404);
      html = html.replace('<meta name="robots" content="index, follow" />', '<meta name="robots" content="noindex, follow" />');
    }
    res.type('html').send(html);
  };
}

module.exports = { sitemap, robots, renderIndex };
