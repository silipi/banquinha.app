/** Public store identity, shown on every storefront page. */
export class StorefrontStoreSummaryDto {
  handle: string;
  name: string;
  logoUrl: string | null;
  /** Hex color used to theme the storefront. */
  accentColor: string;
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
