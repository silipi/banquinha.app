import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { loadEnv } from '../env.js';
import { OrderThrottlerGuard } from './order-throttler.guard.js';
import { SitemapController } from './sitemap.controller.js';
import { StorefrontController } from './storefront.controller.js';
import { StorefrontOrdersService } from './storefront-orders.service.js';
import { StorefrontService } from './storefront.service.js';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      useFactory: () => ({
        throttlers: [
          { name: 'orders', ttl: 60_000, limit: loadEnv().ORDER_RATE_LIMIT },
        ],
        errorMessage:
          'Muitos pedidos em pouco tempo. Espere um minuto e tente de novo.',
      }),
    }),
  ],
  controllers: [StorefrontController, SitemapController],
  providers: [StorefrontService, StorefrontOrdersService, OrderThrottlerGuard],
})
export class StorefrontModule {}
