import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { getSessionUser } from "@/lib/auth.functions";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    // Activation is the final onboarding step, not a gate on the admin. Admins
    // can configure the store first and activate whenever they have a key.
    const user = await getSessionUser();
    if (!user?.isAdmin) {
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }
    return { admin: user };
  },
  component: () => <Outlet />,
});
