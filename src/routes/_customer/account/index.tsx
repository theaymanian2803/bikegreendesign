import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/lib/auth.functions";

export const Route = createFileRoute("/_customer/account/")({
  head: () => ({
    meta: [
      { title: "Profile — Pathway Cycle Supply" },
      { name: "description", content: "Your Pathway account details." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = Route.useRouteContext();
  const [name, setName] = useState(user.name ?? "");
  const [saving, setSaving] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ data: { name } });
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save your profile");
    }
    setSaving(false);
  }

  return (
    <div>
      <p className="site-eyebrow">Account details</p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-[-.05em] text-ink">Profile</h1>
      <p className="mt-1 font-sans text-sm text-muted-foreground">
        Manage your personal information.
      </p>

      <form onSubmit={save} className="mt-6 max-w-md space-y-5 border border-border bg-card p-6">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 rounded-none bg-background"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={user.email}
            readOnly
            className="h-12 rounded-none bg-surface text-muted-foreground"
          />
          <p className="text-[11px] text-muted-foreground">
            {user.isGuest
              ? "Guest session — add an email and password from the sign-in page to keep your orders."
              : "Your sign-in email. Contact the shop to change it."}
          </p>
        </div>
        <Button type="submit" disabled={saving} className="btn-brand">
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </div>
  );
}
