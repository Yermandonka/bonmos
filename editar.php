<?php
require_once __DIR__ . '/inc/lib.php';
$db = bm_db();

$id = (int)($_GET['id'] ?? $_POST['id'] ?? 0);
$r = [
    'titulo' => '', 'categoria' => 'principal', 'descripcion' => '', 'ingredientes' => '',
    'pasos' => '', 'consejo' => '', 'tiempo_min' => 30, 'comensales' => 4,
    'dificultad' => 'Media', 'foto' => '', 'destacada' => 0,
];
if ($id) {
    $st = $db->prepare('SELECT * FROM recetas WHERE id = ?');
    $st->execute([$id]);
    $existente = $st->fetch(PDO::FETCH_ASSOC);
    if ($existente) { $r = $existente; } else { $id = 0; }
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    foreach (['titulo','categoria','descripcion','ingredientes','pasos','consejo','dificultad'] as $campo) {
        $r[$campo] = trim($_POST[$campo] ?? '');
    }
    $r['tiempo_min'] = max(1, (int)($_POST['tiempo_min'] ?? 30));
    $r['comensales'] = max(1, (int)($_POST['comensales'] ?? 4));
    $r['destacada'] = isset($_POST['destacada']) ? 1 : 0;
    if (!array_key_exists($r['categoria'], BM_CATEGORIAS)) { $r['categoria'] = 'principal'; }
    if (!in_array($r['dificultad'], BM_DIFICULTADES, true)) { $r['dificultad'] = 'Media'; }

    if ($r['titulo'] === '' || $r['ingredientes'] === '') {
        $error = 'Título e ingredientes son obligatorios.';
    } else {
        $nueva_foto = bm_guardar_foto($_FILES['foto'] ?? []);
        if ($nueva_foto !== null) {
            if ($r['foto'] !== '' && !str_starts_with($r['foto'], 'assets/') && is_file(BM_UPLOADS . '/' . $r['foto'])) {
                unlink(BM_UPLOADS . '/' . $r['foto']);
            }
            $r['foto'] = $nueva_foto;
        }
        $slug = bm_slug($r['titulo']);
        $st = $db->prepare('SELECT COUNT(*) FROM recetas WHERE slug = ? AND id != ?');
        $st->execute([$slug, $id]);
        if ($st->fetchColumn() > 0) { $slug .= '-' . substr(bin2hex(random_bytes(2)), 0, 4); }

        if ($id) {
            $db->prepare('UPDATE recetas SET titulo=?, slug=?, categoria=?, descripcion=?, ingredientes=?, pasos=?, consejo=?, tiempo_min=?, comensales=?, dificultad=?, foto=?, destacada=? WHERE id=?')
               ->execute([$r['titulo'], $slug, $r['categoria'], $r['descripcion'], $r['ingredientes'], $r['pasos'], $r['consejo'], $r['tiempo_min'], $r['comensales'], $r['dificultad'], $r['foto'], $r['destacada'], $id]);
        } else {
            $db->prepare('INSERT INTO recetas (titulo, slug, categoria, descripcion, ingredientes, pasos, consejo, tiempo_min, comensales, dificultad, foto, destacada) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')
               ->execute([$r['titulo'], $slug, $r['categoria'], $r['descripcion'], $r['ingredientes'], $r['pasos'], $r['consejo'], $r['tiempo_min'], $r['comensales'], $r['dificultad'], $r['foto'], $r['destacada']]);
        }
        header('Location: admin.php?ok=guardada');
        exit;
    }
}

$titulo_pagina = $id ? 'Editar receta' : 'Nueva receta';
require __DIR__ . '/inc/header.php';
?>

<section class="panel panel-editar">
  <h1><?= $id ? 'Editar receta' : 'Nueva receta' ?></h1>
  <?php if ($error): ?><p class="alerta"><?= e($error) ?></p><?php endif; ?>

  <form method="post" enctype="multipart/form-data" class="formulario">
    <input type="hidden" name="id" value="<?= $id ?>">

    <label>Título del plato
      <input type="text" name="titulo" value="<?= e($r['titulo']) ?>" required placeholder="Ej: Arròs negre amb sepionets">
    </label>

    <div class="fila-doble">
      <label>Categoría
        <select name="categoria">
          <?php foreach (BM_CATEGORIAS as $clave => $nombre): ?>
            <option value="<?= $clave ?>" <?= $r['categoria'] === $clave ? 'selected' : '' ?>><?= e($nombre) ?></option>
          <?php endforeach; ?>
        </select>
      </label>
      <label>Dificultad
        <select name="dificultad">
          <?php foreach (BM_DIFICULTADES as $d): ?>
            <option <?= $r['dificultad'] === $d ? 'selected' : '' ?>><?= e($d) ?></option>
          <?php endforeach; ?>
        </select>
      </label>
    </div>

    <div class="fila-doble">
      <label>Tiempo (minutos)
        <input type="number" name="tiempo_min" min="1" value="<?= (int)$r['tiempo_min'] ?>" inputmode="numeric">
      </label>
      <label>Comensales
        <input type="number" name="comensales" min="1" value="<?= (int)$r['comensales'] ?>" inputmode="numeric">
      </label>
    </div>

    <label>Descripción corta
      <textarea name="descripcion" rows="3" placeholder="Dos o tres frases que abran el apetito…"><?= e($r['descripcion']) ?></textarea>
    </label>

    <label>Ingredientes <small>(uno por línea)</small>
      <textarea name="ingredientes" rows="8" required placeholder="400 g de arroz redondo&#10;600 g de pollo troceado&#10;…"><?= e($r['ingredientes']) ?></textarea>
    </label>

    <label>Elaboración <small>(notas internas del chef — no se muestran en la web)</small>
      <textarea name="pasos" rows="6" placeholder="Apuntes de preparación, solo para ti…"><?= e($r['pasos']) ?></textarea>
    </label>

    <label>El toque del chef <small>(opcional)</small>
      <textarea name="consejo" rows="2" placeholder="Ese truco que marca la diferencia…"><?= e($r['consejo']) ?></textarea>
    </label>

    <label>Foto del plato <small>(JPG, PNG o WebP)</small>
      <input type="file" name="foto" accept="image/jpeg,image/png,image/webp">
    </label>
    <?php if ($r['foto']): ?>
      <p class="foto-actual">Foto actual: <img src="<?= e(bm_foto_url($r)) ?>" alt="Foto actual de la receta"></p>
    <?php endif; ?>

    <label class="casilla">
      <input type="checkbox" name="destacada" <?= $r['destacada'] ? 'checked' : '' ?>>
      Plato de la casa (aparece destacado en portada)
    </label>

    <div class="botonera">
      <button type="submit" class="boton">Guardar receta</button>
      <a class="boton boton-suave" href="admin.php">Cancelar</a>
    </div>
  </form>
</section>

<?php require __DIR__ . '/inc/footer.php'; ?>
