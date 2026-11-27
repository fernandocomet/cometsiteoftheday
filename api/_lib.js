// Código compartido por las funciones de /api (Vercel no publica como endpoint los archivos que empiezan por "_").
// Variables de entorno en Vercel → Settings → Environment Variables:
//   ADMIN_PASSWORD  contraseña del panel /admin
//   GITHUB_TOKEN    token de GitHub con permiso "Contents: Read and write" solo sobre este repo
//   GITHUB_REPO     opcional, por defecto fernandocomet/cometsiteoftheday
//   GITHUB_BRANCH   opcional, por defecto master
const crypto = require('crypto');

const REPO = process.env.GITHUB_REPO || 'fernandocomet/cometsiteoftheday';
const BRANCH = process.env.GITHUB_BRANCH || 'master';
const FILE = 'data/sites.json';

function send(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

// Comprueba la contraseña (cabecera Authorization: Bearer <contraseña>) en tiempo constante.
async function checkAuth(req, res) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) { send(res, 500, { error: 'Falta ADMIN_PASSWORD en las variables de entorno de Vercel.' }); return false; }
  const given = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const a = crypto.createHash('sha256').update(given).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  if (!crypto.timingSafeEqual(a, b)) {
    await new Promise((r) => setTimeout(r, 800)); // frena intentos de adivinar la contraseña
    send(res, 401, { error: 'Contraseña incorrecta.' });
    return false;
  }
  return true;
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  let raw = '';
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

async function gh(path, opts = {}) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('Falta GITHUB_TOKEN en las variables de entorno de Vercel.');
  const r = await fetch(`https://api.github.com/repos/${REPO}/${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'cometsiteoftheday-admin',
      ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error(`GitHub ${r.status}: ${data.message || 'error'}`);
    e.status = r.status;
    throw e;
  }
  return data;
}

async function readSites() {
  const f = await gh(`contents/${FILE}?ref=${encodeURIComponent(BRANCH)}`);
  const json = Buffer.from(f.content, 'base64').toString('utf8');
  return { sites: JSON.parse(json), sha: f.sha };
}

// Lee sites.json, aplica `change` y lo guarda con un commit. Si alguien ha cambiado el archivo entre medias, reintenta una vez.
async function updateSites(change, message) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const { sites, sha } = await readSites();
    const result = change(sites);
    sites.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    const content = Buffer.from(JSON.stringify(sites, null, 2) + '\n', 'utf8').toString('base64');
    try {
      const out = await gh(`contents/${FILE}`, { method: 'PUT', body: JSON.stringify({ message, content, sha, branch: BRANCH }) });
      return { result, commit: out.commit && out.commit.html_url };
    } catch (e) {
      if (attempt === 0 && (e.status === 409 || e.status === 422)) continue;
      throw e;
    }
  }
}

const TECH = {
  'Three.js': /three\.?js/i,
  GSAP: /\bgsap\b/i,
  Lenis: /\blenis\b/i,
  Webflow: /webflow/i,
  Lottie: /lottie/i,
  'Barba.js': /barba/i,
  React: /\breact\b/i,
  'Machine Learning': /machine learning/i,
  VR: /\bvr\b/i,
};
const detectTags = (text) => Object.keys(TECH).filter((k) => TECH[k].test(text || ''));

function normalizeUrl(u) {
  const url = new URL(String(u || '').trim());
  if (!/^https?:$/.test(url.protocol)) throw new Error('La URL tiene que empezar por http:// o https://');
  return url;
}

const domainOf = (url) => url.hostname.replace(/^www\./, '');

// "https://x.com/fernandocomet/status/123..." → "123..."
function tweetId(u) {
  const m = String(u || '').match(/^https:\/\/(?:x|twitter)\.com\/[^/]+\/status\/(\d+)/);
  return m ? m[1] : null;
}

// Imágenes subidas desde el panel: se guardan en img/ del repo y en sites.json queda la ruta relativa ("img/…").
// El panel ya las reduce (máx. 1600 px, JPEG) antes de enviarlas; aquí solo se valida.
const IMG_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const MAX_IMG_BYTES = 3 * 1024 * 1024;
const LOCAL_IMG = /^img\/[a-z0-9._-]+\.(?:jpg|png|webp)$/;

async function saveImage(dataUrl, domain) {
  const m = String(dataUrl || '').match(/^data:(image\/[a-z]+);base64,([A-Za-z0-9+/=]+)$/);
  if (!m || !IMG_TYPES[m[1]]) throw Object.assign(new Error('La imagen tiene que ser JPG, PNG o WebP.'), { status: 400 });
  const bytes = Buffer.from(m[2], 'base64');
  if (bytes.length > MAX_IMG_BYTES) throw Object.assign(new Error('La imagen pesa demasiado (máx. 3 MB).'), { status: 400 });
  const slug = String(domain || 'web').toLowerCase().replace(/[^a-z0-9.-]+/g, '-').slice(0, 60);
  const path = `img/${slug}-${Date.now().toString(36)}.${IMG_TYPES[m[1]]}`;
  await gh(`contents/${path}`, { method: 'PUT', body: JSON.stringify({ message: `Imagen de ${domain}`, content: m[2], branch: BRANCH }) });
  return path;
}

// Borra una imagen de img/ que ya no usa nadie (si falla, no pasa nada: solo queda un archivo huérfano).
async function deleteImage(path) {
  if (!LOCAL_IMG.test(path || '')) return;
  try {
    const f = await gh(`contents/${path}?ref=${encodeURIComponent(BRANCH)}`);
    await gh(`contents/${path}`, { method: 'DELETE', body: JSON.stringify({ message: `Quita ${path}`, sha: f.sha, branch: BRANCH }) });
  } catch (e) { /* ignorado */ }
}

// Devuelve lo que se guarda en el campo `image`: una imagen subida (imageData), una URL o una ruta img/… existente.
async function resolveImage(body, domain) {
  if (body.imageData) return saveImage(body.imageData, domain);
  const img = String(body.image || '').trim();
  if (!img) return null;
  if (LOCAL_IMG.test(img)) return img;
  try { return normalizeUrl(img).href; } catch (e) { throw Object.assign(new Error('La URL de la imagen no es válida.'), { status: 400 }); }
}

module.exports = { send, checkAuth, readBody, readSites, updateSites, detectTags, normalizeUrl, domainOf, tweetId, resolveImage, deleteImage };
