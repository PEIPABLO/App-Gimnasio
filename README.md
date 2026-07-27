# Entreno — app de entrenamiento (PWA)

App web instalable. Los datos se guardan en tu iPhone y funciona sin conexión.

## Subirla a GitHub y usarla en el iPhone

1. Entra en github.com y crea un repositorio nuevo, por ejemplo **entreno** (público).
2. En el repo: **Add file → Upload files**. Arrastra **todo el contenido de esta carpeta**
   (index.html, app.js, styles.css, sw.js, manifest.webmanifest y las carpetas **icons/** y **vendor/**)
   y pulsa **Commit changes**.
3. **Settings → Pages**. En "Source" elige **Deploy from a branch**, rama **main** y carpeta **/(root)**. Guarda.
4. Espera ~1 minuto. GitHub mostrará la dirección: `https://TU-USUARIO.github.io/entreno/`.
   Ábrela en **Safari** en el iPhone.
5. Toca el botón **Compartir** → **Añadir a pantalla de inicio**.
   Ábrela desde ese icono: se ve a pantalla completa, como una app.

## Notas
- Los entrenamientos, rutinas y medidas se guardan **solo en ese dispositivo** (no se sincronizan entre móviles).
- Tras abrirla una vez, **funciona sin internet**.
- Para actualizarla en el futuro: sube los archivos nuevos y, en **sw.js**, cambia `entreno-v1` por `entreno-v2`.
  Cierra y vuelve a abrir la app para que cargue la versión nueva.

## Qué es cada archivo
- **index.html** — página principal
- **app.js** — la aplicación (React ya compilado, no necesitas instalar nada)
- **styles.css** — estilos
- **vendor/** — React incluido en local (sin depender de ningún CDN)
- **icons/** — iconos de la pantalla de inicio
- **manifest.webmanifest** y **sw.js** — hacen que sea instalable y funcione offline
