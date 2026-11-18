// POST /api/save
//   { action: "add",  url, note, image, tags, date } → añade una web a data/sites.json
//   { action: "link", id, tweet }                     → pone el enlace al tuit en una web ya añadida
// GET  /api/save → webs pendientes de enlazar con su tuit
// Cada cambio es un commit en GitHub; Vercel y GitHub Pages redespliegan solos.
const { send, checkAuth, readBody, readSites, updateSites, detectTags, normalizeUrl, domainOf, tweetId } = require('./_lib');

const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date()); // AAAA-MM-DD

module.exports = async (req, res) => {
  if (!(await checkAuth(req, res))) return;

  try {
    if (req.method === 'GET') {
      const { sites } = await readSites();
      return send(res, 200, { pending: sites.filter((s) => !s.tweet).map(({ id, date, domain, url }) => ({ id, date, domain, url })) });
    }
    if (req.method !== 'POST') return send(res, 405, { error: 'Usa GET o POST.' });

    const body = await readBody(req);

    if (body.action === 'add') {
      let url;
      try { url = normalizeUrl(body.url); } catch (e) { return send(res, 400, { error: 'URL no válida.' }); }
      const note = String(body.note || '').trim().slice(0, 1000);
      if (!note) return send(res, 400, { error: 'Falta el texto.' });
      const date = /^\d{4}-\d{2}-\d{2}$/.test(body.date || '') ? body.date : today();
      let image = null;
      if (body.image) { try { image = normalizeUrl(body.image).href; } catch (e) { return send(res, 400, { error: 'La URL de la imagen no es válida.' }); } }
      const tags = Array.isArray(body.tags)
        ? [...new Set(body.tags.map((t) => String(t).trim()).filter(Boolean))].slice(0, 8)
        : detectTags(note);

      const entry = {
        id: `m${Date.now()}`, // se sustituye por el id del tuit al enlazarlo
        date,
        url: url.href.replace(/\/$/, ''),
        domain: domainOf(url),
        note,
        tweet: null,
        image,
        tags,
      };
      const { commit } = await updateSites((sites) => { sites.unshift(entry); }, `Añade ${entry.domain} (#CometSiteOfTheDay ${date})`);
      return send(res, 200, { ok: true, entry, commit });
    }

    if (body.action === 'link') {
      const tid = tweetId(body.tweet);
      if (!tid) return send(res, 400, { error: 'Pega el enlace del tuit, tipo https://x.com/fernandocomet/status/123…' });
      const tweet = String(body.tweet).split(/[?#]/)[0].replace('twitter.com', 'x.com');
      let found = null;
      const { commit } = await updateSites((sites) => {
        if (sites.some((s) => s.id === tid && s.id !== body.id)) throw Object.assign(new Error('Ese tuit ya está enlazado a otra web.'), { status: 409 });
        found = sites.find((s) => s.id === body.id);
        if (!found) throw Object.assign(new Error('No encuentro esa web en sites.json.'), { status: 404 });
        found.tweet = tweet;
        found.id = tid; // así scripts/build_data.py no la duplica si un día importas los tuits
      }, `Enlaza el tuit de ${body.id}`);
      return send(res, 200, { ok: true, entry: found, commit });
    }

    send(res, 400, { error: 'Acción desconocida.' });
  } catch (e) {
    send(res, e.status === 404 || e.status === 409 ? e.status : 502, { error: e.message });
  }
};
