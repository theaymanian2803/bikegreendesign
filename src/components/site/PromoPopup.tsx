import { useEffect, useState } from "react";
import { X } from "lucide-react";

import type { PromoPopupSection } from "@/lib/landing";

const DISMISS_KEY = "pathway_promo_dismissed";

export function PromoPopup({ popup }: { popup: PromoPopupSection | null }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!popup) return;
    let dismissed = false;
    try {
      dismissed = window.sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      dismissed = false;
    }
    if (dismissed) return;

    const delay = Math.min(Math.max(popup.config.delaySeconds, 0), 120) * 1000;
    const timer = window.setTimeout(() => setOpen(true), delay);
    return () => window.clearTimeout(timer);
  }, [popup]);

  if (!popup || !open) return null;

  function close() {
    try {
      window.sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // sessionStorage may be unavailable; the popup simply closes for this view.
    }
    setOpen(false);
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/60 px-4"
      role="dialog"
      aria-modal="true"
      aria-label={popup.title}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-background shadow-xl">
        <button
          type="button"
          onClick={close}
          aria-label="Close popup"
          className="absolute right-3 top-3 z-10 rounded-full bg-background/90 p-1.5 text-ink transition-colors hover:text-primary"
        >
          <X className="size-4" />
        </button>

        {popup.imageUrl ? (
          <img
            src={popup.imageUrl}
            alt=""
            width={900}
            height={500}
            className="h-44 w-full object-cover"
          />
        ) : null}

        <div className="p-6 text-center">
          <p className="section-label">Pathway</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-ink">{popup.title}</h2>
          {popup.subtitle ? (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{popup.subtitle}</p>
          ) : null}

          {popup.config.couponCode ? (
            <p className="mt-4 rounded-xl border border-dashed border-primary bg-primary-soft px-3 py-2 font-display text-sm font-bold uppercase tracking-[0.2em] text-primary">
              {popup.config.couponCode}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {popup.config.ctaLabel && popup.config.ctaHref ? (
              <a href={popup.config.ctaHref} onClick={close} className="btn-brand">
                {popup.config.ctaLabel}
              </a>
            ) : null}
            <button
              type="button"
              onClick={close}
              className="rounded-full border border-border px-5 py-3 text-xs font-bold text-ink transition-colors hover:border-primary hover:text-primary"
            >
              No thanks
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
