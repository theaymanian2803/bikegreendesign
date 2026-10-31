import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { toast } from "sonner";

import { ImageField } from "@/components/admin/ImageField";
import { Button } from "@/components/ui/button";
import { useAdminWriteGuard } from "@/hooks/use-admin-write-guard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getPromoPopupAdmin, savePromoPopup } from "@/integrations/turso/landing.functions";

export const Route = createFileRoute("/_authenticated/admin/popup")({
  head: () => ({
    meta: [
      { title: "Promo Popup — Pathway Admin" },
      {
        name: "description",
        content: "Control the storefront promo popup: timing, copy, coupon code and image.",
      },
      { property: "og:title", content: "Promo Popup — Pathway Admin" },
      { property: "og:description", content: "Edit the Pathway promo popup." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PopupAdminPage,
});

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function PopupAdminPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [delaySeconds, setDelaySeconds] = useState("4");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaHref, setCtaHref] = useState("");
  const { requireWrite } = useAdminWriteGuard();

  async function load() {
    try {
      const data = await getPromoPopupAdmin();
      setEnabled(data.config.enabled);
      setTitle(data.title);
      setSubtitle(data.subtitle);
      setImageUrl(data.imageUrl);
      setCouponCode(data.config.couponCode);
      setDelaySeconds(String(data.config.delaySeconds));
      setCtaLabel(data.config.ctaLabel);
      setCtaHref(data.config.ctaHref);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load the popup");
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    if (!requireWrite()) return;
    const delay = Number(delaySeconds);
    if (!Number.isFinite(delay) || delay < 0 || delay > 120) {
      toast.error("Delay must be between 0 and 120 seconds");
      return;
    }
    setSaving(true);
    try {
      await savePromoPopup({
        data: {
          title,
          subtitle,
          imageUrl,
          config: {
            enabled,
            couponCode: couponCode.trim().toUpperCase(),
            delaySeconds: Math.round(delay),
            ctaLabel,
            ctaHref,
          },
        },
      });
      await load();
      toast.success("Promo popup saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the popup");
    }
    setSaving(false);
  }

  if (loading) {
    return <div className="py-20 font-sans text-muted-foreground">Loading…</div>;
  }

  return (
    <main className="py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-label">Admin</p>
          <h1 className="font-display text-3xl font-bold text-ink">Promo popup</h1>
          <p className="mt-1 font-sans text-sm text-muted-foreground">
            A dismissible offer shown on the homepage after a short delay.
          </p>
        </div>
        <Button onClick={save} disabled={saving} className="btn-brand">
          <Save className="mr-2 size-4" /> {saving ? "Saving…" : "Save popup"}
        </Button>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="rounded-lg border border-border p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-bold text-ink">Settings</h2>
              <p className="mt-1 font-sans text-xs text-muted-foreground">
                Shown once per browser session after the delay.
              </p>
            </div>
            <label className="flex cursor-pointer items-center gap-2 font-sans text-sm text-ink">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(event) => setEnabled(event.target.checked)}
                className="size-4 accent-[var(--color-primary)]"
              />
              Enabled
            </label>
          </div>

          <div className="mt-5 grid gap-4">
            <Field label="Title" value={title} onChange={setTitle} />
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Subtitle
              </Label>
              <Textarea
                rows={3}
                value={subtitle}
                onChange={(event) => setSubtitle(event.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Coupon code"
                value={couponCode}
                placeholder="PATHWAY10"
                onChange={(value) => setCouponCode(value.toUpperCase())}
              />
              <Field
                label="Delay (seconds)"
                type="number"
                value={delaySeconds}
                onChange={setDelaySeconds}
              />
              <Field label="CTA label" value={ctaLabel} onChange={setCtaLabel} />
              <Field label="CTA link" value={ctaHref} placeholder="/shop" onChange={setCtaHref} />
            </div>
            <ImageField
              label="Popup image"
              value={imageUrl}
              onChange={setImageUrl}
              placeholder="/menu/cta-road.jpg"
            />
          </div>
        </section>

        <section className="h-fit rounded-lg border border-border p-6">
          <h2 className="font-display text-lg font-bold text-ink">Preview</h2>
          <div className="mt-4 overflow-hidden rounded-lg border border-border">
            {imageUrl ? (
              <img src={imageUrl} alt="" className="h-32 w-full object-cover" />
            ) : (
              <div className="h-32 w-full bg-surface" />
            )}
            <div className="p-4 text-center">
              <p className="section-label">Pathway</p>
              <p className="mt-1 font-display text-lg font-bold text-ink">
                {title || "Popup title"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{subtitle || "Popup subtitle"}</p>
              {couponCode ? (
                <p className="mt-3 rounded border border-dashed border-primary px-2 py-1 font-display text-xs font-bold uppercase tracking-[0.2em] text-primary">
                  {couponCode}
                </p>
              ) : null}
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-ink">
                {ctaLabel || "Shop now"}
              </p>
            </div>
          </div>
          <p className="mt-3 font-sans text-[11px] text-muted-foreground">
            {enabled ? "Visible on the storefront." : "Hidden until you enable it."}
          </p>
        </section>
      </div>
    </main>
  );
}
