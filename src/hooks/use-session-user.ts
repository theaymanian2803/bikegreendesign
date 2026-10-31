import { useQuery } from "@tanstack/react-query";

import { getSessionUser } from "@/lib/auth.functions";

export function useSessionUser() {
  return useQuery({
    queryKey: ["session-user"],
    queryFn: () => getSessionUser(),
    staleTime: 60_000,
    retry: false,
  });
}
