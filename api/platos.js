import { neon } from '@neondatabase/serverless';
import { SEED } from './_seed.js';

const URL_DB = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';

function slugificar(t) {
  return (t || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'plato';
}

function sinClave(req) {
  const clave = process.env.PANEL_CLAVE;
  return !clave || req.headers['x-clave'] !== clave;
}

let lista = null;

async function db() {
  const sql = neon(URL_DB);
  if (!lista) {
    await sql`CREATE TABLE IF NOT EXISTS platos (
      id SERIAL PRIMARY KEY,
      titulo TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      categoria TEXT NOT NULL DEFAULT 'principal',
      descripcion TEXT NOT NULL DEFAULT '',
      ingredientes TEXT NOT NULL DEFAULT '',
      consejo TEXT NOT NULL DEFAULT '',
      notas TEXT NOT NULL DEFAULT '',
      tiempo_min INT NOT NULL DEFAULT 60,
      comensales INT NOT NULL DEFAULT 4,
      foto TEXT NOT NULL DEFAULT '',
      destacada INT NOT NULL DEFAULT 0,
      creada_en TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
    const [{ n }] = await sql`SELECT count(*)::int AS n FROM platos`;
    if (n === 0) {
      for (const p of SEED) {
        await sql`INSERT INTO platos (titulo, slug, categoria, descripcion, ingredientes, consejo, tiempo_min, comensales, foto, destacada)
                  VALUES (${p.titulo}, ${p.slug}, ${p.categoria}, ${p.descripcion}, ${p.ingredientes}, ${p.consejo}, ${p.tiempo_min}, ${p.comensales}, ${p.foto}, ${p.destacada})`;
      }
    }
    lista = true;
  }
  return sql;
}

export async function leerPlatos() {
  if (!URL_DB) {
    return { platos: SEED, demo: true };
  }
  const sql = await db();
  const platos = await sql`SELECT * FROM platos ORDER BY destacada DESC, creada_en DESC`;
  return { platos, demo: false };
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      return res.status(200).json(await leerPlatos());
    }

    if (req.method === 'POST' || req.method === 'DELETE') {
      if (!URL_DB) {
        return res.status(503).json({ error: 'Sin base de datos: crea una base Neon en la pestaña Storage de tu proyecto en Vercel y redepliega.' });
      }
      if (!process.env.PANEL_CLAVE) {
        return res.status(503).json({ error: 'El panel no tiene clave configurada: añade la variable PANEL_CLAVE en Vercel.' });
      }
      if (sinClave(req)) {
        return res.status(401).json({ error: 'Clave del chef incorrecta.' });
      }
      const sql = await db();

      if (req.method === 'DELETE') {
        const id = parseInt(new URL(req.url, 'http://x').searchParams.get('id') || '0', 10);
        if (!id) return res.status(400).json({ error: 'Falta el id.' });
        await sql`DELETE FROM platos WHERE id = ${id}`;
        return res.status(200).json({ ok: true });
      }

      const b = req.body || {};
      const titulo = (b.titulo || '').trim();
      const ingredientes = (b.ingredientes || '').trim();
      if (!titulo || !ingredientes) {
        return res.status(400).json({ error: 'Título e ingredientes son obligatorios.' });
      }
      const datos = {
        titulo,
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
      let slug = slugificar(titulo);
      const id = parseInt(b.id, 10) || 0;
      const [choca] = await sql`SELECT id FROM platos WHERE slug = ${slug} AND id != ${id}`;
      if (choca) slug += '-' + Math.random().toString(36).slice(2, 6);

      if (id) {
        await sql`UPDATE platos SET titulo=${datos.titulo}, slug=${slug}, categoria=${datos.categoria},
          descripcion=${datos.descripcion}, ingredientes=${datos.ingredientes}, consejo=${datos.consejo},
          notas=${datos.notas}, tiempo_min=${datos.tiempo_min}, comensales=${datos.comensales},
          foto=${datos.foto}, destacada=${datos.destacada} WHERE id=${id}`;
      } else {
        await sql`INSERT INTO platos (titulo, slug, categoria, descripcion, ingredientes, consejo, notas, tiempo_min, comensales, foto, destacada)
          VALUES (${datos.titulo}, ${slug}, ${datos.categoria}, ${datos.descripcion}, ${datos.ingredientes}, ${datos.consejo},
                  ${datos.notas}, ${datos.tiempo_min}, ${datos.comensales}, ${datos.foto}, ${datos.destacada})`;
      }
      return res.status(200).json({ ok: true, slug });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'Método no permitido.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error del servidor: ' + err.message });
  }
}
