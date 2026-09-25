// Subida de fotos: se convierten a WebP (máx. 1600px, calidad 80) antes de
// guardarse en Vercel Blob, para que pesen poco se suban como se suban.
import { put } from '@vercel/blob';
import sharp from 'sharp';

export const config = { api: { bodyParser: false } };

const MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 8 * 1024 * 1024;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(503).json({ error: 'Sin almacén de fotos: crea un Blob store en la pestaña Storage de tu proyecto en Vercel y redepliega.' });
  }
  const clave = process.env.PANEL_CLAVE;
  if (!clave) {
    return res.status(503).json({ error: 'El panel no tiene clave configurada: añade la variable PANEL_CLAVE en Vercel.' });
  }
  if (req.headers['x-clave'] !== clave) {
    return res.status(401).json({ error: 'Clave del chef incorrecta.' });
  }
  if (!MIMES.includes(req.headers['content-type'])) {
    return res.status(400).json({ error: 'Solo se admiten fotos JPG, PNG o WebP.' });
  }
  try {
    const trozos = [];
    let total = 0;
    for await (const trozo of req) {
      total += trozo.length;
      if (total > MAX_BYTES) {
        return res.status(413).json({ error: 'La foto supera los 8 MB. Redúcela un poco.' });
      }
      trozos.push(trozo);
    }
    const webp = await sharp(Buffer.concat(trozos))
      .rotate() // respeta la orientación EXIF de las fotos de móvil
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    const nombre = 'platos/' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8) + '.webp';
    const blob = await put(nombre, webp, {
      access: 'public',
      contentType: 'image/webp',
    });
    return res.status(200).json({ url: blob.url });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'No se pudo procesar la foto: ' + err.message });
  }
}
