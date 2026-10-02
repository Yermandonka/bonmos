// Ajustes del perfil del chef (logo y portada del inicio) — en el JSON del Blob
import { leerDatos, guardarCrudo, errorConfiguracion } from './platos.js';

function urlValida(v) {
  return v === '' || /^https:\/\//.test(v);
}

// Punto focal "x% y%" para encuadrar (background-position / object-position)
function posValida(v) {
  return /^\d{1,3}(\.\d+)?% \d{1,3}(\.\d+)?%$/.test(String(v || '').trim());
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
    if (b.logoPos !== undefined) {
      d.ajustes.logoPos = posValida(b.logoPos) ? String(b.logoPos).trim() : '50% 50%';
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
    if (b.portadaPos !== undefined) {
      d.ajustes.portadaPos = posValida(b.portadaPos) ? String(b.portadaPos).trim() : '50% 50%';
    }

    // Foto de la página de contacto
    if (b.contacto !== undefined) {
      const contacto = String(b.contacto || '').trim();
      if (!urlValida(contacto)) {
        return res.status(400).json({ error: 'La foto de contacto debe ser una URL https válida.' });
      }
      d.ajustes.contacto = contacto;
    }
    if (b.contactoPos !== undefined) {
      d.ajustes.contactoPos = posValida(b.contactoPos) ? String(b.contactoPos).trim() : '50% 50%';
    }

    await guardarCrudo(d);
    return res.status(200).json({
      ok: true,
      logo: d.ajustes.logo || '',
      logoPos: d.ajustes.logoPos || '',
      portada: d.ajustes.portada || '',
      portadaTipo: d.ajustes.portadaTipo || '',
      portadaPos: d.ajustes.portadaPos || '',
      contacto: d.ajustes.contacto || '',
      contactoPos: d.ajustes.contactoPos || '',
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error del servidor: ' + err.message });
  }
}
