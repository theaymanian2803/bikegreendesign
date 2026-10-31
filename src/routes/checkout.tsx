import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { useCart } from "@/lib/cart";
import { useSessionUser } from "@/hooks/use-session-user";
import { placeOrder } from "@/lib/orders.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  head: () => {
    const title = "Checkout — Pathway Bike Shop";
    const description =
      "Enter your shipping and contact details to place your Pathway bike parts and gear order.";
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
  component: CheckoutPage,
});

const checkoutSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(60),
  lastName: z.string().trim().min(1, "Last name is required").max(60),
  email: z.string().trim().email("Enter a valid email address").max(255),
  phone: z.string().trim().min(6, "Enter a valid phone number").max(30),
  address: z.string().trim().min(1, "Street address is required").max(200),
  city: z.string().trim().min(1, "City is required").max(80),
  postcode: z.string().trim().min(3, "Postal code is required").max(20),
  country: z.string().trim().min(1, "Country is required").max(80),
  notes: z.string().trim().max(500).optional(),
});

type FieldName = keyof z.infer<typeof checkoutSchema>;

const fields: { name: FieldName; label: string; type?: string; full?: boolean }[] = [
  { name: "firstName", label: "First name" },
  { name: "lastName", label: "Last name" },
  { name: "email", label: "Email address", type: "email" },
  { name: "phone", label: "Phone number", type: "tel" },
  { name: "address", label: "Street address", full: true },
  { name: "city", label: "City" },
  { name: "postcode", label: "Postal code" },
  { name: "country", label: "Country" },
];

function CheckoutPage() {
  const { items, subtotal, shipping, total, count, clear } = useCart();
  const navigate = useNavigate();
  const { data: user } = useSessionUser();
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [order, setOrder] = useState<{ id: string; email: string; total: number } | null>(null);
  const [placing, setPlacing] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const parsed = checkoutSchema.safeParse(data);

    if (!parsed.success) {
      const next: Partial<Record<FieldName, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as FieldName;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }

    if (!user) {
      void navigate({ to: "/auth", search: { redirect: "/checkout" } });
      return;
    }

    setErrors({});
    setPlacing(true);
    try {
      const placed = await placeOrder({
        data: {
          ...parsed.data,
          items: items.map((i) => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
        },
      });
      setOrder({ id: placed.publicId, email: placed.email, total: placed.total });
      clear();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not place your order");
    }
    setPlacing(false);
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="bg-ink py-8">
        <div className="mx-auto max-w-[1200px] px-4 text-center">
          <h1 className="text-xl text-ink-foreground">Checkout</h1>
          <p className="mt-1 text-xs text-ink-foreground/70">
            <Link to="/" className="hover:text-primary">
              Home
            </Link>{" "}
            /{" "}
            <Link to="/cart" className="hover:text-primary">
              Cart
            </Link>{" "}
            / Checkout
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-[1200px] px-4 py-12">
        {order ? (
          <div className="mx-auto max-w-[520px] border border-border p-10 text-center">
            <CheckCircle2 className="mx-auto size-10 text-primary" />
            <h2 className="mt-4 text-xl text-ink">Thank you, your order is placed!</h2>
            <p className="mt-2 text-xs text-muted-foreground">
              Order <span className="font-bold text-ink">{order.id}</span> — a confirmation was sent
              to {order.email}. Our workshop crew will pack and ship it within 24 hours.
            </p>
            <p className="mt-4 text-lg font-bold text-primary">${order.total.toFixed(2)}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/shop" className="btn-brand">
                Continue shopping
              </Link>
              <button
                type="button"
                onClick={() => navigate({ to: "/" })}
                className="border border-border px-5 py-3 text-xs font-bold uppercase tracking-wide text-ink hover:text-primary"
              >
                Back home
              </button>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="mx-auto max-w-[420px] py-16 text-center">
            <ShoppingCart className="mx-auto size-10 text-primary" />
            <h2 className="mt-4 text-xl text-ink">Nothing to check out</h2>
            <p className="mt-2 text-xs text-muted-foreground">
              Add a few parts to your cart before placing an order.
            </p>
            <Link to="/shop" className="btn-brand mt-6 inline-block">
              Browse the shop
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="grid gap-10 lg:grid-cols-[1fr_320px]">
            <div>
              <h2 className="text-lg text-ink">Shipping &amp; Contact Details</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {fields.map((field) => (
                  <div key={field.name} className={field.full ? "sm:col-span-2" : undefined}>
                    <label
                      htmlFor={field.name}
                      className="text-[11px] font-bold uppercase tracking-wide text-ink"
                    >
                      {field.label}
                    </label>
                    <input
                      id={field.name}
                      name={field.name}
                      type={field.type ?? "text"}
                      maxLength={255}
                      aria-invalid={errors[field.name] ? true : undefined}
                      className="mt-1.5 w-full border border-border bg-background px-3 py-2.5 text-sm text-ink outline-none focus:border-primary"
                    />
                    {errors[field.name] ? (
                      <p className="mt-1 text-[11px] text-primary">{errors[field.name]}</p>
                    ) : null}
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="notes"
                    className="text-[11px] font-bold uppercase tracking-wide text-ink"
                  >
                    Delivery notes (optional)
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={4}
                    maxLength={500}
                    className="mt-1.5 w-full border border-border bg-background px-3 py-2.5 text-sm text-ink outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            <aside className="h-fit border border-border p-6">
              <h2 className="text-lg text-ink">Order Summary</h2>
              <ul className="mt-4 space-y-3">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                      width={96}
                      height={96}
                      className="size-12 shrink-0 object-cover"
                    />
                    <span className="flex-1 text-xs text-ink">
                      {item.name}
                      <span className="text-muted-foreground"> × {item.qty}</span>
                    </span>
                    <span className="text-xs font-semibold text-primary">
                      ${(item.price * item.qty).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
              <dl className="mt-5 space-y-3 border-t border-border pt-4 text-xs">
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
                  <dd className="text-lg font-bold text-primary">${total.toFixed(2)}</dd>
                </div>
              </dl>
              <button type="submit" disabled={placing} className="btn-brand mt-5 w-full">
                {placing ? "Placing order…" : "Place order"}
              </button>
              <Link
                to="/cart"
                className="mt-3 block text-center text-[11px] font-bold uppercase tracking-wide text-muted-foreground hover:text-primary"
              >
                Back to cart
              </Link>
            </aside>
          </form>
        )}
      </main>

      <Footer />
    </div>
  );
}
