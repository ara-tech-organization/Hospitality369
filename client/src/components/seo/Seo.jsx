import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import seo from '../../../../shared/seo-pages.json';

const SITE_URL = (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, '');

/**
 * Per-page SEO. Public pages read defaults from shared/seo-pages.json (the same file
 * the server uses to pre-render meta tags and the sitemap). Private pages pass noindex.
 */
export default function Seo({ title, description, noindex = false, jsonLd, path }) {
  const { pathname } = useLocation();
  const route = path || pathname.replace(/\/+$/, '') || '/';
  const page = seo.pages[route] || {};
  const t = title || page.title || seo.siteName;
  const d = description || page.description || seo.pages['/'].description;
  const url = `${SITE_URL}${route === '/' ? '/' : route}`;
  const image = `${SITE_URL}${seo.defaultImage}`;

  return (
    <Helmet prioritizeSeoTags>
      <title>{t}</title>
      <meta name="description" content={d} />
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow'} />
      {!noindex && <link rel="canonical" href={url} />}
      <meta property="og:title" content={t} />
      <meta property="og:description" content={d} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta name="twitter:title" content={t} />
      <meta name="twitter:description" content={d} />
      <meta name="twitter:image" content={image} />
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
}

export { SITE_URL };
