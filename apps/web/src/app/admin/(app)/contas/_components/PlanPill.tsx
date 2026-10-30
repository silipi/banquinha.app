import type { PlanSummaryDto } from '@banquinha/api-client';
import { formatDate } from '@/lib/admin';
import { Pill } from '../../../_components/admin-ui';

export function PlanPill({ plan }: { plan: PlanSummaryDto }) {
  return (
    <span className="flex flex-wrap items-center gap-1">
      <Pill tone={plan.effective === 'free' ? 'muted' : 'lilac'}>
        {plan.effective}
      </Pill>
      {plan.override && (
        <Pill tone={plan.overrideActive ? 'brand' : 'danger'}>
          {plan.overrideActive ? 'cortesia' : 'cortesia vencida'}
          {plan.overrideExpiresAt &&
            ` até ${formatDate(plan.overrideExpiresAt)}`}
        </Pill>
      )}
    </span>
  );
}
