import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, count, desc, eq, lt, sum } from 'drizzle-orm';
import type { AuthUser } from '../auth/current-user.decorator.js';
import type { Db } from '../database/database.js';
import { DB } from '../database/database.module.js';
import { orderItems, orders } from '../database/schema/index.js';
import { StoresService } from '../stores/stores.service.js';
import { customerLinks } from './customer-messages.js';
import type {
  ListOrdersQueryDto,
  OrderDto,
  OrderListDto,
  OrderStatus,
  OrderSummaryDto,
} from './dto/order.dto.js';

const PAGE_SIZE = 30;

type OrderRow = typeof orders.$inferSelect;

const toSummary = (order: OrderRow, itemCount: number): OrderSummaryDto => ({
  id: order.id,
  number: order.number,
  customerName: order.customerName,
  fulfillment: order.fulfillment,
  totalCents: order.totalCents,
  status: order.status,
  itemCount,
  createdAt: order.createdAt.toISOString(),
});

@Injectable()
export class OrdersService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly stores: StoresService,
  ) {}

  async list(
    user: AuthUser,
    storeId: string,
    query: ListOrdersQueryDto,
  ): Promise<OrderListDto> {
    await this.stores.findOwned(user, storeId);

    const rows = await this.db
      .select({
        order: orders,
        itemCount: sum(orderItems.quantity).mapWith(Number),
      })
      .from(orders)
      .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
      .where(
        and(
          eq(orders.storeId, storeId),
          query.status ? eq(orders.status, query.status) : undefined,
          query.before ? lt(orders.number, query.before) : undefined,
        ),
      )
      .groupBy(orders.id)
      .orderBy(desc(orders.number))
      // One extra row tells whether there is a next page.
      .limit(PAGE_SIZE + 1);

    const page = rows.slice(0, PAGE_SIZE);
    return {
      orders: page.map(({ order, itemCount }) =>
        toSummary(order, itemCount ?? 0),
      ),
      nextBefore:
        rows.length > PAGE_SIZE ? page[page.length - 1]!.order.number : null,
      counts: await this.counts(storeId),
    };
  }

  async get(
    user: AuthUser,
    storeId: string,
    orderId: string,
  ): Promise<OrderDto> {
    const store = await this.stores.findOwned(user, storeId);
    const order = await this.db.query.orders.findFirst({
      where: and(eq(orders.id, orderId), eq(orders.storeId, storeId)),
      with: { items: true },
    });
    if (!order) throw new NotFoundException('Pedido não encontrado');

    return {
      ...toSummary(
        order,
        order.items.reduce((total, item) => total + item.quantity, 0),
      ),
      customerWhatsapp: order.customerWhatsapp,
      customerLinks: order.customerWhatsapp
        ? customerLinks(order.customerWhatsapp, {
            storeName: store.name,
            locationUrl: store.locationUrl,
            number: order.number,
            customerName: order.customerName,
            fulfillment: order.fulfillment,
            address: order.address,
            totalCents: order.totalCents,
          })
        : null,
      address: order.address,
      note: order.note,
      items: order.items.map((item) => ({
        name: item.name,
        unitPriceCents: item.unitPriceCents,
        quantity: item.quantity,
        productId: item.productId,
      })),
    };
  }

  async setStatus(
    user: AuthUser,
    storeId: string,
    orderId: string,
    status: OrderStatus,
  ): Promise<OrderDto> {
    await this.stores.findOwned(user, storeId);
    const [updated] = await this.db
      .update(orders)
      .set({ status })
      .where(and(eq(orders.id, orderId), eq(orders.storeId, storeId)))
      .returning({ id: orders.id });
    if (!updated) throw new NotFoundException('Pedido não encontrado');
    return this.get(user, storeId, orderId);
  }

  private async counts(storeId: string): Promise<OrderListDto['counts']> {
    const rows = await this.db
      .select({ status: orders.status, total: count() })
      .from(orders)
      .where(eq(orders.storeId, storeId))
      .groupBy(orders.status);
    const counts: OrderListDto['counts'] = {
      new: 0,
      confirmed: 0,
      completed: 0,
      canceled: 0,
    };
    for (const row of rows) counts[row.status] = row.total;
    return counts;
  }
}
