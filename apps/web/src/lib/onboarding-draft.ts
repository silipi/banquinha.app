// The onboarding draft lives in the browser until the store is published, so people
// can leave and come back to the same step. Storage can be unavailable (private mode),
// so every access is guarded.

const KEY = 'banquinha:onboarding';

export interface DraftProduct {
  /** Stable key for React lists. */
  key: string;
  name: string;
  priceCents: number;
  description: string;
}

export interface OnboardingDraft {
  step: number;
  name: string;
  handle: string;
  /** False while the address still follows the store name. */
  handleEdited: boolean;
  whatsapp: string;
  /** Id of a theme from GET /themes. */
  themeId: string;
  products: DraftProduct[];
}

export function readDraft(): Partial<OnboardingDraft> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}');
  } catch {
    return {};
  }
}

export function saveDraft(draft: Partial<OnboardingDraft>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // Without storage the onboarding still works; it just can't resume.
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

/** Keeps the address picked on the landing for the onboarding, which comes after sign-up. */
export function rememberChosenHandle(handle: string) {
  const draft = readDraft();
  if (draft.handle) return;
  saveDraft({ ...draft, handle, handleEdited: true });
}
