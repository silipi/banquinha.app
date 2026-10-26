import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { toWhatsappNumber } from '../../common/whatsapp-number.js';

/** Online is only for orders made of services. */
export const FULFILLMENT_METHODS = ['pickup', 'delivery', 'online'] as const;
export type FulfillmentMethod = (typeof FULFILLMENT_METHODS)[number];

export const DAY_PERIODS = ['morning', 'afternoon', 'evening'] as const;
export type DayPeriod = (typeof DAY_PERIODS)[number];

export const MAX_ITEM_QUANTITY = 99;

export class CreateOrderItemDto {
  @IsString()
  @Matches(/^[a-z0-9-]+$/)
  @MaxLength(100)
  slug: string;

  @IsInt()
  @Min(1)
  @Max(MAX_ITEM_QUANTITY, {
    message: `Máximo de ${MAX_ITEM_QUANTITY} unidades por produto`,
  })
  quantity: number;
}

export class CreateOrderDto {
  @IsString()
  @MinLength(2, { message: 'Informe seu nome' })
  @MaxLength(80, { message: 'Nome muito longo' })
  customerName: string;

  /** So the store can reply about the order. Any common format; stored as digits with the country code. */
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? (toWhatsappNumber(value) ?? value) : value,
  )
  @IsString()
  @Matches(/^55\d{11}$/, {
    message: 'Confira seu WhatsApp: use o DDD e o número do celular',
  })
  customerWhatsapp: string;

  @IsIn(FULFILLMENT_METHODS)
  fulfillment: FulfillmentMethod;

  /** Required for delivery. */
  @ValidateIf((order: CreateOrderDto) => order.fulfillment === 'delivery')
  @IsString()
  @MinLength(5, { message: 'Informe o endereço de entrega' })
  @MaxLength(300, { message: 'Endereço muito longo' })
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Observação muito longa' })
  note?: string;

  /** For services: the day the customer would like, as YYYY-MM-DD. Ignored without services. */
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Escolha uma data válida' })
  preferredDate?: string;

  /** For services: the part of the day the customer would like. Ignored without services. */
  @IsOptional()
  @IsIn(DAY_PERIODS, { message: 'Escolha manhã, tarde ou noite' })
  preferredPeriod?: DayPeriod;

  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  @ArrayMinSize(1, { message: 'Sua sacola está vazia' })
  @ArrayMaxSize(50, { message: 'Pedido com produtos demais' })
  items: CreateOrderItemDto[];
}

export class CreateOrderResponseDto {
  /** Sequential within the store. */
  number: number;
  /** Items with a firm price only; see priceToConfirm. */
  totalCents: number;
  /** Some items are priced "from" or "quote", to be settled with the store. */
  priceToConfirm: boolean;
  /** wa.me link with the order message, ready to open. */
  whatsappUrl: string;
}
