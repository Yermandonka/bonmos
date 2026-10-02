// Subida de archivos a Vercel Blob:
//  - Fotos: se convierten a WebP (máx. 1600px, calidad 80) con sharp.
//  - Vídeos: se guardan tal cual (el navegador del chef ya los comprime a
//    WebM ligero antes de subirlos; aquí solo se almacenan).
import { put } from '@vercel/blob';
import sharp from 'sharp';

export const config = { api: { bodyParser: false } };

const MIMES_IMG = ['image/jpeg', 'image/png', 'image/webp'];
const MIMES_VID = ['video/webm', 'video/mp4', 'video/quicktime', 'video/x-matroska', 'video/ogg'];
const MAX_IMG = 8 * 1024 * 1024;
const MAX_VID = 60 * 1024 * 1024;

const EXT_VID = {
  'video/webm': 'webm',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/x-matroska': 'mkv',
  'video/ogg': 'ogv',
};

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

  const tipo = (req.headers['content-type'] || '').split(';')[0].trim();
  const esImagen = MIMES_IMG.includes(tipo);
  const esVideo = MIMES_VID.includes(tipo);
  if (!esImagen && !esVideo) {
    return res.status(400).json({ error: 'Solo se admiten fotos (JPG, PNG, WebP) o vídeos (MP4, WebM, MOV).' });
  }

  const maxBytes = esVideo ? MAX_VID : MAX_IMG;
  try {
    const trozos = [];
    let total = 0;
    for await (const trozo of req) {
      total += trozo.length;
      if (total > maxBytes) {
        return res.status(413).json({
          error: esVideo ? 'El vídeo supera los 60 MB. Usa uno más corto.' : 'La foto supera los 8 MB. Redúcela un poco.',
        });
      }
      trozos.push(trozo);
    }
    const datos = Buffer.concat(trozos);

    if (esVideo) {
      const ext = EXT_VID[tipo] || 'webm';
      const nombre = 'portada/' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8) + '.' + ext;
      const blob = await put(nombre, datos, { access: 'public', contentType: tipo });
      return res.status(200).json({ url: blob.url, tipo: 'video' });
    }

    const webp = await sharp(datos)
      .rotate() // respeta la orientación EXIF de las fotos de móvil
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    const nombre = 'platos/' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8) + '.webp';
    const blob = await put(nombre, webp, { access: 'public', contentType: 'image/webp' });
    return res.status(200).json({ url: blob.url, tipo: 'image' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'No se pudo procesar el archivo: ' + err.message });
  }
}
