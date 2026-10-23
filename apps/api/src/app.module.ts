import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthController } from './health/health.controller.js';
import { StorefrontModule } from './storefront/storefront.module.js';
import { StoresModule } from './stores/stores.module.js';
import { ThemesModule } from './themes/themes.module.js';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    ThemesModule,
    StoresModule,
    StorefrontModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
