import sharp from 'sharp';
import { processImage } from './process-image.js';

const photo = (width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: '#4f7a3a' } });

describe('processImage', () => {
  it('turns phone photos upright using their EXIF orientation', async () => {
    // Orientation 6: stored landscape, meant to be shown rotated 90° (portrait).
    const input = await photo(400, 200)
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer();

    const image = await processImage(input, 'product');

    expect(image).toMatchObject({ width: 200, height: 400 });
  });

  it('never enlarges small images', async () => {
    const image = await processImage(
      await photo(300, 200).png().toBuffer(),
      'banner',
    );
    expect(image).toMatchObject({ width: 300, height: 200 });
  });

  it('drops metadata such as GPS location', async () => {
    const input = await photo(100, 100)
      .jpeg()
      .withExif({ IFD3: { GPSLatitude: '25/1 25/1 0/1' } })
      .toBuffer();

    const image = await processImage(input, 'product');

    expect((await sharp(image.data).metadata()).exif).toBeUndefined();
  });

  it('rejects files that are not images', async () => {
    await expect(processImage(Buffer.from('%PDF-1.7'), 'logo')).rejects.toThrow(
      /Não conseguimos abrir essa imagem/,
    );
  });
});
