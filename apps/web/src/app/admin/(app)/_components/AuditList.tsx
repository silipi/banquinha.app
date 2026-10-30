'use client';

import type { AuditEntryDto } from '@banquinha/api-client';
import { formatDateTime } from '@/lib/admin';
import { Pill } from '../../_components/admin-ui';

const TONES: Record<string, 'muted' | 'brand' | 'danger' | 'sage' | 'lilac'> = {
  login_failed: 'danger',
  store_deleted: 'danger',
  account_deleted: 'danger',
  store_suspended: 'brand',
  plan_override_set: 'lilac',
  login_succeeded: 'sage',
};

export function AuditList({ entries }: { entries: AuditEntryDto[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum registro</p>;
  }
  return (
    <ul className="divide-y text-sm">
      {entries.map((entry) => (
        <li key={entry.id} className="flex flex-wrap items-baseline gap-2 py-2">
          <span className="w-28 shrink-0 text-xs text-muted-foreground tabular-nums">
            {formatDateTime(entry.createdAt)}
          </span>
          <Pill tone={TONES[entry.action] ?? 'muted'}>{entry.action}</Pill>
          <span className="min-w-0 flex-1 break-words">{entry.summary}</span>
        </li>
      ))}
    </ul>
  );
}
