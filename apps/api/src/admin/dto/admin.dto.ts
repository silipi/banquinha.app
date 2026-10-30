import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PLAN_IDS, type PlanId } from '../../plans/plans.js';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

// Auth

export class AdminLoginDto {
  @IsString()
  @MaxLength(200)
  username: string;

  @IsString()
  @MaxLength(200)
  password: string;

  /** The 6-digit code from the authenticator app. */
  @IsString()
  @Matches(/^\d{6}$/, { message: 'O código tem 6 dígitos' })
  code: string;
}

export class AdminMeDto {
  environment: 'development' | 'staging' | 'production';
  /** When the session ends at the latest (ISO). */
  expiresAt: string;
}

// Shared

export class CountDto {
  /** Machine value (plan id, city, item kind…). */
  key: string;
  /** pt-BR label. */
  label: string;
  count: number;
}

export class PlanSummaryDto {
  /** The plan whose limits apply. */
  effective: PlanId;
  /** The plan paid for (billing). */
  paid: PlanId;
  override: PlanId | null;
  /** ISO; null when the override never ends. */
  overrideExpiresAt: string | null;
  overrideReason: string | null;
  /** False once the expiry passed (the override stays on record until removed). */
  overrideActive: boolean;
}

export class AuditEntryDto {
  id: string;
  action: string;
  summary: string;
  targetType: string | null;
  targetId: string | null;
  details: Record<string, unknown> | null;
  userAgent: string | null;
  createdAt: string;
}

export class AuditLogDto {
  entries: AuditEntryDto[];
  /** Pass as `before` for the next page; null on the last one. */
  nextBefore: string | null;
}

export class AuditLogQueryDto {
  @IsOptional()
  @IsDateString()
  before?: string;
}

// Overview

export class WeekDto {
  /** Monday of the week (YYYY-MM-DD, São Paulo time). */
  week: string;
  signups: number;
  /** Of the accounts created that week, how many have created a store by now. */
  signupsWithStore: number;
  storesCreated: number;
  orders: number;
}

export class OverviewTotalsDto {
  accounts: number;
  /** Merchant stores (example stores excluded). */
  stores: number;
  suspendedStores: number;
  products: number;
  services: number;
  photos: number;
  orders: number;
  ordersLast30Days: number;
  /** Stores with at least one order in the last 30 days. */
  activeStoresLast30Days: number;
  /** Accounts with a plan override in force. */
  compedAccounts: number;
  /** Sum of the firm part of every order, in cents. */
  orderValueCents: number;
}

export class FunnelStepDto {
  key: string;
  label: string;
  count: number;
}

export class AveragesDto {
  productsPerStore: number;
  photosPerProduct: number;
  ordersPerActiveStore: number;
  /** Mean firm total of the orders, in cents. */
  orderValueCents: number;
}

export class AdminOverviewDto {
  environment: 'development' | 'staging' | 'production';
  generatedAt: string;
  totals: OverviewTotalsDto;
  averages: AveragesDto;
  /** Last 12 weeks, oldest first. */
  weeks: WeekDto[];
  /** Accounts at each step, from sign-up to the first order. */
  funnel: FunnelStepDto[];
  plans: CountDto[];
  signupMethods: CountDto[];
  itemKinds: CountDto[];
  priceTypes: CountDto[];
  /** Top cities by number of stores. */
  cities: CountDto[];
  themes: CountDto[];
  fulfillment: CountDto[];
  orderStatuses: CountDto[];
  productsPerStore: CountDto[];
  photosPerProduct: CountDto[];
  ordersPerStore: CountDto[];
}

// Stores

export const STORE_FILTERS = ['all', 'live', 'suspended', 'examples'] as const;
export type StoreFilter = (typeof STORE_FILTERS)[number];

export class AdminStoreListQueryDto {
  /** Searches handle, name, city and owner email. */
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsIn(STORE_FILTERS)
  filter?: StoreFilter;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(1000)
  page?: number;
}

export class AdminOwnerDto {
  id: string;
  email: string;
  name: string | null;
  whatsapp: string | null;
}

export class AdminStoreRowDto {
  id: string;
  handle: string;
  name: string;
  city: string | null;
  /** Null for the example stores. */
  owner: AdminOwnerDto | null;
  plan: PlanId;
  productCount: number;
  photoCount: number;
  orderCount: number;
  lastOrderAt: string | null;
  createdAt: string;
  suspendedAt: string | null;
}

export class AdminStoreListDto {
  stores: AdminStoreRowDto[];
  total: number;
  page: number;
  pageSize: number;
}

export class AdminProductRowDto {
  id: string;
  slug: string;
  name: string;
  kind: 'product' | 'service';
  priceType: 'fixed' | 'hourly' | 'daily' | 'from' | 'quote';
  priceCents: number | null;
  active: boolean;
  photoCount: number;
}

export class AdminOrderRowDto {
  id: string;
  number: number;
  status: 'new' | 'confirmed' | 'completed' | 'canceled';
  fulfillment: 'pickup' | 'delivery' | 'online';
  totalCents: number;
  priceToConfirm: boolean;
  itemCount: number;
  createdAt: string;
}

export class AdminStoreDto extends AdminStoreRowDto {
  bio: string | null;
  whatsapp: string;
  instagram: string | null;
  serviceArea: string | null;
  themeName: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  fieldCount: number;
  suspensionReason: string | null;
  planDetails: PlanSummaryDto | null;
  products: AdminProductRowDto[];
  /** The 20 most recent. */
  recentOrders: AdminOrderRowDto[];
  ordersByStatus: CountDto[];
  audit: AuditEntryDto[];
}

export class SuspendStoreDto {
  @Transform(trim)
  @IsString()
  @MinLength(3, { message: 'Escreva o motivo' })
  @MaxLength(500)
  reason: string;
}

export class DeleteStoreDto {
  /** The store's handle, typed again as confirmation. */
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  handle: string;

  /** Required in production: a fresh code from the authenticator app. */
  @IsOptional()
  @IsString()
  @Matches(/^\d{6}$/, { message: 'O código tem 6 dígitos' })
  code?: string;
}

export class DeletedStoreDto {
  handle: string;
  productCount: number;
  orderCount: number;
  photoCount: number;
}

// Accounts

export class AdminAccountListQueryDto {
  /** Searches email, name and WhatsApp. */
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  q?: string;

  /** Only accounts with a plan override (in force or expired). */
  @IsOptional()
  @Transform(
    ({ value }: { value: unknown }) => value === 'true' || value === true,
  )
  comped?: boolean;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(1000)
  page?: number;
}

export class AdminAccountRowDto {
  id: string;
  email: string;
  name: string | null;
  whatsapp: string | null;
  /** How the account signs in. */
  signInMethods: ('password' | 'google')[];
  plan: PlanSummaryDto;
  storeCount: number;
  createdAt: string;
  /** Start of the most recent session still on record. */
  lastSignInAt: string | null;
}

export class AdminAccountListDto {
  accounts: AdminAccountRowDto[];
  total: number;
  page: number;
  pageSize: number;
}

export class AdminAccountStoreDto {
  id: string;
  handle: string;
  name: string;
  suspendedAt: string | null;
}

export class AdminAccountDto extends AdminAccountRowDto {
  stores: AdminAccountStoreDto[];
  audit: AuditEntryDto[];
}

export class SetPlanOverrideDto {
  @IsIn(PLAN_IDS)
  plan: PlanId;

  /** ISO date or date-time; omit or null for no end. */
  @IsOptional()
  @IsDateString({}, { message: 'Data inválida' })
  expiresAt?: string | null;

  @Transform(trim)
  @IsString()
  @MinLength(3, { message: 'Escreva o motivo' })
  @MaxLength(500)
  reason: string;
}
