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

  function wa(titulo) {
    return 'https://wa.me/' + CFG.whatsapp + '?text=' + encodeURIComponent(
      'Hola! Me gustaría reservar «' + titulo + '» de ' + (CFG.nombre || 'Bon Mos') + ' para mi casa. ¿Hablamos?');
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
    hoja = h('div', { class: 'hoja', role: 'dialog', 'aria-label': p.titulo }, [
      h('div', { class: 'hoja-asa' }),
      fotoHoja,
      h('span', { class: 'hoja-meta', texto: catNombre(p.categoria) + ' · ' + p.tiempo_min + ' min' }),
      h('h2', { texto: p.titulo }),
      h('p', { class: 'hoja-desc', texto: p.descripcion }),
      h('p', { class: 'hoja-datos', texto: 'Para ' + p.comensales + ' o más · Producto de mercado' }),
      h('div', { class: 'hoja-botones' }, [
        h('a', { class: 'boton boton-sorpresa', href: wa(p.titulo), target: '_blank', rel: 'noopener', texto: 'Reservar' }),
        h('a', { class: 'boton boton-suave', href: href, texto: 'Ver el plato' }),
        h('button', { type: 'button', class: 'boton boton-suave hoja-cerrar', 'aria-label': 'Cerrar', texto: '✕', onclick: cerrarHoja }),
      ]),
    ]);
    document.body.appendChild(fondo);
    document.body.appendChild(hoja);
    document.body.classList.add('hoja-abierta');

    var fotoOrigen = origen && origen.querySelector('.tarjeta-foto, .hero-foto');
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

  function tarjeta(p) {
    var t = h('a', { class: 'tarjeta', href: '/plato/' + p.slug }, [
      h('div', { class: 'tarjeta-foto', estilo: "background-image:url('" + p.foto + "')" }),
      h('div', { class: 'tarjeta-cuerpo' }, [
        h('span', { class: 'tarjeta-meta', texto: catNombre(p.categoria) + ' · ' + p.tiempo_min + ' min' }),
        h('h2', { texto: p.titulo }),
        h('p', { texto: p.descripcion.length > 150 ? p.descripcion.slice(0, 147) + '…' : p.descripcion }),
        h('div', { class: 'tarjeta-pie' }, [
          h('span', { texto: 'Para ' + p.comensales + ' o más' }),
          h('span', { class: 'tarjeta-ver', texto: 'Ver plato' }),
        ]),
      ]),
    ]);
    t.addEventListener('click', function (ev) { ev.preventDefault(); abrirHoja(p, t); });
    return t;
  }

  function renderCarta(d) {
    var platos = d.platos;
    var cat = '', busca = '';
    app.textContent = '';

    var destacada = platos.find(function (p) { return p.destacada; }) || platos[0];
    if (destacada) {
      var heroTarjeta = h('a', { class: 'hero-tarjeta', href: '/plato/' + destacada.slug }, [
        h('div', { class: 'hero-foto', estilo: "background-image:url('" + destacada.foto + "')" }),
        h('div', { class: 'hero-texto' }, [
          h('span', { class: 'sobre-titulo', texto: 'Plato de la casa' }),
          h('h1', { texto: destacada.titulo }),
          h('p', { class: 'prosa', texto: destacada.descripcion }),
          h('span', { class: 'hero-cta', texto: 'Ver el plato' }),
        ]),
      ]);
      heroTarjeta.addEventListener('click', function (ev) { ev.preventDefault(); abrirHoja(destacada, heroTarjeta); });
      app.appendChild(h('section', { class: 'hero' }, [heroTarjeta]));
    }

    var rejilla = h('section', { class: 'rejilla' });

    function pinta() {
      rejilla.textContent = '';
      var lista = platos.filter(function (p) {
        if (cat && p.categoria !== cat) { return false; }
        if (busca) {
          var t = (p.titulo + ' ' + p.descripcion + ' ' + p.ingredientes).toLowerCase();
          return t.indexOf(busca.toLowerCase()) !== -1;
        }
        return !(destacada && !cat && !busca && p.id === destacada.id);
      });
      if (!lista.length) {
        rejilla.appendChild(h('p', { class: 'vacio', texto: 'No hay platos por aquí todavía.' }));
      }
      lista.forEach(function (p) { rejilla.appendChild(tarjeta(p)); });
      revelar([].slice.call(rejilla.children));
    }

    var entrada = h('input', {
      type: 'search', placeholder: 'Busca un plato o un ingrediente…', 'aria-label': 'Buscar platos',
      oninput: function (ev) { busca = ev.target.value.trim(); pinta(); },
    });
    var sorpresa = h('a', {
      class: 'boton boton-sorpresa', href: '#', texto: 'Sorpréndeme', title: 'Un plato al azar',
      onclick: function (ev) {
        ev.preventDefault();
        var p = platos[Math.floor(Math.random() * platos.length)];
        if (p) { abrirHoja(p, null); }
      },
    });
    app.appendChild(h('form', { class: 'buscador', role: 'search', onsubmit: function (ev) { ev.preventDefault(); } }, [entrada, sorpresa]));

    var filtros = h('nav', { class: 'filtros', 'aria-label': 'Categorías' });
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
    filtros.appendChild(botonFiltro('', 'Todos'));
    Object.keys(CATS).forEach(function (c) { filtros.appendChild(botonFiltro(c, CATS[c])); });
    app.appendChild(filtros);
    app.appendChild(h('div', { class: 'cenefa', 'aria-hidden': 'true' }));
    app.appendChild(rejilla);
    pinta();
    var heroEl = app.querySelector('.hero-tarjeta');
    if (heroEl) { revelar([heroEl]); }
  }

  // ---------- Ficha del plato ----------

  function renderPlato(d) {
    var slug = decodeURIComponent(location.pathname.split('/').pop() || '');
    var p = d.platos.find(function (x) { return x.slug === slug; });
    app.textContent = '';
    if (!p) {
      app.appendChild(h('p', { class: 'vacio' }, [
        document.createTextNode('Ese plato no está en la carta. '),
        h('a', { href: '/', texto: 'Volver a la carta' }),
      ]));
      return;
    }
    document.title = p.titulo + ' · ' + (CFG.nombre || 'Bon Mos');
    var enlaceWa = wa(p.titulo);

    var mercado = h('ul', { class: 'lista-ingredientes lista-mercado' });
    p.ingredientes.split('\n').map(function (s) { return s.trim(); }).filter(Boolean).forEach(function (ing) {
      mercado.appendChild(h('li', {}, [h('span', { texto: ing })]));
    });

    var pasosServicio = [
      ['Eliges el menú.', ' Este plato solo, o combinado con entrantes y dulce de la carta.'],
      ['El chef hace la compra.', ' Producto fresco del día, elegido pieza a pieza.'],
      ['Se cocina en tu casa.', ' Tú pones la mesa y la compañía; de la cocina (y de recogerla) se encarga él.'],
    ];
    var servicio = h('ol', { class: 'lista-pasos lista-servicio' }, pasosServicio.map(function (par) {
      return h('li', {}, [h('strong', { texto: par[0] }), document.createTextNode(par[1])]);
    }));

    app.appendChild(h('article', { class: 'receta' }, [
      h('div', { class: 'receta-foto', estilo: "background-image:url('" + p.foto + "')" }),
      h('header', { class: 'receta-cabecera' }, [
        h('span', { class: 'sobre-titulo', texto: catNombre(p.categoria) }),
        h('h1', { texto: p.titulo }),
        h('p', { class: 'receta-descripcion prosa', texto: p.descripcion }),
        h('div', { class: 'receta-datos' }, [
          h('div', {}, [h('strong', { texto: p.comensales + '+' }), h('span', { texto: 'comensales' })]),
          h('div', {}, [h('strong', { texto: p.tiempo_min + "'" }), h('span', { texto: 'en tu cocina' })]),
          h('div', {}, [h('strong', { texto: 'Mercado' }), h('span', { texto: 'producto del día' })]),
        ]),
        h('p', { class: 'reserva-principal' }, [
          h('a', { class: 'boton boton-sorpresa', href: enlaceWa, target: '_blank', rel: 'noopener', texto: 'Reservar este plato' }),
        ]),
      ]),
      h('div', { class: 'receta-columnas' }, [
        h('section', { class: 'panel panel-ingredientes' }, [
          h('h2', { texto: 'Producto de mercado' }),
          h('p', { class: 'panel-nota', texto: 'Todo se compra el mismo día, de proximidad siempre que la lonja y la huerta lo permiten.' }),
          mercado,
        ]),
        h('section', { class: 'panel panel-pasos' }, [
          h('h2', { texto: 'Así funciona' }),
          servicio,
          p.consejo ? h('aside', { class: 'consejo' }, [
            h('strong', { texto: 'El toque del chef' }),
            h('p', { texto: p.consejo }),
          ]) : null,
          h('div', { class: 'reserva-panel' }, [
            h('p', { class: 'prosa', texto: '¿Te lo imaginas ya en tu mesa?' }),
            h('a', { class: 'boton boton-sorpresa', href: enlaceWa, target: '_blank', rel: 'noopener', texto: 'Reservar por WhatsApp' }),
            h('a', { class: 'boton boton-suave', href: 'mailto:' + CFG.email + '?subject=' + encodeURIComponent('Reserva: ' + p.titulo), texto: 'O por correo' }),
          ]),
        ]),
      ]),
      h('p', { class: 'volver' }, [h('a', { href: '/', texto: 'Volver a la carta' })]),
    ]));
  }

  // ---------- Panel del chef ----------

  function clave() { return localStorage.getItem('bm_clave') || ''; }

  function llamarApi(metodo, url, cuerpo, tipo) {
    var cab = { 'x-clave': clave() };
    if (tipo) { cab['content-type'] = tipo; }
    return fetch(url, { method: metodo, headers: cab, body: cuerpo }).then(function (r) {
      return r.json().then(function (j) {
        if (r.status === 401) {
          localStorage.removeItem('bm_clave');
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
            localStorage.setItem('bm_clave', fClave.value);
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
        localStorage.removeItem('bm_clave');
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
      seccion.appendChild(h('p', { class: 'alerta', texto: 'Modo demostración: la carta es de ejemplo. Para publicar de verdad, crea una base de datos Neon y un Blob store en la pestaña Storage del proyecto en Vercel.' }));
    }
    seccion.appendChild(aviso);

    var listaEl = h('ul', { class: 'admin-lista' });
    platos.forEach(function (p) {
      listaEl.appendChild(h('li', {}, [
        h('div', { class: 'admin-item-info' }, [
          h('strong', { texto: p.titulo }),
          h('span', { texto: catNombre(p.categoria) + (p.destacada ? ' · ★ plato de la casa' : '') }),
        ]),
        h('div', { class: 'admin-item-botones' }, [
          h('a', { class: 'boton boton-suave', href: '/plato/' + p.slug, texto: 'Ver' }),
          h('a', { class: 'boton boton-suave', href: '#', texto: 'Editar', onclick: function (ev) { ev.preventDefault(); abreFormulario(p); } }),
          h('button', { type: 'button', class: 'boton boton-peligro', texto: 'Borrar', onclick: function () {
            if (!confirm('¿Borrar «' + p.titulo + '» de la carta?')) { return; }
            llamarApi('DELETE', '/api/platos?id=' + p.id).then(function () {
              cachePlatos = null;
              cargarPlatos().then(renderPanel);
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
      p = p || { titulo: '', categoria: 'principal', descripcion: '', ingredientes: '', consejo: '', notas: '', tiempo_min: 60, comensales: 4, foto: '', destacada: 0, id: 0 };
      var viejo = app.querySelector('.panel-editar');
      if (viejo) { viejo.remove(); }

      var fTitulo = h('input', { type: 'text', value: p.titulo, required: '', placeholder: 'Ej: Arròs negre amb sepionets' });
      var fCategoria = h('select', {}, Object.keys(CATS).map(function (c) {
        var o = h('option', { value: c, texto: CATS[c] });
        if (p.categoria === c) { o.selected = true; }
        return o;
      }));
      var fTiempo = h('input', { type: 'number', min: '1', value: p.tiempo_min, inputmode: 'numeric' });
      var fComensales = h('input', { type: 'number', min: '1', value: p.comensales, inputmode: 'numeric' });
      var fDesc = h('textarea', { rows: '3', placeholder: 'Dos o tres frases que abran el apetito…', texto: p.descripcion });
      var fIng = h('textarea', { rows: '7', required: '', placeholder: 'Arroz redondo de la Albufera\nPollo y conejo de corral\n…', texto: p.ingredientes });
      var fConsejo = h('textarea', { rows: '2', placeholder: 'Ese detalle del servicio que marca la diferencia…', texto: p.consejo });
      var fNotas = h('textarea', { rows: '4', placeholder: 'Apuntes de preparación, solo para ti…', texto: p.notas || '' });
      var fFoto = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp' });
      var fDestacada = h('input', { type: 'checkbox' });
      if (p.destacada) { fDestacada.checked = true; }

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
            ingredientes: fIng.value, consejo: fConsejo.value, notas: fNotas.value,
            tiempo_min: fTiempo.value, comensales: fComensales.value, foto: urlFoto, destacada: fDestacada.checked,
          }), 'application/json');
        }).then(function () {
          var r = boton.getBoundingClientRect();
          confeti(r.left + r.width / 2, r.top);
          cachePlatos = null;
          cargarPlatos().then(function (nd) { renderPanel(nd); avisa('Plato guardado. Bon profit!'); window.scrollTo({ top: 0, behavior: 'smooth' }); });
        }).catch(function (e) {
          boton.disabled = false;
          avisa(e.message, true);
        });
      } }, [
        campo('Nombre del plato', fTitulo),
        h('div', { class: 'fila-doble' }, [campo('Categoría', fCategoria), campo('Minutos en tu cocina', fTiempo)]),
        h('div', { class: 'fila-doble' }, [campo('Comensales mínimos', fComensales), campo('Foto del plato', fFoto, 'JPG, PNG o WebP')]),
        campo('Descripción apetitosa', fDesc),
        campo('Producto de mercado', fIng, 'uno por línea'),
        campo('El toque del chef', fConsejo, 'se muestra en la ficha'),
        campo('Elaboración', fNotas, 'notas internas, no se publican'),
        h('label', { class: 'casilla' }, [fDestacada, document.createTextNode(' Plato de la casa (destacado en portada)')]),
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

  // ---------- Arranque ----------

  cargarPlatos().then(function (d) {
    if (pagina === 'carta') { renderCarta(d); }
    else if (pagina === 'plato') { renderPlato(d); }
    else if (pagina === 'panel') { entrarPanel(d); }
  }).catch(function (e) {
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
