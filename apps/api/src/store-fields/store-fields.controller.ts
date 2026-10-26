import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator.js';
import {
  CreateStoreFieldDto,
  ReorderStoreFieldsDto,
  StoreFieldListDto,
  UpdateStoreFieldDto,
} from './dto/store-field.dto.js';
import { StoreFieldsService } from './store-fields.service.js';

/** A store's custom fields. Every change answers with the whole list. */
@Controller('stores/:storeId/fields')
export class StoreFieldsController {
  constructor(private readonly fields: StoreFieldsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Param('storeId', ParseUUIDPipe) storeId: string,
  ): Promise<StoreFieldListDto> {
    return this.fields.list(user, storeId);
  }

  /** 403: the plan's field limit was reached. 409: a field with that name exists. */
  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Body() body: CreateStoreFieldDto,
  ): Promise<StoreFieldListDto> {
    return this.fields.create(user, storeId, body);
  }

  /** Sets the display order. Must list every field of the store. */
  @Put('order')
  reorder(
    @CurrentUser() user: AuthUser,
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Body() body: ReorderStoreFieldsDto,
  ): Promise<StoreFieldListDto> {
    return this.fields.reorder(user, storeId, body.fieldIds);
  }

  @Patch(':fieldId')
  update(
    @CurrentUser() user: AuthUser,
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('fieldId', ParseUUIDPipe) fieldId: string,
    @Body() body: UpdateStoreFieldDto,
  ): Promise<StoreFieldListDto> {
    return this.fields.update(user, storeId, fieldId, body);
  }

  /** Also clears the field's value on every item. */
  @Delete(':fieldId')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('fieldId', ParseUUIDPipe) fieldId: string,
  ): Promise<StoreFieldListDto> {
    return this.fields.remove(user, storeId, fieldId);
  }
}
