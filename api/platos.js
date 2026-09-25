// La carta vive como un JSON en Vercel Blob — sin base de datos externa.
// Cada guardado escribe un archivo con marca de tiempo (URL nueva) porque el
// CDN del Blob sirve hasta 60 s la versión vieja si se sobrescribe la misma ruta.
import { put, list, del } from '@vercel/blob';
import { SEED } from './_seed.js';

const PREFIJO = 'datos/carta';
const HAY_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;

function slugificar(t) {
  return (t || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'plato';
}

function conClave(req) {
  const clave = process.env.PANEL_CLAVE;
  return clave && req.headers['x-clave'] === clave;
}

async function leerCrudo() {
  const { blobs } = await list({ prefix: PREFIJO, limit: 100 });
  if (!blobs.length) { return null; }
  // La versión más reciente: los nombres llevan Date.now(), ordenan solos
  blobs.sort(function (a, b) { return a.pathname < b.pathname ? 1 : -1; });
  const r = await fetch(blobs[0].url);
  if (!r.ok) { return null; }
  return r.json();
}

export async function guardarCrudo(datos) {
  await put(PREFIJO + '-' + Date.now() + '.json', JSON.stringify(datos), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json',
    cacheControlMaxAge: 60,
  });
  // Limpieza de versiones antiguas (nos quedamos con las 3 últimas)
  try {
    const { blobs } = await list({ prefix: PREFIJO, limit: 100 });
    blobs.sort(function (a, b) { return a.pathname < b.pathname ? 1 : -1; });
    const viejas = blobs.slice(3).map(function (b) { return b.url; });
    if (viejas.length) { await del(viejas); }
  } catch (err) {
    console.error('limpieza de versiones:', err.message);
  }
}

function ordenar(platos) {
  return platos.slice().sort(function (a, b) {
    return (b.destacada - a.destacada) || String(b.creada_en || '').localeCompare(String(a.creada_en || ''));
  });
}

export async function leerDatos() {
  let d = await leerCrudo();
  if (!d || !Array.isArray(d.platos)) {
    d = { platos: SEED.map(function (p) { return { ...p, creada_en: new Date().toISOString() }; }), ajustes: {}, siguienteId: SEED.length + 1 };
    await guardarCrudo(d);
  }
  if (!d.ajustes) { d.ajustes = {}; }
  if (!d.siguienteId) { d.siguienteId = d.platos.reduce(function (m, p) { return Math.max(m, p.id); }, 0) + 1; }
  return d;
}

export async function leerPlatos() {
  if (!HAY_BLOB) {
    return { platos: SEED, demo: true, ajustes: {} };
  }
  const d = await leerDatos();
  return { platos: ordenar(d.platos), demo: false, ajustes: d.ajustes };
}

export function errorConfiguracion(req, res) {
  if (!HAY_BLOB) {
    res.status(503).json({ error: 'Sin almacén: crea un Blob store en la pestaña Storage de tu proyecto en Vercel y redepliega.' });
    return true;
  }
  if (!process.env.PANEL_CLAVE) {
    res.status(503).json({ error: 'El panel no tiene clave configurada: añade la variable PANEL_CLAVE en Vercel.' });
    return true;
  }
  if (!conClave(req)) {
    res.status(401).json({ error: 'Clave del chef incorrecta.' });
    return true;
  }
  return false;
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      return res.status(200).json(await leerPlatos());
    }

    if (req.method === 'POST' || req.method === 'DELETE') {
      if (errorConfiguracion(req, res)) { return; }
      const d = await leerDatos();

      if (req.method === 'DELETE') {
        const id = parseInt(new URL(req.url, 'http://x').searchParams.get('id') || '0', 10);
        if (!id) { return res.status(400).json({ error: 'Falta el id.' }); }
        d.platos = d.platos.filter(function (p) { return p.id !== id; });
        await guardarCrudo(d);
        return res.status(200).json({ ok: true, platos: ordenar(d.platos), ajustes: d.ajustes });
      }

      const b = req.body || {};
      const titulo = (b.titulo || '').trim();
      const ingredientes = (b.ingredientes || '').trim();
      if (!titulo || !ingredientes) {
        return res.status(400).json({ error: 'Título e ingredientes son obligatorios.' });
      }
      const id = parseInt(b.id, 10) || 0;
      let slug = slugificar(titulo);
      if (d.platos.some(function (p) { return p.slug === slug && p.id !== id; })) {
        slug += '-' + Math.random().toString(36).slice(2, 6);
      }
      const plato = {
        id: id || d.siguienteId,
        titulo,
        slug,
        categoria: (b.categoria || 'principal').trim(),
        descripcion: (b.descripcion || '').trim(),
        ingredientes,
        consejo: (b.consejo || '').trim(),
        notas: (b.notas || '').trim(),
        tiempo_min: Math.max(1, parseInt(b.tiempo_min, 10) || 60),
        comensales: Math.max(1, parseInt(b.comensales, 10) || 4),
        foto: (b.foto || '').trim(),
        destacada: b.destacada ? 1 : 0,
      };
      if (id) {
        const i = d.platos.findIndex(function (p) { return p.id === id; });
        if (i === -1) { return res.status(404).json({ error: 'Ese plato ya no está en la carta.' }); }
        plato.creada_en = d.platos[i].creada_en;
        d.platos[i] = plato;
      } else {
        plato.creada_en = new Date().toISOString();
        d.platos.push(plato);
        d.siguienteId += 1;
      }
      await guardarCrudo(d);
      return res.status(200).json({ ok: true, slug, platos: ordenar(d.platos), ajustes: d.ajustes });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'Método no permitido.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error del servidor: ' + err.message });
  }
}
