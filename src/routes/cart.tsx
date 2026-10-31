import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/cart")({
  head: () => {
    const title = "Your Cart — Pathway Bike Shop";
    const description =
      "Review the bike parts and gear in your Pathway cart, adjust quantities and see your order total before checkout.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  component: CartPage,
});

function CartPage() {
  const { items, subtotal, shipping, total, setQty, remove, clear, count } = useCart();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="border-b border-border bg-surface py-5">
        <div className="site-container">
          <h1 className="text-2xl tracking-[-.04em] text-ink">Your basket</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-primary">
              Home
            </Link>{" "}
            / Cart
          </p>
        </div>
      </section>

      <main className="site-container min-h-[45vh] py-10 sm:py-14">
        {items.length === 0 ? (
          <div className="mx-auto max-w-[460px] py-16 text-center">
            <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-accent text-secondary">
              <ShoppingCart className="size-7" />
            </span>
            <p className="site-eyebrow mt-6">Ready for a new ride?</p>
            <h2 className="mt-2 text-3xl tracking-[-.05em] text-ink">
              Your basket is taking a breather.
            </h2>
            <p className="mt-2 text-xs text-muted-foreground">
              Browse the workshop shelves and add some parts to get rolling.
            </p>
            <Link to="/shop" className="btn-brand mt-6 inline-block">
              Continue shopping
            </Link>
          </div>
        ) : (
          <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
            <div>
              <div className="hidden border-b border-border pb-3 text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground sm:grid sm:grid-cols-[1fr_120px_110px_40px] sm:gap-4">
                <span>Product</span>
                <span>Quantity</span>
                <span className="text-right">Subtotal</span>
                <span />
              </div>

              {items.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-4 border-b border-border py-5 sm:grid-cols-[1fr_120px_110px_40px] sm:items-center"
                >
                  <div className="flex items-center gap-4">
                    <Link
                      to="/product/$id"
                      params={{ id: item.id }}
                      className="block size-20 shrink-0 overflow-hidden bg-surface"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                        width={160}
                        height={160}
                        className="size-full object-cover"
                      />
                    </Link>
                    <div>
                      <Link
                        to="/product/$id"
                        params={{ id: item.id }}
                        className="text-sm font-medium text-ink hover:text-primary"
                      >
                        {item.name}
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground">
                        ${item.price.toFixed(2)} each
                      </p>
                    </div>
                  </div>

                  <div className="flex w-[120px] items-center border border-border">
                    <button
                      type="button"
                      onClick={() => setQty(item.id, item.qty - 1)}
                      className="flex size-9 items-center justify-center text-muted-foreground hover:text-primary"
                      aria-label={`Decrease quantity of ${item.name}`}
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="flex-1 text-center text-sm">{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty(item.id, item.qty + 1)}
                      className="flex size-9 items-center justify-center text-muted-foreground hover:text-primary"
                      aria-label={`Increase quantity of ${item.name}`}
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>

                  <span className="font-display text-sm font-semibold text-ink sm:text-right">
                    ${(item.price * item.qty).toFixed(2)}
                  </span>

                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    className="flex size-9 items-center justify-center text-muted-foreground hover:text-primary sm:justify-self-end"
                    aria-label={`Remove ${item.name} from cart`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <Link
                  to="/shop"
                  className="text-xs font-bold uppercase tracking-wide text-ink hover:text-primary"
                >
                  Continue shopping
                </Link>
                <button
                  type="button"
                  onClick={clear}
                  className="text-xs font-bold uppercase tracking-wide text-muted-foreground hover:text-primary"
                >
                  Clear cart
                </button>
              </div>
            </div>

            <aside className="admin-panel h-fit border border-border p-6 lg:sticky lg:top-6">
              <p className="site-eyebrow">At a glance</p>
              <h2 className="mt-2 text-xl tracking-[-.04em] text-ink">Order summary</h2>
              <dl className="mt-4 space-y-3 text-xs">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Items</dt>
                  <dd className="text-ink">{count}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="text-ink">${subtotal.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Shipping</dt>
                  <dd className="text-ink">
                    {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-border pt-3">
                  <dt className="font-bold uppercase tracking-wide text-ink">Total</dt>
                  <dd className="font-display text-xl font-bold text-ink">${total.toFixed(2)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-[11px] text-muted-foreground">
                Free delivery on orders over $300. Taxes included.
              </p>
              <Link to="/checkout" className="btn-brand mt-5 block w-full text-center">
                Proceed to checkout
              </Link>
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
