import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator.js';
import { ImagesService } from '../images/images.service.js';
import { UploadImageDto } from '../stores/dto/store.dto.js';
import {
  CreateProductDto,
  ProductDto,
  ProductListDto,
  ReorderProductImagesDto,
  ReorderProductsDto,
  UpdateProductDto,
} from './dto/product.dto.js';
import { ProductsService } from './products.service.js';

/** A merchant's products. 404 when the store or product isn't theirs. */
@Controller('stores/:storeId/products')
export class ProductsController {
  constructor(
    private readonly products: ProductsService,
    private readonly images: ImagesService,
  ) {}

  /** All products, hidden ones included, with the plan limits. */
  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Param('storeId', ParseUUIDPipe) storeId: string,
  ): Promise<ProductListDto> {
    return this.products.list(user, storeId);
  }

  /** 403: the plan's product limit was reached. */
  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Body() body: CreateProductDto,
  ): Promise<ProductDto> {
    return this.products.create(user, storeId, body);
  }

  /** Sets the display order. Must list every product of the store. */
  @Put('order')
  reorder(
    @CurrentUser() user: AuthUser,
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Body() body: ReorderProductsDto,
  ): Promise<ProductListDto> {
    return this.products.reorder(user, storeId, body.productIds);
  }

  @Patch(':productId')
  update(
    @CurrentUser() user: AuthUser,
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() body: UpdateProductDto,
  ): Promise<ProductDto> {
    return this.products.update(user, storeId, productId, body);
  }

  @Delete(':productId')
  @HttpCode(204)
  remove(
    @CurrentUser() user: AuthUser,
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
  ): Promise<void> {
    return this.products.remove(user, storeId, productId);
  }

  /**
   * Adds a photo after the existing ones. 400: not an image. 403: the plan's photo
   * limit was reached. 413: file too large.
   */
  @Post(':productId/images')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadImageDto })
  async addImage(
    @CurrentUser() user: AuthUser,
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Req() request: FastifyRequest,
  ): Promise<ProductDto> {
    const file = await this.images.readUpload(request);
    return this.products.addImage(user, storeId, productId, file);
  }

  /** Sets the photo order; the first one is the cover. Must list every photo. */
  @Put(':productId/images/order')
  reorderImages(
    @CurrentUser() user: AuthUser,
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() body: ReorderProductImagesDto,
  ): Promise<ProductDto> {
    return this.products.reorderImages(user, storeId, productId, body.imageIds);
  }

  @Delete(':productId/images/:imageId')
  removeImage(
    @CurrentUser() user: AuthUser,
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
  ): Promise<ProductDto> {
    return this.products.removeImage(user, storeId, productId, imageId);
  }
}
