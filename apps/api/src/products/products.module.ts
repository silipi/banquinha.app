import { Module } from '@nestjs/common';
import { ImagesModule } from '../images/images.module.js';
import { StoreFieldsModule } from '../store-fields/store-fields.module.js';
import { StoresModule } from '../stores/stores.module.js';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';

@Module({
  imports: [ImagesModule, StoresModule, StoreFieldsModule],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
