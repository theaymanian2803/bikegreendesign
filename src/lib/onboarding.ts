const DONE_KEY = "pathway_onboarded";
const STEP_KEY = "pathway_tour_progress";

export const ONBOARDING_RESTART_EVENT = "pathway:restart-tour";

// Indices must match the STEPS order in components/onboarding/OnboardingDialog.tsx.
export const TOUR_STEPS = { SIGNIN: 1, ADMIN: 2, ACTIVATE: 10 } as const;

export function isOnboardingDone(): boolean {
  try {
    return localStorage.getItem(DONE_KEY) === "1";
  } catch {
    return true;
  }
}

export function markOnboardingDone(): void {
  try {
    localStorage.setItem(DONE_KEY, "1");
    sessionStorage.removeItem(STEP_KEY);
  } catch {
    // storage unavailable — nothing to persist
  }
}

export function readTourStep(): number | null {
  try {
    const raw = sessionStorage.getItem(STEP_KEY);
    if (raw === null) return null;
    const step = Number(raw);
    return Number.isInteger(step) && step >= 0 ? step : null;
  } catch {
    return null;
  }
}

export function writeTourStep(step: number): void {
  try {
    sessionStorage.setItem(STEP_KEY, String(step));
  } catch {
    // storage unavailable — the tour simply won't resume
  }
}

export function clearTourStep(): void {
  try {
    sessionStorage.removeItem(STEP_KEY);
  } catch {
    // storage unavailable
  }
}

export function hasTourProgress(): boolean {
  return readTourStep() !== null;
}

export function restartOnboarding(): void {
  try {
    localStorage.removeItem(DONE_KEY);
    sessionStorage.removeItem(STEP_KEY);
  } catch {
    // storage unavailable
  }
  window.dispatchEvent(new Event(ONBOARDING_RESTART_EVENT));
}
