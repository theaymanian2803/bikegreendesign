import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { KeyRound, RotateCcw, X } from "lucide-react";

import { useLicense } from "@/hooks/use-license";
import { useSessionUser } from "@/hooks/use-session-user";
import { restartOnboarding } from "@/lib/onboarding";
import {
  DEMO_BANNER_RESTORE_EVENT,
  dismissDemoBanner,
  isDemoBannerDismissed,
} from "@/lib/demo-banner";

const BAR_BUTTON =
  "inline-flex h-7 shrink-0 items-center gap-1.5 border border-[#E9EAE4]/30 px-2.5 font-spec text-[9px] uppercase tracking-[0.12em] text-[#E9EAE4]/80 transition-colors hover:border-[#E9EAE4] hover:bg-[#E9EAE4] hover:text-[#171A17] active:translate-y-px sm:h-8 sm:px-3 sm:text-[10px]";

export function DemoBanner() {
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { status } = useLicense();
  const { data: user } = useSessionUser();

  useEffect(() => {
    setMounted(true);
    setDismissed(isDemoBannerDismissed());
    const onRestore = () => setDismissed(false);
    window.addEventListener(DEMO_BANNER_RESTORE_EVENT, onRestore);
    return () => window.removeEventListener(DEMO_BANNER_RESTORE_EVENT, onRestore);
  }, []);

  if (!mounted || dismissed || !status?.demoMode) return null;

  const licensed = Boolean(status?.licensed);
  const isOwner = Boolean(user?.isAdmin);

  return (
    <div className="bg-[#171A17] px-5 py-2 text-[#E9EAE4] md:px-10">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-1.5 font-spec text-[9px] uppercase tracking-[0.14em] sm:flex-row sm:items-center sm:gap-6 sm:text-[10px]">
        <div className="flex min-w-0 items-start gap-2.5 sm:flex-1 sm:items-center">
          <KeyRound className="mt-px size-3.5 shrink-0 text-[#FF4D00] sm:mt-0" />
          <span className="min-w-0 flex-1 leading-[1.6] text-[#E9EAE4]/80">
            {licensed
              ? "Demo store â€” licensed. "
              : "Demo store â€” explore freely, activate your key when you're ready. "}
            {isOwner
              ? "You are signed in as an admin."
              : licensed
                ? "The first sign-in on this store becomes the owner."
                : ""}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:ml-auto sm:shrink-0">
          <Link
            to={licensed ? "/admin" : "/activate"}
            className="inline-flex h-7 shrink-0 items-center bg-[#FF4D00] px-2.5 font-spec text-[9px] font-bold uppercase tracking-[0.12em] text-[#171A17] transition-colors hover:bg-[#E9EAE4] active:translate-y-px sm:h-8 sm:px-3 sm:text-[10px]"
          >
            {licensed ? "Open admin" : "Activate"}
          </Link>
          <button type="button" onClick={restartOnboarding} className={BAR_BUTTON}>
            <RotateCcw className="size-3" /> Take the tour
          </button>
          <button
            type="button"
            onClick={() => {
              dismissDemoBanner();
              setDismissed(true);
            }}
            className={BAR_BUTTON}
          >
            <X className="size-3" /> Remove bar
          </button>
        </div>
      </div>
    </div>
  );
}
