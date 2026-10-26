import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthController } from './health/health.controller.js';
import { ImagesModule } from './images/images.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { ProductsModule } from './products/products.module.js';
import { StoreFieldsModule } from './store-fields/store-fields.module.js';
import { StorefrontModule } from './storefront/storefront.module.js';
import { StoresModule } from './stores/stores.module.js';
import { ThemesModule } from './themes/themes.module.js';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    ImagesModule,
    ThemesModule,
    StoresModule,
    StoreFieldsModule,
    ProductsModule,
    OrdersModule,
    StorefrontModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
