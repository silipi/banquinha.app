/**
 * Shrinks a photo in the browser before upload, so a 12 MP phone picture becomes a few
 * hundred KB on mobile data. The API still validates and re-encodes it: this is only to
 * make uploads fast. Returns the original file when the browser can't decode it.
 */
export async function shrinkImage(file: File, maxSide: number): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    // Applies the EXIF orientation, like the API does.
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return file;
  }

  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext('2d');
  if (!context) return file;
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const encode = (type: string) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.9));
  // Older Safari can't encode webp and silently returns a (large) PNG instead.
  let blob = await encode('image/webp');
  if (blob?.type !== 'image/webp') blob = await encode('image/jpeg');
  if (!blob) return file;
  // A small JPG/PNG/WebP that needed no resizing may already be lighter than the re-encode.
  const keepOriginal =
    scale === 1 && UPLOADABLE.has(file.type) && file.size <= blob.size;
  return keepOriginal ? file : blob;
}

const UPLOADABLE = new Set(['image/jpeg', 'image/png', 'image/webp']);
