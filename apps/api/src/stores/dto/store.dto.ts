import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { toWhatsappNumber } from '../../common/whatsapp-number.js';
import { ThemeTokensDto } from '../../themes/dto/theme.dto.js';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

/** Empty text means "remove it". */
const trimOrNull = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() || null : value;

export const MAX_PRICE_CENTS = 10_000_000;

export class CreateStoreProductDto {
  @Transform(trim)
  @IsString()
  @MinLength(2, { message: 'Dê um nome ao produto' })
  @MaxLength(80, { message: 'Nome do produto muito longo' })
  name: string;

  /** Price in cents (R$ 25,90 = 2590). */
  @IsInt({ message: 'Informe o preço' })
  @Min(1, { message: 'Informe o preço' })
  @Max(MAX_PRICE_CENTS, { message: 'Preço muito alto' })
  priceCents: number;

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
}
