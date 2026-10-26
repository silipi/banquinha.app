import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator.js';
import {
  ListOrdersQueryDto,
  OrderDto,
  OrderListDto,
  UpdateOrderDto,
} from './dto/order.dto.js';
import { OrdersService } from './orders.service.js';

/** Orders placed on a merchant's storefront. 404 when the store or order isn't theirs. */
@Controller('stores/:storeId/orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  /** Newest first, a page at a time, optionally by status. */
  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Query() query: ListOrdersQueryDto,
  ): Promise<OrderListDto> {
    return this.orders.list(user, storeId, query);
  }

  /** The order with its items and the customer's details. */
  @Get(':orderId')
  get(
    @CurrentUser() user: AuthUser,
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ): Promise<OrderDto> {
    return this.orders.get(user, storeId, orderId);
  }

  /** Moves the order along: confirmed, completed or canceled (or back to new). */
  @Patch(':orderId')
  update(
    @CurrentUser() user: AuthUser,
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() body: UpdateOrderDto,
  ): Promise<OrderDto> {
    return this.orders.setStatus(user, storeId, orderId, body.status);
  }
}
