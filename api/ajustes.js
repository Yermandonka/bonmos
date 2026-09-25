// Ajustes del perfil del chef (de momento, el logo) — guardados en el JSON del Blob
import { leerDatos, guardarCrudo, errorConfiguracion } from './platos.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }
  if (errorConfiguracion(req, res)) { return; }
  try {
    const logo = ((req.body || {}).logo || '').trim();
    if (logo !== '' && !/^https:\/\//.test(logo)) {
      return res.status(400).json({ error: 'El logo debe ser una URL https válida.' });
    }
    const d = await leerDatos();
    d.ajustes.logo = logo;
    await guardarCrudo(d);
    return res.status(200).json({ ok: true, logo });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error del servidor: ' + err.message });
  }
}
