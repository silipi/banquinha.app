import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';
import type { ItemKind, PriceType } from '../../products/pricing.js';
import type {
  DayPeriod,
  FulfillmentMethod,
} from '../../storefront/dto/create-order.dto.js';

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
  fulfillment: FulfillmentMethod;
  /** Items with a firm price only; see priceToConfirm. */
  totalCents: number;
  /** Some items are priced "from" or "quote", to be settled with the customer. */
  priceToConfirm: boolean;
  /** At least one item is a service. */
  hasServices: boolean;
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
  /** Name and pricing as they were when the order was placed. */
  name: string;
  kind: ItemKind;
  priceType: PriceType;
  /** Null for "quote". */
  unitPriceCents: number | null;
  quantity: number;
  /** Null when the product was deleted since. */
  productId: string | null;
}

/** wa.me links to the customer, each with a ready message in pt-BR. */
export class OrderCustomerLinksDto {
  /** Opens the chat with a short greeting about the order. */
  chat: string;
  confirmed: string;
  /**
   * The order is ready: for pickup or out for delivery, or for services ready to start
   * or on the way, by the order's fulfillment.
   */
  ready: string;
  completed: string;
  canceled: string;
}

export class OrderDto extends OrderSummaryDto {
  /** Digits only, with country code. Null for orders placed before the bag asked for it. */
  customerWhatsapp: string | null;
  /** Null when there is no customerWhatsapp. */
  customerLinks: OrderCustomerLinksDto | null;
  /** Delivery address (or where to do the service); null for pickup and online. */
  address: string | null;
  note: string | null;
  /** For services: the day the customer would like, as YYYY-MM-DD. */
  preferredDate: string | null;
  preferredPeriod: DayPeriod | null;
  items: OrderItemDto[];
}
