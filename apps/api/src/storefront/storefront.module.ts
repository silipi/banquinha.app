import { Module } from '@nestjs/common';
import { StorefrontController } from './storefront.controller.js';
import { StorefrontOrdersService } from './storefront-orders.service.js';
import { StorefrontService } from './storefront.service.js';

@Module({
  controllers: [StorefrontController],
  providers: [StorefrontService, StorefrontOrdersService],
})
export class StorefrontModule {}
