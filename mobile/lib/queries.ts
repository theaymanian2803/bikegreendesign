import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "./api";
import type {
  Bootstrap,
  CatalogCategory,
  CatalogProduct,
  ProductDetail,
  ProductReviews,
  Review,
  TrackedOrder,
} from "./types";

export function useBootstrap() {
  return useQuery({
    queryKey: ["bootstrap"],
    queryFn: () => apiFetch<Bootstrap>("bootstrap"),
    staleTime: 60_000,
  });
}

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: () => apiFetch<CatalogProduct[]>("products"),
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const [detail, reviews] = await Promise.all([
        apiFetch<ProductDetail>(`products/${encodeURIComponent(slug)}`),
        apiFetch<ProductReviews>(`reviews?productId=${encodeURIComponent(slug)}`),
      ]);
      return { ...detail, reviews };
    },
    enabled: slug.length > 0,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => apiFetch<CatalogCategory[]>("categories"),
  });
}

export function useReviews(limit = 6) {
  return useQuery({
    queryKey: ["reviews", limit],
    queryFn: () => apiFetch<Review[]>(`reviews?limit=${limit}`),
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      productSlug: string;
      author: string;
      rating: number;
      title: string;
      body: string;
    }) => apiFetch<{ ok: true }>("reviews", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },
  });
}

export function usePlaceOrder() {
  return useMutation({
    mutationFn: (input: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      address: string;
      city: string;
      postcode: string;
      country: string;
      notes?: string;
      items: { name: string; price: number; qty: number }[];
    }) =>
      apiFetch<{ publicId: string; email: string; total: number }>("orders", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}

export function useTrackOrders(phone: string) {
  return useQuery({
    queryKey: ["track", phone],
    queryFn: () => apiFetch<TrackedOrder[]>(`orders/track?phone=${encodeURIComponent(phone)}`),
    enabled: phone.trim().length >= 4,
  });
}

export function useSubscribeNewsletter() {
  return useMutation({
    mutationFn: (email: string) =>
      apiFetch<{ ok: true }>("newsletter", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
  });
}
