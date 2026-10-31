import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { activateLicense, getLicenseStatus } from "@/lib/license.functions";

export function useLicense() {
  const queryClient = useQueryClient();

  const status = useQuery({
    queryKey: ["license"],
    queryFn: () => getLicenseStatus(),
    staleTime: 30_000,
    retry: false,
  });

  const activate = useMutation({
    mutationFn: (key: string) => activateLicense({ data: { key } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["license"] }),
  });

  return {
    status: status.data,
    isLoading: status.isLoading,
    refetch: status.refetch,
    activate: activate.mutateAsync,
    isActivating: activate.isPending,
    activateError: activate.error as Error | null,
    resetActivate: activate.reset,
  };
}
