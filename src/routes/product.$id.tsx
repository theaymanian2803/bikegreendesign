import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { Star, Check, Truck, ShieldCheck, RotateCcw, Minus, Plus, Heart } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ProductCard } from "@/components/site/ProductCard";
import { useCart } from "@/lib/cart";
import { useFavorites } from "@/lib/favorites";
import { productGallery } from "@/lib/catalog";
import { getCatalogProduct } from "@/integrations/turso/catalog.functions";
import {
  createReview,
  listProductReviews,
  type ProductReviews,
} from "@/integrations/turso/reviews.functions";

export const Route = createFileRoute("/product/$id")({
  loader: async ({ params }) => {
    const data = await getCatalogProduct({ data: params.id });
    if (!data) throw notFound();
    const reviews = await listProductReviews({ data: params.id });
    return { ...data, reviews };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Product not found — Pathway" }, { name: "robots", content: "noindex" }],
      };
    }
    const { product } = loaderData;
    const title = `${product.name} — Pathway Bike Shop`;
    const description = `${product.name} in ${product.category} for $${product.price.toFixed(2)}. Shipped and fitted by the Pathway workshop.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: ProductNotFound,
  component: ProductDetail,
});

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={
            i < rating ? "size-3.5 fill-star text-star" : "size-3.5 fill-border text-border"
          }
        />
      ))}
    </div>
  );
}

function ProductNotFound() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-[600px] px-4 py-24 text-center">
        <h1 className="text-2xl">Product not found</h1>
        <p className="mt-3 text-xs text-muted-foreground">
          The item you are looking for is no longer available.
        </p>
        <Link to="/shop" className="btn-brand mt-6 inline-block">
          Back to shop
        </Link>
      </main>
      <Footer />
    </div>
  );
}

function ProductDetail() {
  const { product, related, reviews } = Route.useLoaderData();
  const gallery = productGallery(product);
  const [reviewData, setReviewData] = useState<ProductReviews>(reviews);
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<"description" | "details" | "reviews">("description");
  const [added, setAdded] = useState(false);
  const { add } = useCart();
  const { isFavorite, toggle } = useFavorites();
  const navigate = useNavigate();
  const soldOut = product.badge === "Out of stock";
  const favorited = isFavorite(product.id);
  const average = reviewData.average || product.rating;
  const reviewCount = reviewData.count;

  async function reloadReviews() {
    try {
      setReviewData(await listProductReviews({ data: product.id }));
    } catch {
      // keep the last good list
    }
  }

  const handleAdd = () => {
    add({ id: product.id, name: product.name, price: product.price, image: product.image }, qty);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Breadcrumb banner */}
      <section className="bg-ink py-8">
        <div className="mx-auto max-w-[1200px] px-4 text-center">
          <h1 className="text-xl text-ink-foreground">{product.category}</h1>
          <p className="mt-1 text-xs text-ink-foreground/70">
            <Link to="/" className="hover:text-primary">
              Home
            </Link>{" "}
            /{" "}
            <Link to="/shop" className="hover:text-primary">
              Shop
            </Link>{" "}
            / {product.name}
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-[1200px] px-4 py-12">
        <div className="grid gap-10 lg:grid-cols-2">
          {/* Gallery */}
          <div>
            <div className="relative overflow-hidden bg-surface">
              {product.badge ? (
                <span className="absolute left-3 top-3 z-10 rounded-sm bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-primary-foreground">
                  {product.badge}
                </span>
              ) : null}
              <img
                src={gallery[active]}
                alt={product.name}
                width={900}
                height={900}
                className="aspect-square w-full object-cover"
              />
            </div>
            <div className="mt-3 grid grid-cols-4 gap-3">
              {gallery.map((g, i) => (
                <button
                  key={g + i}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`overflow-hidden border bg-surface ${
                    i === active ? "border-primary" : "border-border"
                  }`}
                  aria-label={`View image ${i + 1}`}
                >
                  <img
                    src={g}
                    alt={`${product.name} view ${i + 1}`}
                    loading="lazy"
                    width={220}
                    height={220}
                    className="aspect-square w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary">
              {product.brand}
            </span>
            <h2 className="mt-2 text-2xl leading-tight text-ink">{product.name}</h2>

            <div className="mt-3 flex items-center gap-3">
              <Stars rating={Math.round(average)} />
              <span className="text-xs text-muted-foreground">
                {average.toFixed(1)} · {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
              </span>
            </div>

            <div className="mt-4 flex items-end gap-3">
              <span className="text-3xl font-bold text-primary">${product.price.toFixed(2)}</span>
              {product.oldPrice ? (
                <span className="pb-1 text-sm text-muted-foreground line-through">
                  ${product.oldPrice.toFixed(2)}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Tax included. Shipping calculated at checkout.
            </p>

            <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
              {product.description}
            </p>

            <ul className="mt-5 space-y-2">
              {product.highlights?.map((h: string) => (
                <li key={h} className="flex items-start gap-2 text-xs text-ink">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  {h}
                </li>
              ))}
            </ul>

            <dl className="mt-5 grid grid-cols-2 gap-y-2 text-xs">
              <dt className="text-muted-foreground">SKU</dt>
              <dd className="text-ink">{product.sku}</dd>
              <dt className="text-muted-foreground">Category</dt>
              <dd className="text-ink">{product.category}</dd>
              <dt className="text-muted-foreground">Availability</dt>
              <dd className={soldOut ? "text-muted-foreground" : "text-primary"}>
                {soldOut ? "Out of stock" : "In stock"}
              </dd>
            </dl>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="flex items-center border border-border">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="flex size-9 items-center justify-center text-muted-foreground hover:text-primary"
                  aria-label="Decrease quantity"
                >
                  <Minus className="size-3.5" />
                </button>
                <span className="w-10 text-center text-sm">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                  className="flex size-9 items-center justify-center text-muted-foreground hover:text-primary"
                  aria-label="Increase quantity"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
              <button
                type="button"
                disabled={soldOut}
                onClick={handleAdd}
                className="btn-brand disabled:opacity-50"
              >
                {soldOut ? "Out of stock" : added ? "Added to cart ✓" : "Add to cart"}
              </button>
              <button
                type="button"
                disabled={soldOut}
                onClick={() => {
                  handleAdd();
                  void navigate({ to: "/cart" });
                }}
                className="border border-ink px-5 py-2.5 font-display text-[13px] font-bold uppercase tracking-wide text-ink transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
              >
                Buy now
              </button>
              <button
                type="button"
                onClick={() => toggle(product)}
                className={`flex size-9 items-center justify-center border transition-colors ${
                  favorited
                    ? "border-primary text-primary"
                    : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                }`}
                aria-label={favorited ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart className={`size-4 ${favorited ? "fill-primary" : ""}`} />
              </button>
            </div>

            <div className="mt-7 grid gap-3 border-t border-border pt-5 sm:grid-cols-3">
              {[
                { icon: Truck, label: "Free delivery over $300" },
                { icon: RotateCcw, label: "30 day easy returns" },
                { icon: ShieldCheck, label: "2 year warranty" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 text-[11px] text-muted-foreground"
                >
                  <Icon className="size-4 text-primary" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-14 border-t border-border">
          <div className="flex flex-wrap gap-6 border-b border-border">
            {(["description", "details", "reviews"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`-mb-px border-b-2 py-3 text-xs font-bold uppercase tracking-wide ${
                  tab === t
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-ink"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="py-6">
            {tab === "description" ? (
              <div className="max-w-[820px] space-y-4 text-xs leading-relaxed text-muted-foreground">
                <p>{product.description}</p>
                <p>
                  Our mechanics ride the same components we sell, so every part on this page has
                  been tested on local roads and trails before it reaches the shelf. Bring your bike
                  into the Pathway workshop and we will fit it, torque it to spec and take it out
                  for a quick shakedown ride — free with any purchase over $150.
                </p>
              </div>
            ) : null}

            {tab === "details" ? (
              <table className="w-full max-w-[620px] text-xs">
                <tbody>
                  {product.specs?.map((s: { label: string; value: string }) => (
                    <tr key={s.label} className="border-b border-border">
                      <th className="w-40 py-2.5 text-left font-medium text-ink">{s.label}</th>
                      <td className="py-2.5 text-muted-foreground">{s.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}

            {tab === "reviews" ? (
              <div className="max-w-[720px] space-y-5">
                {reviewData.reviews.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No reviews yet — be the first to write one.
                  </p>
                ) : (
                  reviewData.reviews.map((r) => (
                    <div key={r.id} className="border border-border p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-ink">{r.author}</span>
                        <Stars rating={r.rating} />
                      </div>
                      {r.title ? <p className="mt-2 text-sm text-ink">{r.title}</p> : null}
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{r.body}</p>
                    </div>
                  ))
                )}
                <ReviewForm productSlug={product.id} onSubmitted={reloadReviews} />
              </div>
            ) : null}
          </div>
        </div>

        {/* Related */}
        {related.length ? (
          <section className="mt-14">
            <span className="section-label">Related Products</span>
            <h2 className="mt-2 text-2xl">You May Also Like</h2>
            <div className="mt-6 grid grid-cols-2 gap-6 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}

function ReviewForm({
  productSlug,
  onSubmitted,
}: {
  productSlug: string;
  onSubmitted: () => Promise<void>;
}) {
  const [author, setAuthor] = useState("");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await createReview({ data: { productSlug, author, rating, title, body } });
      toast.success("Thanks � your review is waiting for approval.");
      setAuthor("");
      setTitle("");
      setBody("");
      setRating(5);
      await onSubmitted();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit your review");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="border border-border p-4">
      <h3 className="text-sm text-ink">Write a review</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <input
          required
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Your name"
          className="border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
        />
        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="border border-border bg-background px-3 py-2 text-xs text-ink"
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} star{n === 1 ? "" : "s"}
            </option>
          ))}
        </select>
      </div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="mt-3 w-full border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
      />
      <textarea
        required
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="How did it work out?"
        rows={3}
        className="mt-3 w-full border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
      />
      <button type="submit" disabled={busy} className="btn-brand mt-3">
        {busy ? "Sending�" : "Submit review"}
      </button>
    </form>
  );
}
