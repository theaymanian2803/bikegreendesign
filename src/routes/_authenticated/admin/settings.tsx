import { useEffect, useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { toast } from "sonner";

import {
  getAdminSettings,
  saveSettings,
  setDemoMode,
  type StoreSettings,
} from "@/lib/settings.functions";
import { heartbeatLicense } from "@/lib/license.functions";
import { useLicense } from "@/hooks/use-license";
import { useAdminWriteGuard } from "@/hooks/use-admin-write-guard";
import { restartOnboarding } from "@/lib/onboarding";
import { restoreDemoBanner } from "@/lib/demo-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => ({
    meta: [
      { title: "Store Settings — Pathway Admin" },
      {
        name: "description",
        content: "Configure shipping rates and store contact details.",
      },
      { property: "og:title", content: "Store Settings — Pathway Admin" },
      { property: "og:description", content: "Configure Pathway store settings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  step,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  min?: string;
  step?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        min={min}
        step={step}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function SettingsPage() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [freeThreshold, setFreeThreshold] = useState("");
  const [flatShipping, setFlatShipping] = useState("");
  const [storeEmail, setStoreEmail] = useState("");
  const [storePhone, setStorePhone] = useState("");

  const { status: license, refetch: refetchLicense } = useLicense();
  const { requireWrite } = useAdminWriteGuard();
  const router = useRouter();
  const [demoSaving, setDemoSaving] = useState(false);

  async function toggleDemoMode() {
    if (!requireWrite()) return;
    if (!license) return;
    setDemoSaving(true);
    try {
      await setDemoMode({ data: { enabled: !license.demoMode } });
      await refetchLicense();
      toast.success(license.demoMode ? "Demo mode turned off" : "Demo mode turned on");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not update demo mode");
    } finally {
      setDemoSaving(false);
    }
  }

  async function refreshLicense() {
    try {
      const result = await heartbeatLicense();
      await refetchLicense();
      if (!result.licensed) {
        await router.invalidate();
        return;
      }
      toast.success("License refreshed");
    } catch {
      toast.error("Could not refresh the license");
    }
  }

  async function load() {
    try {
      const data = await getAdminSettings();
      setSettings(data);
      setFreeThreshold((data.freeShippingThresholdCents / 100).toFixed(2));
      setFlatShipping((data.flatShippingCents / 100).toFixed(2));
      setStoreEmail(data.storeEmail);
      setStorePhone(data.storePhone);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load settings");
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    if (!requireWrite()) return;
    const freeThresholdDollars = Number(freeThreshold);
    const flatShippingDollars = Number(flatShipping);
    if (!Number.isFinite(freeThresholdDollars) || freeThresholdDollars < 0) {
      toast.error("Enter a valid free-shipping threshold");
      return;
    }
    if (!Number.isFinite(flatShippingDollars) || flatShippingDollars < 0) {
      toast.error("Enter a valid flat shipping rate");
      return;
    }
    setSaving(true);
    try {
      await saveSettings({
        data: {
          freeShippingThresholdCents: Math.round(freeThresholdDollars * 100),
          flatShippingCents: Math.round(flatShippingDollars * 100),
          storeEmail: storeEmail.trim(),
          storePhone: storePhone.trim(),
        },
      });
      await load();
      toast.success("Store settings saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save settings");
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
          <h1 className="font-display text-3xl font-bold text-ink">Store settings</h1>
          <p className="mt-1 font-sans text-sm text-muted-foreground">
            Shipping rules and store contact details. Changes apply immediately.
          </p>
        </div>
        <Button onClick={save} disabled={saving} className="btn-brand">
          <Save className="mr-2 size-4" /> {saving ? "Saving…" : "Save settings"}
        </Button>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section data-tour="admin-settings" className="rounded-lg border border-border p-6">
          <h2 className="font-display text-lg font-bold text-ink">Shipping</h2>
          <p className="mt-1 font-sans text-xs text-muted-foreground">
            Applied automatically at checkout and when admin-editing orders.
          </p>
          <div className="mt-4 grid gap-4">
            <Field
              label="Free shipping threshold ($)"
              value={freeThreshold}
              onChange={setFreeThreshold}
              type="number"
              min="0"
              step="0.01"
            />
            <Field
              label="Flat shipping rate ($)"
              value={flatShipping}
              onChange={setFlatShipping}
              type="number"
              min="0"
              step="0.01"
            />
          </div>
        </section>

        <section className="rounded-lg border border-border p-6">
          <h2 className="font-display text-lg font-bold text-ink">Store contact</h2>
          <p className="mt-1 font-sans text-xs text-muted-foreground">
            Contact details surfaced to customers and order confirmations.
          </p>
          <div className="mt-4 grid gap-4">
            <Field
              label="Store email"
              value={storeEmail}
              onChange={setStoreEmail}
              type="email"
              placeholder="hello@pathwaybikeshop.com"
            />
            <Field
              label="Store phone"
              value={storePhone}
              onChange={setStorePhone}
              placeholder="+1 (555) 010-2233"
            />
          </div>
        </section>
      </div>

      <section data-tour="admin-license" className="mt-6 rounded-lg border border-border p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">License</h2>
            <p className="mt-1 font-sans text-xs text-muted-foreground">
              The admin is locked until this domain is activated with a product key.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/activate">Change key</Link>
            </Button>
            {license?.mode === "managed" ? (
              <Button variant="outline" size="sm" onClick={refreshLicense}>
                Refresh license
              </Button>
            ) : null}
          </div>
        </div>

        {license ? (
          <dl className="mt-4 grid gap-2 font-sans text-sm sm:grid-cols-2">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Status</dt>
              <dd className="font-semibold text-ink">
                {license.licensed ? "Active" : "Not activated"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Domain</dt>
              <dd className="font-semibold text-ink">{license.domain}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Mode</dt>
              <dd className="font-semibold text-ink">{license.mode ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Reason</dt>
              <dd className="font-semibold text-ink">{license.reason ?? "—"}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-4 font-sans text-sm text-muted-foreground">Loading license…</p>
        )}
      </section>

      <section className="mt-6 rounded-lg border border-border p-6">
        <h2 className="font-display text-lg font-bold text-ink">Demo mode</h2>
        <p className="mt-1 font-sans text-xs text-muted-foreground">
          Shows the demo banner and opens the tour on first visit. Turn this off after setup so real
          shoppers never see it.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            variant={license?.demoMode ? "default" : "outline"}
            size="sm"
            aria-pressed={Boolean(license?.demoMode)}
            disabled={demoSaving || !license}
            onClick={toggleDemoMode}
          >
            Demo mode: {license?.demoMode ? "On" : "Off"}
          </Button>
          <Button variant="outline" size="sm" onClick={restartOnboarding}>
            Restart tour
          </Button>
          <Button variant="outline" size="sm" onClick={restoreDemoBanner}>
            Show demo bar
          </Button>
        </div>
      </section>

      <p className="mt-6 font-sans text-xs text-muted-foreground">
        Current free-shipping threshold:{" "}
        <span className="font-semibold text-ink">
          {settings ? `$${(settings.freeShippingThresholdCents / 100).toFixed(2)}` : "—"}
        </span>{" "}
        · Flat rate:{" "}
        <span className="font-semibold text-ink">
          {settings ? `$${(settings.flatShippingCents / 100).toFixed(2)}` : "—"}
        </span>
      </p>
    </main>
  );
}
