<?php
require_once __DIR__ . '/inc/lib.php';
$db = bm_db();

$st = $db->prepare('SELECT * FROM recetas WHERE slug = ?');
$st->execute([$_GET['r'] ?? '']);
$r = $st->fetch(PDO::FETCH_ASSOC);
if (!$r) {
    http_response_code(404);
    $titulo_pagina = 'Plato no encontrado';
    require __DIR__ . '/inc/header.php';
    echo '<p class="vacio">Ese plato no está en la carta. <a href="index.php">Volver a la carta</a></p>';
    require __DIR__ . '/inc/footer.php';
    exit;
}

$ingredientes = bm_lineas($r['ingredientes']);
$wa = bm_wa_link('Hola! Me gustaría reservar «' . $r['titulo'] . '» de Bon Mos para mi casa. ¿Hablamos?');
$titulo_pagina = $r['titulo'];
require __DIR__ . '/inc/header.php';
?>

<article class="receta">
  <div class="receta-foto" style="background-image:url('<?= e(bm_foto_url($r)) ?>')"></div>

  <header class="receta-cabecera">
    <span class="sobre-titulo"><?= e(BM_CATEGORIAS[$r['categoria']] ?? $r['categoria']) ?></span>
    <h1><?= e($r['titulo']) ?></h1>
    <p class="receta-descripcion prosa"><?= e($r['descripcion']) ?></p>
    <div class="receta-datos">
      <div><strong><?= (int)$r['comensales'] ?>+</strong><span>comensales</span></div>
      <div><strong><?= (int)$r['tiempo_min'] ?>'</strong><span>en tu cocina</span></div>
      <div><strong>Mercado</strong><span>producto del día</span></div>
    </div>
    <p class="reserva-principal">
      <a class="boton boton-sorpresa" href="<?= e($wa) ?>" target="_blank" rel="noopener">Reservar este plato</a>
    </p>
  </header>

  <div class="receta-columnas">
    <section class="panel panel-ingredientes">
      <h2>Producto de mercado</h2>
      <p class="panel-nota">Todo se compra el mismo día, de proximidad siempre que la lonja y la huerta lo permiten.</p>
      <ul class="lista-ingredientes lista-mercado">
        <?php foreach ($ingredientes as $ing): ?>
          <li><span><?= e($ing) ?></span></li>
        <?php endforeach; ?>
      </ul>
    </section>

    <section class="panel panel-pasos">
      <h2>Así funciona</h2>
      <ol class="lista-pasos lista-servicio">
        <li><strong>Eliges el menú.</strong> Este plato solo, o combinado con entrantes y dulce de la carta.</li>
        <li><strong>El chef hace la compra.</strong> Producto fresco del día, elegido pieza a pieza.</li>
        <li><strong>Se cocina en tu casa.</strong> Tú pones la mesa y la compañía; de la cocina (y de recogerla) se encarga él.</li>
      </ol>
      <?php if (trim($r['consejo']) !== ''): ?>
        <aside class="consejo">
          <strong>El toque del chef</strong>
          <p><?= e($r['consejo']) ?></p>
        </aside>
      <?php endif; ?>
      <div class="reserva-panel">
        <p class="prosa">¿Te lo imaginas ya en tu mesa?</p>
        <a class="boton boton-sorpresa" href="<?= e($wa) ?>" target="_blank" rel="noopener">Reservar por WhatsApp</a>
        <a class="boton boton-suave" href="mailto:<?= BM_EMAIL ?>?subject=<?= rawurlencode('Reserva: ' . $r['titulo']) ?>">O por correo</a>
      </div>
    </section>
  </div>

  <p class="volver"><a href="index.php">Volver a la carta</a> · <a href="editar.php?id=<?= (int)$r['id'] ?>">Editar (chef)</a></p>
</article>

<?php require __DIR__ . '/inc/footer.php'; ?>
