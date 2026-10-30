import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  INSTAGRAM_USERNAME,
  toInstagramUsername,
} from '../../common/instagram.js';
import { toWhatsappNumber } from '../../common/whatsapp-number.js';
import {
  ITEM_KINDS,
  PRICE_TYPES,
  type ItemKind,
  type PriceType,
} from '../../products/pricing.js';
import { ThemeTokensDto } from '../../themes/dto/theme.dto.js';

export const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

/** Empty text means "remove it". */
export const trimOrNull = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() || null : value;

export const MAX_PRICE_CENTS = 10_000_000;

export class CreateStoreProductDto {
  @Transform(trim)
  @IsString()
  @MinLength(2, { message: 'Dê um nome ao produto' })
  @MaxLength(80, { message: 'Nome do produto muito longo' })
  name: string;

  /** A product by default. */
  @IsOptional()
  @IsIn(ITEM_KINDS)
  kind?: ItemKind;

  /** How the price reads; fixed by default. Hourly and daily are for services only. */
  @IsOptional()
  @IsIn(PRICE_TYPES, { message: 'Escolha como cobrar' })
  priceType?: PriceType;

  /**
   * Price in cents (R$ 25,90 = 2590): per hour or per day for those price types, the
   * starting price for "from". Required except for "quote", which has none.
   */
  @IsOptional()
  @IsInt({ message: 'Informe o preço' })
  @Min(1, { message: 'Informe o preço' })
  @Max(MAX_PRICE_CENTS, { message: 'Preço muito alto' })
  priceCents?: number | null;

  @IsOptional()
  @Transform(trimOrNull)
  @IsString()
  @MaxLength(500, { message: 'Descrição muito longa' })
  description?: string | null;
}

export class CreateStoreDto {
  /** Desired address as free text; normalized like GET /stores/handle-availability. */
  @IsString()
  @MaxLength(100)
  handle: string;

  @Transform(trim)
  @IsString()
  @MinLength(2, { message: 'Dê um nome à sua loja' })
  @MaxLength(60, { message: 'Nome da loja muito longo' })
  name: string;

  /** Where orders go. Any common format; stored as digits with the country code. */
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? (toWhatsappNumber(value) ?? value) : value,
  )
  @IsString()
  @Matches(/^55\d{11}$/, {
    message: 'Confira o WhatsApp: use o DDD e o número do celular',
  })
  whatsapp: string;

  /** A theme from GET /themes. The first platform theme when omitted. */
  @IsOptional()
  @IsUUID('all', { message: 'Escolha um dos temas' })
  themeId?: string;

  /** Ways to receive orders; pickup and delivery on, online off when omitted. */
  @IsOptional()
  @IsBoolean()
  pickupEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  deliveryEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  onlineEnabled?: boolean;

  /** At least one; at most what the plan allows. */
  @ValidateNested({ each: true })
  @Type(() => CreateStoreProductDto)
  @ArrayMinSize(1, { message: 'Cadastre pelo menos um produto' })
  @ArrayMaxSize(100)
  products: CreateStoreProductDto[];
}

export class UpdateStoreDto {
  /** Short description shown under the store name. Empty removes it. */
  @IsOptional()
  @Transform(trimOrNull)
  @IsString()
  @MaxLength(300, { message: 'Descrição muito longa (até 300 caracteres)' })
  bio?: string | null;

  /** A theme from GET /themes. */
  @IsOptional()
  @IsUUID('all', { message: 'Escolha um dos temas' })
  themeId?: string;

  /**
   * The store's own button and highlight color on top of its theme, as #rrggbb. The text
   * on it is picked for contrast. Null goes back to the theme's color.
   */
  @IsOptional()
  @Matches(/^#[0-9a-f]{6}$/i, { message: 'Escolha uma cor válida' })
  accentColor?: string | null;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(2, { message: 'Dê um nome à sua loja' })
  @MaxLength(60, { message: 'Nome da loja muito longo' })
  name?: string;

  /** Shown next to the location button. Empty removes it. */
  @IsOptional()
  @Transform(trimOrNull)
  @IsString()
  @MaxLength(60, { message: 'Nome da cidade muito longo' })
  city?: string | null;

  /** Where orders go. Any common format; stored as digits with the country code. */
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? (toWhatsappNumber(value) ?? value) : value,
  )
  @IsString()
  @Matches(/^55\d{11}$/, {
    message: 'Confira o WhatsApp: use o DDD e o número do celular',
  })
  whatsapp?: string;

  /** Username, @username or profile link. Empty removes it. */
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? toInstagramUsername(value) || null : value,
  )
  @IsString()
  @Matches(INSTAGRAM_USERNAME, {
    message: 'Confira o Instagram: use só o nome de usuário, como @minhaloja',
  })
  instagram?: string | null;

  /** A maps link (Google Maps, Waze...). Empty removes it. */
  @IsOptional()
  @Transform(trimOrNull)
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'Cole o link completo, começando com https://' },
  )
  @MaxLength(500, { message: 'Link muito longo' })
  locationUrl?: string | null;

  /** Customers may pick the order up. At least one way to receive must stay on. */
  @IsOptional()
  @IsBoolean()
  pickupEnabled?: boolean;

  /** Customers may ask for delivery, or for a service at their place. */
  @IsOptional()
  @IsBoolean()
  deliveryEnabled?: boolean;

  /** Services done remotely; only offered for orders made of services. */
  @IsOptional()
  @IsBoolean()
  onlineEnabled?: boolean;

  /** Where the store works, shown on the storefront. Empty removes it. */
  @IsOptional()
  @Transform(trimOrNull)
  @IsString()
  @MaxLength(120, { message: 'Região muito longa (até 120 caracteres)' })
  serviceArea?: string | null;
}

export const STORE_IMAGE_SLOTS = ['logo', 'banner'] as const;
export type StoreImageSlot = (typeof STORE_IMAGE_SLOTS)[number];

/** multipart/form-data body of an image upload. */
export class UploadImageDto {
  /** JPG, PNG or WebP, up to 10 MB. Stored as webp. */
  @ApiProperty({ type: 'string', format: 'binary' })
  file: Blob;
}

export class StoreSummaryDto {
  id: string;
  handle: string;
  name: string;
}

export class StoreSetupStepDto {
  /** Something the merchant can still customize after the onboarding. */
  id: 'logo' | 'banner' | 'description';
  done: boolean;
}

/** A merchant's own store, for the dashboard. */
export class StoreDashboardDto extends StoreSummaryDto {
  bio: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  themeId: string;
  /** The theme's tokens with the store's overrides applied. */
  theme: ThemeTokensDto;
  productCount: number;
  /** Product limit of the owner's plan. */
  maxProducts: number;
  /** Optional customizations, in the order to suggest them. */
  setup: StoreSetupStepDto[];
  /** The store's own accent color, or null when it uses the theme's. */
  accentColor: string | null;
  city: string | null;
  /** Digits only, with country code. */
  whatsapp: string;
  /** Username without the @. */
  instagram: string | null;
  locationUrl: string | null;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  onlineEnabled: boolean;
  serviceArea: string | null;
  orderCount: number;
  /** Orders still marked as new. */
  newOrderCount: number;
  /** Set when the platform took the storefront offline; the panel shows a notice. */
  suspended: boolean;
}
