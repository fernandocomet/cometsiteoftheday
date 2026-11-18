/*
 * Exporta los tuits de #CometSiteOfTheDay desde X.
 *
 * Uso:
 *   1. Inicia sesión en X y abre:
 *      https://x.com/search?q=%23CometSiteOfTheDay%20from%3Afernandocomet&f=live
 *   2. Abre la consola del navegador (Cmd+Opt+J / Ctrl+Shift+J), pega este archivo y pulsa Enter.
 *   3. El script hace scroll hasta el final y descarga raw-tweets.json.
 *   4. Guárdalo en data/raw-tweets.json y ejecuta: python3 scripts/build_data.py
 */
(async () => {
  const found = {};
  const grab = () => {
    document.querySelectorAll('article[data-testid="tweet"]').forEach((a) => {
      const time = a.querySelector('time');
      const link = time && time.closest('a');
      if (!link) return;
      const path = link.getAttribute('href');
      if (found[path]) return;
      const text = (a.querySelector('[data-testid="tweetText"]') || {}).innerText || '';
      const links = [...a.querySelectorAll('a[href^="https://t.co"]')]
        .map((l) => l.innerText.replace(/\s+/g, '').replace(/…$/, ''))
        .filter((s) => /^https?:\/\//.test(s));
      const card = a.querySelector('[data-testid="card.wrapper"] img');
      const photo = a.querySelector('[data-testid="tweetPhoto"] img');
      found[path] = {
        u: 'https://x.com' + path,
        d: time.getAttribute('datetime').slice(0, 10),
        t: text,
        l: links,
        img: (card || photo || {}).src || null,
      };
    });
  };

  let stable = 0, last = -1;
  while (stable < 8) {
    grab();
    window.scrollBy(0, 2500);
    await new Promise((r) => setTimeout(r, 1200));
    const n = Object.keys(found).length;
    if (n === last) stable++; else { stable = 0; last = n; }
  }
  grab();

  const data = Object.values(found).sort((a, b) => (a.d < b.d ? 1 : -1));
  const blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'raw-tweets.json' });
  a.click();
  console.log(`✔ ${data.length} tuits exportados`);
})();
