import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, inArray, max } from 'drizzle-orm';
import type { Db } from '../database/database.js';
import { DB } from '../database/database.module.js';
import {
  orderItems,
  orders,
  products,
  stores,
} from '../database/schema/index.js';
import {
  MAX_ITEM_QUANTITY,
  type CreateOrderDto,
  type CreateOrderItemDto,
  type CreateOrderResponseDto,
} from './dto/create-order.dto.js';
import { buildOrderMessage, whatsappUrl } from './order-message.js';

/** Sums quantities of repeated products, keeping the cart order. */
function mergeItems(items: CreateOrderItemDto[]): Map<string, number> {
  const quantities = new Map<string, number>();
  for (const { slug, quantity } of items) {
    const total = (quantities.get(slug) ?? 0) + quantity;
    quantities.set(slug, Math.min(total, MAX_ITEM_QUANTITY));
  }
  return quantities;
}

const clean = (value?: string) => value?.trim() || null;

@Injectable()
export class StorefrontOrdersService {
  constructor(@Inject(DB) private readonly db: Db) {}

  /**
   * Records an order with server-side prices and returns the WhatsApp link
   * the customer uses to send it to the store.
   */
  async createOrder(
    handle: string,
    input: CreateOrderDto,
  ): Promise<CreateOrderResponseDto> {
    const quantities = mergeItems(input.items);
    const slugs = [...quantities.keys()];

    return this.db.transaction(async (tx) => {
      // Locking the store row serializes order numbers within the store.
      const [store] = await tx
        .select()
        .from(stores)
        .where(eq(stores.handle, handle.toLowerCase()))
        .for('update');
      if (!store) throw new NotFoundException('Loja não encontrada');

      const found = await tx
        .select({
          id: products.id,
          slug: products.slug,
          name: products.name,
          priceCents: products.priceCents,
        })
        .from(products)
        .where(
          and(
            eq(products.storeId, store.id),
            eq(products.active, true),
            inArray(products.slug, slugs),
          ),
        );

      const bySlug = new Map(found.map((product) => [product.slug, product]));
      const unavailableSlugs = slugs.filter((slug) => !bySlug.has(slug));
      if (unavailableSlugs.length > 0) {
        throw new BadRequestException({
          message:
            'Alguns produtos da sua sacola não estão mais disponíveis. Revise a sacola e tente de novo.',
          unavailableSlugs,
        });
      }

      const items = slugs.map((slug) => {
        const product = bySlug.get(slug)!;
        return {
          productId: product.id,
          name: product.name,
          unitPriceCents: product.priceCents,
          quantity: quantities.get(slug)!,
        };
      });
      const totalCents = items.reduce(
        (sum, item) => sum + item.unitPriceCents * item.quantity,
        0,
      );

      const [last] = await tx
        .select({ number: max(orders.number) })
        .from(orders)
        .where(eq(orders.storeId, store.id));
      const number = (last?.number ?? 0) + 1;

      const fulfillment = input.fulfillment;
      const address = fulfillment === 'delivery' ? clean(input.address) : null;
      const note = clean(input.note);
      const customerName = input.customerName.trim();

      const [order] = await tx
        .insert(orders)
        .values({
          storeId: store.id,
          number,
          customerName,
          fulfillment,
          address,
          note,
          totalCents,
        })
        .returning({ id: orders.id });
      await tx
        .insert(orderItems)
        .values(items.map((item) => ({ ...item, orderId: order!.id })));

      const message = buildOrderMessage({
        storeName: store.name,
        number,
        customerName,
        fulfillment,
        address,
        note,
        items,
        totalCents,
      });

      return {
        number,
        totalCents,
        whatsappUrl: whatsappUrl(store.whatsapp, message),
      };
    });
  }
}
