import { put } from '@vercel/blob';

export const config = { api: { bodyParser: false } };

const MIMES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const MAX_BYTES = 4 * 1024 * 1024;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(503).json({ error: 'Sin almacén de fotos: crea un Blob store en la pestaña Storage de tu proyecto en Vercel y redepliega.' });
  }
  const clave = process.env.PANEL_CLAVE;
  if (clave && req.headers['x-clave'] !== clave) {
    return res.status(401).json({ error: 'Clave del chef incorrecta.' });
  }
  const ext = MIMES[req.headers['content-type']];
  if (!ext) {
    return res.status(400).json({ error: 'Solo se admiten fotos JPG, PNG o WebP.' });
  }
  try {
    const trozos = [];
    let total = 0;
    for await (const trozo of req) {
      total += trozo.length;
      if (total > MAX_BYTES) {
        return res.status(413).json({ error: 'La foto supera los 4 MB. Redúcela un poco.' });
      }
      trozos.push(trozo);
    }
    const nombre = 'platos/' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8) + '.' + ext;
    const blob = await put(nombre, Buffer.concat(trozos), {
      access: 'public',
      contentType: req.headers['content-type'],
    });
    return res.status(200).json({ url: blob.url });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'No se pudo guardar la foto: ' + err.message });
  }
}
