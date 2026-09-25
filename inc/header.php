<?php
require_once __DIR__ . '/lib.php';
$logo = is_file(__DIR__ . '/../assets/img/logo.png') ? 'assets/img/logo.png' : 'assets/img/logo.svg';
$titulo_pagina = $titulo_pagina ?? BM_NOMBRE;
?>
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title><?= e($titulo_pagina) ?> · <?= BM_NOMBRE ?></title>
<meta name="description" content="<?= BM_NOMBRE ?> — recetario de chef privado. <?= BM_LEMA ?>.">
<link rel="icon" type="image/svg+xml" href="assets/img/logo.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/estilo.css">
</head>
<body>
<div class="senyera" aria-hidden="true"></div>
<header class="cabecera">
  <a class="marca" href="index.php">
    <img src="<?= e($logo) ?>" alt="Logo de Bon Mos" class="marca-logo">
    <span class="marca-texto">
      <strong>Bon Mos</strong>
      <em><?= BM_LEMA ?></em>
    </span>
  </a>
  <nav class="nav">
    <a href="index.php">La carta</a>
    <a href="editar.php" class="nav-destino">+ Nueva</a>
    <a href="admin.php">Panel</a>
  </nav>
</header>
<main class="contenido">
