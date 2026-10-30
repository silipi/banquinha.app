import { SetMetadata } from '@nestjs/common';

export const IS_ADMIN_ROUTE = 'isAdminRoute';

/**
 * Marks a platform admin controller. AdminGuard requires an admin session on it (unless the
 * route is also @Public(), like the login) and the merchant AuthGuard leaves it alone: a
 * merchant session never opens an admin route.
 */
export const AdminRoute = () => SetMetadata(IS_ADMIN_ROUTE, true);
