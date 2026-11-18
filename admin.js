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
      const { pending } = await api('/api/save');
      $('#login').hidden = true;
      $('#panel').hidden = false;
      $('#logout').hidden = false;
      renderPending(pending);
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
      if (d.image) $('#image').value = d.image;
      d.tags.forEach((t) => { selectedTags.add(t); if (!knownTags.includes(t)) knownTags.push(t); });
      renderTagChips();
      if (!$('#note').value.trim()) $('#note').value = `${d.domain} is ${HASHTAG}`;
      const parts = [d.title && `«${d.title}»`, d.image ? 'imagen encontrada' : 'sin imagen'];
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
    const img = $('#image').value.trim();
    const date = $('#date').value ? new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date($('#date').value + 'T12:00:00')) : '';
    const tags = allTags();
    $('#preview').innerHTML = `<article class="card">
      <span class="thumb">${img ? `<img src="${esc(img)}" alt="" referrerpolicy="no-referrer">` : `<span class="ph">${esc(domain)}</span>`}</span>
      <div class="meta"><time>${esc(date)}</time><span aria-hidden="true">★</span></div>
      <h2>${esc(domain)}</h2>
      <p class="note">${esc($('#note').value.trim() || 'El texto del tuit…')}</p>
      ${tags.length ? `<div class="tags">${tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}
    </article>`;
    const im = $('#preview img');
    if (im) im.addEventListener('error', () => { im.replaceWith(Object.assign(document.createElement('span'), { className: 'ph', textContent: domain })); });
  }

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
        image: $('#image').value.trim() || null,
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
    try { renderPending((await api('/api/save')).pending); } catch (e) {}
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

  update();
  password ? enter() : showLogin();
})();
