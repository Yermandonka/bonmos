// Ajustes del perfil del chef (logo y portada del inicio) — en el JSON del Blob
import { leerDatos, guardarCrudo, errorConfiguracion } from './platos.js';

function urlValida(v) {
  return v === '' || /^https:\/\//.test(v);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }
  if (errorConfiguracion(req, res)) { return; }
  try {
    const b = req.body || {};
    const d = await leerDatos();

    // Logo
    if (b.logo !== undefined) {
      const logo = String(b.logo || '').trim();
      if (!urlValida(logo)) {
        return res.status(400).json({ error: 'El logo debe ser una URL https válida.' });
      }
      d.ajustes.logo = logo;
    }

    // Portada del inicio (foto o vídeo)
    if (b.portada !== undefined) {
      const portada = String(b.portada || '').trim();
      if (!urlValida(portada)) {
        return res.status(400).json({ error: 'La portada debe ser una URL https válida.' });
      }
      d.ajustes.portada = portada;
      const tipo = String(b.portadaTipo || '').trim();
      d.ajustes.portadaTipo = (tipo === 'video' || tipo === 'image') ? tipo : '';
    }

    await guardarCrudo(d);
    return res.status(200).json({
      ok: true,
      logo: d.ajustes.logo || '',
      portada: d.ajustes.portada || '',
      portadaTipo: d.ajustes.portadaTipo || '',
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error del servidor: ' + err.message });
  }
}
