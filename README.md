# #CometSiteOfTheDay

Archivo de todas las webs que se han llevado el **#CometSiteOfTheDay**, el premio que [@fernandocomet](https://x.com/fernandocomet) da en X desde 2014 cuando una web le llama la atención por algo: una transición, un efecto, la música, una idea…

**81 webs · 2014 → 2026**

- **Modo claro / oscuro:** sigue al sistema la primera vez; el botón sol/luna del header lo cambia y la elección se guarda (`localStorage` → `cometsotd-theme`).
- **Español / inglés:** detecta el idioma del navegador; el selector `ES · EN` lo cambia y se guarda (`cometsotd-lang`). Para compartir la versión en inglés: `?lang=en` o `#en`.
- **Cuadrícula / lista:** el selector junto al contador cambia entre tarjetas y una tabla (fecha · web · tuit · tecnología). Se guarda en `cometsotd-view`.
- **Animaciones** con [anime.js](https://animejs.com) 4.5.0, guardado en `vendor/anime.umd.min.js` (sin CDN ni npm): los textos se "descifran" (`scrambleText`) y las imágenes se revelan al entrar en pantalla. Se desactivan con `prefers-reduced-motion` y, si el archivo no carga, la web funciona igual sin animar.
- Sin dependencias externas: HTML, CSS y JS vanilla, fuentes del sistema y solo blanco, negro y grises (marca FCA).

## Qué hay aquí

```
index.html            Página principal
styles.css            Estilos (blanco y negro, fuentes del sistema)
app.js                Carga los datos, búsqueda y filtros
data/sites.json       ← La lista de webs (este es el archivo que se edita)
data/raw-tweets.json  Tuits originales exportados de X
scripts/scrape-x.js   Exporta los tuits del hashtag desde el navegador
scripts/build_data.py Convierte raw-tweets.json en sites.json
```

Cada web en `data/sites.json` tiene este formato:

```json
{
  "id": "2123045539541618958",
  "date": "2026-11-18",
  "url": "https://tomjohn.design",
  "domain": "tomjohn.design",
  "note": "Tom Johnson | Product Designer at Vercel made this Three.js game…",
  "tweet": "https://x.com/fernandocomet/status/2123045539541618958",
  "image": "https://pbs.twimg.com/media/…",
  "tags": ["Three.js"]
}
```

## Publicarla con GitHub Pages

1. Crea un repositorio nuevo en GitHub (por ejemplo `comet-site-of-the-day`) y sube todos estos archivos.
2. Ve a **Settings → Pages**, elige **Deploy from a branch**, rama `main` y carpeta `/ (root)`.
3. En un minuto estará en `https://<tu-usuario>.github.io/comet-site-of-the-day/`.

Para verla en local: `npx serve .` o `python3 -m http.server`, y abre `http://localhost:8000`. Si abres `index.html` con doble clic no carga los datos, porque el navegador bloquea `fetch` en `file://`.

## Añadir un premio nuevo

**Desde el panel (lo normal):** entra en `https://cometsiteoftheday.vercel.app/admin` con tu contraseña.

1. Pega la URL de la web y pulsa **Leer web**: saca la imagen y sugiere las tecnologías.
2. Escribe el texto del tuit, revisa la vista previa y pulsa **Publicar y abrir X**.
3. La web se guarda en `data/sites.json` (un commit en GitHub) y se abre X con el tuit escrito. Solo te queda darle a *Postear*.
4. Cuando el tuit esté publicado, copia su enlace y pégalo en **Pendientes** para que la tarjeta tenga «Ver tuit».

El panel usa las funciones de `api/` y solo funciona en Vercel. Necesita estas variables en **Vercel → Settings → Environment Variables**:

| Variable | Valor |
|---|---|
| `ADMIN_PASSWORD` | La contraseña del panel |
| `GITHUB_TOKEN` | Token *fine-grained* de GitHub con acceso solo a este repo y permiso **Contents: Read and write** |

### Otras formas

**A mano:** añade un objeto al principio de `data/sites.json` con los campos de arriba. `image` y `tags` son opcionales: si no hay imagen, la tarjeta muestra el dominio sobre fondo negro (blanco en modo oscuro).

`note` es el texto original del tuit y no se traduce. Si quieres una descripción propia en cada idioma, añade `note_es` y/o `note_en`: la web muestra la del idioma activo y, si no existe, `note`.

**Desde X:**
1. Abre la [búsqueda del hashtag](https://x.com/search?q=%23CometSiteOfTheDay%20from%3Afernandocomet&f=live) con tu sesión iniciada.
2. Pega `scripts/scrape-x.js` en la consola del navegador. Hará scroll hasta el final y descargará `raw-tweets.json`.
3. Sustituye `data/raw-tweets.json` por el archivo descargado y ejecuta `python3 scripts/build_data.py`. Solo se añaden los tuits nuevos: lo que hayas editado a mano en `sites.json` se respeta.

## Notas

- Las miniaturas se cargan directamente desde los servidores de imágenes de X (`pbs.twimg.com`). Si alguna deja de funcionar, la tarjeta muestra el dominio en su lugar. Para no depender de X, puedes guardar capturas en `img/` y cambiar el campo `image`.
- Algunas webs antiguas (2014–2017) ya no existen o han cambiado. El enlace al tuit se mantiene siempre.

© Fernando Comet
