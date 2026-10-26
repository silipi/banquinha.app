import { Module } from '@nestjs/common';
import { ImagesModule } from '../images/images.module.js';
import { ThemesModule } from '../themes/themes.module.js';
import { StoresController } from './stores.controller.js';
import { StoresService } from './stores.service.js';

@Module({
  imports: [ImagesModule, ThemesModule],
  controllers: [StoresController],
  providers: [StoresService],
  exports: [StoresService],
})
export class StoresModule {}
