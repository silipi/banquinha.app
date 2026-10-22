import { Module } from '@nestjs/common';
import { SitemapController } from './sitemap.controller.js';
import { StorefrontController } from './storefront.controller.js';
import { StorefrontOrdersService } from './storefront-orders.service.js';
import { StorefrontService } from './storefront.service.js';

@Module({
  controllers: [StorefrontController, SitemapController],
  providers: [StorefrontService, StorefrontOrdersService],
})
export class StorefrontModule {}
