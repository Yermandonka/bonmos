// Bon Mos — frontend (carta, plato y panel) sobre /api
(function () {
  'use strict';

  var CFG = window.BM_CONFIG || {};
  var CATS = CFG.categorias || {};
  var app = document.getElementById('app');
  var pagina = document.body.dataset.pagina;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function h(tag, attrs, hijos) {
    var el = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'texto') { el.textContent = attrs[k]; }
      else if (k === 'estilo') { el.style.cssText = attrs[k]; }
      else if (k.indexOf('on') === 0) { el.addEventListener(k.slice(2), attrs[k]); }
      else { el.setAttribute(k, attrs[k]); }
    });
    (hijos || []).forEach(function (x) { if (x) el.appendChild(x); });
    return el;
  }

  function catNombre(c) { return CATS[c] || c; }

  // Ingredientes guardados como texto separado por comas o saltos de línea.
  // Los mostramos como lista, sin cantidades.
  function ingredientesLista(p) {
    return String(p.ingredientes || '')
      .split(/[,\n;]+/)
      .map(function (x) { return x.trim(); })
      .filter(Boolean);
  }

  function ulIngredientes(p, clase) {
    var items = ingredientesLista(p);
    if (!items.length) { return null; }
    return h('ul', { class: 'lista-ingredientes lista-mercado ' + (clase || '') },
      items.map(function (ing) { return h('li', {}, [h('span', { texto: ing })]); }));
  }

  // Enlace de WhatsApp sin mensaje pre-escrito: al pulsar se abre la
  // conversación con el chef, pero sin dejar nada redactado en la bandeja.
  function wa() {
    return 'https://wa.me/' + CFG.whatsapp;
  }

  // Número de WhatsApp en bonito para mostrarlo (sin el prefijo de país)
  function waMostrar() {
    var n = String(CFG.whatsapp || '').replace(/\D/g, '');
    if (n.indexOf('34') === 0 && n.length === 11) { n = n.slice(2); }
    return n.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
  }

  function aplicarLogo(d) {
    var url = (d.ajustes && d.ajustes.logo) || '';
    if (!url) { return; }
    [].forEach.call(document.querySelectorAll('.marca-logo'), function (i) { i.src = url; });
    var fav = document.querySelector('link[rel="icon"]');
    if (fav) { fav.href = url; }
  }

  var cachePlatos = null;
  function cargarPlatos() {
    if (cachePlatos) { return Promise.resolve(cachePlatos); }
    return fetch('/api/platos').then(function (r) { return r.json(); }).then(function (d) {
      cachePlatos = d;
      return d;
    });
  }

  // ---------- Interacciones compartidas ----------

  function revelar(nodos) {
    if (!('IntersectionObserver' in window)) { return; }
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('visible'); obs.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    nodos.forEach(function (t, i) {
      t.classList.add('revelar');
      t.style.setProperty('--retardo', (Math.min(i, 6) * 0.07) + 's');
      obs.observe(t);
    });
  }

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

  // ---------- Hoja de preview (estilo iOS, con vuelo de la foto) ----------

  var fondo = null, hoja = null;

  function cerrarHoja() {
    if (!hoja) { return; }
    var f = fondo, ho = hoja;
    fondo = hoja = null;
    f.classList.remove('abierta');
    ho.classList.remove('abierta');
    document.body.classList.remove('hoja-abierta');
    setTimeout(function () { f.remove(); ho.remove(); }, 450);
  }

  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') { cerrarHoja(); } });

  function abrirHoja(p, origen) {
    cerrarHoja();
    var href = '/plato/' + p.slug;
    fondo = h('div', { class: 'hoja-fondo', onclick: cerrarHoja });
    var fotoHoja = h('div', { class: 'hoja-foto', estilo: "background-image:url('" + p.foto + "')" });
    var ingr = ulIngredientes(p, 'hoja-ingredientes');
    hoja = h('div', { class: 'hoja', role: 'dialog', 'aria-label': p.titulo }, [
      h('div', { class: 'hoja-asa' }),
      fotoHoja,
      h('span', { class: 'hoja-meta', texto: catNombre(p.categoria) }),
      h('h2', { texto: p.titulo }),
      ingr ? h('span', { class: 'hoja-etiqueta', texto: 'Ingredientes' }) : null,
      ingr,
      h('div', { class: 'hoja-botones' }, [
        h('a', { class: 'boton boton-sorpresa', href: wa(), target: '_blank', rel: 'noopener', texto: 'Reservar' }),
        h('a', { class: 'boton boton-suave', href: href, texto: 'Ver el plato' }),
        h('button', { type: 'button', class: 'boton boton-suave hoja-cerrar', 'aria-label': 'Cerrar', texto: '✕', onclick: cerrarHoja }),
      ]),
    ]);
    document.body.appendChild(fondo);
    document.body.appendChild(hoja);
    document.body.classList.add('hoja-abierta');

    var fotoOrigen = origen && origen.querySelector('.tarjeta-foto');
    if (!reduce && fotoOrigen && fotoOrigen.getBoundingClientRect().height > 0) {
      var a = fotoOrigen.getBoundingClientRect();
      hoja.style.transition = 'none';
      hoja.classList.add('abierta');
      var b = fotoHoja.getBoundingClientRect();
      hoja.classList.remove('abierta');
      void hoja.offsetHeight;
      hoja.style.transition = '';

      fotoHoja.style.visibility = 'hidden';
      var clon = h('div', { class: 'vuelo', estilo: fotoHoja.style.cssText.replace('visibility: hidden;', '') +
        'left:' + a.left + 'px;top:' + a.top + 'px;width:' + a.width + 'px;height:' + a.height + 'px;border-radius:14px;' });
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

    var y0 = null, dy = 0;
    hoja.addEventListener('touchstart', function (ev) {
      if (hoja.scrollTop > 0) { return; }
      y0 = ev.touches[0].clientY; dy = 0;
    }, { passive: true });
    hoja.addEventListener('touchmove', function (ev) {
      if (y0 === null) { return; }
      dy = ev.touches[0].clientY - y0;
      if (dy > 0) { hoja.classList.add('arrastrando'); hoja.style.transform = 'translateY(' + dy + 'px)'; }
    }, { passive: true });
    hoja.addEventListener('touchend', function () {
      if (y0 === null) { return; }
      hoja.classList.remove('arrastrando');
      hoja.style.transform = '';
      if (dy > 90) { cerrarHoja(); }
      y0 = null;
    });
  }

  // ---------- La carta ----------

  // Tarjeta de la carta: solo foto y nombre. Al pulsar se abre la hoja con los ingredientes.
  function tarjeta(p) {
    var t = h('a', { class: 'tarjeta tarjeta-plato', href: '/plato/' + p.slug }, [
      h('div', { class: 'tarjeta-foto', estilo: "background-image:url('" + p.foto + "')" }),
      h('div', { class: 'tarjeta-cuerpo' }, [
        h('h2', { texto: p.titulo }),
      ]),
    ]);
    t.addEventListener('click', function (ev) { ev.preventDefault(); abrirHoja(p, t); });
    return t;
  }

  // Un chorro de confeti dopamínico desde un punto
  function fiesta(x, y) {
    if (reduce) { return; }
    confeti(x, y);
    confeti(x, y);
    if (navigator.vibrate) { navigator.vibrate([12, 30, 18]); }
  }

  // Inicio: portada a pantalla completa (slogan + contacto + flecha),
  // y debajo la rejilla de platos.
  function renderInicio(d) {
    var platos = d.platos;
    app.textContent = '';

    var flecha = h('a', { class: 'portada-flecha', href: '#inicio-mas', 'aria-label': 'Ver los platos' });
    flecha.innerHTML = '<svg viewBox="0 0 32 20" width="34" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4l13 12L29 4"/></svg>';
    var portada = h('section', { class: 'portada' });
    // Foto o vídeo de portada: lo que haya puesto el chef en su perfil, o la foto por defecto.
    var aj = d.ajustes || {};
    if (aj.portadaTipo === 'video' && aj.portada) {
      var vid = h('video', { class: 'portada-video', src: aj.portada, loop: '', playsinline: '', 'aria-hidden': 'true', preload: 'auto' });
      vid.muted = true; vid.autoplay = true; vid.setAttribute('muted', ''); vid.setAttribute('autoplay', '');
      portada.appendChild(vid);
      var intento = vid.play(); if (intento && intento.catch) { intento.catch(function () {}); }
    } else {
      portada.style.backgroundImage = "url('" + (aj.portada || '/assets/img/chef.webp') + "')";
    }
    portada.appendChild(h('div', { class: 'portada-contenido' }, [
      h('span', { class: 'portada-eyebrow', texto: 'Chef privado a domicilio' }),
      h('h1', { class: 'portada-slogan', texto: 'Tú eliges lo que quieres comer. Nosotros nos encargamos del resto.' }),
      h('a', { class: 'boton boton-sorpresa portada-boton', href: '/contacto', texto: 'Contáctanos' }),
    ]));
    portada.appendChild(flecha);
    // La foto no cambia de tamaño al scrollear en móvil: fijamos su altura en
    // píxeles al cargar (no reacciona al mostrar/ocultar la barra del navegador).
    var anchoPrevio = window.innerWidth;
    function fijarAltura() { portada.style.height = window.innerHeight + 'px'; }
    fijarAltura();
    window.addEventListener('resize', function () {
      // Solo re-ajusta en cambios reales de ancho (rotación / redimensionar
      // ventana), no cuando el móvil solo cambia el alto al scrollear.
      if (window.innerWidth !== anchoPrevio) { anchoPrevio = window.innerWidth; fijarAltura(); }
    });
    window.addEventListener('orientationchange', function () {
      setTimeout(function () { anchoPrevio = window.innerWidth; fijarAltura(); }, 120);
    });

    // Flecha dopamínica: confeti, vibración, latido y bajada suave.
    flecha.addEventListener('click', function (ev) {
      ev.preventDefault();
      var r = flecha.getBoundingClientRect();
      fiesta(r.left + r.width / 2, r.top + r.height / 2);
      flecha.classList.remove('late');
      void flecha.offsetWidth;
      flecha.classList.add('late');
      setTimeout(function () { flecha.classList.remove('late'); }, 650);
      var destino = document.getElementById('inicio-mas');
      if (destino) { destino.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }
    });
    app.appendChild(portada);

    var mas = h('section', { id: 'inicio-mas', class: 'inicio-mas' });

    // ¿Cómo funciona? — tarjeta con los pasos del servicio
    var pasos = [
      'Eliges qué te apetece comer durante la semana.',
      'Te enviamos la lista de la compra, o la hacemos nosotros.',
      'Cocinamos en tu casa.',
      'Te dejamos la cocina limpia y organizada.',
      'Tuppers listos para comer.',
    ];
    // ¿Cómo funciona? (recuadro marrón): pasos + una frase + botón centrado
    var comoFunciona = h('section', { class: 'comofunciona' }, [
      h('h2', { class: 'comofunciona-titulo', texto: '¿Cómo funciona?' }),
      h('ol', { class: 'pasos-pildora' }, pasos.map(function (txt, i) {
        return h('li', { class: 'paso-pildora' }, [
          h('span', { class: 'paso-num', texto: String(i + 1) }),
          h('span', { texto: txt }),
        ]);
      })),
      h('p', { class: 'comofunciona-frase', texto: 'Tú eliges. Nosotros cocinamos. Tú calientas.' }),
      h('a', { class: 'boton boton-sorpresa opciones-boton', href: wa(), target: '_blank', rel: 'noopener', texto: 'Reservar por WhatsApp' }),
    ]);
    mas.appendChild(comoFunciona);

    // Platos
    mas.appendChild(h('header', { class: 'receta-cabecera' }, [
      h('span', { class: 'sobre-titulo', texto: 'Bon Mos' }),
      h('h2', { class: 'inicio-titulo', texto: 'Platos que cocino para ti' }),
    ]));
    mas.appendChild(h('div', { class: 'cenefa', 'aria-hidden': 'true' }));
    var rejilla = h('section', { class: 'rejilla' });
    platos.forEach(function (p) { rejilla.appendChild(tarjeta(p)); });
    mas.appendChild(rejilla);
    mas.appendChild(h('p', { class: 'inicio-cta' }, [
      h('a', { class: 'boton boton-sorpresa', href: '/carta', texto: 'Ver la carta completa' }),
    ]));
    app.appendChild(mas);
    // Entrada en cascada de todo lo del recuadro marrón: título, píldoras,
    // opciones y botón; y luego las tarjetas de platos.
    revelar([comoFunciona.querySelector('.comofunciona-titulo')]
      .concat([].slice.call(comoFunciona.querySelectorAll('.paso-pildora')))
      .concat([comoFunciona.querySelector('.comofunciona-frase'), comoFunciona.querySelector('.opciones-boton')]));
    revelar([].slice.call(rejilla.children));
  }

  // La carta: filtros de categoría arriba del todo, y las tarjetas de los platos
  function renderCarta(d) {
    var platos = d.platos;
    var cat = '';
    app.textContent = '';

    app.appendChild(h('header', { class: 'receta-cabecera carta-cabecera' }, [
      h('span', { class: 'sobre-titulo', texto: 'Bon Mos' }),
      h('h1', { texto: 'Nuestra carta' }),
    ]));
    app.appendChild(h('div', { class: 'cenefa', 'aria-hidden': 'true' }));

    var rejilla = h('section', { class: 'rejilla' });

    function pinta() {
      rejilla.textContent = '';
      var lista = platos.filter(function (p) {
        return !cat || p.categoria === cat;
      });
      if (!lista.length) {
        rejilla.appendChild(h('p', { class: 'vacio', texto: 'No hay platos en esta categoría todavía.' }));
      }
      lista.forEach(function (p) { rejilla.appendChild(tarjeta(p)); });
      revelar([].slice.call(rejilla.children));
    }

    var filtros = h('nav', { class: 'filtros filtros-carta', 'aria-label': 'Categorías' });
    function botonFiltro(clave, nombre) {
      var b = h('a', { class: 'filtro' + (cat === clave ? ' activo' : ''), href: '#', texto: nombre });
      b.addEventListener('click', function (ev) {
        ev.preventDefault();
        cat = clave;
        [].forEach.call(filtros.children, function (x) { x.classList.remove('activo'); });
        b.classList.add('activo');
        pinta();
      });
      return b;
    }
    Object.keys(CATS).forEach(function (c) { filtros.appendChild(botonFiltro(c, CATS[c])); });
    filtros.appendChild(botonFiltro('', 'Todos'));
    app.appendChild(filtros);
    app.appendChild(h('div', { class: 'cenefa', 'aria-hidden': 'true' }));
    app.appendChild(rejilla);
    pinta();
  }

  // ---------- Ficha del plato ----------

  function renderPlato(d) {
    var slug = decodeURIComponent(location.pathname.split('/').pop() || '');
    var p = d.platos.find(function (x) { return x.slug === slug; });
    app.textContent = '';
    if (!p) {
      app.appendChild(h('p', { class: 'vacio' }, [
        document.createTextNode('Ese plato no está en la carta. '),
        h('a', { href: '/carta', texto: 'Volver a la carta' }),
      ]));
      return;
    }
    document.title = p.titulo + ' · ' + (CFG.nombre || 'Bon Mos');
    var enlaceWa = wa();

    app.appendChild(h('article', { class: 'receta' }, [
      h('div', { class: 'receta-foto', estilo: "background-image:url('" + p.foto + "')" }),
      h('header', { class: 'receta-cabecera' }, [
        h('span', { class: 'sobre-titulo', texto: catNombre(p.categoria) }),
        h('h1', { texto: p.titulo }),
        h('p', { class: 'receta-descripcion prosa', texto: p.descripcion }),
        h('p', { class: 'reserva-principal' }, [
          h('a', { class: 'boton boton-sorpresa', href: enlaceWa, target: '_blank', rel: 'noopener', texto: 'Reservar este plato' }),
        ]),
      ]),
      ulIngredientes(p) ? h('section', { class: 'panel panel-ingredientes panel-servicio' }, [
        h('h2', { texto: 'Ingredientes' }),
        ulIngredientes(p),
      ]) : null,
      h('p', { class: 'volver' }, [h('a', { href: '/carta', texto: 'Volver a la carta' })]),
    ]));
  }

  // ---------- Panel del chef ----------

  // Comprime un vídeo en el propio navegador (sin subir el original pesado):
  // lo reescala (máx. 1280px de ancho), lo re-codifica a WebM y descarta el
  // audio (la portada va en bucle y en silencio). Devuelve un Blob webm.
  function comprimirVideo(archivo, onProgreso) {
    return new Promise(function (resolve, reject) {
      if (!('MediaRecorder' in window) || !HTMLCanvasElement.prototype.captureStream) {
        reject(new Error('sin soporte de compresión'));
        return;
      }
      var w1 = null, w2 = null, limpio = false;
      var video = document.createElement('video');
      video.muted = true; video.defaultMuted = true; video.volume = 0;
      video.playsInline = true;
      video.setAttribute('muted', ''); video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', ''); video.setAttribute('autoplay', '');
      // iOS NO reproduce un <video> fuera del DOM: lo dejamos presente pero oculto.
      video.style.cssText = 'position:fixed;left:0;top:0;width:2px;height:2px;opacity:0.01;pointer-events:none;z-index:-1;';
      video.src = URL.createObjectURL(archivo);

      function limpiar() {
        if (limpio) { return; } limpio = true;
        if (w1) { clearTimeout(w1); } if (w2) { clearTimeout(w2); }
        try { URL.revokeObjectURL(video.src); } catch (e) {}
        if (video.parentNode) { video.parentNode.removeChild(video); }
      }
      function fallar(msg) { limpiar(); reject(new Error(msg || 'compresión fallida')); }

      document.body.appendChild(video);
      video.onerror = function () { fallar('No se pudo leer el vídeo.'); };

      video.onloadedmetadata = function () {
        var MAXW = 1280, MAXDUR = 20;
        var escala = Math.min(1, MAXW / (video.videoWidth || MAXW));
        var w = Math.round((video.videoWidth || MAXW) * escala);
        var hh = Math.round((video.videoHeight || 720) * escala);
        w -= w % 2; hh -= hh % 2; if (w < 2) { w = 2; } if (hh < 2) { hh = 2; }
        var canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = hh;
        var ctx = canvas.getContext('2d');
        var stream = canvas.captureStream(30);
        // Mejor códec disponible: MP4/H.264 (iPhone/Safari, reproducible en todos
        // los navegadores) y, si no, WebM (Zen/Chrome/Firefox).
        var candidatos = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
        var mime = '';
        for (var ci = 0; ci < candidatos.length; ci++) {
          if (MediaRecorder.isTypeSupported(candidatos[ci])) { mime = candidatos[ci]; break; }
        }
        if (!mime) { fallar('sin códec compatible'); return; }
        var mimeBase = mime.split(';')[0];
        var rec;
        try { rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 2500000 }); }
        catch (e) { fallar('MediaRecorder: ' + e.message); return; }
        var trozos = [], acabado = false, dibujando = true;
        rec.ondataavailable = function (e) { if (e.data && e.data.size) { trozos.push(e.data); } };
        rec.onstop = function () {
          limpiar();
          if (!trozos.length) { reject(new Error('sin datos de vídeo')); return; }
          resolve({ blob: new Blob(trozos, { type: mimeBase }), mime: mimeBase });
        };
        function pinta() {
          if (!dibujando) { return; }
          try { ctx.drawImage(video, 0, 0, w, hh); } catch (e) {}
          var dur = Math.min(video.duration || MAXDUR, MAXDUR);
          if (onProgreso && dur) { onProgreso(Math.min(1, (video.currentTime || 0) / dur)); }
          requestAnimationFrame(pinta);
        }
        function terminar() {
          if (acabado) { return; } acabado = true; dibujando = false;
          try { rec.stop(); } catch (e) { fallar('no se pudo cerrar la grabación'); }
        }
        video.onended = terminar;
        video.ontimeupdate = function () { if (video.currentTime >= MAXDUR) { try { video.pause(); } catch (e) {} terminar(); } };
        // Arrancamos la grabación cuando el vídeo EMPIEZA a reproducir de verdad
        // (clave en iOS: así hay fotogramas que capturar).
        video.onplaying = function () {
          if (rec.state === 'inactive') {
            try { rec.start(200); } catch (e) { fallar('MediaRecorder start: ' + e.message); return; }
          }
          pinta();
        };
        var pr = video.play();
        if (pr && pr.catch) { pr.catch(function () {}); }
        // Watchdog: si en 6 s el vídeo no ha avanzado (iOS atascado), abortamos
        // para subir el original en vez de quedarnos colgados.
        w1 = setTimeout(function () {
          if (!acabado && (video.currentTime || 0) < 0.05) { fallar('el vídeo no avanza'); }
        }, 6000);
        w2 = setTimeout(function () { if (!acabado) { terminar(); } }, 150000);
      };
    });
  }

  function clave() { return sessionStorage.getItem('bm_clave') || ''; }

  function llamarApi(metodo, url, cuerpo, tipo) {
    var cab = { 'x-clave': clave() };
    if (tipo) { cab['content-type'] = tipo; }
    return fetch(url, { method: metodo, headers: cab, body: cuerpo }).then(function (r) {
      return r.json().then(function (j) {
        if (r.status === 401) {
          sessionStorage.removeItem('bm_clave');
          location.href = '/panel';
          return new Promise(function () {});
        }
        if (!r.ok) { throw new Error(j.error || ('Error ' + r.status)); }
        return j;
      });
    });
  }

  // Puerta del panel: solo se entra con la clave del chef
  function renderAcceso(d, mensaje) {
    app.textContent = '';
    var fClave = h('input', { type: 'password', required: '', autocomplete: 'current-password', 'aria-label': 'Clave del chef' });
    var form = h('form', { class: 'formulario', onsubmit: function (ev) {
      ev.preventDefault();
      var boton = form.querySelector('button');
      boton.disabled = true;
      fetch('/api/clave', { method: 'POST', headers: { 'x-clave': fClave.value } }).then(function (r) {
        return r.json().then(function (j) {
          if (r.ok) {
            sessionStorage.setItem('bm_clave', fClave.value);
            renderPanel(d);
          } else {
            renderAcceso(d, j.error || 'No ha podido ser.');
          }
        });
      }).catch(function () { renderAcceso(d, 'No hay conexión con la cocina. Prueba de nuevo.'); });
    } }, [
      h('label', {}, [document.createTextNode('Clave'), fClave]),
      h('button', { type: 'submit', class: 'boton', texto: 'Entrar a la cocina' }),
    ]);
    app.appendChild(h('section', { class: 'panel panel-acceso' }, [
      h('h1', { texto: 'Acceso del chef' }),
      h('p', { class: 'panel-nota', texto: 'Zona privada para cuidar la carta.' }),
      mensaje ? h('p', { class: 'alerta', texto: mensaje }) : null,
      form,
    ]));
    fClave.focus();
  }

  function entrarPanel(d) {
    if (!clave()) { return renderAcceso(d); }
    fetch('/api/clave', { method: 'POST', headers: { 'x-clave': clave() } }).then(function (r) {
      if (r.ok) { renderPanel(d); }
      else {
        sessionStorage.removeItem('bm_clave');
        r.json().then(function (j) { renderAcceso(d, r.status === 503 ? j.error : ''); });
      }
    }).catch(function () { renderAcceso(d, 'No hay conexión con la cocina.'); });
  }

  function renderPanel(d) {
    app.textContent = '';
    var platos = d.platos;

    var aviso = h('p', { class: 'exito', estilo: 'display:none' });
    function avisa(texto, esError) {
      aviso.textContent = texto;
      aviso.className = esError ? 'alerta' : 'exito';
      aviso.style.display = '';
      if (!esError) { setTimeout(function () { aviso.style.display = 'none'; }, 4000); }
    }

    var seccion = h('section', { class: 'panel-admin' });
    seccion.appendChild(h('header', { class: 'admin-cabecera' }, [
      h('h1', { texto: 'Panel del chef' }),
      h('div', { class: 'admin-acciones' }, [
        h('a', { class: 'boton', href: '#', texto: '+ Nuevo plato', onclick: function (ev) { ev.preventDefault(); abreFormulario(null); } }),
      ]),
    ]));
    if (d.demo) {
      seccion.appendChild(h('p', { class: 'alerta', texto: 'Modo demostración: la carta es de ejemplo. Para publicar de verdad, crea un Blob store en la pestaña Storage del proyecto en Vercel.' }));
    }
    seccion.appendChild(aviso);

    // Perfil del cocinero: logo editable
    var logoActual = (d.ajustes && d.ajustes.logo) || '/assets/img/logo.webp';
    var vistaLogo = h('img', { class: 'perfil-logo', src: logoActual, alt: 'Logo actual' });
    var fLogo = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp', 'aria-label': 'Nuevo logo' });
    function guardarLogo(url) {
      return llamarApi('POST', '/api/ajustes', JSON.stringify({ logo: url }), 'application/json').then(function (j) {
        cachePlatos = null;
        var nuevo = j.logo || '/assets/img/logo.webp';
        vistaLogo.src = nuevo;
        aplicarLogo({ ajustes: { logo: j.logo } });
        if (!j.logo) {
          [].forEach.call(document.querySelectorAll('.marca-logo'), function (i) { i.src = nuevo; });
        }
        avisa('Logo actualizado.');
      }).catch(function (e) { avisa(e.message, true); });
    }
    fLogo.addEventListener('change', function () {
      var archivo = fLogo.files[0];
      if (!archivo) { return; }
      llamarApi('POST', '/api/foto', archivo, archivo.type)
        .then(function (j) { return guardarLogo(j.url); })
        .catch(function (e) { avisa(e.message, true); })
        .finally(function () { fLogo.value = ''; });
    });
    seccion.appendChild(h('section', { class: 'panel perfil-chef' }, [
      vistaLogo,
      h('div', { class: 'perfil-campos' }, [
        h('strong', { texto: 'Perfil del cocinero' }),
        h('label', { class: 'perfil-subir' }, [
          document.createTextNode('Cambiar el logo '),
          h('small', { texto: '(cuadrado, se muestra en círculo)' }),
          fLogo,
        ]),
        (d.ajustes && d.ajustes.logo) ? h('a', { href: '#', class: 'perfil-restaurar', texto: 'Restaurar el original', onclick: function (ev) {
          ev.preventDefault();
          guardarLogo('');
        } }) : null,
      ]),
    ]));

    // Portada del inicio: foto o vídeo editable
    var vistaPortada = h('div', { class: 'perfil-portada-vista' });
    function pintaVistaPortada(url, tipo) {
      vistaPortada.textContent = '';
      if (tipo === 'video' && url) {
        var v = h('video', { src: url, loop: '', playsinline: '' });
        v.muted = true; v.autoplay = true; v.setAttribute('muted', ''); v.setAttribute('autoplay', '');
        vistaPortada.appendChild(v);
        var pp = v.play(); if (pp && pp.catch) { pp.catch(function () {}); }
      } else {
        vistaPortada.appendChild(h('div', { class: 'perfil-portada-img', estilo: "background-image:url('" + (url || '/assets/img/chef.webp') + "')" }));
      }
    }
    pintaVistaPortada((d.ajustes && d.ajustes.portada) || '', (d.ajustes && d.ajustes.portadaTipo) || '');

    var fPortada = h('input', { type: 'file', accept: 'image/*,video/*', 'aria-label': 'Nueva portada' });
    var estadoPortada = h('small', { class: 'perfil-estado', estilo: 'display:none' });
    function estadoPort(txt) {
      estadoPortada.textContent = txt || '';
      estadoPortada.style.display = txt ? '' : 'none';
    }
    function guardarPortada(url, tipo) {
      return llamarApi('POST', '/api/ajustes', JSON.stringify({ portada: url, portadaTipo: tipo }), 'application/json').then(function (j) {
        cachePlatos = null;
        pintaVistaPortada(j.portada, j.portadaTipo);
        avisa(j.portada ? 'Portada actualizada.' : 'Portada restaurada a la foto por defecto.');
      }).catch(function (e) { avisa(e.message, true); });
    }
    fPortada.addEventListener('change', function () {
      var archivo = fPortada.files[0];
      if (!archivo) { return; }
      // iOS a veces no rellena el tipo del .mov: detectamos también por extensión.
      var nombre = archivo.name || '';
      var esVideo = /^video\//.test(archivo.type) || /\.(mov|mp4|m4v|webm|ogv|mkv|qt)$/i.test(nombre);
      var mimeOriginal = archivo.type || (/\.mov$|\.qt$/i.test(nombre) ? 'video/quicktime' : 'video/mp4');
      function subir(blob, mime) {
        estadoPort('Subiendo…');
        return llamarApi('POST', '/api/foto', blob, mime).then(function (j) { return guardarPortada(j.url, j.tipo); });
      }
      var preparar;
      if (esVideo) {
        estadoPort('Comprimiendo el vídeo… 0%');
        preparar = comprimirVideo(archivo, function (p) { estadoPort('Comprimiendo el vídeo… ' + Math.round(p * 100) + '%'); })
          .catch(function () { estadoPort('Subiendo el vídeo original…'); return { blob: archivo, mime: mimeOriginal }; });
      } else {
        preparar = Promise.resolve({ blob: archivo, mime: archivo.type });
      }
      preparar
        .then(function (r) { return subir(r.blob, r.mime); })
        .catch(function (e) { avisa(e.message, true); })
        .then(function () { fPortada.value = ''; estadoPort(''); });
    });
    seccion.appendChild(h('section', { class: 'panel perfil-chef perfil-portada' }, [
      vistaPortada,
      h('div', { class: 'perfil-campos' }, [
        h('strong', { texto: 'Portada del inicio' }),
        h('label', { class: 'perfil-subir' }, [
          document.createTextNode('Cambiar foto o vídeo '),
          h('small', { texto: '(foto o vídeo, también .mov del iPhone; el vídeo se comprime solo, máx. 20 s)' }),
          fPortada,
        ]),
        estadoPortada,
        (d.ajustes && d.ajustes.portada) ? h('a', { href: '#', class: 'perfil-restaurar', texto: 'Quitar y usar la foto por defecto', onclick: function (ev) {
          ev.preventDefault();
          guardarPortada('', '');
        } }) : null,
      ]),
    ]));

    var listaEl = h('ul', { class: 'admin-lista' });
    platos.forEach(function (p) {
      listaEl.appendChild(h('li', {}, [
        h('div', { class: 'admin-item-info' }, [
          h('strong', { texto: p.titulo }),
          h('span', { texto: catNombre(p.categoria) }),
        ]),
        h('div', { class: 'admin-item-botones' }, [
          h('a', { class: 'boton boton-suave', href: '/plato/' + p.slug, texto: 'Ver' }),
          h('a', { class: 'boton boton-suave', href: '#', texto: 'Editar', onclick: function (ev) { ev.preventDefault(); abreFormulario(p); } }),
          h('button', { type: 'button', class: 'boton boton-peligro', texto: 'Borrar', onclick: function () {
            if (!confirm('¿Borrar «' + p.titulo + '» de la carta?')) { return; }
            llamarApi('DELETE', '/api/platos?id=' + p.id).then(function (j) {
              cachePlatos = { platos: j.platos || [], demo: false, ajustes: j.ajustes || (cachePlatos && cachePlatos.ajustes) || {} };
              renderPanel(cachePlatos);
              avisa('Plato borrado de la carta.');
            }).catch(function (e) { avisa(e.message, true); });
          } }),
        ]),
      ]));
    });
    seccion.appendChild(listaEl);
    app.appendChild(seccion);

    function campo(etiqueta, nodo, nota) {
      var l = h('label', {}, [document.createTextNode(etiqueta + ' ')]);
      if (nota) { l.appendChild(h('small', { texto: '(' + nota + ')' })); }
      l.appendChild(nodo);
      return l;
    }

    function abreFormulario(p) {
      p = p || { titulo: '', categoria: 'carnes', descripcion: '', ingredientes: '', foto: '', id: 0 };
      var viejo = app.querySelector('.panel-editar');
      if (viejo) { viejo.remove(); }

      var fTitulo = h('input', { type: 'text', value: p.titulo, required: '', placeholder: 'Ej: Arròs negre amb sepionets' });
      var fCategoria = h('select', {}, Object.keys(CATS).map(function (c) {
        var o = h('option', { value: c, texto: CATS[c] });
        if (p.categoria === c) { o.selected = true; }
        return o;
      }));
      var fIngredientes = h('textarea', { rows: '3', placeholder: 'Pimiento rojo asado, bacalao, ajo, aceite de oliva…', texto: p.ingredientes });
      var fDesc = h('textarea', { rows: '3', placeholder: 'Dos o tres frases que abran el apetito…', texto: p.descripcion });
      var fFoto = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp' });

      var form = h('form', { class: 'formulario', onsubmit: function (ev) {
        ev.preventDefault();
        var boton = form.querySelector('button[type=submit]');
        boton.disabled = true;
        var listo = Promise.resolve(p.foto);
        var archivo = fFoto.files[0];
        if (archivo) {
          listo = llamarApi('POST', '/api/foto', archivo, archivo.type).then(function (j) { return j.url; });
        }
        listo.then(function (urlFoto) {
          return llamarApi('POST', '/api/platos', JSON.stringify({
            id: p.id, titulo: fTitulo.value, categoria: fCategoria.value, descripcion: fDesc.value,
            ingredientes: fIngredientes.value, foto: urlFoto,
          }), 'application/json');
        }).then(function (j) {
          var r = boton.getBoundingClientRect();
          confeti(r.left + r.width / 2, r.top);
          cachePlatos = { platos: j.platos || [], demo: false, ajustes: j.ajustes || (cachePlatos && cachePlatos.ajustes) || {} };
          renderPanel(cachePlatos);
          avisa('Plato guardado. Bon profit!');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }).catch(function (e) {
          boton.disabled = false;
          avisa(e.message, true);
        });
      } }, [
        campo('Nombre del plato', fTitulo),
        h('div', { class: 'fila-doble' }, [campo('Categoría', fCategoria), campo('Foto del plato', fFoto, 'JPG, PNG o WebP')]),
        campo('Ingredientes', fIngredientes, 'sin cantidades, separados por comas'),
        campo('Descripción apetitosa', fDesc),
        h('div', { class: 'botonera' }, [
          h('button', { type: 'submit', class: 'boton', texto: 'Guardar plato' }),
          h('a', { class: 'boton boton-suave', href: '#', texto: 'Cancelar', onclick: function (ev) { ev.preventDefault(); form.parentElement.remove(); } }),
        ]),
      ]);

      var caja = h('section', { class: 'panel panel-editar' }, [
        h('h1', { texto: p.id ? 'Editar plato' : 'Nuevo plato' }),
        form,
      ]);
      seccion.before(caja);
      caja.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // ---------- Contacto ----------

  function svgIcono(tipo) {
    var cont = h('span', { class: 'contacto-icono', 'aria-hidden': 'true' });
    if (tipo === 'whatsapp') {
      cont.innerHTML = '<svg viewBox="0 0 32 32" width="26" height="26" fill="currentColor"><path d="M16 3C9.4 3 4 8.4 4 15c0 2.1.6 4.2 1.6 6L4 27l6.2-1.6c1.7.9 3.7 1.4 5.8 1.4 6.6 0 12-5.4 12-12S22.6 3 16 3zm0 21.8c-1.8 0-3.6-.5-5.1-1.4l-.4-.2-3.7.9.9-3.6-.2-.4c-1-1.6-1.5-3.4-1.5-5.1C5.9 9.5 10.4 5 16 5s10.1 4.5 10.1 10S21.6 24.8 16 24.8zm5.6-7.5c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.1-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.5-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.2-.2.2-.3.3-.5.1-.2.1-.4 0-.5-.1-.2-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.3-.6-.4z"/></svg>';
    } else {
      cont.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/><path d="M3.5 6l8.5 6 8.5-6"/></svg>';
    }
    return cont;
  }

  function renderContacto() {
    app.textContent = '';

    var tarjeta = h('section', { class: 'contacto-tarjeta' }, [
      h('div', { class: 'contacto-foto', estilo: "background-image:url('/assets/img/chef.webp')", role: 'img', 'aria-label': 'El chef de Bon Mos' }),
      h('div', { class: 'contacto-cuerpo' }, [
        h('span', { class: 'contacto-eyebrow', texto: 'Contacto' }),
        h('h1', { class: 'contacto-titulo', texto: '¿Tienes alguna duda o quieres hacer un pedido?' }),
        h('p', { class: 'prosa contacto-sub', texto: 'Estoy a tu disposición. Escríbeme o llámame y te ayudaré en todo lo que necesites.' }),
        h('a', { class: 'contacto-pildora contacto-wa', href: wa(), target: '_blank', rel: 'noopener' }, [
          svgIcono('whatsapp'),
          h('span', { class: 'contacto-dato', texto: waMostrar() }),
        ]),
        h('a', { class: 'contacto-pildora contacto-mail', href: 'mailto:' + CFG.email }, [
          svgIcono('mail'),
          h('span', { class: 'contacto-dato', texto: CFG.email }),
        ]),
        h('div', { class: 'contacto-cierre', 'aria-hidden': 'true' }, [
          h('span', { class: 'contacto-filete' }),
          h('span', { class: 'contacto-hoja' }),
          h('span', { class: 'contacto-filete' }),
        ]),
      ]),
    ]);
    app.appendChild(tarjeta);
    revelar([tarjeta]);
  }

  // ---------- Eventos ----------

  var ICONOS_EVENTO = {
    paella: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="24" cy="26" r="13"/><circle cx="24" cy="26" r="6"/><path d="M8 26H3M40 26h5"/><path d="M24 13V8"/></svg>',
    cena: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M24 40c7-9 10-15 10-21a10 10 0 0 0-20 0c0 6 3 12 10 21z"/><path d="M24 25a6 6 0 0 0 6-6"/></svg>',
    grupo: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="18" r="6"/><circle cx="33" cy="20" r="5"/><path d="M8 38c0-6 4.5-10 10-10s10 4 10 10"/><path d="M30 29c5 0 10 3 10 9"/></svg>',
    aniversario: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="12" y="22" width="24" height="16" rx="2"/><path d="M12 30h24"/><path d="M24 22v-6"/><path d="M24 12c2 0 2-3 0-4-2 1-2 4 0 4z"/></svg>',
    barbacoa: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M24 30c5 0 9-4 9-9 0-6-6-8-5-14-4 2-7 5-7 10-2 0-3-2-3-4-3 3-4 6-4 9 0 5 4 8 10 8z" transform="translate(0 -2)"/><path d="M16 34h16l-2 8H18z"/></svg>',
    lista: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="16" width="14" height="18" rx="2"/><rect x="26" y="16" width="14" height="18" rx="2"/><path d="M8 24h14M26 24h14"/><path d="M12 16v-2M18 16v-2M30 16v-2M36 16v-2"/></svg>',
    corazon: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M24 38S9 29 9 19a8 8 0 0 1 15-3 8 8 0 0 1 15 3c0 10-15 19-15 19z"/></svg>',
  };

  var EVENTOS = [
    { icono: 'paella', titulo: 'Paella en el chalet', texto: 'Paella tradicional cocinada en tu jardín o terraza. Sabor auténtico y el ambiente de siempre, con leña si se puede.' },
    { icono: 'cena', titulo: 'Cena romántica para dos', texto: 'Una cena íntima, elegante y pensada solo para vosotros. Yo cocino, sirvo y recojo; vosotros solo disfrutáis.' },
    { icono: 'grupo', titulo: 'Comida o cena de grupo', texto: 'Para familias o amigos. Platos para compartir, ambiente relajado y atención personalizada en tu casa.' },
    { icono: 'aniversario', titulo: 'Aniversario en privado', texto: 'Celebrad lo vuestro en la intimidad de vuestro hogar. Mesa decorada y menú a medida, sin presencia de personal.' },
    { icono: 'barbacoa', titulo: 'Barbacoa en casa', texto: 'Barbacoa clásica o de autor, preparada y servida en tu terraza. Tú disfrutas, yo me encargo del resto.' },
    { icono: 'lista', titulo: 'Catering listo en tu cocina', texto: 'Preparo todo en tu casa y lo dejo cocinado y decorado para que solo tengas que servir. Sin personal, sin estrés.' },
  ];

  function renderEventos(platos) {
    app.textContent = '';
    app.appendChild(h('header', { class: 'receta-cabecera' }, [
      h('span', { class: 'sobre-titulo', texto: 'Bon Mos · Eventos' }),
      h('h1', { texto: 'Cocino en tu casa' }),
      h('p', { class: 'prosa receta-descripcion', texto: 'Elige el plan y yo me ocupo de todo: la compra, la cocina y la recogida. Tú pones la mesa y la compañía.' }),
    ]));
    app.appendChild(h('div', { class: 'cenefa', 'aria-hidden': 'true' }));

    // Cada servicio con su ficha de marca: fondo degradado + icono (siempre
    // elegante y consistente, sin depender de la calidad de fotos sueltas).
    var lista = h('div', { class: 'eventos' });
    EVENTOS.forEach(function (ev, i) {
      var media = h('div', { class: 'evento-media' }, [
        h('span', { class: 'evento-num', texto: String(i + 1) }),
      ]);
      var ic = h('span', { class: 'evento-icono' });
      ic.innerHTML = ICONOS_EVENTO[ev.icono] || ICONOS_EVENTO.corazon;
      media.appendChild(ic);
      lista.appendChild(h('article', { class: 'evento' }, [
        media,
        h('div', { class: 'evento-cuerpo' }, [
          h('h2', { texto: ev.titulo }),
          h('p', { texto: ev.texto }),
          h('a', { class: 'boton boton-sorpresa', href: wa(), target: '_blank', rel: 'noopener', texto: 'Reservar' }),
        ]),
      ]));
    });
    app.appendChild(lista);
    revelar([].slice.call(lista.children));

    app.appendChild(h('section', { class: 'eventos-cta' }, [
      h('span', { class: 'evento-icono eventos-cta-icono' }),
      h('h2', { texto: '¿Tienes otra idea en mente?' }),
      h('p', { class: 'prosa', texto: 'Cuéntame qué celebras y lo diseñamos juntos, a tu medida.' }),
      h('a', { class: 'boton boton-sorpresa', href: wa(), target: '_blank', rel: 'noopener', texto: 'Hablar con el chef' }),
    ]));
    var ctaIcono = app.querySelector('.eventos-cta-icono');
    if (ctaIcono) { ctaIcono.innerHTML = ICONOS_EVENTO.corazon; }
  }

  // ---------- Servicios: cómo funciona y qué incluye ----------

  function renderServicios() {
    app.textContent = '';
    app.appendChild(h('header', { class: 'receta-cabecera' }, [
      h('span', { class: 'sobre-titulo', texto: 'Bon Mos · Servicios' }),
      h('h1', { texto: 'Cómo funciona' }),
      h('p', { class: 'prosa receta-descripcion', texto: 'Un chef privado en tu casa, sin complicaciones. Así es de fácil sentarte a la mesa.' }),
    ]));
    app.appendChild(h('div', { class: 'cenefa', 'aria-hidden': 'true' }));

    var pasos = [
      ['Eliges el menú.', ' Me cuentas la ocasión y los comensales, y te propongo platos de la carta o algo a medida.'],
      ['Hago la compra.', ' Producto fresco del día, elegido pieza a pieza en el mercado.'],
      ['Cocino en tu casa.', ' Llego con todo, cocino en tu cocina y sirvo recién hecho.'],
      ['Y lo recojo todo.', ' Tú solo disfrutas y compartes mesa; de la cocina (y de dejarla limpia) me encargo yo.'],
    ];
    var pasosEl = h('section', { class: 'panel panel-pasos panel-servicio' }, [
      h('h2', { texto: 'Paso a paso' }),
      h('ol', { class: 'lista-pasos lista-servicio' }, pasos.map(function (par) {
        return h('li', {}, [h('strong', { texto: par[0] }), document.createTextNode(par[1])]);
      })),
    ]);
    app.appendChild(pasosEl);

    var incluye = [
      'Menú diseñado a tu gusto, con producto de mercado',
      'Compra y desplazamiento incluidos',
      'Cocinado en tu casa y servido recién hecho',
      'Recojo y dejo la cocina como estaba',
      'Zona: València y alrededores (hasta 25 km)',
      'Reservas con al menos 3 días de antelación',
    ];
    var incluyeEl = h('section', { class: 'panel panel-servicio' }, [
      h('h2', { texto: 'Qué incluye' }),
      h('ul', { class: 'lista-ingredientes lista-mercado' },
        incluye.map(function (t) { return h('li', {}, [h('span', { texto: t })]); })),
      h('div', { class: 'reserva-panel' }, [
        h('p', { class: 'prosa', texto: '¿Te lo imaginas ya en tu mesa?' }),
        h('a', { class: 'boton boton-sorpresa', href: wa(), target: '_blank', rel: 'noopener', texto: 'Reservar por WhatsApp' }),
        h('a', { class: 'boton boton-suave', href: 'mailto:' + CFG.email, texto: 'O escríbeme un correo' }),
      ]),
    ]);
    app.appendChild(incluyeEl);
  }

  // ---------- Menú hamburguesa ----------

  function initMenu() {
    var boton = document.querySelector('.hamburguesa');
    if (!boton) { return; }
    var rutas = [['Inicio', '/'], ['La carta', '/carta'], ['Eventos', '/eventos'], ['Servicios', '/servicios'], ['Contacto', '/contacto']];
    function esActual(ruta) {
      if (ruta === '/') { return pagina === 'inicio'; }
      if (ruta === '/carta') { return pagina === 'carta' || pagina === 'plato'; }
      return location.pathname === ruta;
    }
    // En ordenador, las páginas van directamente en la cabecera
    var navEscritorio = h('nav', { class: 'nav-escritorio', 'aria-label': 'Menú' }, rutas.map(function (par) {
      return h('a', { href: par[1], class: esActual(par[1]) ? 'actual' : '', texto: par[0] });
    }));
    boton.parentElement.insertBefore(navEscritorio, boton);

    var menu = h('nav', { class: 'menu-panel', 'aria-label': 'Menú' }, rutas.map(function (par) {
      return h('a', { href: par[1], class: esActual(par[1]) ? 'actual' : '', texto: par[0] });
    }));
    // Fuera de la cabecera: WebKit (iPhone) recorta los hijos absolutos
    // de un elemento con backdrop-filter, y el panel no se veía.
    document.body.appendChild(menu);

    function colocar() {
      var r = boton.getBoundingClientRect();
      menu.style.top = (r.bottom + 10) + 'px';
      menu.style.right = Math.max(10, window.innerWidth - r.right) + 'px';
    }

    function alternar(abrir) {
      if (abrir) { colocar(); }
      boton.classList.toggle('abierto', abrir);
      menu.classList.toggle('abierto', abrir);
      boton.setAttribute('aria-expanded', abrir ? 'true' : 'false');
      if (abrir && navigator.vibrate) { navigator.vibrate(8); }
    }
    window.addEventListener('resize', function () {
      if (menu.classList.contains('abierto')) { colocar(); }
    });
    window.addEventListener('scroll', function () {
      if (menu.classList.contains('abierto')) { colocar(); }
    }, { passive: true });
    boton.addEventListener('click', function (ev) {
      ev.stopPropagation();
      alternar(!menu.classList.contains('abierto'));
    });
    document.addEventListener('click', function (ev) {
      if (menu.classList.contains('abierto') && !menu.contains(ev.target)) { alternar(false); }
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') { alternar(false); }
    });
  }

  initMenu();

  // La cabecera se esconde al scrollear hacia abajo y reaparece al subir.
  function initCabeceraScroll() {
    var cab = document.querySelector('.cabecera');
    if (!cab) { return; }
    var lastY = window.pageYOffset || 0, ticking = false, menu = null;
    function actualizar() {
      ticking = false;
      var y = window.pageYOffset || 0;
      if (!menu) { menu = document.querySelector('.menu-panel'); }
      var menuAbierto = menu && menu.classList.contains('abierto');
      if (y <= 80 || menuAbierto) {
        cab.classList.remove('cabecera-oculta');
      } else if (y > lastY + 6) {
        cab.classList.add('cabecera-oculta');
      } else if (y < lastY - 6) {
        cab.classList.remove('cabecera-oculta');
      }
      lastY = y;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(actualizar); }
    }, { passive: true });
  }
  initCabeceraScroll();

  // ---------- Arranque ----------

  // Páginas que no dependen de la carta: se pintan de inmediato.
  if (pagina === 'servicios') { renderServicios(); }
  else if (pagina === 'contacto') { renderContacto(); }

  var necesitaDatos = pagina === 'inicio' || pagina === 'carta' || pagina === 'plato' || pagina === 'panel' || pagina === 'eventos';

  cargarPlatos().then(function (d) {
    aplicarLogo(d);
    if (pagina === 'inicio') { renderInicio(d); }
    else if (pagina === 'carta') { renderCarta(d); }
    else if (pagina === 'plato') { renderPlato(d); }
    else if (pagina === 'panel') { entrarPanel(d); }
    else if (pagina === 'eventos') { renderEventos(d.platos); }
  }).catch(function (e) {
    // Eventos funciona aunque no haya API: sin fotos, con iconos de respaldo.
    if (pagina === 'eventos') { renderEventos([]); return; }
    if (!necesitaDatos) { return; }
    app.textContent = '';
    app.appendChild(h('p', { class: 'vacio', texto: 'No se pudo cargar la carta (' + e.message + '). Recarga la página.' }));
  });

  // Acceso discreto al panel: mantener pulsado el «Bon Mos» del pie (o doble clic)
  var sello = document.querySelector('.pie p strong');
  if (sello && pagina !== 'panel') {
    var pulsacion = null;
    sello.style.userSelect = 'none';
    sello.style.webkitUserSelect = 'none';
    sello.addEventListener('pointerdown', function () {
      pulsacion = setTimeout(function () { location.href = '/panel'; }, 1200);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) {
      sello.addEventListener(ev, function () { clearTimeout(pulsacion); });
    });
    sello.addEventListener('dblclick', function () { location.href = '/panel'; });
  }
})();
