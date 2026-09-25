# Bon Mos

Web-escaparate de chef privado a domicilio, con estética valenciana. La carta se gestiona desde un panel sin complicaciones y las reservas llegan por WhatsApp.

Pensada para **Vercel**: frontend estático + funciones serverless en `/api`, base de datos **Neon Postgres** y fotos en **Vercel Blob**.

## Desplegar en Vercel

1. Importa este repo en Vercel (preset de framework: **Other**, sin comando de build).
2. El primer deploy ya funciona en **modo demostración** (carta de ejemplo, solo lectura).
3. Para publicar de verdad, en el proyecto de Vercel:
   - **Storage → Create Database → Neon (Postgres)** y conéctala al proyecto (añade `DATABASE_URL` sola). La tabla se crea y se siembra automáticamente en la primera visita.
   - **Storage → Blob** para las fotos que suba el chef (añade `BLOB_READ_WRITE_TOKEN` solo).
   - Opcional pero recomendable: variable de entorno `PANEL_CLAVE` con una clave — el panel la pedirá una vez para poder publicar/borrar.
4. Redepliega.

## Configuración del negocio

En `assets/js/config.js`: nombre, lema, categorías y — **importante** — el WhatsApp y el correo reales del chef (los que hay son de ejemplo).

## Estructura

- `index.html` / `plato.html` / `panel.html` — carta, ficha comercial y panel del chef (render en cliente con `assets/js/bm.js`).
- `api/platos.js` — CRUD de la carta (Neon Postgres; sin base de datos responde la carta demo).
- `api/foto.js` — subida de fotos a Vercel Blob (JPG/PNG/WebP, máx. 4 MB).
- `php-version/` — la versión original PHP + SQLite, para servidor propio (XAMPP/LAMPP): `sudo bash php-version/desplegar.sh`.

Las fotos de los platos de ejemplo proceden de Wikimedia Commons; atribución en `assets/img/platos/CREDITOS.txt`.
