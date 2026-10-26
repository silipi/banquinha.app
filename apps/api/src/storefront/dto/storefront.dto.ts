import type { ItemKind, PriceType } from '../../products/pricing.js';
import { ThemeTokensDto } from '../../themes/dto/theme.dto.js';
import type { FulfillmentMethod } from './create-order.dto.js';

/** Public store identity, shown on every storefront page. */
export class StorefrontStoreSummaryDto {
  handle: string;
  name: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  /** Design tokens to render with: the store's theme plus its own overrides. */
  theme: ThemeTokensDto;
}

export class StorefrontContactDto {
  /** Digits only, with country code. */
  whatsapp: string;
  /** Username without the @. */
  instagram: string | null;
  locationUrl: string | null;
}

export class StorefrontProductSummaryDto {
  slug: string;
  name: string;
  kind: ItemKind;
  priceType: PriceType;
  /** Null for "quote". */
  priceCents: number | null;
  /** Cover image. Absolute URL or a path served by the web app. */
  imageUrl: string | null;
  /** Custom field values for the card, formatted ("2019", "45.000 km"). At most two. */
  highlights: string[];
}

export class StorefrontStoreDto extends StorefrontStoreSummaryDto {
  bio: string | null;
  city: string | null;
  /** Where the store works ("Curitiba e região metropolitana"). */
  serviceArea: string | null;
  contact: StorefrontContactDto;
  /** Ways to receive an order the store offers. Never empty. Online is only for services. */
  fulfillment: FulfillmentMethod[];
  /** Active products, in display order. */
  products: StorefrontProductSummaryDto[];
}

export class StorefrontProductImageDto {
  url: string;
}

/** A custom field of the item, formatted for reading: "Km" / "45.000 km". */
export class StorefrontAttributeDto {
  label: string;
  value: string;
}

export class StorefrontProductDto {
  slug: string;
  name: string;
  description: string | null;
  kind: ItemKind;
  priceType: PriceType;
  /** Null for "quote". */
  priceCents: number | null;
  /** Cover first. */
  images: StorefrontProductImageDto[];
  /** Filled-in custom fields, in the store's order. */
  attributes: StorefrontAttributeDto[];
  store: StorefrontStoreSummaryDto;
}

export class SitemapProductDto {
  slug: string;
  updatedAt: string;
}

export class SitemapStoreDto {
  handle: string;
  updatedAt: string;
  /** Active products only. */
  products: SitemapProductDto[];
}
