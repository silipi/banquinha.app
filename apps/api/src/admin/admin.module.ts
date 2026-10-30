import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ImagesModule } from '../images/images.module.js';
import { AdminAccountsService } from './admin-accounts.service.js';
import { AdminAuthController } from './admin-auth.controller.js';
import { AdminAuthService } from './admin-auth.service.js';
import { AdminGuard } from './admin.guard.js';
import {
  AdminAccountsController,
  AdminController,
  AdminStoresController,
} from './admin.controller.js';
import { ADMIN_SETTINGS, loadAdminSettings } from './admin-settings.js';
import { AdminSessionsService } from './admin-sessions.service.js';
import { AdminStatsService } from './admin-stats.service.js';
import { AdminStoresService } from './admin-stores.service.js';
import { AuditLogService } from './audit-log.service.js';

/**
 * Internal panel for the platform owner (one admin, credentials in env). Separate from the
 * merchant accounts: own guard, sessions and cookie. Every change goes to the audit log.
 */
@Module({
  imports: [ImagesModule],
  controllers: [
    AdminAuthController,
    AdminController,
    AdminStoresController,
    AdminAccountsController,
  ],
  providers: [
    { provide: ADMIN_SETTINGS, useFactory: loadAdminSettings },
    { provide: APP_GUARD, useClass: AdminGuard },
    AdminAuthService,
    AdminSessionsService,
    AdminStatsService,
    AdminStoresService,
    AdminAccountsService,
    AuditLogService,
  ],
})
export class AdminModule {}
