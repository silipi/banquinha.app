import { adminConfig, loadEnv, type AdminConfig, type Env } from '../env.js';

export const ADMIN_SETTINGS = Symbol('ADMIN_SETTINGS');

export interface AdminSettings {
  /** Null when the admin credentials are not set: the whole panel answers 404. */
  credentials: AdminConfig | null;
  environment: Env['APP_ENV'];
}

export function loadAdminSettings(): AdminSettings {
  const env = loadEnv();
  return { credentials: adminConfig(env), environment: env.APP_ENV };
}
