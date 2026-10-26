import { PartialType } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { CreateStoreProductDto } from '../../stores/dto/store.dto.js';
import type { ItemKind, PriceType } from '../pricing.js';

export class CreateProductDto extends CreateStoreProductDto {
  /** Hidden from the storefront when false. Defaults to true. */
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

/** Only the fields sent change. The slug stays the same so shared links keep working. */
export class UpdateProductDto extends PartialType(CreateProductDto) {}

export class ReorderProductsDto {
  /** Every product of the store, in the new display order. */
  @IsArray()
  @ArrayMaxSize(1000)
  @IsUUID('all', { each: true })
  productIds: string[];
}

export class ReorderProductImagesDto {
  /** Every photo of the product, in the new order. The first one is the cover. */
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID('all', { each: true })
  imageIds: string[];
}

export class ProductImageDto {
  id: string;
  /** Absolute URL (R2) or a path served by the web app (seed data). */
  url: string;
}

/** A product as the merchant manages it, hidden ones included. */
export class ProductDto {
  id: string;
  /** URL segment: banquinha.app/<handle>/produto/<slug>. */
  slug: string;
  name: string;
  description: string | null;
  kind: ItemKind;
  priceType: PriceType;
  /** Null for "quote". */
  priceCents: number | null;
  active: boolean;
  /** Cover first. */
  images: ProductImageDto[];
}

export class ProductListDto {
  /** In display order. */
  products: ProductDto[];
  /** Limits of the owner's plan. */
  maxProducts: number;
  maxImagesPerProduct: number;
}
