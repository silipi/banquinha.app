import { Module } from '@nestjs/common';
import { StoresModule } from '../stores/stores.module.js';
import { StoreFieldsController } from './store-fields.controller.js';
import { StoreFieldsService } from './store-fields.service.js';

@Module({
  imports: [StoresModule],
  controllers: [StoreFieldsController],
  providers: [StoreFieldsService],
  exports: [StoreFieldsService],
})
export class StoreFieldsModule {}
