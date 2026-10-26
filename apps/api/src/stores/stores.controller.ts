import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiParam } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator.js';
import { Public } from '../auth/public.decorator.js';
import { ImagesService } from '../images/images.service.js';
import {
  CheckHandleQueryDto,
  CheckHandleResponseDto,
} from './dto/check-handle.dto.js';
import {
  CreateStoreDto,
  STORE_IMAGE_SLOTS,
  StoreDashboardDto,
  StoreSummaryDto,
  UpdateStoreDto,
  UploadImageDto,
  type StoreImageSlot,
} from './dto/store.dto.js';
import { StoresService } from './stores.service.js';

@Controller('stores')
export class StoresController {
  constructor(
    private readonly storesService: StoresService,
    private readonly images: ImagesService,
  ) {}

  /**
   * Checks whether an address (banquinha.app/<handle>) can be used by a new store.
   * When another store has it, suggests free alternatives.
   */
  @Public()
  @Get('handle-availability')
  checkHandle(
    @Query() query: CheckHandleQueryDto,
  ): Promise<CheckHandleResponseDto> {
    return this.storesService.checkHandle(query.handle);
  }

  /**
   * Creates the signed-in merchant's store with its first products (end of the onboarding).
   * 409: handle taken. 403: the plan allows no more stores. 400: invalid data or too many products.
   */
  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() body: CreateStoreDto,
  ): Promise<StoreSummaryDto> {
    return this.storesService.create(user, body);
  }

  /** One of the merchant's stores, with what is left to customize. */
  @Get(':id')
  get(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<StoreDashboardDto> {
    return this.storesService.getDashboard(user, id);
  }

  /**
   * Sets the store's logo or banner from an uploaded image, replacing the previous one.
   * 400: not an image. 413: file too large.
   */
  @Put(':id/images/:slot')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadImageDto })
  @ApiParam({ name: 'slot', enum: STORE_IMAGE_SLOTS })
  async uploadImage(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('slot', new ParseEnumPipe(STORE_IMAGE_SLOTS)) slot: StoreImageSlot,
    @Req() request: FastifyRequest,
  ): Promise<StoreDashboardDto> {
    const file = await this.images.readUpload(request);
    return this.storesService.setImage(user, id, slot, file);
  }

  /** Removes the store's logo or banner. */
  @Delete(':id/images/:slot')
  @ApiParam({ name: 'slot', enum: STORE_IMAGE_SLOTS })
  removeImage(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('slot', new ParseEnumPipe(STORE_IMAGE_SLOTS)) slot: StoreImageSlot,
  ): Promise<StoreDashboardDto> {
    return this.storesService.removeImage(user, id, slot);
  }

  /** Edits store details. Only the fields sent change. */
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateStoreDto,
  ): Promise<StoreDashboardDto> {
    return this.storesService.update(user, id, body);
  }
}
