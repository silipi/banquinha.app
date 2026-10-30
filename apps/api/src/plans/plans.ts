// Plan limits. Everyone signs up on the free plan. Pro can only be given from the admin
// panel for now; its price and final limits come with billing (ROADMAP P5-01).
export const PLANS = {
  free: {
    name: 'Grátis',
    /** Stores one account can own. */
    maxStores: 1,
    /** Products per store, active or not. */
    maxProducts: 10,
    /** Photos per product. */
    maxImagesPerProduct: 3,
    /** Custom fields per store (Ano, Km…). */
    maxFields: 3,
  },
  pro: {
    name: 'Pro',
    maxStores: 3,
    maxProducts: 200,
    maxImagesPerProduct: 8,
    maxFields: 10,
  },
} as const;

export type PlanId = keyof typeof PLANS;

export const PLAN_IDS = Object.keys(PLANS) as PlanId[];

/** Whether a plan includes what `required` unlocks. Plans are listed cheapest first in PLANS. */
export function planIncludes(plan: PlanId, required: PlanId): boolean {
  return PLAN_IDS.indexOf(plan) >= PLAN_IDS.indexOf(required);
}

export interface PlanColumns {
  plan: PlanId;
  planOverride: PlanId | null;
  planOverrideExpiresAt: Date | null;
}

/** Whether the account has a plan override that has not expired. */
export function hasActiveOverride(
  account: PlanColumns,
  now = new Date(),
): account is PlanColumns & { planOverride: PlanId } {
  return (
    account.planOverride !== null &&
    (account.planOverrideExpiresAt === null ||
      account.planOverrideExpiresAt > now)
  );
}

/**
 * The plan whose limits apply: the better of the paid plan and an unexpired override, so
 * an override never takes away what the merchant pays for.
 */
export function effectivePlan(account: PlanColumns, now = new Date()): PlanId {
  if (!hasActiveOverride(account, now)) return account.plan;
  return planIncludes(account.plan, account.planOverride)
    ? account.plan
    : account.planOverride;
}
