'use client';

import type { CountDto } from '@banquinha/api-client';
import { LoaderCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import {
  ENVIRONMENT_LABELS,
  formatNumber,
  type AdminEnvironment,
} from '@/lib/admin';
import { cn } from '@/lib/utils';

// Plain building blocks of the admin: tables, numbers and bars, no storefront polish.

export function EnvironmentBadge({
  environment,
  className,
}: {
  environment: AdminEnvironment;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase',
        environment === 'production'
          ? 'bg-red-600 text-white'
          : environment === 'staging'
            ? 'bg-butter text-ink'
            : 'bg-sky text-ink',
        className,
      )}
    >
      {ENVIRONMENT_LABELS[environment]}
    </span>
  );
}

export function Loading() {
  return (
    <div className="flex justify-center py-16 text-muted-foreground">
      <LoaderCircle className="size-6 animate-spin" aria-label="Carregando" />
    </div>
  );
}

export function PageTitle({
  children,
  aside,
}: {
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="font-display text-2xl font-bold">{children}</h1>
      {aside}
    </div>
  );
}

export function Section({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-2xl border bg-surface p-4', className)}>
      <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-surface p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold tabular-nums">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Horizontal bars, one per row, scaled to the largest count. */
export function BarList({
  rows,
  empty = 'Nada ainda',
}: {
  rows: CountDto[];
  empty?: string;
}) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const max = Math.max(1, ...rows.map((row) => row.count));
  if (total === 0) {
    return <p className="text-sm text-muted-foreground">{empty}</p>;
  }
  return (
    <ul className="space-y-1.5">
      {rows.map((row) => (
        <li key={row.key} className="text-sm">
          <div className="flex justify-between gap-3">
            <span className="truncate">{row.label}</span>
            <span className="shrink-0 text-muted-foreground tabular-nums">
              {formatNumber(row.count)} ·{' '}
              {Math.round((row.count / total) * 100)}%
            </span>
          </div>
          <div className="mt-0.5 h-1.5 rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-ink"
              style={{ width: `${(row.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Small vertical bar chart over time, with the value on hover. */
export function ColumnChart({
  points,
}: {
  points: { label: string; value: number; title: string }[];
}) {
  const max = Math.max(1, ...points.map((point) => point.value));
  return (
    <div>
      <div className="flex h-28 items-end gap-1">
        {points.map((point) => (
          <div
            key={point.label}
            title={point.title}
            className="flex h-full flex-1 flex-col justify-end"
          >
            <span className="mb-0.5 text-center text-[10px] text-muted-foreground tabular-nums">
              {point.value > 0 ? point.value : ''}
            </span>
            <div
              className="min-h-px rounded-t bg-brand"
              style={{ height: `${(point.value / max) * 100}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-1 text-[10px] text-muted-foreground">
        {points.map((point, index) => (
          <span key={point.label} className="flex-1 truncate text-center">
            {index % 2 === 0 ? point.label : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Table({
  head,
  children,
}: {
  head: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border bg-surface">
      <table className="w-full text-left text-sm">
        <thead className="border-b text-xs text-muted-foreground">
          <tr>
            {head.map((label) => (
              <th
                key={label}
                className="px-3 py-2 font-medium whitespace-nowrap"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">{children}</tbody>
      </table>
    </div>
  );
}

export function Pager({
  page,
  pageSize,
  total,
  onPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
      <span>
        {formatNumber(total)} no total · página {page} de {pages}
      </span>
      <span className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="rounded-full border px-3 py-1 disabled:opacity-40"
        >
          Anterior
        </button>
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          className="rounded-full border px-3 py-1 disabled:opacity-40"
        >
          Próxima
        </button>
      </span>
    </div>
  );
}

export function Pill({
  children,
  tone = 'muted',
}: {
  children: ReactNode;
  tone?: 'muted' | 'brand' | 'danger' | 'sage' | 'lilac';
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        {
          muted: 'bg-muted text-muted-foreground',
          brand: 'bg-brand-soft text-ink',
          danger: 'bg-red-100 text-red-700',
          sage: 'bg-sage text-ink',
          lilac: 'bg-lilac text-ink',
        }[tone],
      )}
    >
      {children}
    </span>
  );
}
