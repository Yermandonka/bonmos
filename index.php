<?php
require_once __DIR__ . '/inc/lib.php';
$db = bm_db();

// «Sorpréndeme»: receta al azar
if (isset($_GET['azar'])) {
    $slug = $db->query('SELECT slug FROM recetas ORDER BY RANDOM() LIMIT 1')->fetchColumn();
    header('Location: ' . ($slug ? 'receta.php?r=' . rawurlencode($slug) : 'index.php'));
    exit;
}

$cat = $_GET['cat'] ?? '';
if (!array_key_exists($cat, BM_CATEGORIAS)) {
    $cat = '';
}
$busca = trim($_GET['q'] ?? '');

$sql = 'SELECT * FROM recetas';
$cond = [];
$par = [];
if ($cat !== '') { $cond[] = 'categoria = ?'; $par[] = $cat; }
if ($busca !== '') { $cond[] = '(titulo LIKE ? OR descripcion LIKE ? OR ingredientes LIKE ?)'; $like = "%$busca%"; array_push($par, $like, $like, $like); }
if ($cond) { $sql .= ' WHERE ' . implode(' AND ', $cond); }
$sql .= ' ORDER BY destacada DESC, creada_en DESC';
$st = $db->prepare($sql);
$st->execute($par);
$recetas = $st->fetchAll(PDO::FETCH_ASSOC);

$destacada = null;
if ($cat === '' && $busca === '') {
    foreach ($recetas as $i => $r) {
        if ($r['destacada']) { $destacada = $r; unset($recetas[$i]); break; }
    }
}

$titulo_pagina = 'Recetas';
require __DIR__ . '/inc/header.php';
?>

<?php if ($destacada): ?>
<section class="hero">
  <a class="hero-tarjeta" href="receta.php?r=<?= e($destacada['slug']) ?>"
     data-titulo="<?= e($destacada['titulo']) ?>"
     data-desc="<?= e($destacada['descripcion']) ?>"
     data-foto="<?= e(bm_foto_url($destacada)) ?>"
     data-meta="<?= e(BM_CATEGORIAS[$destacada['categoria']] ?? $destacada['categoria']) ?> · <?= (int)$destacada['tiempo_min'] ?> min"
     data-datos="Para <?= (int)$destacada['comensales'] ?> o más · Producto de mercado"
     data-wa="<?= e(bm_wa_link('Hola! Me gustaría reservar «' . $destacada['titulo'] . '» de Bon Mos para mi casa. ¿Hablamos?')) ?>">
    <div class="hero-foto" style="background-image:url('<?= e(bm_foto_url($destacada)) ?>')"></div>
    <div class="hero-texto">
      <span class="sobre-titulo">Plato de la casa</span>
      <h1><?= e($destacada['titulo']) ?></h1>
      <p class="prosa"><?= e($destacada['descripcion']) ?></p>
      <span class="hero-cta">Ver el plato</span>
    </div>
  </a>
</section>
<?php else: ?>
<h1 class="titulo-seccion">
  <?= $busca !== '' ? 'Resultados para «' . e($busca) . '»' : e(BM_CATEGORIAS[$cat] ?? 'La carta') ?>
</h1>
<?php endif; ?>

<form class="buscador" action="index.php" method="get" role="search">
  <input type="search" name="q" value="<?= e($busca) ?>" placeholder="Busca por plato o ingrediente…" aria-label="Buscar recetas">
  <button type="submit">Buscar</button>
  <a class="boton boton-sorpresa" href="index.php?azar=1" title="Una receta al azar">Sorpréndeme</a>
</form>

<nav class="filtros" aria-label="Categorías">
  <a href="index.php" class="filtro <?= $cat === '' ? 'activo' : '' ?>">Todas</a>
  <?php foreach (BM_CATEGORIAS as $clave => $nombre): ?>
    <a href="index.php?cat=<?= $clave ?>" class="filtro <?= $cat === $clave ? 'activo' : '' ?>"><?= e($nombre) ?></a>
  <?php endforeach; ?>
</nav>

<?php if (!$recetas && !$destacada): ?>
  <p class="vacio">No hay platos por aquí todavía. <a href="index.php">Ver toda la carta</a></p>
<?php endif; ?>

<div class="cenefa" aria-hidden="true"></div>

<section class="rejilla">
  <?php foreach ($recetas as $r): ?>
  <a class="tarjeta" href="receta.php?r=<?= e($r['slug']) ?>"
     data-titulo="<?= e($r['titulo']) ?>"
     data-desc="<?= e($r['descripcion']) ?>"
     data-foto="<?= e(bm_foto_url($r)) ?>"
     data-meta="<?= e(BM_CATEGORIAS[$r['categoria']] ?? $r['categoria']) ?> · <?= (int)$r['tiempo_min'] ?> min"
     data-datos="Para <?= (int)$r['comensales'] ?> o más · Producto de mercado"
     data-wa="<?= e(bm_wa_link('Hola! Me gustaría reservar «' . $r['titulo'] . '» de Bon Mos para mi casa. ¿Hablamos?')) ?>">
    <div class="tarjeta-foto" style="background-image:url('<?= e(bm_foto_url($r)) ?>')"></div>
    <div class="tarjeta-cuerpo">
      <span class="tarjeta-meta"><?= e(BM_CATEGORIAS[$r['categoria']] ?? $r['categoria']) ?> · <?= (int)$r['tiempo_min'] ?> min</span>
      <h2><?= e($r['titulo']) ?></h2>
      <p><?= e(mb_strimwidth($r['descripcion'], 0, 150, '…')) ?></p>
      <div class="tarjeta-pie">
        <span>Para <?= (int)$r['comensales'] ?> · <?= e($r['dificultad']) ?></span>
        <span class="tarjeta-ver">Ver plato</span>
      </div>
    </div>
  </a>
  <?php endforeach; ?>
</section>

<?php require __DIR__ . '/inc/footer.php'; ?>
