const DISMISS_KEY = "pathway_demo_banner_dismissed";

export const DEMO_BANNER_RESTORE_EVENT = "pathway:restore-demo-banner";

export function isDemoBannerDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissDemoBanner(): void {
  try {
    localStorage.setItem(DISMISS_KEY, "1");
  } catch {
    // storage unavailable
  }
}

export function restoreDemoBanner(): void {
  try {
    localStorage.removeItem(DISMISS_KEY);
  } catch {
    // storage unavailable
  }
  window.dispatchEvent(new Event(DEMO_BANNER_RESTORE_EVENT));
}
