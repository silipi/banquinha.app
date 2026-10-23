import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator.js';
import { Public } from '../auth/public.decorator.js';
import {
  CheckHandleQueryDto,
  CheckHandleResponseDto,
} from './dto/check-handle.dto.js';
import {
  CreateStoreDto,
  StoreDashboardDto,
  StoreSummaryDto,
  UpdateStoreDto,
} from './dto/store.dto.js';
import { StoresService } from './stores.service.js';

@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

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
