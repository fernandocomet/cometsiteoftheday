(async function () {
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- i18n ---------- */
  const STRINGS = {
    es: {
      'meta.title': '#CometSiteOfTheDay — Fernando Comet',
      'meta.description': 'Archivo de las webs premiadas con el #CometSiteOfTheDay de Fernando Comet desde 2014.',
      'header.label': 'Site of the Day',
      'header.random': 'Una al azar ↗',
      'header.logo': 'Fernando Comet en X',
      'theme.toDark': 'Activar modo oscuro',
      'theme.toLight': 'Activar modo claro',
      'lang.label': 'Idioma',
      'hero.label': 'Archivo · desde 2014',
      'hero.lede': 'Cuando una web me llama la atención por algo, sea una transición, un efecto, la música o una idea, se lleva el premio. Aquí están todas.',
      'stats.sites': 'Webs premiadas',
      'stats.years': 'Años',
      'stats.first': 'Primer premio',
      'search.placeholder': 'Buscar por web, texto o tecnología…',
      'filter.section': 'Filtros',
      'filter.yearGroup': 'Año',
      'filter.tagGroup': 'Tecnología',
      'filter.allYears': 'Todos los años',
      'filter.allTags': 'Todas las tecnologías',
      'count.all': '{n} webs',
      'count.filtered': '{n} de {total} webs',
      'empty': 'Ninguna web coincide con la búsqueda.',
      'loadError': 'No se han podido cargar los datos. Abre la web desde un servidor.',
      'card.visit': 'Visitar web ↗',
      'card.tweet': 'Ver tuit ↗',
      'card.imgAlt': 'Captura de {domain}',
      'footer.hashtag': 'Ver el hashtag en X ↗',
      'view.label': 'Vista',
      'view.grid': 'Ver en cuadrícula',
      'view.list': 'Ver en lista',
      'list.date': 'Fecha',
      'list.site': 'Web',
      'list.note': 'Tuit',
      'list.tags': 'Tecnología',
    },
    en: {
      'meta.title': '#CometSiteOfTheDay — Fernando Comet',
      'meta.description': "An archive of every website awarded Fernando Comet's #CometSiteOfTheDay since 2014.",
      'header.label': 'Site of the Day',
      'header.random': 'Random pick ↗',
      'header.logo': 'Fernando Comet on X',
      'theme.toDark': 'Switch to dark mode',
      'theme.toLight': 'Switch to light mode',
      'lang.label': 'Language',
      'hero.label': 'Archive · since 2014',
      'hero.lede': 'When a website catches my eye for something, be it a transition, an effect, the music or an idea, it wins the award. Here they all are.',
      'stats.sites': 'Awarded sites',
      'stats.years': 'Years',
      'stats.first': 'First award',
      'search.placeholder': 'Search by site, text or technology…',
      'filter.section': 'Filters',
      'filter.yearGroup': 'Year',
      'filter.tagGroup': 'Technology',
      'filter.allYears': 'All years',
      'filter.allTags': 'All technologies',
      'count.all': '{n} sites',
      'count.filtered': '{n} of {total} sites',
      'empty': 'No sites match your search.',
      'loadError': "Couldn't load the data. Open the site from a web server.",
      'card.visit': 'Visit site ↗',
      'card.tweet': 'View post ↗',
      'card.imgAlt': 'Screenshot of {domain}',
      'footer.hashtag': 'See the hashtag on X ↗',
      'view.label': 'View',
      'view.grid': 'Grid view',
      'view.list': 'List view',
      'list.date': 'Date',
      'list.site': 'Site',
      'list.note': 'Post',
      'list.tags': 'Technology',
    },
  };
  const LOCALES = { es: 'es-ES', en: 'en-GB' };

  function initialLang() {
    // 1) URL (?lang=en o #en)  2) localStorage  3) idioma del navegador
    const p = new URLSearchParams(location.search).get('lang');
    const h = location.hash.replace('#', '');
    for (const v of [p, h]) if (v === 'es' || v === 'en') return v;
    try {
      const s = localStorage.getItem('cometsotd-lang');
      if (s === 'es' || s === 'en') return s;
    } catch (e) {}
    return (navigator.language || '').toLowerCase().startsWith('es') ? 'es' : 'en';
  }

  let lang = initialLang();
  let fmt;
  const i18n = (key, vars = {}) =>
    (STRINGS[lang][key] ?? STRINGS.es[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : `{${k}}`));

  /* ---------- Animaciones (anime.js, vendor/anime.umd.min.js) ----------
     Si anime.js no carga o el usuario prefiere menos movimiento, todo funciona igual sin animar. */
  const A = window.anime;
  const motionOK = !!(A && A.animate && A.scrambleText) && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const HERO_DURATION = 700;
  const HERO_DELAY = 250;
  const EASE = 'out(4)';
  const clean = (el) => () => el.removeAttribute('style');

  // Texto que se "descifra" letra a letra hasta el texto real (como en Vibe Lab)
  // Se guarda el texto real en data-txt para que un scramble encima de otro nunca deje caracteres basura.
  function scramble(el, opts = {}, refresh = false) {
    if (!motionOK || !el || el.children.length) return;
    if (refresh || el.dataset.txt == null) el.dataset.txt = el.textContent;
    const txt = el.dataset.txt;
    el.textContent = txt;
    const done = opts.onComplete;
    A.animate(el, {
      innerHTML: A.scrambleText(), duration: 600, ...opts,
      onComplete: (a) => { el.textContent = txt; if (done) done(a); },
    });
  }

  function heroIntro(first) {
    if (!motionOK) return;
    const d = first ? HERO_DURATION : 600;
    // refresh = true: applyLang acaba de poner el texto en el idioma nuevo
    scramble($('.hero .label'), { duration: d }, true);
    scramble($('.hero h1'), { duration: d, delay: first ? 60 : 0 }, true);
    scramble($('.hero .lede'), { duration: d, delay: first ? HERO_DELAY : 40 }, true);
    document.querySelectorAll('.stats dd').forEach((el, i) => scramble(el, { duration: d, delay: (first ? HERO_DELAY + 150 : 80) + i * 80 }, true));
  }

  // Entrada de cada tarjeta / fila cuando aparece en pantalla
  function reveal(item, delay) {
    item.classList.remove('pre');
    const isRow = item.tagName === 'TR';
    const thumb = item.querySelector('.thumb');
    if (thumb) {
      A.animate(thumb, {
        clipPath: ['inset(100% 0% 0% 0%)', 'inset(0% 0% 0% 0%)'],
        duration: 900, delay, ease: EASE, onComplete: clean(thumb),
      });
    }
    // Fecha, dominio y texto del post se descifran; el párrafo, más largo, dura un poco más
    const texts = isRow ? ['.c-date time', '.c-site a', '.c-note span'] : ['.meta time', 'h2 a', '.note'];
    texts.forEach((sel, j) => {
      const el = item.querySelector(sel);
      if (el) scramble(el, { opacity: [0, 1], duration: j === 2 ? 900 : 600, delay: delay + (isRow ? 0 : 200) + j * 60, onComplete: clean(el) });
    });
    const rest = item.querySelectorAll(isRow ? '.c-tags .tags, .c-link a' : '.tags, .links');
    rest.forEach((el, j) => {
      A.animate(el, {
        opacity: [0, 1], y: [12, 0],
        duration: 700, delay: delay + (isRow ? 120 : 320) + j * 70, ease: EASE, onComplete: clean(el),
      });
    });
  }

  let io = null;
  function animateItems(baseDelay = 0) {
    if (io) { io.disconnect(); io = null; }
    if (!motionOK || !('IntersectionObserver' in window)) return;
    const items = document.querySelectorAll('#grid .card, #grid tbody tr');
    items.forEach((el) => el.classList.add('pre'));
    io = new IntersectionObserver((entries) => {
      let i = 0;
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        reveal(en.target, baseDelay + i++ * (en.target.tagName === 'TR' ? 50 : 90));
      });
      baseDelay = 0; // el retraso del hero solo aplica a la primera tanda
    }, { rootMargin: '0px 0px -40px 0px' });
    items.forEach((el) => io.observe(el));
  }

  // Al pasar el ratón: vuelve a descifrar el título (tarjeta) o la fecha y la web (fila)
  if (motionOK) {
    $('#grid').addEventListener('pointerover', (e) => {
      const item = e.target.closest('.card, tbody tr');
      if (!item || item.contains(e.relatedTarget) || item.classList.contains('pre')) return;
      const sels = item.tagName === 'TR' ? ['.c-date time', '.c-site a'] : ['h2 a'];
      sels.forEach((sel, i) => scramble(item.querySelector(sel), { delay: i * 40 }));
    });
  }

  /* ---------- Tema ---------- */
  const themeBtn = $('#theme-toggle');
  function syncThemeLabel() {
    const t = document.documentElement.dataset.theme;
    themeBtn.setAttribute('aria-label', t === 'dark' ? i18n('theme.toLight') : i18n('theme.toDark'));
  }
  function applyTheme(t) {
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem('cometsotd-theme', t); } catch (e) {}
    syncThemeLabel();
  }
  themeBtn.addEventListener('click', () => {
    applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  });

  /* ---------- Idioma ---------- */
  let render = () => {};
  let renderStatic = () => {};

  function applyLang(l, persist = true) {
    lang = l;
    fmt = new Intl.DateTimeFormat(LOCALES[lang], { day: 'numeric', month: 'short', year: 'numeric' });
    document.documentElement.lang = lang;
    document.title = i18n('meta.title');
    document.querySelector('meta[name="description"]').setAttribute('content', i18n('meta.description'));
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = i18n(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => { el.placeholder = i18n(el.dataset.i18nPlaceholder); });
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', i18n(el.dataset.i18nAria)); });
    $('.logo').setAttribute('aria-label', i18n('header.logo'));
    document.querySelectorAll('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    syncThemeLabel();
    if (persist) { try { localStorage.setItem('cometsotd-lang', lang); } catch (e) {} }
    renderStatic();
    render();
  }

  document.querySelectorAll('.lang button').forEach((b) =>
    b.addEventListener('click', () => {
      if (b.dataset.lang === lang) return;
      applyLang(b.dataset.lang);
      heroIntro(false);
      // Mantener la URL compartible coherente con el idioma elegido
      const url = new URL(location.href);
      if (url.searchParams.has('lang')) url.searchParams.set('lang', lang);
      if (url.hash === '#es' || url.hash === '#en') url.hash = lang;
      history.replaceState(null, '', url);
    })
  );

  applyLang(lang, false);

  /* ---------- Datos ---------- */
  // Los datos vienen de data/sites.json. Si la página lleva los datos incrustados (window.SITES), usa esos.
  let sites = window.SITES;
  if (!sites) {
    try {
      const res = await fetch('data/sites.json');
      if (!res.ok) throw new Error(res.status);
      sites = await res.json();
    } catch (e) {
      render = () => { $('#grid').innerHTML = `<p class="empty">${esc(i18n('loadError'))}</p>`; };
      render();
      return;
    }
  }
  sites.sort((a, b) => (a.date < b.date ? 1 : -1));

  const state = { q: '', year: null, tag: null, view: 'grid' };
  try { if (localStorage.getItem('cometsotd-view') === 'list') state.view = 'list'; } catch (e) {}
  const years = [...new Set(sites.map((s) => s.date.slice(0, 4)))].sort().reverse();
  const tagCount = {};
  sites.forEach((s) => (s.tags || []).forEach((t) => (tagCount[t] = (tagCount[t] || 0) + 1)));
  const tags = Object.keys(tagCount).sort((a, b) => tagCount[b] - tagCount[a]);

  $('#year').textContent = new Date().getFullYear();

  const chip = (group, value, label, n) =>
    `<button class="chip" type="button" data-group="${group}" data-value="${esc(value)}" aria-pressed="false">${esc(label)}${n ? `<small>${n}</small>` : ''}</button>`;

  renderStatic = () => {
    $('#stats').innerHTML = [
      [sites.length, i18n('stats.sites')],
      [years.length, i18n('stats.years')],
      [years[years.length - 1], i18n('stats.first')],
    ].map(([v, k]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');
    $('#years').innerHTML = chip('year', '', i18n('filter.allYears')) + years.map((y) => chip('year', y, y, sites.filter((s) => s.date.startsWith(y)).length)).join('');
    $('#tags').innerHTML = chip('tag', '', i18n('filter.allTags')) + tags.map((t) => chip('tag', t, t, tagCount[t])).join('');
  };

  function syncChips() {
    document.querySelectorAll('.chip').forEach((b) => {
      const cur = state[b.dataset.group] || '';
      b.setAttribute('aria-pressed', String(b.dataset.value === cur));
    });
  }

  const noteFor = (s) => s[`note_${lang}`] || s.note || '';

  function card(s) {
    const d = fmt.format(new Date(s.date + 'T12:00:00'));
    const title = s.domain;
    const media = s.image
      ? `<img src="${esc(s.image)}" alt="${esc(i18n('card.imgAlt', { domain: title }))}" loading="lazy" referrerpolicy="no-referrer" data-ph="${esc(title)}">`
      : `<span class="ph">${esc(title)}</span>`;
    const href = s.url || s.tweet;
    const tagList = s.tags || [];
    return `<article class="card">
      <a class="thumb" href="${esc(href)}" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true">${media}</a>
      <div class="meta"><time datetime="${esc(s.date)}">${esc(d)}</time><span aria-hidden="true">★</span></div>
      <h2><a href="${esc(href)}" target="_blank" rel="noopener">${esc(title)}</a></h2>
      <p class="note">${esc(noteFor(s))}</p>
      ${tagList.length ? `<div class="tags">${tagList.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}
      <div class="links">
        ${s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(i18n('card.visit'))}</a>` : ''}
        <a class="alt" href="${esc(s.tweet)}" target="_blank" rel="noopener">${esc(i18n('card.tweet'))}</a>
      </div>
    </article>`;
  }

  const ARROW = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>';

  function row(s) {
    const href = s.url || s.tweet;
    const tagList = s.tags || [];
    const tweetLabel = i18n('card.tweet').replace(/\s*↗$/, '');
    return `<tr data-href="${esc(href)}">
      <td class="c-date"><time datetime="${esc(s.date)}">${esc(fmt.format(new Date(s.date + 'T12:00:00')))}</time></td>
      <td class="c-site"><a href="${esc(href)}" target="_blank" rel="noopener">${esc(s.domain)}</a></td>
      <td class="c-note"><span>${esc(noteFor(s))}</span></td>
      <td class="c-tags">${tagList.length ? `<div class="tags">${tagList.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}</td>
      <td class="c-link"><a href="${esc(s.tweet)}" target="_blank" rel="noopener" aria-label="${esc(tweetLabel)} · ${esc(s.domain)}" title="${esc(tweetLabel)}">${ARROW}</a></td>
    </tr>`;
  }

  function table(list) {
    return `<table>
      <thead><tr>
        <th class="c-date" scope="col">${esc(i18n('list.date'))}</th>
        <th class="c-site" scope="col">${esc(i18n('list.site'))}</th>
        <th class="c-note" scope="col">${esc(i18n('list.note'))}</th>
        <th class="c-tags" scope="col">${esc(i18n('list.tags'))}</th>
        <th class="c-link" scope="col"><span class="sr-only">X</span></th>
      </tr></thead>
      <tbody>${list.map(row).join('')}</tbody>
    </table>`;
  }

  function syncView() {
    $('#grid').className = state.view;
    document.querySelectorAll('.seg-item').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === state.view)));
  }

  // animate: false al escribir en el buscador, para no repetir la entrada en cada tecla
  render = ({ animate = true, delay = 0 } = {}) => {
    const q = state.q.trim().toLowerCase();
    const list = sites.filter((s) =>
      (!state.year || s.date.startsWith(state.year)) &&
      (!state.tag || (s.tags || []).includes(state.tag)) &&
      (!q || [s.domain, s.note, s.note_es, s.note_en, s.url, (s.tags || []).join(' ')].join(' ').toLowerCase().includes(q))
    );
    $('#count').textContent = list.length === sites.length
      ? i18n('count.all', { n: list.length })
      : i18n('count.filtered', { n: list.length, total: sites.length });
    syncView();
    $('#grid').innerHTML = !list.length
      ? `<p class="empty">${esc(i18n('empty'))}</p>`
      : state.view === 'list' ? table(list) : list.map(card).join('');
    syncChips();
    if (animate) animateItems(delay);
    else if (io) { io.disconnect(); io = null; }
  };

  // Imagen rota → placeholder con el dominio (sin handlers inline)
  $('#grid').addEventListener('error', (e) => {
    const img = e.target;
    if (img.tagName !== 'IMG') return;
    const ph = document.createElement('span');
    ph.className = 'ph';
    ph.textContent = img.dataset.ph || '';
    img.replaceWith(ph);
  }, true);

  document.addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    state[b.dataset.group] = b.dataset.value || null;
    render();
  });
  document.querySelectorAll('.seg-item').forEach((b) =>
    b.addEventListener('click', () => {
      if (b.dataset.view === state.view) return;
      state.view = b.dataset.view;
      try { localStorage.setItem('cometsotd-view', state.view); } catch (e) {}
      render();
    })
  );
  // Toda la fila de la lista es clicable (salvo al pulsar un enlace o seleccionar texto)
  $('#grid').addEventListener('click', (e) => {
    const tr = e.target.closest('tbody tr[data-href]');
    if (!tr || e.target.closest('a') || String(getSelection())) return;
    window.open(tr.dataset.href, '_blank', 'noopener');
  });
  $('#q').addEventListener('input', (e) => { state.q = e.target.value; render({ animate: false }); });

  // Enlace normal (no window.open) para que funcione también en navegadores que bloquean popups
  const pool = sites.filter((s) => s.url);
  const shuffle = () => { if (pool.length) $('#random').href = pool[Math.floor(Math.random() * pool.length)].url; };
  shuffle();
  $('#random').addEventListener('click', () => setTimeout(shuffle, 0));

  renderStatic();
  render({ delay: HERO_DELAY + HERO_DURATION - 200 });
  heroIntro(true);
})();
