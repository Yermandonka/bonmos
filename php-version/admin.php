<?php
require_once __DIR__ . '/inc/lib.php';
$db = bm_db();
$aviso = $_GET['ok'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['borrar'])) {
    $st = $db->prepare('SELECT foto FROM recetas WHERE id = ?');
    $st->execute([(int)$_POST['borrar']]);
    $foto = $st->fetchColumn();
    if ($foto && !str_starts_with($foto, 'assets/') && is_file(BM_UPLOADS . '/' . $foto)) {
        unlink(BM_UPLOADS . '/' . $foto);
    }
    $db->prepare('DELETE FROM recetas WHERE id = ?')->execute([(int)$_POST['borrar']]);
    header('Location: admin.php?ok=borrada');
    exit;
}

$recetas = $db->query('SELECT id, titulo, slug, categoria, destacada, creada_en FROM recetas ORDER BY creada_en DESC')->fetchAll(PDO::FETCH_ASSOC);
$titulo_pagina = 'Panel del chef';
require __DIR__ . '/inc/header.php';
?>

<section class="panel-admin">
  <header class="admin-cabecera">
    <h1>Panel del chef</h1>
    <div class="admin-acciones">
      <a class="boton" href="editar.php">+ Nueva receta</a>
    </div>
  </header>
  <?php if ($aviso === 'guardada'): ?><p class="exito">Receta guardada. Bon profit!</p><?php endif; ?>
  <?php if ($aviso === 'borrada'): ?><p class="exito">Receta borrada del recetario.</p><?php endif; ?>

  <ul class="admin-lista">
    <?php foreach ($recetas as $r): ?>
    <li>
      <div class="admin-item-info">
        <strong><?= e($r['titulo']) ?></strong>
        <span><?= e(BM_CATEGORIAS[$r['categoria']] ?? $r['categoria']) ?><?= $r['destacada'] ? ' · ★ plato de la casa' : '' ?></span>
      </div>
      <div class="admin-item-botones">
        <a class="boton boton-suave" href="receta.php?r=<?= e($r['slug']) ?>">Ver</a>
        <a class="boton boton-suave" href="editar.php?id=<?= (int)$r['id'] ?>">Editar</a>
        <form method="post" onsubmit="return confirm('¿Borrar «<?= e($r['titulo']) ?>» del recetario?')">
          <input type="hidden" name="borrar" value="<?= (int)$r['id'] ?>">
          <button type="submit" class="boton boton-peligro">Borrar</button>
        </form>
      </div>
    </li>
    <?php endforeach; ?>
  </ul>
</section>

<?php require __DIR__ . '/inc/footer.php'; ?>
