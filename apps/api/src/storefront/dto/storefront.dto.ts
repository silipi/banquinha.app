import { ThemeTokensDto } from '../../themes/dto/theme.dto.js';

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
  priceCents: number;
  /** Cover image. Absolute URL or a path served by the web app. */
  imageUrl: string | null;
}

export class StorefrontStoreDto extends StorefrontStoreSummaryDto {
  bio: string | null;
  city: string | null;
  contact: StorefrontContactDto;
  /** Active products, in display order. */
  products: StorefrontProductSummaryDto[];
}

export class StorefrontProductImageDto {
  url: string;
}

export class StorefrontProductDto {
  slug: string;
  name: string;
  description: string | null;
  priceCents: number;
  /** Cover first. */
  images: StorefrontProductImageDto[];
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
