// Plan limits. Everyone signs up on the free plan; paid plans come later (ROADMAP P5-01).
export const PLANS = {
  free: {
    name: 'Grátis',
    /** Stores one account can own. */
    maxStores: 1,
    /** Products per store, active or not. */
    maxProducts: 10,
  },
} as const;

export type PlanId = keyof typeof PLANS;

export const PLAN_IDS = Object.keys(PLANS) as PlanId[];

/** Whether a plan includes what `required` unlocks. Plans are listed cheapest first in PLANS. */
export function planIncludes(plan: PlanId, required: PlanId): boolean {
  return PLAN_IDS.indexOf(plan) >= PLAN_IDS.indexOf(required);
}
