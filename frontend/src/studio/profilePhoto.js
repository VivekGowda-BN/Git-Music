const MAX_SOURCE_BYTES = 8 * 1024 * 1024;
const MAX_STORED_LENGTH = 400 * 1024;
const ACCEPTED = /^image\/(jpeg|png|webp|gif|bmp|avif)$/;
const STORED = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

// Anything read from localStorage is untrusted: only our own re-encoded data
// URLs may reach an <img src>.
export function safePhoto(value) {
  return typeof value === 'string' && value.length <= MAX_STORED_LENGTH && STORED.test(value) ? value : '';
}

async function decode(file) {
  if (typeof createImageBitmap === 'function') {
    try { return await createImageBitmap(file); } catch { /* fall back to <img> */ }
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Square-crop, downscale and re-encode in the browser. Re-encoding drops EXIF
// metadata (including GPS coordinates) and keeps the stored string small.
export async function prepareProfilePhoto(file) {
  if (!file) throw new Error('Choose a photo first.');
  if (!ACCEPTED.test(file.type || '')) throw new Error('Choose a JPEG, PNG, WebP, GIF, BMP or AVIF image.');
  if (file.size > MAX_SOURCE_BYTES) throw new Error('Choose an image smaller than 8 MB.');

  let source;
  try {
    source = await decode(file);
  } catch {
    throw new Error('That image could not be read. Try another file.');
  }

  const side = Math.min(source.width, source.height);
  if (!side) throw new Error('That image could not be read. Try another file.');

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('This browser cannot prepare the photo.');
  context.drawImage(source, (source.width - side) / 2, (source.height - side) / 2, side, side, 0, 0, 512, 512);
  source.close?.();

  let dataUrl = canvas.toDataURL('image/jpeg', 0.86);
  if (dataUrl.length > MAX_STORED_LENGTH) dataUrl = canvas.toDataURL('image/jpeg', 0.7);
  if (dataUrl.length > MAX_STORED_LENGTH) throw new Error('That photo is too detailed to store. Try a smaller image.');
  return dataUrl;
}
