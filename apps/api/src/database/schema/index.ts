import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

// The owning merchant arrives in phase 2 with auth.
export const stores = pgTable('stores', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** Public address: <handle>.vendeu.store. Always normalized (see store-handle.ts). */
  handle: text('handle').notNull().unique(),
  name: text('name').notNull(),
  bio: text('bio'),
  city: text('city'),
  logoUrl: text('logo_url'),
  /** Hex color used to theme the storefront. */
  accentColor: text('accent_color').notNull().default('#ff5a1f'),
  /** Digits only, with country code (5541999999999). Orders are sent here. */
  whatsapp: text('whatsapp').notNull(),
  /** Username without the @. */
  instagram: text('instagram'),
  locationUrl: text('location_url'),
  ...timestamps,
});

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    storeId: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    /** URL segment, unique within the store. */
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    priceCents: integer('price_cents').notNull(),
    /** Display order on the storefront, ascending. */
    position: integer('position').notNull().default(0),
    active: boolean('active').notNull().default(true),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('products_store_slug_idx').on(table.storeId, table.slug),
  ],
);

export const productImages = pgTable(
  'product_images',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    /** Absolute URL (R2) or a path served by the web app (seed data). */
    url: text('url').notNull(),
    /** The lowest position is the cover image. */
    position: integer('position').notNull().default(0),
    createdAt: timestamps.createdAt,
  },
  (table) => [index('product_images_product_idx').on(table.productId)],
);

export const fulfillmentMethod = pgEnum('fulfillment_method', [
  'pickup',
  'delivery',
]);

// Orders are placed from the storefront and finished on the merchant's WhatsApp.
export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    storeId: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    /** Sequential within the store, shown to people as "Pedido #12". */
    number: integer('number').notNull(),
    customerName: text('customer_name').notNull(),
    fulfillment: fulfillmentMethod('fulfillment').notNull(),
    address: text('address'),
    note: text('note'),
    totalCents: integer('total_cents').notNull(),
    createdAt: timestamps.createdAt,
  },
  (table) => [
    uniqueIndex('orders_store_number_idx').on(table.storeId, table.number),
  ],
);

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    /** Kept for reporting; name and price below are snapshots in case the product changes. */
    productId: uuid('product_id').references(() => products.id, {
      onDelete: 'set null',
    }),
    name: text('name').notNull(),
    unitPriceCents: integer('unit_price_cents').notNull(),
    quantity: integer('quantity').notNull(),
  },
  (table) => [index('order_items_order_idx').on(table.orderId)],
);

export const storesRelations = relations(stores, ({ many }) => ({
  products: many(products),
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  store: one(stores, { fields: [orders.storeId], references: [stores.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  store: one(stores, { fields: [products.storeId], references: [stores.id] }),
  images: many(productImages),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));
