import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Database,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  Lock,
  Settings2,
  Users,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLicense } from "@/hooks/use-license";
import { useSessionUser } from "@/hooks/use-session-user";
import { signInDemoAdmin } from "@/lib/auth.functions";
import {
  clearTourStep,
  markOnboardingDone,
  readTourStep,
  TOUR_STEPS,
  writeTourStep,
} from "@/lib/onboarding";

type TourRoute =
  "/activate" | "/auth" | "/admin" | "/admin/setup" | "/admin/settings" | "/admin/users";

type StepId =
  | "welcome"
  | "signin"
  | "admin"
  | "setup"
  | "database"
  | "secure"
  | "checklist"
  | "settings"
  | "shipping"
  | "users"
  | "activate"
  | "done";

type Step = {
  id: StepId;
  selector?: string;
  route?: TourRoute;
  icon: ReactNode;
  title: string;
  description: string;
};

const ADMIN_STEPS: ReadonlySet<StepId> = new Set([
  "admin",
  "setup",
  "database",
  "secure",
  "checklist",
  "settings",
  "shipping",
  "users",
]);

const STEPS: Step[] = [
  {
    id: "welcome",
    icon: <KeyRound className="size-5" />,
    title: "Welcome to Pathway",
    description:
      "A quick tour of your store: look around, sign in, set up the shop, and activate your license at the end when you have your key.",
  },
  {
    id: "signin",
    selector: '[data-tour="admin-signin"]',
    route: "/auth",
    icon: <Lock className="size-5" />,
    title: "Sign in with Google",
    description:
      "Use the Google account that should own this store. The first Google sign-in becomes the admin, so you can tour the admin screens before activating.",
  },
  {
    id: "admin",
    selector: '[data-tour="admin-dashboard"]',
    route: "/admin",
    icon: <LayoutDashboard className="size-5" />,
    title: "Your admin dashboard",
    description: "Orders, products, categories, reviews and revenue all live here.",
  },
  {
    id: "setup",
    selector: '[data-tour="setup-header"]',
    route: "/admin/setup",
    icon: <Settings2 className="size-5" />,
    title: "The setup page",
    description:
      "Connect your own database, secure the Google admin and follow the launch checklist.",
  },
  {
    id: "database",
    selector: '[data-tour="admin-db"]',
    route: "/admin/setup",
    icon: <Database className="size-5" />,
    title: "Connect your own database",
    description:
      "Paste your Turso URL and token. The schema and sample catalog are provisioned automatically.",
  },
  {
    id: "secure",
    selector: '[data-tour="admin-creds"]',
    route: "/admin/setup",
    icon: <KeyRound className="size-5" />,
    title: "Secure your admin login",
    description:
      "Admin access is tied to Google. The first Google sign-in becomes the owner; manage others in Users & roles.",
  },
  {
    id: "checklist",
    selector: '[data-tour="setup-list"]',
    route: "/admin/setup",
    icon: <ListChecks className="size-5" />,
    title: "Setup progress",
    description:
      "Tick items off as you add products, categories, content, shipping and team admins.",
  },
  {
    id: "settings",
    selector: '[data-tour="nav-settings"]',
    route: "/admin/settings",
    icon: <Settings2 className="size-5" />,
    title: "Store settings",
    description: "Shipping rules, contact details, the license and demo mode.",
  },
  {
    id: "shipping",
    selector: '[data-tour="admin-settings"]',
    route: "/admin/settings",
    icon: <ListChecks className="size-5" />,
    title: "Shipping and contact",
    description: "Set your free-shipping threshold, flat rate, store email and phone.",
  },
  {
    id: "users",
    selector: '[data-tour="nav-users"]',
    route: "/admin/users",
    icon: <Users className="size-5" />,
    title: "Users & roles",
    description: "Grant or revoke admin access for other Google accounts.",
  },
  {
    id: "activate",
    selector: '[data-tour="license-form"]',
    route: "/activate",
    icon: <KeyRound className="size-5" />,
    title: "Activate when you're ready",
    description:
      "Have your license key? Paste it here to activate this domain. You can also skip this and activate any time from the demo bar or Admin → Settings.",
  },
  {
    id: "done",
    icon: <CheckCircle2 className="size-5" />,
    title: "You're all set",
    description:
      "Your storefront is ready to browse. Activate whenever you have your key — no rush.",
  },
];

const TOOLTIP_WIDTH = 336;
const TOOLTIP_HEIGHT = 224;

type Rect = { top: number; left: number; width: number; height: number; radius: string };

export function OnboardingDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [demoLoginTried, setDemoLoginTried] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { status: license } = useLicense();
  const { data: user, refetch: refetchUser } = useSessionUser();
  const scrollDoneFor = useRef<string | null>(null);

  const showSignin = !user || user.isGuest;
  const visibleSteps = STEPS.filter((visibleStep) => {
    if (ADMIN_STEPS.has(visibleStep.id)) return Boolean(user?.isAdmin);
    if (visibleStep.id === "signin") return showSignin;
    if (visibleStep.id === "activate") return !license?.licensed;
    return true;
  });
  const current = STEPS[step];
  const position = visibleSteps.findIndex((s) => s.id === current.id);
  const isLast = position === visibleSteps.length - 1;

  function move(delta: number) {
    if (position < 0) return;
    const target = visibleSteps[Math.min(Math.max(position + delta, 0), visibleSteps.length - 1)];
    if (target) setStep(STEPS.findIndex((s) => s.id === target.id));
  }

  useEffect(() => {
    if (!open) return;
    const saved = readTourStep();
    setStep(Math.min(Math.max(saved ?? 0, 0), STEPS.length - 1));
  }, [open]);

  // While the store is unlicensed in demo mode, sign in the local demo admin so
  // the tour can cover the real admin screens. Activation disables this.
  useEffect(() => {
    if (!open || demoLoginTried) return;
    if (!license?.demoMode || license.licensed) return;
    if (user && !user.isGuest) return;

    setDemoLoginTried(true);
    signInDemoAdmin()
      .then((signedIn) => {
        if (signedIn) void refetchUser();
      })
      .catch(() => {
        // The tour falls back to the normal sign-in flow.
      });
  }, [open, demoLoginTried, license?.demoMode, license?.licensed, user, refetchUser]);

  useEffect(() => {
    if (!open) return;
    if (step === TOUR_STEPS.SIGNIN && user) {
      setStep(user.isAdmin ? TOUR_STEPS.ADMIN : TOUR_STEPS.ACTIVATE);
    } else if (step === TOUR_STEPS.ACTIVATE && license?.licensed) {
      setStep(STEPS.length - 1);
    }
  }, [open, step, license?.licensed, user]);

  // The admin walkthrough only makes sense for a signed-in admin. Everyone else
  // skips it and lands on the final, optional activation step.
  useEffect(() => {
    if (!open) return;
    const inAdminSection = step >= TOUR_STEPS.ADMIN && step < TOUR_STEPS.ACTIVATE;
    if (inAdminSection && !user?.isAdmin) {
      setStep(TOUR_STEPS.ACTIVATE);
    }
  }, [open, step, user]);

  useEffect(() => {
    if (!open) return;
    const route = STEPS[step].route;
    if (!route || location.pathname === route) return;
    if (route === "/activate" && license?.licensed) return;
    if (route === "/auth" && user) return;
    if (route.startsWith("/admin") && (!user || !user.isAdmin)) return;

    switch (route) {
      case "/activate":
        navigate({ to: "/activate" });
        break;
      case "/auth":
        navigate({ to: "/auth" });
        break;
      case "/admin":
        navigate({ to: "/admin" });
        break;
      case "/admin/setup":
        navigate({ to: "/admin/setup" });
        break;
      case "/admin/settings":
        navigate({ to: "/admin/settings" });
        break;
      case "/admin/users":
        navigate({ to: "/admin/users" });
        break;
    }
  }, [open, step, location.pathname, navigate, license?.licensed, user]);

  useEffect(() => {
    if (open) writeTourStep(step);
  }, [open, step]);

  const measure = useCallback(() => {
    if (!open) return;
    const selector = STEPS[step].selector;
    if (!selector) {
      setRect(null);
      return;
    }
    const element = document.querySelector<HTMLElement>(selector);
    if (!element) {
      setRect(null);
      return;
    }
    const key = `${step}:${selector}`;
    if (scrollDoneFor.current !== key) {
      scrollDoneFor.current = key;
      element.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
    const style = getComputedStyle(element);
    const bounds = element.getBoundingClientRect();
    setRect({
      top: bounds.top,
      left: bounds.left,
      width: bounds.width,
      height: bounds.height,
      radius: style.borderRadius,
    });
  }, [open, step]);

  useLayoutEffect(() => {
    measure();
    const observer = new MutationObserver(measure);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [measure]);

  if (!open) return null;

  const close = () => {
    markOnboardingDone();
    clearTourStep();
    onOpenChange(false);
    if (location.pathname === "/activate") {
      navigate({ to: "/" });
    }
  };

  const placeBelow =
    rect !== null && rect.top + rect.height + TOOLTIP_HEIGHT + 24 <= window.innerHeight;
  const tooltipLeft = rect
    ? Math.min(
        Math.max(rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2, 16),
        window.innerWidth - TOOLTIP_WIDTH - 16,
      )
    : 16;
  const tooltipTop = rect
    ? Math.min(
        Math.max(placeBelow ? rect.top + rect.height + 24 : rect.top - TOOLTIP_HEIGHT - 24, 16),
        window.innerHeight - TOOLTIP_HEIGHT - 16,
      )
    : 16;

  const aboveViewport = rect !== null && rect.top < 0;
  const belowViewport = rect !== null && rect.top + rect.height > window.innerHeight;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[100]"
      role="dialog"
      aria-label="Welcome tour"
    >
      {!rect ? <div className="pointer-events-none absolute inset-0 bg-black/60" /> : null}

      {rect ? (
        <div
          className="pointer-events-none absolute transition-all duration-300"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            borderRadius: rect.radius,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
          }}
        />
      ) : null}

      {rect && (aboveViewport || belowViewport) ? (
        <div
          className="pointer-events-none absolute left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1.5"
          style={aboveViewport ? { top: 20 } : { bottom: 20 }}
        >
          {belowViewport ? (
            <ChevronDown className="size-7 animate-bounce text-primary" />
          ) : (
            <ChevronUp className="size-7 animate-bounce text-primary" />
          )}
          <span className="rounded-full bg-background/95 px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-lg">
            {belowViewport ? "Scroll down" : "Scroll up"}
          </span>
        </div>
      ) : null}

      <div
        className="pointer-events-auto absolute z-10 rounded-2xl border border-border/50 bg-card text-card-foreground shadow-2xl"
        style={{ width: TOOLTIP_WIDTH, left: tooltipLeft, top: tooltipTop }}
      >
        <div
          className={`absolute size-3 rotate-45 border-border/50 bg-card ${
            placeBelow ? "-top-1.5 border-l border-t" : "-bottom-1.5 border-b border-r"
          }`}
          style={{
            left: Math.min(
              Math.max(rect ? rect.left + rect.width / 2 - 6 : 16, 20),
              TOOLTIP_WIDTH - 26,
            ),
          }}
        />

        <button
          type="button"
          onClick={close}
          aria-label="Skip tour"
          className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-4" />
        </button>

        <div className="flex flex-col gap-3 p-5">
          <div className="flex items-center gap-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
              {current.icon}
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              {Math.max(position, 0) + 1} / {visibleSteps.length}
            </span>
            <div className="flex items-center gap-1">
              {visibleSteps.map((visibleStep, index) => (
                <span
                  key={visibleStep.id}
                  className={`h-1.5 rounded-full transition-all ${
                    index === position ? "w-5 bg-primary" : "w-1.5 bg-border"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <h3 className="font-display text-lg font-semibold leading-snug">{current.title}</h3>
            <p className="font-sans text-sm leading-relaxed text-muted-foreground">
              {current.description}
            </p>
          </div>

          <div className="flex items-center justify-between pt-1">
            <Button variant="outline" size="sm" onClick={() => move(-1)} disabled={position <= 0}>
              Back
            </Button>
            {isLast ? (
              <Button size="sm" onClick={close}>
                Finish
              </Button>
            ) : (
              <Button size="sm" onClick={() => move(1)}>
                {current.id === "activate" ? "Activate later" : "Next"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
