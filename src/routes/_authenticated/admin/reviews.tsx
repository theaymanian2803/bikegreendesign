import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import {
  adminCreateReview,
  deleteReview,
  loadReviewsAdmin,
  setReviewStatus,
  type ReviewRow,
} from "@/integrations/turso/reviews.functions";
import { loadCatalogAdmin, type AdminProductRow } from "@/integrations/turso/catalog.functions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAdminWriteGuard } from "@/hooks/use-admin-write-guard";

export const Route = createFileRoute("/_authenticated/admin/reviews")({
  head: () => ({
    meta: [
      { title: "Reviews — Pathway Admin" },
      {
        name: "description",
        content: "Moderate customer reviews: approve, reject or remove them, and add your own.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReviewsPage,
});

type Filter = "all" | "pending" | "approved" | "rejected";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-primary">
      {"★".repeat(rating)}
      <span className="text-border">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [products, setProducts] = useState<AdminProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("pending");
  const [addOpen, setAddOpen] = useState(false);
  const { requireWrite } = useAdminWriteGuard();

  async function load() {
    try {
      const [reviewData, catalog] = await Promise.all([loadReviewsAdmin(), loadCatalogAdmin()]);
      setReviews(reviewData);
      setProducts(catalog.products);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load reviews");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function setStatus(review: ReviewRow, status: "approved" | "rejected") {
    if (!requireWrite()) return;
    try {
      await setReviewStatus({ data: { id: review.id, status } });
      setReviews((prev) => prev.map((r) => (r.id === review.id ? { ...r, status } : r)));
      toast.success(status === "approved" ? "Review approved" : "Review rejected");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update review");
    }
  }

  async function remove(review: ReviewRow) {
    if (!requireWrite()) return;
    if (!window.confirm(`Delete the review from "${review.author}"?`)) return;
    try {
      await deleteReview({ data: { id: review.id } });
      setReviews((prev) => prev.filter((r) => r.id !== review.id));
      toast.success("Review deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete review");
    }
  }

  async function add(values: {
    productId: number;
    author: string;
    rating: number;
    title: string;
    body: string;
  }) {
    if (!requireWrite()) return;
    try {
      await adminCreateReview({ data: values });
      toast.success("Review published");
      setAddOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add review");
    }
  }

  const counts = {
    all: reviews.length,
    pending: reviews.filter((r) => r.status === "pending").length,
    approved: reviews.filter((r) => r.status === "approved").length,
    rejected: reviews.filter((r) => r.status === "rejected").length,
  };
  const filtered = filter === "all" ? reviews : reviews.filter((r) => r.status === filter);

  if (loading) {
    return <div className="py-20 font-sans text-muted-foreground">Loading…</div>;
  }

  return (
    <main className="py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-label">Admin</p>
          <h1 className="font-display text-3xl font-bold text-ink">Reviews</h1>
          <p className="mt-1 font-sans text-sm text-muted-foreground">
            Customer reviews start as pending. Approve them to show them on the storefront.
          </p>
        </div>
        <Button
          onClick={() => {
            if (requireWrite()) setAddOpen(true);
          }}
          className="btn-brand"
        >
          <Plus className="mr-2 size-4" /> Add review
        </Button>
      </header>

      <Dialog open={addOpen} onOpenChange={(open) => (open ? null : setAddOpen(false))}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold text-ink">
              Add review
            </DialogTitle>
            <DialogDescription>
              Admin-added reviews are published immediately as approved.
            </DialogDescription>
          </DialogHeader>
          <AddReviewForm
            products={products}
            submitting={false}
            onCancel={() => setAddOpen(false)}
            onSubmit={add}
          />
        </DialogContent>
      </Dialog>

      <div className="mt-6 flex flex-wrap gap-2">
        {(["pending", "approved", "rejected", "all"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 font-sans text-sm capitalize transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-surface text-ink hover:bg-surface/70"
            }`}
          >
            {f} ({counts[f]})
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-border p-10 text-center font-sans text-sm text-muted-foreground">
            No {filter === "all" ? "" : filter} reviews.
          </div>
        ) : (
          filtered.map((r) => (
            <div key={r.id} className="rounded-lg border border-border p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-sans font-semibold text-ink">{r.author}</span>
                    <Stars rating={r.rating} />
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="mt-0.5 font-sans text-xs text-muted-foreground">
                    on {r.productName} · {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {r.status !== "approved" ? (
                    <Button variant="outline" size="sm" onClick={() => setStatus(r, "approved")}>
                      <Check className="mr-1.5 size-4" /> Approve
                    </Button>
                  ) : null}
                  {r.status !== "rejected" ? (
                    <Button variant="outline" size="sm" onClick={() => setStatus(r, "rejected")}>
                      <X className="mr-1.5 size-4" /> Reject
                    </Button>
                  ) : null}
                  <Button variant="ghost" size="icon" onClick={() => remove(r)}>
                    <Trash2 className="size-4 text-primary" />
                  </Button>
                </div>
              </div>
              {r.title ? (
                <p className="mt-3 font-sans text-sm font-medium text-ink">{r.title}</p>
              ) : null}
              {r.body ? (
                <p className="mt-1 font-sans text-sm text-muted-foreground">{r.body}</p>
              ) : null}
            </div>
          ))
        )}
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: ReviewRow["status"] }) {
  const cls =
    status === "approved"
      ? "bg-emerald-100 text-emerald-700"
      : status === "rejected"
        ? "bg-red-100 text-red-700"
        : "bg-amber-100 text-amber-700";
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cls}`}
    >
      {status}
    </span>
  );
}

function AddReviewForm({
  products,
  submitting,
  onSubmit,
  onCancel,
}: {
  products: AdminProductRow[];
  submitting: boolean;
  onCancel?: () => void;
  onSubmit: (values: {
    productId: number;
    author: string;
    rating: number;
    title: string;
    body: string;
  }) => Promise<void> | void;
}) {
  const [productId, setProductId] = useState("");
  const [author, setAuthor] = useState("");
  const [rating, setRating] = useState("5");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId) {
      toast.error("Pick a product");
      return;
    }
    void onSubmit({
      productId: Number(productId),
      author: author.trim(),
      rating: Number(rating),
      title: title.trim(),
      body: body.trim(),
    });
  }

  const selectCls =
    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

  return (
    <form onSubmit={submit} className="mt-2">
      <h2 className="sr-only">Add review</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Product</Label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className={selectCls}
          >
            <option value="">Select a product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Author</Label>
          <Input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Customer name"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Rating</Label>
          <select value={rating} onChange={(e) => setRating(e.target.value)} className={selectCls}>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} ★
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-4 space-y-1.5">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Title</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Smooth shifting"
        />
      </div>
      <div className="mt-4 space-y-1.5">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Body</Label>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="What did you think?"
        />
      </div>
      <div className="mt-5 flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={submitting} className="btn-brand">
          <Plus className="mr-2 size-4" /> Publish review
        </Button>
      </div>
    </form>
  );
}
