import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import type { FieldValues } from '../../store-fields/field-values.js';
import type { ThemeOverrides, ThemeTokens } from '../../themes/theme-tokens.js';

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/** Limits per plan live in src/plans/plans.ts. */
export const plan = pgEnum('plan', ['free']);

// Merchants. They sign in with email and password, or with Google.
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** Always lowercased. */
  email: text('email').notNull().unique(),
  name: text('name'),
  /** Digits only, with country code (5541999999999). Null until asked, for Google sign-ups. */
  whatsapp: text('whatsapp'),
  /** scrypt hash (see auth/password.ts). Null for accounts created with Google. */
  passwordHash: text('password_hash'),
  /** Google account id (`sub` claim), set on the first Google sign-in. */
  googleSub: text('google_sub').unique(),
  plan: plan('plan').notNull().default('free'),
  ...timestamps,
});

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** SHA-256 of the cookie token; the token itself is never stored. */
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamps.createdAt,
  },
  (table) => [index('sessions_user_idx').on(table.userId)],
);

/** Six-digit codes sent by email to set a new password. */
export const passwordResetCodes = pgTable(
  'password_reset_codes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    codeHash: text('code_hash').notNull(),
    /** Wrong guesses; the code stops working after a few. */
    attempts: integer('attempts').notNull().default(0),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    createdAt: timestamps.createdAt,
  },
  (table) => [
    index('password_reset_codes_user_idx').on(table.userId, table.createdAt),
  ],
);

/**
 * Storefront themes as design tokens (src/themes/theme-tokens.ts). Platform themes have
 * a slug and no owner and are synced from src/themes/system-themes.ts; themes made by a
 * merchant (future theme builder) have an owner and no slug.
 */
export const themes = pgTable(
  'themes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').unique(),
    ownerId: uuid('owner_id').references(() => users.id, {
      onDelete: 'cascade',
    }),
    name: text('name').notNull(),
    description: text('description'),
    /** Lowest plan that can use it. */
    requiredPlan: plan('required_plan').notNull().default('free'),
    tokens: jsonb('tokens').$type<ThemeTokens>().notNull(),
    /** Display order, ascending. */
    position: integer('position').notNull().default(0),
    ...timestamps,
  },
  (table) => [index('themes_owner_idx').on(table.ownerId)],
);

/** Values and rules in src/products/pricing.ts. */
export const itemKind = pgEnum('item_kind', ['product', 'service']);
export const priceType = pgEnum('price_type', [
  'fixed',
  'hourly',
  'daily',
  'from',
  'quote',
]);

export const stores = pgTable('stores', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** Null for the example stores, which belong to the platform. */
  ownerId: uuid('owner_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  /** Public path: banquinha.app/<handle>. Always normalized (see store-handle.ts). */
  handle: text('handle').notNull().unique(),
  name: text('name').notNull(),
  bio: text('bio'),
  city: text('city'),
  logoUrl: text('logo_url'),
  /** Wide image at the top of the storefront. */
  bannerUrl: text('banner_url'),
  themeId: uuid('theme_id')
    .notNull()
    .references(() => themes.id),
  /** The store's own changes on top of its theme's tokens. */
  themeOverrides: jsonb('theme_overrides').$type<ThemeOverrides>(),
  /** Digits only, with country code (5541999999999). Orders are sent here. */
  whatsapp: text('whatsapp').notNull(),
  /** Username without the @. */
  instagram: text('instagram'),
  locationUrl: text('location_url'),
  /**
   * How customers can receive orders. At least one is on. Pickup also means a service done
   * at the store's place, delivery a service done at the customer's.
   */
  pickupEnabled: boolean('pickup_enabled').notNull().default(true),
  deliveryEnabled: boolean('delivery_enabled').notNull().default(true),
  /** Services done remotely. Only for orders made of services. */
  onlineEnabled: boolean('online_enabled').notNull().default(false),
  /** Where the store works, as free text ("Curitiba e região metropolitana"). */
  serviceArea: text('service_area'),
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
    kind: itemKind('kind').notNull().default('product'),
    priceType: priceType('price_type').notNull().default('fixed'),
    /** Per hour or per day for those price types, the starting price for "from"; null for "quote". */
    priceCents: integer('price_cents'),
    /** Display order on the storefront, ascending. */
    position: integer('position').notNull().default(0),
    active: boolean('active').notNull().default(true),
    /** Values of the store's custom fields, by field id (src/store-fields/field-values.ts). */
    attributes: jsonb('attributes').$type<FieldValues>().notNull().default({}),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('products_store_slug_idx').on(table.storeId, table.slug),
    check(
      'products_price_check',
      sql`${table.priceCents} is not null or ${table.priceType} = 'quote'`,
    ),
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

export const fieldType = pgEnum('field_type', [
  'text',
  'number',
  'choice',
  'boolean',
]);

/** Custom fields a store fills in on each item (Ano, Km, Câmbio). */
export const storeFields = pgTable(
  'store_fields',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    storeId: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    label: text('label').notNull(),
    /** Fixed once created: changing it would break the values already filled in. */
    type: fieldType('type').notNull(),
    /** Number fields only ("km"). */
    unit: text('unit'),
    /** Choice fields only. */
    options: jsonb('options').$type<string[]>(),
    /** Shown on the storefront card (the first few marked, see MAX_CARD_FIELDS). */
    showOnCard: boolean('show_on_card').notNull().default(false),
    /** Display order, ascending. Fields past the plan's limit are hidden, not deleted. */
    position: integer('position').notNull().default(0),
    ...timestamps,
  },
  (table) => [index('store_fields_store_idx').on(table.storeId)],
);

/** Online is for orders made only of services. */
export const fulfillmentMethod = pgEnum('fulfillment_method', [
  'pickup',
  'delivery',
  'online',
]);

/** When the customer prefers a service to happen. */
export const dayPeriod = pgEnum('day_period', [
  'morning',
  'afternoon',
  'evening',
]);

/** Where an order stands, set by the merchant from the dashboard. */
export const orderStatus = pgEnum('order_status', [
  'new',
  'confirmed',
  'completed',
  'canceled',
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
    /** Digits only, with country code. Null for orders placed before the bag asked for it. */
    customerWhatsapp: text('customer_whatsapp'),
    fulfillment: fulfillmentMethod('fulfillment').notNull(),
    address: text('address'),
    note: text('note'),
    /** Sum of the items with a firm price; see priceToConfirm. */
    totalCents: integer('total_cents').notNull(),
    /** Some items are priced "from" or "quote", to be settled with the store. */
    priceToConfirm: boolean('price_to_confirm').notNull().default(false),
    preferredDate: date('preferred_date', { mode: 'string' }),
    preferredPeriod: dayPeriod('preferred_period'),
    status: orderStatus('status').notNull().default('new'),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (table) => [
    uniqueIndex('orders_store_number_idx').on(table.storeId, table.number),
    index('orders_store_status_idx').on(table.storeId, table.status),
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
    kind: itemKind('kind').notNull().default('product'),
    priceType: priceType('price_type').notNull().default('fixed'),
    /** Null for "quote". */
    unitPriceCents: integer('unit_price_cents'),
    quantity: integer('quantity').notNull(),
  },
  (table) => [index('order_items_order_idx').on(table.orderId)],
);

export const storesRelations = relations(stores, ({ one, many }) => ({
  theme: one(themes, { fields: [stores.themeId], references: [themes.id] }),
  owner: one(users, { fields: [stores.ownerId], references: [users.id] }),
  products: many(products),
  orders: many(orders),
  fields: many(storeFields),
}));

export const storeFieldsRelations = relations(storeFields, ({ one }) => ({
  store: one(stores, {
    fields: [storeFields.storeId],
    references: [stores.id],
  }),
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
