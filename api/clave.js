// Verifica la clave del chef antes de abrir el panel
export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }
  const clave = process.env.PANEL_CLAVE;
  if (!clave) {
    return res.status(503).json({ error: 'El panel no tiene clave configurada: añade la variable PANEL_CLAVE en los ajustes del proyecto en Vercel y redepliega.' });
  }
  if (req.headers['x-clave'] !== clave) {
    return res.status(401).json({ error: 'Esa no es la clave, chef.' });
  }
  return res.status(200).json({ ok: true });
}
