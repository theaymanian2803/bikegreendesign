import { useCallback } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";

import { useLicense } from "@/hooks/use-license";

/**
 * Client half of admin preview mode. Read everything, but the first attempt to
 * add or edit sends the visitor to activation instead of making the change.
 */
export function useAdminWriteGuard() {
  const { status } = useLicense();
  const navigate = useNavigate();
  const location = useLocation();
  const locked = Boolean(status && !status.licensed);

  const requireWrite = useCallback(() => {
    if (!locked) return true;
    void navigate({
      to: "/activate",
      search: { redirect: location.href },
    });
    return false;
  }, [locked, navigate, location.href]);

  return { locked, requireWrite };
}
