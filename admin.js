// Panel privado: premiar una web, guardarla en data/sites.json (vía /api) y abrir X con el tuit escrito.
(function () {
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const KEY = 'cometsotd-admin';
  const HASHTAG = '#CometSiteOfTheDay';
  const BASE_TAGS = ['Three.js', 'GSAP', 'Webflow', 'Lenis', 'Lottie', 'Barba.js', 'React', 'WebGL', 'AI'];

  let password = '';
  try { password = localStorage.getItem(KEY) || ''; } catch (e) {}
  const selectedTags = new Set();

  $('#year').textContent = new Date().getFullYear();
  $('#date').value = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date());

  async function api(path, body) {
    const r = await fetch(path, {
      method: body ? 'POST' : 'GET',
      headers: { Authorization: `Bearer ${password}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    let data = {};
    try { data = await r.json(); } catch (e) {
      throw Object.assign(new Error(r.status === 404
        ? 'No encuentro /api. El panel solo funciona en Vercel (cometsiteoftheday.vercel.app).'
        : `Error ${r.status}`), { status: r.status });
    }
    if (!r.ok) throw Object.assign(new Error(data.error || `Error ${r.status}`), { status: r.status });
    return data;
  }

  const msg = (el, text, kind = '') => { el.textContent = text; el.className = `msg ${kind}`; };
  const thumbHTML = (src, domain) => src
    ? `<img src="${esc(src)}" alt="" referrerpolicy="no-referrer">`
    : `<span class="ph">${esc(domain)}</span>`;
  // Si la imagen no carga, placeholder con el dominio (como en la web)
  const fallbackOnError = (box, domain) => {
    const im = box.querySelector('img');
    if (im) im.addEventListener('error', () => { im.replaceWith(Object.assign(document.createElement('span'), { className: 'ph', textContent: domain })); });
  };

  /* ---------- Subir imágenes ---------- */
  // Se reduce en el navegador (máx. 1600 px de ancho, JPEG) para que pese poco y quepa en la petición a /api.
  async function shrink(file) {
    if (!file || !/^image\//.test(file.type)) throw new Error('Eso no es una imagen.');
    const src = URL.createObjectURL(file);
    try {
      const img = await new Promise((ok, ko) => {
        const i = new Image();
        i.onload = () => ok(i);
        i.onerror = () => ko(new Error('No puedo leer esa imagen.'));
        i.src = src;
      });
      const scale = Math.min(1, 1600 / img.naturalWidth);
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      const c = Object.assign(document.createElement('canvas'), { width: w, height: h });
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#fff'; // las transparencias del PNG quedan en blanco, no en negro
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      return { data: c.toDataURL('image/jpeg', 0.85), w, h, name: file.name || 'captura' };
    } finally { URL.revokeObjectURL(src); }
  }

  // Botón «Subir imagen» + arrastrar la imagen encima del bloque. Pegar (⌘V) se gestiona abajo, una vez para todo el panel.
  const pickers = [];
  function imagePicker({ button, input, zone, onPick, onError }) {
    const take = async (file) => { try { onPick(await shrink(file)); } catch (e) { onError(e.message); } };
    button.addEventListener('click', () => input.click());
    input.addEventListener('change', () => { if (input.files[0]) take(input.files[0]); input.value = ''; });
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragging'); });
    zone.addEventListener('dragleave', (e) => { if (!zone.contains(e.relatedTarget)) zone.classList.remove('dragging'); });
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('dragging');
      const f = [...e.dataTransfer.files].find((x) => /^image\//.test(x.type));
      f ? take(f) : onError('Suelta un archivo de imagen.');
    });
    pickers.push({ zone, take });
  }
  // ⌘V con una imagen en el portapapeles: va al bloque donde está el foco (o al de nuevo premio).
  document.addEventListener('paste', (e) => {
    if ($('#panel').hidden) return;
    const f = [...((e.clipboardData && e.clipboardData.files) || [])].find((x) => /^image\//.test(x.type));
    if (!f) return;
    e.preventDefault();
    const p = pickers.find((x) => x.zone.contains(document.activeElement)) || pickers[0];
    p.take(f);
  });
  const uploadedText = (u) => `Imagen subida: ${u.name} (${u.w}×${u.h}) · `;
  function showUploaded(el, u, onRemove) {
    msg(el, uploadedText(u), 'ok');
    const b = Object.assign(document.createElement('button'), { type: 'button', className: 'link-btn', textContent: 'Quitar' });
    b.addEventListener('click', onRemove);
    el.append(b);
  }

  /* ---------- Acceso ---------- */
  function showLogin(text) {
    $('#panel').hidden = true;
    $('#logout').hidden = true;
    $('#login').hidden = false;
    if (text) msg($('#login-msg'), text, 'error');
    $('#password').focus();
  }

  async function enter() {
    try {
      const { pending, sites } = await api('/api/save');
      $('#login').hidden = true;
      $('#panel').hidden = false;
      $('#logout').hidden = false;
      renderPending(pending);
      renderSites(sites || []);
      $('#url').focus();
    } catch (e) {
      if (e.status === 401) { try { localStorage.removeItem(KEY); } catch (er) {} password = ''; }
      showLogin(e.message);
    }
  }

  $('#login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    password = $('#password').value;
    try { localStorage.setItem(KEY, password); } catch (er) {}
    msg($('#login-msg'), 'Comprobando…');
    enter();
  });
  $('#logout').addEventListener('click', () => {
    try { localStorage.removeItem(KEY); } catch (e) {}
    password = '';
    $('#password').value = '';
    showLogin();
  });

  /* ---------- Etiquetas ---------- */
  let knownTags = [...BASE_TAGS];
  fetch('data/sites.json').then((r) => r.json()).then((sites) => {
    const count = {};
    sites.forEach((s) => (s.tags || []).forEach((t) => (count[t] = (count[t] || 0) + 1)));
    knownTags = [...new Set([...Object.keys(count).sort((a, b) => count[b] - count[a]), ...BASE_TAGS])];
    renderTagChips();
  }).catch(() => {});

  function renderTagChips() {
    $('#tag-chips').innerHTML = knownTags.map((t) =>
      `<button type="button" class="chip" data-tag="${esc(t)}" aria-pressed="${selectedTags.has(t)}">${esc(t)}</button>`).join('');
  }
  renderTagChips();
  $('#tag-chips').addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    const t = b.dataset.tag;
    selectedTags.has(t) ? selectedTags.delete(t) : selectedTags.add(t);
    renderTagChips();
    renderPreview();
  });
  const allTags = () => [...selectedTags, ...$('#tag-extra').value.split(',').map((t) => t.trim()).filter(Boolean)];

  /* ---------- Leer la web ---------- */
  let lastFetched = '';
  async function readSite() {
    const url = $('#url').value.trim();
    if (!url || url === lastFetched) return;
    lastFetched = url;
    msg($('#fetch-msg'), 'Leyendo la web…');
    try {
      const d = await api('/api/preview', { url });
      $('#url').value = d.url;
      lastFetched = d.url;
      if (d.image && !upload) $('#image').value = d.image;
      d.tags.forEach((t) => { selectedTags.add(t); if (!knownTags.includes(t)) knownTags.push(t); });
      renderTagChips();
      if (!$('#note').value.trim()) $('#note').value = `${d.domain} is ${HASHTAG}`;
      const parts = [d.title && `«${d.title}»`, d.image ? 'imagen encontrada' : (upload ? '' : 'sin imagen: sube una captura')];
      if (d.duplicate) parts.push(`⚠ ya premiada el ${d.duplicate.date}`);
      msg($('#fetch-msg'), [parts.filter(Boolean).join(' · '), d.warning].filter(Boolean).join(' — '), d.duplicate || d.warning ? 'warn' : 'ok');
      update();
    } catch (e) {
      lastFetched = '';
      msg($('#fetch-msg'), e.message, 'error');
      if (e.status === 401) showLogin(e.message);
    }
  }
  $('#fetch').addEventListener('click', () => { lastFetched = ''; readSite(); });
  $('#url').addEventListener('change', readSite);

  /* ---------- Texto, contador y vista previa ---------- */
  // X cuenta cada enlace como 23 caracteres
  const tweetText = () => {
    const note = $('#note').value.trim();
    const url = $('#url').value.trim();
    let domain = '';
    try { domain = new URL(url).hostname.replace(/^www\./, ''); } catch (e) {}
    return domain && !note.toLowerCase().includes(domain.toLowerCase()) ? `${note} ${url}` : note;
  };
  // (aprox.: dominios sueltos con las extensiones habituales; «Three.js» no cuenta como enlace)
  const TLD = 'com|net|org|io|dev|design|ai|co|app|me|es|xyz|studio|site|art|fr|de|uk|us|tv|gg|so|sh|cc|info|agency|work|digital|website|page|world|space|online|tech|fm|it|nl|be|ch|jp';
  const BARE = new RegExp(`\\b[\\w-]+(?:\\.[\\w-]+)*\\.(?:${TLD})\\b(?:\\/\\S*)?`, 'gi');
  const tweetLength = (t) => [...t.replace(/https?:\/\/\S+/g, 'x'.repeat(23)).replace(BARE, 'x'.repeat(23))].length;

  function update() {
    const t = tweetText();
    const n = tweetLength(t);
    const c = $('#counter');
    c.textContent = `${n} / 280`;
    c.className = n > 280 ? 'over' : '';
    $('#hashtag-msg').hidden = !$('#note').value.trim() || t.toLowerCase().includes(HASHTAG.toLowerCase());
    renderPreview();
  }

  function renderPreview() {
    let domain = '…';
    try { domain = new URL($('#url').value.trim()).hostname.replace(/^www\./, ''); } catch (e) {}
    const img = upload ? upload.data : $('#image').value.trim();
    const date = $('#date').value ? new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date($('#date').value + 'T12:00:00')) : '';
    const tags = allTags();
    $('#preview').innerHTML = `<article class="card">
      <span class="thumb">${thumbHTML(img, domain)}</span>
      <div class="meta"><time>${esc(date)}</time><span aria-hidden="true">★</span></div>
      <h2>${esc(domain)}</h2>
      <p class="note">${esc($('#note').value.trim() || 'El texto del tuit…')}</p>
      ${tags.length ? `<div class="tags">${tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}
    </article>`;
    fallbackOnError($('#preview'), domain);
  }

  let upload = null; // imagen subida para el nuevo premio
  const clearUpload = () => { upload = null; msg($('#image-msg'), ''); };
  imagePicker({
    button: $('#image-pick'),
    input: $('#image-file'),
    zone: $('#add-form'),
    onPick: (u) => {
      upload = u;
      $('#image').value = '';
      showUploaded($('#image-msg'), u, () => { clearUpload(); update(); });
      update();
    },
    onError: (t) => msg($('#image-msg'), t, 'error'),
  });
  $('#image').addEventListener('input', () => { if (upload && $('#image').value.trim()) clearUpload(); });

  ['#note', '#url', '#image', '#date', '#tag-extra'].forEach((s) => $(s).addEventListener('input', update));
  $('#add-hashtag').addEventListener('click', () => {
    $('#note').value = `${$('#note').value.trim()} ${HASHTAG}`;
    update();
    $('#note').focus();
  });

  /* ---------- Publicar ---------- */
  $('#add-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = tweetText();
    if (tweetLength(text) > 280) { msg($('#publish-msg'), 'El tuit pasa de 280 caracteres.', 'error'); return; }

    // Se abre la pestaña ya (dentro del clic) para que el navegador no la bloquee; luego se lleva a X.
    const win = window.open('', '_blank');
    const btn = $('#publish');
    btn.disabled = true;
    msg($('#publish-msg'), 'Guardando en la web…');
    try {
      const { entry } = await api('/api/save', {
        action: 'add',
        url: $('#url').value.trim(),
        note: text,
        image: upload ? null : $('#image').value.trim() || null,
        imageData: upload ? upload.data : undefined,
        tags: allTags(),
        date: $('#date').value,
      });
      const intent = `https://x.com/intent/post?text=${encodeURIComponent(text)}`;
      if (win) { win.opener = null; win.location.href = intent; }
      msg($('#publish-msg'), win
        ? `✓ ${entry.domain} guardada. Aparecerá en la web en un minuto. Termina el tuit en la pestaña de X.`
        : `✓ ${entry.domain} guardada. Tu navegador ha bloqueado la pestaña:`, 'ok');
      if (!win) $('#publish-msg').insertAdjacentHTML('beforeend', ` <a href="${esc(intent)}" target="_blank" rel="noopener">abrir X ↗</a>`);
      $('#add-form').reset();
      $('#date').value = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date());
      selectedTags.clear();
      clearUpload();
      lastFetched = '';
      msg($('#fetch-msg'), '');
      renderTagChips();
      update();
      refreshPending();
    } catch (err) {
      if (win) win.close();
      msg($('#publish-msg'), `No se ha guardado: ${err.message}`, 'error');
      if (err.status === 401) showLogin(err.message);
    } finally {
      btn.disabled = false;
    }
  });

  /* ---------- Pendientes de enlazar con su tuit ---------- */
  function renderPending(list) {
    $('#pending').innerHTML = list.length
      ? list.map((p) => `<form class="pending-row" data-id="${esc(p.id)}">
          <div class="pending-site"><strong>${esc(p.domain)}</strong><small>${esc(p.date)}</small></div>
          <input type="url" name="tweet" placeholder="https://x.com/fernandocomet/status/…" required aria-label="Enlace del tuit de ${esc(p.domain)}">
          <button class="btn ghost" type="submit">Enlazar</button>
          <p class="msg" role="status"></p>
        </form>`).join('')
      : '<p class="hint">Nada pendiente. 👌</p>';
  }
  async function refreshPending() {
    try {
      const d = await api('/api/save');
      renderPending(d.pending);
      renderSites(d.sites || []);
    } catch (e) {}
  }
  $('#pending').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const out = form.querySelector('.msg');
    msg(out, 'Guardando…');
    try {
      await api('/api/save', { action: 'link', id: form.dataset.id, tweet: form.tweet.value.trim() });
      msg(out, '✓ Enlazado', 'ok');
      setTimeout(refreshPending, 1200);
    } catch (err) {
      msg(out, err.message, 'error');
    }
  });

  /* ---------- Cambiar la imagen de una web ya publicada ---------- */
  let siteList = [];
  let ciUpload = null;
  const savedPreview = {}; // id → imagen recién guardada (hasta que Vercel redespliegue, la ruta img/… aún no existe)
  const ciSite = () => siteList.find((s) => s.id === $('#ci-site').value);

  function renderSites(list) {
    siteList = list;
    const keep = $('#ci-site').value;
    const opt = (s) => `<option value="${esc(s.id)}">${esc(s.domain)} · ${esc(s.date)}</option>`;
    const without = list.filter((s) => !s.image);
    const withImg = list.filter((s) => s.image);
    $('#ci-site').innerHTML =
      (without.length ? `<optgroup label="Sin imagen (${without.length})">${without.map(opt).join('')}</optgroup>` : '') +
      `<optgroup label="Con imagen (${withImg.length})">${withImg.map(opt).join('')}</optgroup>`;
    if (keep && list.some((s) => s.id === keep)) $('#ci-site').value = keep;
    $('#ci-count').textContent = without.length ? `${without.length} sin imagen` : 'todas tienen imagen 👌';
    renderCi();
  }

  function renderCi() {
    const s = ciSite();
    if (!s) { $('#ci-preview').innerHTML = ''; return; }
    const src = (ciUpload && ciUpload.data) || $('#ci-image').value.trim() || savedPreview[s.id] || s.image;
    $('#ci-preview').innerHTML = thumbHTML(src, s.domain);
    fallbackOnError($('#ci-preview'), s.domain);
  }

  const clearCiUpload = () => { ciUpload = null; msg($('#ci-image-msg'), ''); };
  imagePicker({
    button: $('#ci-pick'),
    input: $('#ci-file'),
    zone: $('#ci-form'),
    onPick: (u) => {
      ciUpload = u;
      $('#ci-image').value = '';
      showUploaded($('#ci-image-msg'), u, () => { clearCiUpload(); renderCi(); });
      msg($('#ci-msg'), '');
      renderCi();
    },
    onError: (t) => msg($('#ci-image-msg'), t, 'error'),
  });
  $('#ci-site').addEventListener('change', () => { clearCiUpload(); $('#ci-image').value = ''; msg($('#ci-msg'), ''); renderCi(); });
  $('#ci-image').addEventListener('input', () => { if (ciUpload && $('#ci-image').value.trim()) clearCiUpload(); renderCi(); });

  $('#ci-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const s = ciSite();
    const url = $('#ci-image').value.trim();
    if (!s) return;
    if (!ciUpload && !url) { msg($('#ci-msg'), 'Sube una imagen o pega su URL.', 'error'); return; }
    const btn = $('#ci-save');
    btn.disabled = true;
    msg($('#ci-msg'), 'Guardando…');
    try {
      const { entry } = await api('/api/save', ciUpload
        ? { action: 'image', id: s.id, imageData: ciUpload.data }
        : { action: 'image', id: s.id, image: url });
      savedPreview[s.id] = ciUpload ? ciUpload.data : url;
      s.image = entry.image;
      clearCiUpload();
      $('#ci-image').value = '';
      renderSites(siteList);
      msg($('#ci-msg'), `✓ Imagen de ${s.domain} guardada. Se verá en la web en un minuto.`, 'ok');
    } catch (err) {
      msg($('#ci-msg'), `No se ha guardado: ${err.message}`, 'error');
      if (err.status === 401) showLogin(err.message);
    } finally {
      btn.disabled = false;
    }
  });

  update();
  password ? enter() : showLogin();
})();
