// Sirve la ficha del plato con metaetiquetas Open Graph propias, para que
// al compartir el enlace por WhatsApp salga la foto y descripción del plato.
// El cuerpo es el mismo cascarón que plato.html: bm.js pinta la ficha en cliente.
import { leerPlatos } from './platos.js';

function esc(s) {
  return String(s || '').replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

export default async function handler(req, res) {
  const slug = new URL(req.url, 'http://x').searchParams.get('slug') || '';
  let p = null;
  let logo = '/assets/img/logo.png';
  try {
    const d = await leerPlatos();
    p = d.platos.find(function (x) { return x.slug === slug; }) || null;
    if (d.ajustes && d.ajustes.logo) { logo = d.ajustes.logo; }
  } catch (err) {
    console.error(err);
  }

  const host = req.headers['x-forwarded-host'] || req.headers.host || 'bonmos.vercel.app';
  const base = 'https://' + host;
  const titulo = p ? p.titulo + ' · Bon Mos' : 'Plato · Bon Mos';
  const desc = p ? p.descripcion : 'Chef privado a domicilio. Cocina valenciana de mercado, cocinada en tu casa.';
  const imagen = p && p.foto ? (p.foto.indexOf('http') === 0 ? p.foto : base + p.foto) : base + '/og.jpg';
  const urlPlato = base + '/plato/' + encodeURIComponent(slug);

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(urlPlato)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Bon Mos">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(urlPlato)}">
<meta property="og:image" content="${esc(imagen)}">
<meta property="og:locale" content="es_ES">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#2b2117">
<link rel="icon" type="image/png" href="${esc(logo)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/estilo.css?v=17">
<script src="/assets/js/config.js?v=17"></script>
<script src="/assets/js/bm.js?v=17" defer></script>
</head>
<body data-pagina="plato">
<header class="cabecera">
  <a class="marca" href="/">
    <img src="${esc(logo)}" alt="Logo de Bon Mos" class="marca-logo">
    <span class="marca-texto">
      <strong>Bon Mos</strong>
      <em>Cuina de xef, a casa teua</em>
    </span>
  </a>
  <button class="hamburguesa" type="button" aria-label="Abrir menú" aria-expanded="false">
    <span></span><span></span><span></span>
  </button>
</header>
<main class="contenido" id="app">
  <p class="vacio">Emplatando…</p>
</main>
<footer class="pie">
  <div class="pie-azulejos" aria-hidden="true"></div>
  <p><strong>Bon Mos</strong> · Cuina de xef, a casa teua</p>
  <p class="pie-nota">Cocina valenciana de proximidad · Chef privado a domicilio</p>
</footer>
</body>
</html>`;

  res.setHeader('content-type', 'text/html; charset=utf-8');
  res.setHeader('cache-control', 'public, max-age=0, must-revalidate');
  return res.status(p ? 200 : 404).send(html);
}
