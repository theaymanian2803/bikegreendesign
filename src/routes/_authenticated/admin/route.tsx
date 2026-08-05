import { useEffect, useState } from "react";
import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { LayoutGrid, LogOut, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { adminExists, claimFirstAdmin } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Pathway" },
      { name: "description", content: "Pathway store administration." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

export type AdminContext = { email: string };

function AdminLayout() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [canClaim, setCanClaim] = useState(false);
  const [claiming, setClaiming] = useState(false);

  async function check() {
    const { data: userData } = await supabase.auth.getUser();
    setEmail(userData.user?.email ?? "");
    if (!userData.user) return setIsAdmin(false);
    const { data, error } = await supabase.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (error) toast.error(error.message);
    const admin = Boolean(data);
    setIsAdmin(admin);
    if (!admin) {
      try {
        const res = await adminExists();
        setCanClaim(!res.exists);
      } catch {
        setCanClaim(false);
      }
    }
  }

  useEffect(() => {
    void check();
  }, []);

  async function onClaim() {
    setClaiming(true);
    try {
      await claimFirstAdmin();
      toast.success("You are now the first admin");
      await check();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not claim admin access");
    }
    setClaiming(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (isAdmin === null) {
    return (
      <div className="container mx-auto px-4 py-20 font-sans text-muted-foreground">Loading…</div>
    );
  }

  if (!isAdmin) {
    return (
      <main className="container mx-auto px-4 py-20">
        <p className="section-label">Admin</p>
        <h1 className="font-display text-3xl font-bold text-ink">
          {canClaim ? "Set up admin access" : "Access denied"}
        </h1>
        <p className="mt-2 max-w-md font-sans text-sm text-muted-foreground">
          {canClaim
            ? `No admin exists yet. Claim admin access for ${email} to manage the store.`
            : `${email || "This account"} is not an admin. Ask an existing admin to grant you access.`}
        </p>
        <div className="mt-6 flex gap-2">
          {canClaim ? (
            <Button className="btn-brand" onClick={onClaim} disabled={claiming}>
              <ShieldCheck className="mr-2 size-4" />
              {claiming ? "Claiming…" : "Make me admin"}
            </Button>
          ) : null}
          <Button variant="outline" onClick={signOut}>
            <LogOut className="mr-2 size-4" /> Sign out
          </Button>
        </div>
      </main>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <nav className="flex gap-2">
          <Link
            to="/admin"
            activeOptions={{ exact: true }}
            activeProps={{ className: "bg-primary text-primary-foreground" }}
            className="flex items-center gap-2 rounded-full bg-surface px-4 py-2 font-sans text-sm text-ink transition-colors"
          >
            <LayoutGrid className="size-4" /> Mega menu
          </Link>
          <Link
            to="/admin/users"
            activeProps={{ className: "bg-primary text-primary-foreground" }}
            className="flex items-center gap-2 rounded-full bg-surface px-4 py-2 font-sans text-sm text-ink transition-colors"
          >
            <Users className="size-4" /> Users & roles
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <span className="font-sans text-sm text-muted-foreground">{email}</span>
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="mr-2 size-4" /> Sign out
          </Button>
        </div>
      </div>
      <Outlet />
    </div>
  );
}
