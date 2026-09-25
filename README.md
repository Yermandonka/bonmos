# Bon Mos

Web-escaparate de chef privado a domicilio, con estética valenciana. La carta se gestiona desde un panel sin complicaciones y las reservas llegan por WhatsApp.

Pensada para **Vercel**, sin base de datos externa: frontend estático + funciones serverless en `/api`, y todos los datos (carta, ajustes y fotos) en **Vercel Blob**.

## Desplegar en Vercel

1. Importa este repo en Vercel (preset de framework: **Other**, sin comando de build).
2. El primer deploy ya funciona en **modo demostración** (carta de ejemplo, solo lectura).
3. Para publicar de verdad, solo dos cosas en el proyecto de Vercel:
   - **Storage → Blob**: crea un Blob store (añade `BLOB_READ_WRITE_TOKEN` solo). La carta se guarda ahí como JSON y se siembra sola con los platos de ejemplo en la primera visita; las fotos del chef también van ahí.
   - **Settings → Environment Variables → `PANEL_CLAVE`**: la clave del chef. Sin ella, el panel y la API de escritura quedan cerrados.
4. Redepliega.

Nota: tras guardar un cambio, el CDN del Blob puede tardar hasta un minuto en reflejarlo para el resto de visitantes.

## Configuración del negocio

En `assets/js/config.js`: nombre, lema, categorías y — **importante** — el WhatsApp y el correo reales del chef (los que hay son de ejemplo).

## Estructura

- `index.html` / `plato.html` / `panel.html` — carta, ficha comercial y panel del chef (render en cliente con `assets/js/bm.js`).
- El panel no aparece en la navegación: se entra por `/panel` o manteniendo pulsado el «Bon Mos» del pie de página (doble clic en escritorio). Siempre pide la clave.
- `api/platos.js` — CRUD de la carta (JSON en Vercel Blob; sin Blob responde la carta demo).
- `api/foto.js` — subida de fotos a Vercel Blob (JPG/PNG/WebP, máx. 4 MB).
- `php-version/` — la versión original PHP + SQLite, para servidor propio (XAMPP/LAMPP): `sudo bash php-version/desplegar.sh`.

Las fotos de los platos de ejemplo proceden de Wikimedia Commons; atribución en `assets/img/platos/CREDITOS.txt`.
