import { beforeEach, describe, expect, it } from "vitest";

import {
  clearTourStep,
  hasTourProgress,
  isOnboardingDone,
  markOnboardingDone,
  readTourStep,
  restartOnboarding,
  writeTourStep,
} from "@/lib/onboarding";
import { dismissDemoBanner, isDemoBannerDismissed, restoreDemoBanner } from "@/lib/demo-banner";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("onboarding flags", () => {
  it("marks completion and clears tour progress", () => {
    writeTourStep(3);
    markOnboardingDone();
    expect(isOnboardingDone()).toBe(true);
    expect(readTourStep()).toBeNull();
  });

  it("reads and clears a valid saved step", () => {
    writeTourStep(4);
    expect(readTourStep()).toBe(4);
    expect(hasTourProgress()).toBe(true);
    clearTourStep();
    expect(readTourStep()).toBeNull();
  });

  it("ignores invalid saved steps", () => {
    sessionStorage.setItem("pathway_tour_progress", "nope");
    expect(readTourStep()).toBeNull();
  });

  it("restart clears done + progress and dispatches the event", () => {
    markOnboardingDone();
    writeTourStep(2);
    let fired = false;
    const listener = () => {
      fired = true;
    };
    window.addEventListener("pathway:restart-tour", listener);
    restartOnboarding();
    window.removeEventListener("pathway:restart-tour", listener);
    expect(isOnboardingDone()).toBe(false);
    expect(readTourStep()).toBeNull();
    expect(fired).toBe(true);
  });
});

describe("demo banner flags", () => {
  it("dismisses and restores", () => {
    expect(isDemoBannerDismissed()).toBe(false);
    dismissDemoBanner();
    expect(isDemoBannerDismissed()).toBe(true);
    let fired = false;
    const listener = () => {
      fired = true;
    };
    window.addEventListener("pathway:restore-demo-banner", listener);
    restoreDemoBanner();
    window.removeEventListener("pathway:restore-demo-banner", listener);
    expect(isDemoBannerDismissed()).toBe(false);
    expect(fired).toBe(true);
  });
});
