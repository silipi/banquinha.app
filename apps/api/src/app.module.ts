import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module.js';
import { HealthController } from './health/health.controller.js';
import { StorefrontModule } from './storefront/storefront.module.js';
import { StoresModule } from './stores/stores.module.js';

@Module({
  imports: [DatabaseModule, StoresModule, StorefrontModule],
  controllers: [HealthController],
})
export class AppModule {}
