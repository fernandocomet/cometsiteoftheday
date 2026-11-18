# Instrucciones — #CometSiteOfTheDay

Documento de trabajo para seguir el proyecto en Visual Studio Code. Sirve tanto para ti como para pasárselo a un asistente de IA (Claude Code, Copilot…) como contexto: **léelo entero antes de tocar código.**

---

## 1. Qué es el proyecto

Archivo web de todas las webs que Fernando Comet ha premiado en X con el hashtag **#CometSiteOfTheDay** desde 2014 (81 premios a 18/11/2026). Web estática, sin frameworks ni build, publicada en **GitHub Pages**.

### Estado actual

```
index.html            Estructura de la página
styles.css            Estilos
app.js                Carga data/sites.json, pinta tarjetas, búsqueda y filtros
data/sites.json       ← Fuente de datos (editable a mano)
data/raw-tweets.json  Tuits exportados de X, sin procesar
scripts/scrape-x.js   Snippet para la consola de X que exporta los tuits
scripts/build_data.py raw-tweets.json → sites.json (solo añade los nuevos)
README.md             Documentación pública del repo
.nojekyll             Para que GitHub Pages sirva los archivos tal cual
```

Funciona: grid de tarjetas, buscador, filtros por año y por tecnología, botón "Una al azar".

### Lo que falta (objetivo de esta fase)

1. **Aplicar la marca FCA completa** (sección 3).
2. **Modo claro / oscuro** con botón de icono sol/luna (sección 4).
3. **Bilingüe español / inglés** con selector ES · EN (sección 5).

---

## 2. Cómo trabajar en VS Code

1. Descomprime el proyecto y ábrelo: `File → Open Folder…`
2. Instala la extensión **Live Server** (Ritwick Dey). Clic derecho en `index.html` → *Open with Live Server*.
   - Alternativa por terminal: `python3 -m http.server 8000` o `npx serve .`
   - ⚠️ No abras `index.html` con doble clic: `fetch()` no funciona en `file://` y no cargarán los datos.
3. Trabaja en una rama: `git checkout -b brand-i18n-theme`
4. Comprueba en escritorio y en móvil (DevTools → modo dispositivo, 390 px).

### Reglas técnicas

- **Sin dependencias**: HTML + CSS + JS vanilla. Nada de npm, frameworks, CDNs ni Google Fonts.
- Todo el CSS en `styles.css`, todo el JS en `app.js` (más un pequeño script inline en `<head>` para el tema, ver 4.3).
- No cambiar el formato de `data/sites.json` salvo lo indicado en 5.4.
- Accesibilidad: todos los botones con `aria-label`, foco visible, contraste AA en ambos temas, respetar `prefers-reduced-motion`.

---

## 3. Marca FCA (Fernando Comet)

### 3.1 Principios — siempre

1. **Solo blanco, negro y grises.** Ningún color de acento.
2. **Fuentes del sistema**, nunca externas.
3. **Logo FC\\ en el header**, siempre, a tamaño fijo (35×17 px), nunca decorativo ni grande.
4. **Etiquetas de sección** en MAYÚSCULAS, 10–11 px, peso 500, `letter-spacing: 2px`.
5. **Títulos en serif** (Georgia), peso 400, tracking ligeramente negativo.
6. **Pie** con `© Fernando Comet [año]`.
7. Minimalismo: mucho blanco, líneas finas (hairlines), sin sombras, sin degradados, sin esquinas redondeadas salvo los chips de filtro (píldora).

### 3.2 Tipografía

```css
--fca-font-display: Georgia, "Times New Roman", Times, serif;
--fca-font-body:    -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
--fca-font-mono:    ui-monospace, "Cascadia Code", Menlo, Consolas, monospace;
```

| Rol | Fuente | Tamaño (web) | Peso | Tracking |
|---|---|---|---|---|
| H1 hero | display | `clamp(40px, 8vw, 104px)` | 400 | -0.03em |
| Título tarjeta (H2) | display | 22px | 400 | -0.01em |
| Cifras de stats | display | 36px | 400 | 0 |
| Etiqueta de sección | body | 11px | 500 | 2px, MAYÚSCULAS |
| Texto | body | 15px, line-height 1.6 | 400 | 0 |
| Pie / metadatos | body | 11–12px | 400 | 0–1.5px |
| Tags de tecnología | mono | 11px | 400 | 0 |

Longitud máxima de línea en textos largos: **60–80ch**.

### 3.3 Header según el tema

La marca define dos tratamientos de header, y encajan directamente con los dos modos:

| | Header | Logo | Línea inferior |
|---|---|---|---|
| **Light** | Fondo blanco `#FFFFFF`, texto negro | Logo **negro** | 1px sólida `#000` |
| **Dark** | Banda negra a todo el ancho `#000000`, texto blanco | Logo **blanco** | Sin línea (o 1px `#222`) |

> La marca original solo oscurece el header y deja el cuerpo blanco. En esta web el **modo oscuro extiende la marca a toda la página** (fondo negro, texto blanco), pero sin salir nunca de la paleta negro/blanco/grises.

### 3.4 Logo (SVG inline)

Usar **un solo SVG con `fill="currentColor"`**, así cambia de color solo con el tema:

```html
<svg class="logo-svg" width="35" height="17" viewBox="0 0 35 17" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M25.2266 5.82031H21.8047C21.7422 5.3776 21.6146 4.98437 21.4219 4.64062C21.2292 4.29167 20.9818 3.99479 20.6797 3.75C20.3776 3.50521 20.0286 3.31771 19.6328 3.1875C19.2422 3.05729 18.8177 2.99219 18.3594 2.99219C17.5312 2.99219 16.8099 3.19792 16.1953 3.60937C15.5807 4.01562 15.1042 4.60938 14.7656 5.39063C14.4271 6.16667 14.2578 7.10938 14.2578 8.21875C14.2578 9.35938 14.4271 10.3177 14.7656 11.0938C15.1094 11.8698 15.5885 12.4557 16.2031 12.8516C16.8177 13.2474 17.5286 13.4453 18.3359 13.4453C18.7891 13.4453 19.2083 13.3854 19.5938 13.2656C19.9844 13.1458 20.3307 12.9714 20.6328 12.7422C20.9349 12.5078 21.1849 12.224 21.3828 11.8906C21.5859 11.5573 21.7266 11.1771 21.8047 10.75L25.2266 10.7656C25.138 11.5 24.9167 12.2083 24.5625 12.8906C24.2135 13.5677 23.7422 14.1745 23.1484 14.7109C22.5599 15.2422 21.8568 15.6641 21.0391 15.9766C20.2266 16.2839 19.3073 16.4375 18.2812 16.4375C16.8542 16.4375 15.5781 16.1146 14.4531 15.4688C13.3333 14.8229 12.4479 13.888 11.7969 12.6641C11.151 11.4401 10.8281 9.95833 10.8281 8.21875C10.8281 6.47396 11.1562 4.98958 11.8125 3.76563C12.4688 2.54167 13.3594 1.60938 14.4844 0.96875C15.6094 0.322917 16.875 0 18.2812 0C19.2083 0 20.0677 0.130208 20.8594 0.390625C21.6562 0.651042 22.362 1.03125 22.9766 1.53125C23.5911 2.02604 24.0911 2.63281 24.4766 3.35156C24.8672 4.07031 25.1172 4.89323 25.2266 5.82031Z"/>
  <path d="M0 16.2188V0.21875H10.5938V3.00781H3.38281V6.82031H9.89063V9.60938H3.38281V16.2188H0Z"/>
  <path d="M31.3932 16.2188L25.6094 0.21875H28.8255L34.6094 16.2188H31.3932Z"/>
</svg>
```

Ahora mismo `index.html` tiene el logo con `fill="white"` fijo en cada `<path>`: **sustituirlo por este.**

---

## 4. Modo claro / oscuro

### 4.1 Comportamiento

- Por defecto sigue al sistema (`prefers-color-scheme`).
- El botón alterna entre claro y oscuro y **guarda la elección** en `localStorage` (`cometsotd-theme` = `light` | `dark`).
- Se aplica con un atributo en `<html>`: `<html data-theme="light">` / `<html data-theme="dark">`.
- **Icono**: en modo claro se muestra la **luna** (acción: pasar a oscuro); en modo oscuro se muestra el **sol** (acción: pasar a claro).
- `aria-label` dinámico y traducido: "Activar modo oscuro" / "Activar modo claro" (ver 5.3).
- Transición suave de colores (`.2s`) desactivada con `prefers-reduced-motion`.

### 4.2 Tokens de color

Reemplazar el `:root` actual de `styles.css` por:

```css
:root,
[data-theme="light"] {
  --bg:          #FFFFFF;
  --ink:         #000000;
  --muted:       #555555;
  --hairline:    #E0E0E0;
  --soft:        #F5F5F5;
  --header-bg:   #FFFFFF;
  --header-ink:  #000000;
  --header-line: #000000;
  --ph-bg:       #000000;  /* tarjeta sin imagen */
  --ph-ink:      #FFFFFF;
  color-scheme: light;
}

[data-theme="dark"] {
  --bg:          #000000;
  --ink:         #FFFFFF;
  --muted:       #A0A0A0;
  --hairline:    #2A2A2A;
  --soft:        #111111;
  --header-bg:   #000000;
  --header-ink:  #FFFFFF;
  --header-line: #2A2A2A;
  --ph-bg:       #FFFFFF;  /* invertido: tarjeta blanca con texto negro */
  --ph-ink:      #000000;
  color-scheme: dark;
}
```

Después, **sustituir todos los colores fijos** (`#000`, `#fff`, `#333`, `#999`, `#bbb`) de `styles.css` por estas variables. Revisar especialmente: `.band`, `.random`, `.chip[aria-pressed="true"]`, `.ph`, `.note`, `#q::placeholder`, `.foot`.

El header pasa de `.band { background: #000; color: #fff; }` a:

```css
.band { background: var(--header-bg); color: var(--header-ink); border-bottom: 1px solid var(--header-line); }
```

### 4.3 Evitar el parpadeo (FOUC)

Script **inline al principio del `<head>`**, antes del CSS:

```html
<script>
  (function () {
    try {
      var t = localStorage.getItem('cometsotd-theme');
      if (t !== 'light' && t !== 'dark') {
        t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      document.documentElement.dataset.theme = t;
    } catch (e) {
      document.documentElement.dataset.theme = 'light';
    }
  })();
</script>
```

### 4.4 Botón con iconos sol / luna

En el header, a la derecha, antes de "Una al azar":

```html
<button class="icon-btn" id="theme-toggle" type="button" aria-label="Activar modo oscuro">
  <!-- Luna: visible en modo claro -->
  <svg class="icon icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>
  </svg>
  <!-- Sol: visible en modo oscuro -->
  <svg class="icon icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
  </svg>
</button>
```

```css
.icon-btn { width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid currentColor; }
.icon-btn:hover { background: var(--header-ink); color: var(--header-bg); }
.icon-btn:focus-visible, .lang button:focus-visible, .random:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
[data-theme="light"] .icon-sun,
[data-theme="dark"]  .icon-moon { display: none; }
```

```js
const themeBtn = document.getElementById('theme-toggle');
function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem('cometsotd-theme', t); } catch (e) {}
  themeBtn.setAttribute('aria-label', t === 'dark' ? i18n('theme.toLight') : i18n('theme.toDark'));
}
themeBtn.addEventListener('click', () => {
  applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
});
```

---

## 5. Bilingüe español / inglés

### 5.1 Comportamiento

- Idioma inicial: lo guardado en `localStorage` (`cometsotd-lang`) → si no hay, `navigator.language` (`es*` → español, lo demás → inglés).
- Selector en el header: **`ES · EN`**, como texto, con el idioma activo subrayado o en negrita (`aria-pressed="true"`). Nada de banderas.
- Al cambiar de idioma:
  - `document.documentElement.lang` = `es` / `en`
  - Se traducen todos los textos de interfaz, `<title>`, `meta description`, placeholders y `aria-label`.
  - Las fechas se formatean con `Intl.DateTimeFormat('es-ES' | 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })`.
  - Se vuelven a pintar las tarjetas sin perder los filtros ni la búsqueda activa.
- Si es posible, permitir `?lang=en` o `#en` en la URL para compartir la versión en inglés.

### 5.2 Implementación

- En el HTML, cada texto traducible lleva `data-i18n="clave"` (contenido), `data-i18n-placeholder="clave"` o `data-i18n-aria="clave"`.
- En `app.js`, un diccionario `STRINGS = { es: {…}, en: {…} }` y una función `i18n(clave, vars)` que interpola `{n}`, `{total}`…
- Función `applyLang(lang)` que recorre los `[data-i18n*]` y vuelve a llamar a `render()`.

### 5.3 Textos de interfaz

| Clave | Español | English |
|---|---|---|
| `meta.title` | #CometSiteOfTheDay — Fernando Comet | #CometSiteOfTheDay — Fernando Comet |
| `meta.description` | Archivo de las webs premiadas con el #CometSiteOfTheDay de Fernando Comet desde 2014. | An archive of every website awarded Fernando Comet's #CometSiteOfTheDay since 2014. |
| `header.label` | Site of the Day | Site of the Day |
| `header.random` | Una al azar ↗ | Random pick ↗ |
| `theme.toDark` | Activar modo oscuro | Switch to dark mode |
| `theme.toLight` | Activar modo claro | Switch to light mode |
| `lang.label` | Idioma | Language |
| `hero.label` | Archivo · desde 2014 | Archive · since 2014 |
| `hero.lede` | Cuando una web me llama la atención por algo, sea una transición, un efecto, la música o una idea, se lleva el premio. Aquí están todas. | When a website catches my eye for something, be it a transition, an effect, the music or an idea, it wins the award. Here they all are. |
| `stats.sites` | Webs premiadas | Awarded sites |
| `stats.years` | Años | Years |
| `stats.first` | Primer premio | First award |
| `search.placeholder` | Buscar por web, texto o tecnología… | Search by site, text or technology… |
| `filter.yearGroup` | Año | Year |
| `filter.tagGroup` | Tecnología | Technology |
| `filter.allYears` | Todos los años | All years |
| `filter.allTags` | Todas las tecnologías | All technologies |
| `count.all` | {n} webs | {n} sites |
| `count.filtered` | {n} de {total} webs | {n} of {total} sites |
| `empty` | Ninguna web coincide con la búsqueda. | No sites match your search. |
| `loadError` | No se han podido cargar los datos. Abre la web desde un servidor. | Couldn't load the data. Open the site from a web server. |
| `card.visit` | Visitar web ↗ | Visit site ↗ |
| `card.tweet` | Ver tuit ↗ | View post ↗ |
| `card.imgAlt` | Captura de {domain} | Screenshot of {domain} |
| `footer.hashtag` | Ver el hashtag en X ↗ | See the hashtag on X ↗ |

### 5.4 Texto de los tuits

El campo `note` de cada web es **el texto original del tuit** (casi todos en inglés, alguno en español) y **no se traduce automáticamente**. Si más adelante se quiere una descripción propia en los dos idiomas, añadir campos opcionales a `sites.json`:

```json
"note_es": "Juego en Three.js con un mapa 3D para explorar sus proyectos.",
"note_en": "A Three.js game with a 3D map to explore his work."
```

Regla en `app.js`: mostrar `note_<lang>` si existe y, si no, `note`. Así no hay que traducir las 81 de golpe.

---

## 6. Header final (referencia)

```
┌──────────────────────────────────────────────────────────────────┐
│ FC\   SITE OF THE DAY                  ES · EN   [☾]   [Una al azar ↗] │
└──────────────────────────────────────────────────────────────────┘
  Light: fondo blanco, 1px negro abajo · Dark: banda negra a todo el ancho
```

- Escritorio: todo en una línea, alto 52px, sticky.
- Móvil (< 600px): se oculta "Site of the Day"; quedan logo, `ES · EN`, sol/luna y "Una al azar".

---

## 7. Checklist antes de hacer merge

**Marca**
- [ ] Solo negro, blanco y grises en los dos temas
- [ ] Fuentes del sistema, sin peticiones a fuentes externas (comprobar en DevTools → Network)
- [ ] Logo FC\ con `currentColor`, negro en claro y blanco en oscuro
- [ ] Header claro: blanco + 1px negro · Header oscuro: banda negra a todo el ancho
- [ ] Etiquetas en mayúsculas con `letter-spacing: 2px`
- [ ] Pie con `© Fernando Comet [año]`

**Tema**
- [ ] Respeta `prefers-color-scheme` en la primera visita
- [ ] El botón alterna y la elección se mantiene al recargar
- [ ] Luna en modo claro, sol en modo oscuro
- [ ] Sin parpadeo blanco al cargar en modo oscuro
- [ ] Tarjetas sin imagen, chips activos, buscador y foco se ven bien en los dos temas
- [ ] Contraste AA en ambos

**Idioma**
- [ ] Detecta el idioma del navegador en la primera visita
- [ ] `ES · EN` cambia todos los textos, el `lang` del `<html>`, el `<title>` y los `aria-label`
- [ ] Las fechas cambian de formato (18 nov 2026 / 18 Nov 2026)
- [ ] Cambiar de idioma no reinicia filtros ni búsqueda
- [ ] La elección se mantiene al recargar

**General**
- [ ] Sin errores en consola
- [ ] Bien en 390px, 768px y 1280px
- [ ] Navegable solo con teclado
- [ ] `README.md` actualizado (mencionar tema e idiomas)

---

## 8. Publicar en GitHub Pages

```bash
git add -A
git commit -m "Marca FCA, modo claro/oscuro y bilingüe ES/EN"
git remote add origin https://github.com/<tu-usuario>/comet-site-of-the-day.git   # solo la primera vez
git push -u origin main
```

En GitHub: **Settings → Pages → Deploy from a branch → `main` / `(root)`**. URL: `https://<tu-usuario>.github.io/comet-site-of-the-day/`

---

## 9. Ideas para más adelante (no ahora)

- Guardar capturas propias en `img/` para no depender de las imágenes de X.
- Página por año (`#2016`) o vista de línea de tiempo.
- Marcar las webs que ya no existen (`"status": "offline"`) y enlazar a archive.org.
- Feed RSS de los premios nuevos.

© Fernando Comet 2026
