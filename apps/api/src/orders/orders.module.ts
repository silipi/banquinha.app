import { Module } from '@nestjs/common';
import { StoresModule } from '../stores/stores.module.js';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';

@Module({
  imports: [StoresModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
