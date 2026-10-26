import { BadRequestException } from '@nestjs/common';
import sharp from 'sharp';

/** How each kind of image is stored. Everything becomes webp without metadata (no GPS). */
export const IMAGE_VARIANTS = {
  /** Shown in a circle: cropped to a square. */
  logo: { width: 512, height: 512, fit: 'cover' },
  /** Shown wide at the top of the storefront (up to ~1024 CSS px, 2x screens). */
  banner: { width: 2048, height: 2048, fit: 'inside' },
  product: { width: 1600, height: 1600, fit: 'inside' },
} as const satisfies Record<
  string,
  { width: number; height: number; fit: 'cover' | 'inside' }
>;

export type ImageVariant = keyof typeof IMAGE_VARIANTS;

/** Largest upload accepted, before processing. The panel shrinks photos before sending. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const ACCEPTED_FORMATS = new Set([
  'jpeg',
  'png',
  'webp',
  'avif',
  'heif',
  'gif',
]);
// A 48 MP phone photo is ~8000x6000; anything far beyond that is not a photo.
const MAX_INPUT_PIXELS = 60_000_000;

const UNREADABLE =
  'Não conseguimos abrir essa imagem. Envie uma foto em JPG, PNG ou WebP.';

export interface ProcessedImage {
  data: Buffer;
  contentType: 'image/webp';
  width: number;
  height: number;
}

/** Validates an uploaded file and turns it into the stored webp for its variant. */
export async function processImage(
  input: Buffer,
  variant: ImageVariant,
): Promise<ProcessedImage> {
  const { width, height, fit } = IMAGE_VARIANTS[variant];
  const image = sharp(input, {
    limitInputPixels: MAX_INPUT_PIXELS,
    // GIFs and animated webp keep only their first frame.
    animated: false,
  });

  let format: string | undefined;
  try {
    ({ format } = await image.metadata());
  } catch {
    throw new BadRequestException(UNREADABLE);
  }
  if (!format || !ACCEPTED_FORMATS.has(format)) {
    throw new BadRequestException(UNREADABLE);
  }

  try {
    const { data, info } = await image
      // Applies the EXIF orientation, so phone photos are not sideways.
      .rotate()
      .resize(width, height, { fit, withoutEnlargement: fit === 'inside' })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
    return {
      data,
      contentType: 'image/webp',
      width: info.width,
      height: info.height,
    };
  } catch {
    throw new BadRequestException(UNREADABLE);
  }
}
