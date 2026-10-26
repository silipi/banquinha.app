import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  Logger,
  PayloadTooLargeException,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { ImageStorage } from './image-storage.js';
import {
  MAX_UPLOAD_BYTES,
  processImage,
  type ImageVariant,
} from './process-image.js';

const MAX_UPLOAD_MB = MAX_UPLOAD_BYTES / 1024 / 1024;

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);

  constructor(private readonly storage: ImageStorage) {}

  /** Reads the `file` field of a multipart request (see UploadImageDto). */
  async readUpload(request: FastifyRequest): Promise<Buffer> {
    if (!request.isMultipart()) {
      throw new BadRequestException('Envie a imagem como multipart/form-data');
    }
    try {
      const file = await request.file();
      if (!file || file.fieldname !== 'file') {
        throw new BadRequestException('Escolha uma imagem para enviar');
      }
      return await file.toBuffer();
    } catch (error) {
      if ((error as { code?: string }).code === 'FST_REQ_FILE_TOO_LARGE') {
        throw new PayloadTooLargeException(
          `Imagem muito grande. Envie uma de até ${MAX_UPLOAD_MB} MB.`,
        );
      }
      throw error;
    }
  }

  /**
   * Processes and stores an upload under `<keyPrefix>-<random>.webp`; returns its URL.
   * Random names keep each URL immutable, so browsers and next/image can cache forever.
   */
  async save(
    file: Buffer,
    variant: ImageVariant,
    keyPrefix: string,
  ): Promise<string> {
    const image = await processImage(file, variant);
    return this.storage.put(
      `${keyPrefix}-${randomUUID()}.webp`,
      image.data,
      image.contentType,
    );
  }

  /**
   * Deletes an uploaded image after it stopped being used. URLs the storage does not own
   * (seed images) are left alone, and failures are only logged: an orphan file is harmless.
   */
  async remove(url: string | null | undefined): Promise<void> {
    const key = url ? this.storage.keyOf(url) : null;
    if (!key) return;
    try {
      await this.storage.delete(key);
    } catch (error) {
      this.logger.warn(`Could not delete image ${key}: ${String(error)}`);
    }
  }
}
