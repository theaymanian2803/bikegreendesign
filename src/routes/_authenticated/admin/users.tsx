import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { KeyRound, ShieldCheck, ShieldOff, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  deleteUser,
  listUsers,
  setAdminRole,
  setUserPassword,
  type AdminUser,
} from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { useAdminWriteGuard } from "@/hooks/use-admin-write-guard";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({
    meta: [
      { title: "Users & Roles — Pathway Admin" },
      {
        name: "description",
        content: "Grant or revoke admin access for Pathway store accounts.",
      },
      { property: "og:title", content: "Users & Roles — Pathway Admin" },
      { property: "og:description", content: "Manage admin access for the Pathway store." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: UsersPage,
});

function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { requireWrite } = useAdminWriteGuard();

  async function load() {
    try {
      setUsers(await listUsers());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load users");
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function toggleAdmin(user: AdminUser) {
    if (!requireWrite()) return;
    setBusyId(user.id);
    try {
      await setAdminRole({ data: { userId: user.id, makeAdmin: !user.isAdmin } });
      toast.success(user.isAdmin ? "Admin access removed" : "Admin access granted");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update role");
    }
    setBusyId(null);
  }

  async function changePassword(user: AdminUser) {
    if (!requireWrite()) return;
    const bytes = new Uint8Array(6);
    window.crypto.getRandomValues(bytes);
    const suggested = `Tmp-${Array.from(bytes, (byte) => byte.toString(36).padStart(2, "0")).join("")}!`;
    const password = window.prompt(
      `Set a temporary password for ${user.email} (at least 8 characters). Share it with the customer.`,
      suggested,
    );
    if (password === null) return;
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setBusyId(user.id);
    try {
      await setUserPassword({ data: { userId: user.id, password } });
      toast.success("Temporary password set. Share it with the customer.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not set password");
    }
    setBusyId(null);
  }

  async function removeUser(user: AdminUser) {
    if (!requireWrite()) return;
    if (!window.confirm(`Delete ${user.email}? This cannot be undone.`)) return;
    setBusyId(user.id);
    try {
      await deleteUser({ data: { userId: user.id } });
      toast.success("Account deleted");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete account");
    }
    setBusyId(null);
  }

  return (
    <main className="py-8">
      <header>
        <p className="section-label">Admin</p>
        <h1 className="font-display text-3xl font-bold text-ink">Users &amp; roles</h1>
        <p className="mt-1 font-sans text-sm text-muted-foreground">
          Grant admin access to teammates who should be able to edit store content.
        </p>
      </header>

      {loading ? (
        <p className="mt-8 font-sans text-sm text-muted-foreground">Loading users…</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[640px] font-sans text-sm">
            <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Last sign in</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-border">
                  <td className="px-4 py-3 text-ink">{u.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {u.isGuest ? "Guest" : u.confirmed ? "Confirmed" : "Pending confirmation"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs ${
                        u.isAdmin ? "bg-primary text-primary-foreground" : "bg-surface text-ink"
                      }`}
                    >
                      {u.isAdmin ? "Admin" : u.isGuest ? "Guest" : "User"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {u.lastSignInAt ? new Date(u.lastSignInAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busyId === u.id}
                        onClick={() => toggleAdmin(u)}
                      >
                        {u.isAdmin ? (
                          <>
                            <ShieldOff className="mr-2 size-4" /> Revoke admin
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="mr-2 size-4" /> Make admin
                          </>
                        )}
                      </Button>
                      {!u.isGuest ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={busyId === u.id}
                          onClick={() => changePassword(u)}
                          aria-label={`Set temporary password for ${u.email}`}
                        >
                          <KeyRound className="size-4 text-ink" />
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={busyId === u.id}
                        onClick={() => removeUser(u)}
                        aria-label={`Delete ${u.email}`}
                      >
                        <Trash2 className="size-4 text-primary" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No accounts yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
