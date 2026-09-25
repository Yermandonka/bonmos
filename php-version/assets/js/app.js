// Bon Mos — interacciones
(function () {
  'use strict';

  // Revelado escalonado de tarjetas al hacer scroll
  var tarjetas = document.querySelectorAll('.tarjeta, .hero-tarjeta, .admin-lista li');
  if ('IntersectionObserver' in window && tarjetas.length) {
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('visible');
          obs.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    tarjetas.forEach(function (t, i) {
      t.classList.add('revelar');
      t.style.setProperty('--retardo', (Math.min(i, 6) * 0.07) + 's');
      obs.observe(t);
    });
  }

  // Confeti breve y contenido (colores de la casa)
  function confeti(x, y) {
    var colores = ['#c06318', '#a33b25', '#d9a441', '#26476b'];
    for (var i = 0; i < 18; i++) {
      var p = document.createElement('span');
      p.className = 'bm-particula';
      p.style.left = x + 'px';
      p.style.top = y + 'px';
      p.style.background = colores[i % colores.length];
      p.style.setProperty('--dx', (Math.random() * 220 - 110) + 'px');
      p.style.setProperty('--dy', (Math.random() * 160 - 30) + 'px');
      p.style.animationDelay = (Math.random() * 0.12) + 's';
      document.body.appendChild(p);
      setTimeout(function (el) { return function () { el.remove(); }; }(p), 1400);
    }
  }

  // Progreso de ingredientes + celebración
  var panelIng = document.querySelector('.panel-ingredientes');
  if (panelIng) {
    var casillas = panelIng.querySelectorAll('input[type="checkbox"]');
    if (casillas.length) {
      var progreso = document.createElement('div');
      progreso.className = 'progreso';
      progreso.innerHTML = '<div class="progreso-texto"><span>En la mesa</span><b>0 / ' + casillas.length + '</b></div>' +
                           '<div class="progreso-barra"><i></i></div>';
      panelIng.querySelector('h2').after(progreso);
      var contador = progreso.querySelector('b');
      var barra = progreso.querySelector('i');
      var celebrado = false;

      panelIng.addEventListener('change', function () {
        var listos = panelIng.querySelectorAll('input:checked').length;
        contador.textContent = listos + ' / ' + casillas.length;
        barra.style.width = (listos / casillas.length * 100) + '%';
        progreso.classList.toggle('completo', listos === casillas.length);

        var brindis = panelIng.querySelector('.brindis');
        if (listos === casillas.length) {
          if (!brindis) {
            brindis = document.createElement('p');
            brindis.className = 'brindis';
            brindis.textContent = 'Tot a punt — a cuinar!';
            panelIng.appendChild(brindis);
          }
          if (!celebrado) {
            celebrado = true;
            var r = progreso.getBoundingClientRect();
            confeti(r.left + r.width / 2, r.top + r.height / 2);
            if (navigator.vibrate) { navigator.vibrate(35); }
          }
        } else if (brindis) {
          brindis.remove();
          celebrado = false;
        }
      });
    }
  }

  // Pasos: tocar para marcar como hecho (no aplica a la lista de servicio)
  document.querySelectorAll('.lista-pasos:not(.lista-servicio) li').forEach(function (li) {
    li.addEventListener('click', function () {
      li.classList.toggle('hecho');
      if (li.classList.contains('hecho') && navigator.vibrate) { navigator.vibrate(15); }
    });
  });

  // Hoja de preview estilo iOS al tocar una receta
  var fondo = null, hoja = null;

  function cerrarHoja() {
    if (!hoja) { return; }
    var f = fondo, h = hoja;
    fondo = hoja = null;
    f.classList.remove('abierta');
    h.classList.remove('abierta');
    document.body.classList.remove('hoja-abierta');
    setTimeout(function () { f.remove(); h.remove(); }, 450);
  }

  function abrirHoja(d, href, origen) {
    cerrarHoja();
    fondo = document.createElement('div');
    fondo.className = 'hoja-fondo';
    fondo.addEventListener('click', cerrarHoja);

    hoja = document.createElement('div');
    hoja.className = 'hoja';
    hoja.setAttribute('role', 'dialog');
    hoja.setAttribute('aria-label', d.titulo);
    hoja.innerHTML =
      '<div class="hoja-asa"></div>' +
      '<div class="hoja-foto"></div>' +
      '<span class="hoja-meta"></span>' +
      '<h2></h2>' +
      '<p class="hoja-desc"></p>' +
      '<p class="hoja-datos"></p>' +
      '<div class="hoja-botones">' +
        '<a class="boton boton-sorpresa" target="_blank" rel="noopener">Reservar</a>' +
        '<a class="boton boton-suave">Ver el plato</a>' +
        '<button type="button" class="boton boton-suave hoja-cerrar" aria-label="Cerrar">✕</button>' +
      '</div>';
    var fotoHoja = hoja.querySelector('.hoja-foto');
    fotoHoja.style.backgroundImage = "url('" + d.foto + "')";
    hoja.querySelector('.hoja-meta').textContent = d.meta;
    hoja.querySelector('h2').textContent = d.titulo;
    hoja.querySelector('.hoja-desc').textContent = d.desc;
    hoja.querySelector('.hoja-datos').textContent = d.datos;
    hoja.querySelector('a.boton-sorpresa').href = d.wa || href;
    hoja.querySelector('a.boton-suave').href = href;
    hoja.querySelector('.hoja-cerrar').addEventListener('click', cerrarHoja);

    document.body.appendChild(fondo);
    document.body.appendChild(hoja);
    document.body.classList.add('hoja-abierta');

    // La foto vuela desde la tarjeta hasta la hoja (elemento compartido)
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var fotoOrigen = origen && origen.querySelector('.tarjeta-foto, .hero-foto');
    if (!reduce && fotoOrigen && fotoOrigen.getBoundingClientRect().height > 0) {
      var a = fotoOrigen.getBoundingClientRect();
      // Medimos dónde acabará la foto con la hoja ya abierta, sin que se vea
      hoja.style.transition = 'none';
      hoja.classList.add('abierta');
      var b = fotoHoja.getBoundingClientRect();
      hoja.classList.remove('abierta');
      void hoja.offsetHeight;
      hoja.style.transition = '';

      fotoHoja.style.visibility = 'hidden';
      var clon = document.createElement('div');
      clon.className = 'vuelo';
      clon.style.backgroundImage = fotoHoja.style.backgroundImage;
      clon.style.cssText += 'left:' + a.left + 'px;top:' + a.top + 'px;width:' + a.width + 'px;height:' + a.height + 'px;border-radius:14px;';
      document.body.appendChild(clon);
      clon.animate([
        { left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px', borderRadius: '14px' },
        { left: b.left + 'px', top: b.top + 'px', width: b.width + 'px', height: b.height + 'px', borderRadius: '16px' }
      ], { duration: 460, easing: 'cubic-bezier(0.32, 0.72, 0, 1)', fill: 'forwards' }).onfinish = function () {
        fotoHoja.style.visibility = '';
        clon.remove();
      };
    }

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        fondo.classList.add('abierta');
        hoja.classList.add('abierta');
      });
    });
    if (navigator.vibrate) { navigator.vibrate(10); }

    // Deslizar hacia abajo para cerrar
    var y0 = null, dy = 0;
    hoja.addEventListener('touchstart', function (ev) {
      if (hoja.scrollTop > 0) { return; }
      y0 = ev.touches[0].clientY;
      dy = 0;
    }, { passive: true });
    hoja.addEventListener('touchmove', function (ev) {
      if (y0 === null) { return; }
      dy = ev.touches[0].clientY - y0;
      if (dy > 0) {
        hoja.classList.add('arrastrando');
        hoja.style.transform = 'translateY(' + dy + 'px)';
      }
    }, { passive: true });
    hoja.addEventListener('touchend', function () {
      if (y0 === null) { return; }
      hoja.classList.remove('arrastrando');
      hoja.style.transform = '';
      if (dy > 90) { cerrarHoja(); }
      y0 = null;
    });
  }

  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') { cerrarHoja(); }
  });

  document.querySelectorAll('a.tarjeta[data-titulo], a.hero-tarjeta[data-titulo]').forEach(function (a) {
    a.addEventListener('click', function (ev) {
      ev.preventDefault();
      abrirHoja(a.dataset, a.href, a);
    });
  });
})();
