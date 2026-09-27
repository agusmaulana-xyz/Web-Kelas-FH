export default function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return res.status(405).setHeader('Allow', 'GET, HEAD').end();
  const body = 'User-agent: *\nAllow: /\nDisallow: /login\nDisallow: /jurnal\nSitemap: https://' + (process.env.SITE_URL || req.headers['x-forwarded-host'] || req.headers.host || 'example.invalid').replace(/^https?:\\/\\//, '').replace(/\/$/, '') + '/sitemap.xml\n';
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  return res.status(200).send(req.method === 'HEAD' ? '' : body);
}
