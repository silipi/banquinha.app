import { Module } from '@nestjs/common';
import { loadEnv, r2Config } from '../env.js';
import {
  ImageStorage,
  LocalImageStorage,
  R2ImageStorage,
} from './image-storage.js';
import { ImagesService } from './images.service.js';
import { UploadsController } from './uploads.controller.js';

@Module({
  controllers: [UploadsController],
  providers: [
    ImagesService,
    {
      provide: ImageStorage,
      useFactory: () => {
        const env = loadEnv();
        const r2 = r2Config(env);
        return r2
          ? new R2ImageStorage(r2)
          : new LocalImageStorage(env.UPLOADS_DIR);
      },
    },
  ],
  exports: [ImagesService],
})
export class ImagesModule {}
