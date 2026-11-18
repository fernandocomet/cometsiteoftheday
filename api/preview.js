// POST /api/preview { url } → { url, domain, title, description, image, tags, duplicate }
// Abre la web premiada y saca su título e imagen (og:image) para la tarjeta.
const { send, checkAuth, readBody, readSites, detectTags, normalizeUrl, domainOf } = require('./_lib');

const decode = (s) => String(s || '')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).trim();

function meta(html, names) {
  for (const name of names) {
    const tags = html.match(/<meta\b[^>]*>/gi) || [];
    for (const tag of tags) {
      const key = (tag.match(/\b(?:property|name)\s*=\s*["']([^"']+)["']/i) || [])[1];
      if (key && key.toLowerCase() === name) {
        const val = (tag.match(/\bcontent\s*=\s*["']([^"']*)["']/i) || [])[1];
        if (val) return decode(val);
      }
    }
  }
  return '';
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'Usa POST.' });
  if (!(await checkAuth(req, res))) return;

  let url;
  try { url = normalizeUrl((await readBody(req)).url); } catch (e) { return send(res, 400, { error: 'URL no válida.' }); }

  const out = { url: url.href, domain: domainOf(url), title: '', description: '', image: null, tags: [], duplicate: null };

  // ¿Ya está premiada?
  try {
    const { sites } = await readSites();
    const dup = sites.find((s) => s.domain === out.domain);
    if (dup) out.duplicate = { date: dup.date, url: dup.url };
  } catch (e) { /* si GitHub falla aquí, seguimos: save.js dará el error claro */ }

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch(url.href, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CometSiteOfTheDay/1.0)', Accept: 'text/html' },
    });
    clearTimeout(timer);
    const finalUrl = new URL(r.url || url.href);
    // Solo leemos el principio: las etiquetas <meta> están en el <head>
    const html = (await r.text()).slice(0, 300000);
    out.title = meta(html, ['og:title', 'twitter:title']) || decode((html.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1]);
    out.description = meta(html, ['og:description', 'twitter:description', 'description']);
    const img = meta(html, ['og:image', 'og:image:url', 'twitter:image', 'twitter:image:src']);
    if (img) { try { out.image = new URL(img, finalUrl).href; } catch (e) {} }
    out.tags = detectTags(`${out.title} ${out.description} ${html.slice(0, 100000)}`.replace(/<[^>]+>/g, ' ')).filter((t) => t !== 'VR');
  } catch (e) {
    out.warning = 'No se ha podido abrir la web para sacar la imagen. Puedes pegar la URL de la imagen a mano.';
  }

  send(res, 200, out);
};
