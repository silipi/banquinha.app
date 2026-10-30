import type { AdminMeDto } from '@banquinha/api-client';

/**
 * Path inside the platform admin, for client-side navigation. On admin.banquinha.app the
 * admin is the whole host (next.config.ts rewrites it to /admin); elsewhere it lives
 * under /admin. Calls go through the same /api proxy as the merchant area (panelApi).
 */
export function adminPath(path: string) {
  return window.location.hostname.startsWith('admin.') ? path : `/admin${path}`;
}

export type AdminEnvironment = AdminMeDto['environment'];

export const ENVIRONMENT_LABELS: Record<AdminEnvironment, string> = {
  production: 'Produção',
  staging: 'Staging',
  development: 'Local',
};

const dateFormat = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'America/Sao_Paulo',
});
const dateTimeFormat = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
});

export const formatDate = (iso: string) => dateFormat.format(new Date(iso));
export const formatDateTime = (iso: string) =>
  dateTimeFormat.format(new Date(iso));

export const formatNumber = (value: number, digits = 0) =>
  value.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

export const formatPercent = (part: number, whole: number) =>
  whole === 0 ? '—' : `${Math.round((part / whole) * 100)}%`;
