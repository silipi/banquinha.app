import { Controller, Get } from '@nestjs/common';
import type { SitemapStoreDto } from './dto/storefront.dto.js';
import { StorefrontService } from './storefront.service.js';

@Controller('sitemap')
export class SitemapController {
  constructor(private readonly storefrontService: StorefrontService) {}

  /** Every public store and product URL, for the web app's sitemap.xml. */
  @Get('storefronts')
  listStorefronts(): Promise<SitemapStoreDto[]> {
    return this.storefrontService.listForSitemap();
  }
}
