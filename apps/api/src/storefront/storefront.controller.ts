import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Public } from '../auth/public.decorator.js';
import {
  CreateOrderDto,
  type CreateOrderResponseDto,
} from './dto/create-order.dto.js';
import type {
  StorefrontProductDto,
  StorefrontStoreDto,
} from './dto/storefront.dto.js';
import { OrderThrottlerGuard } from './order-throttler.guard.js';
import { StorefrontOrdersService } from './storefront-orders.service.js';
import { StorefrontService } from './storefront.service.js';

@Public()
@Controller('storefront')
export class StorefrontController {
  constructor(
    private readonly storefrontService: StorefrontService,
    private readonly ordersService: StorefrontOrdersService,
  ) {}

  /** Public store page: store info and its active products. */
  @Get(':handle')
  getStore(@Param('handle') handle: string): Promise<StorefrontStoreDto> {
    return this.storefrontService.getStore(handle);
  }

  /** Public product page. */
  @Get(':handle/products/:slug')
  getProduct(
    @Param('handle') handle: string,
    @Param('slug') slug: string,
  ): Promise<StorefrontProductDto> {
    return this.storefrontService.getProduct(handle, slug);
  }

  /**
   * Places an order from the cart. Prices come from the database, not the client.
   * A 400 with `unavailableSlugs` means some products were removed or deactivated;
   * a 429 means the customer sent too many orders in a short time.
   */
  @Post(':handle/orders')
  @UseGuards(OrderThrottlerGuard)
  createOrder(
    @Param('handle') handle: string,
    @Body() body: CreateOrderDto,
  ): Promise<CreateOrderResponseDto> {
    return this.ordersService.createOrder(handle, body);
  }
}
