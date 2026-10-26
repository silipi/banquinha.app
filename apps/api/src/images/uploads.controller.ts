import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { FastifyReply } from 'fastify';
import { Public } from '../auth/public.decorator.js';
import { ImageStorage, LocalImageStorage } from './image-storage.js';

/** Serves uploads kept on disk when R2 is not configured (development and tests). */
@ApiExcludeController()
@Controller('uploads')
export class UploadsController {
  constructor(private readonly storage: ImageStorage) {}

  @Public()
  @Get('*')
  async get(
    @Param('*') key: string,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    const file =
      this.storage instanceof LocalImageStorage
        ? await this.storage.read(key)
        : null;
    if (!file) throw new NotFoundException('Imagem não encontrada');
    await reply
      .type('image/webp')
      .header('cache-control', 'public, max-age=31536000, immutable')
      .send(file);
  }
}
