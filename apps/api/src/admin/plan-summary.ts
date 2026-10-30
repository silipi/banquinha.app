import {
  effectivePlan,
  hasActiveOverride,
  type PlanColumns,
} from '../plans/plans.js';
import type { PlanSummaryDto } from './dto/admin.dto.js';

export function planSummary(
  account: PlanColumns & { planOverrideReason: string | null },
): PlanSummaryDto {
  return {
    effective: effectivePlan(account),
    paid: account.plan,
    override: account.planOverride,
    overrideExpiresAt: account.planOverrideExpiresAt?.toISOString() ?? null,
    overrideReason: account.planOverrideReason,
    overrideActive: hasActiveOverride(account),
  };
}
