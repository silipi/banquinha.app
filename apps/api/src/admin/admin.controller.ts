import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { AdminAccountsService } from './admin-accounts.service.js';
import { AdminRoute } from './admin-route.decorator.js';
import { AdminStatsService } from './admin-stats.service.js';
import { AdminStoresService } from './admin-stores.service.js';
import { AuditLogService } from './audit-log.service.js';
import {
  AdminAccountDto,
  AdminAccountListDto,
  AdminAccountListQueryDto,
  AdminOverviewDto,
  AdminStoreDto,
  AdminStoreListDto,
  AdminStoreListQueryDto,
  AuditLogDto,
  AuditLogQueryDto,
  DeleteAccountDto,
  DeletedAccountDto,
  DeletedStoreDto,
  DeleteStoreDto,
  SetPlanOverrideDto,
  SuspendStoreDto,
} from './dto/admin.dto.js';

/** Platform-wide numbers for the admin dashboard. */
@AdminRoute()
@Controller('admin')
export class AdminController {
  constructor(
    private readonly stats: AdminStatsService,
    private readonly audit: AuditLogService,
  ) {}

  @Get('overview')
  overview(): Promise<AdminOverviewDto> {
    return this.stats.overview();
  }

  /** Every admin sign-in and change, newest first. */
  @Get('audit-log')
  auditLog(@Query() query: AuditLogQueryDto): Promise<AuditLogDto> {
    return this.audit.list({ before: query.before });
  }
}

@AdminRoute()
@Controller('admin/stores')
export class AdminStoresController {
  constructor(private readonly stores: AdminStoresService) {}

  /** Newest first, 50 per page. */
  @Get()
  list(@Query() query: AdminStoreListQueryDto): Promise<AdminStoreListDto> {
    return this.stores.list(query);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string): Promise<AdminStoreDto> {
    return this.stores.get(id);
  }

  /** Takes the storefront offline: 404 to visitors, orders refused, out of the sitemap. */
  @Put(':id/suspension')
  async suspend(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: SuspendStoreDto,
    @Headers('user-agent') userAgent: string | undefined,
  ): Promise<AdminStoreDto> {
    await this.stores.suspend(id, body.reason, userAgent);
    return this.stores.get(id);
  }

  @Delete(':id/suspension')
  async unsuspend(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('user-agent') userAgent: string | undefined,
  ): Promise<AdminStoreDto> {
    await this.stores.unsuspend(id, userAgent);
    return this.stores.get(id);
  }

  /**
   * Deletes the store with its products, photos and orders. 400 when the typed handle does
   * not match; in production 403 without a fresh authenticator code.
   */
  @Post(':id/deletion')
  @HttpCode(200)
  delete(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: DeleteStoreDto,
    @Headers('user-agent') userAgent: string | undefined,
  ): Promise<DeletedStoreDto> {
    return this.stores.delete(id, body, userAgent);
  }
}

@AdminRoute()
@Controller('admin/accounts')
export class AdminAccountsController {
  constructor(private readonly accounts: AdminAccountsService) {}

  /** Newest first, 50 per page. */
  @Get()
  list(@Query() query: AdminAccountListQueryDto): Promise<AdminAccountListDto> {
    return this.accounts.list(query);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string): Promise<AdminAccountDto> {
    return this.accounts.get(id);
  }

  /** Gives a plan for free (friends, partners), optionally until a date, with the reason. */
  @Put(':id/plan-override')
  setPlanOverride(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: SetPlanOverrideDto,
    @Headers('user-agent') userAgent: string | undefined,
  ): Promise<AdminAccountDto> {
    return this.accounts.setPlanOverride(id, body, userAgent);
  }

  @Delete(':id/plan-override')
  removePlanOverride(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('user-agent') userAgent: string | undefined,
  ): Promise<AdminAccountDto> {
    return this.accounts.removePlanOverride(id, userAgent);
  }

  /**
   * Deletes the account with all its stores. 400 when the typed email does not match; in
   * production 403 without a fresh authenticator code.
   */
  @Post(':id/deletion')
  @HttpCode(200)
  delete(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: DeleteAccountDto,
    @Headers('user-agent') userAgent: string | undefined,
  ): Promise<DeletedAccountDto> {
    return this.accounts.delete(id, body, userAgent);
  }
}
