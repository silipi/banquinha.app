import { Controller, Get, Query } from '@nestjs/common';
import { Public } from '../auth/public.decorator.js';
import {
  CheckHandleQueryDto,
  CheckHandleResponseDto,
} from './dto/check-handle.dto.js';
import { StoresService } from './stores.service.js';

@Public()
@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  /** Checks whether an address (banquinha.app/<handle>) can be used by a new store. */
  @Get('handle-availability')
  checkHandle(@Query() query: CheckHandleQueryDto): CheckHandleResponseDto {
    return this.storesService.checkHandle(query.handle);
  }
}
