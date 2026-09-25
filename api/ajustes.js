// Ajustes del perfil del chef (de momento, el logo)
import { db } from './platos.js';

const URL_DB = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }
  if (!URL_DB) {
    return res.status(503).json({ error: 'Sin base de datos: crea una base Neon en la pestaña Storage de tu proyecto en Vercel.' });
  }
  const clave = process.env.PANEL_CLAVE;
  if (!clave) {
    return res.status(503).json({ error: 'El panel no tiene clave configurada: añade la variable PANEL_CLAVE en Vercel.' });
  }
  if (req.headers['x-clave'] !== clave) {
    return res.status(401).json({ error: 'Clave del chef incorrecta.' });
  }
  try {
    const logo = ((req.body || {}).logo || '').trim();
    if (logo !== '' && !/^https:\/\//.test(logo)) {
      return res.status(400).json({ error: 'El logo debe ser una URL https válida.' });
    }
    const sql = await db();
    await sql`INSERT INTO ajustes (clave, valor) VALUES ('logo', ${logo})
              ON CONFLICT (clave) DO UPDATE SET valor = ${logo}`;
    return res.status(200).json({ ok: true, logo });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error del servidor: ' + err.message });
  }
}
