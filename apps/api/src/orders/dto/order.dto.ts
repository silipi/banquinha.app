import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

export const ORDER_STATUSES = [
  'new',
  'confirmed',
  'completed',
  'canceled',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export class ListOrdersQueryDto {
  /** Only orders with this status. All when omitted. */
  @IsOptional()
  @IsIn(ORDER_STATUSES)
  status?: OrderStatus;

  /** Next page: orders numbered below this (`nextBefore` of the previous page). */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  before?: number;
}

export class UpdateOrderDto {
  @IsIn(ORDER_STATUSES, { message: 'Escolha um status válido' })
  status: OrderStatus;
}

export class OrderSummaryDto {
  id: string;
  /** Sequential within the store: "Pedido #12". */
  number: number;
  customerName: string;
  fulfillment: 'pickup' | 'delivery';
  totalCents: number;
  status: OrderStatus;
  /** Units across all items. */
  itemCount: number;
  createdAt: string;
}

export class OrderStatusCountsDto {
  new: number;
  confirmed: number;
  completed: number;
  canceled: number;
}

export class OrderListDto {
  /** Newest first. */
  orders: OrderSummaryDto[];
  /** Pass as `before` for the next page; null on the last one. */
  nextBefore: number | null;
  /** All the store's orders per status, regardless of the filter. */
  counts: OrderStatusCountsDto;
}

export class OrderItemDto {
  /** Name and price as they were when the order was placed. */
  name: string;
  unitPriceCents: number;
  quantity: number;
  /** Null when the product was deleted since. */
  productId: string | null;
}

export class OrderDto extends OrderSummaryDto {
  /** Delivery address; null for pickup. */
  address: string | null;
  note: string | null;
  items: OrderItemDto[];
}
