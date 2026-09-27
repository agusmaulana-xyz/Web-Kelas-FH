const routes = ['', '/tentang', '/struktur'];

function siteBase(req) {
  const configured = process.env.SITE_URL;
  if (configured) return configured.replace(/\/$/, '');
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  if (!/^[a-z0-9.-]+(?::\d+)?$/i.test(host)) return 'https://example.invalid';
  return `https://${host}`;
}

export default function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return res.status(405).setHeader('Allow', 'GET, HEAD').end();
  const base = siteBase(req);
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(route => `<url><loc>${base}${route || '/'}</loc></url>`).join('')}</urlset>`;
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  return res.status(200).send(req.method === 'HEAD' ? '' : body);
}
