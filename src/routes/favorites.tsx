import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ProductCard } from "@/components/site/ProductCard";
import { useFavorites } from "@/lib/favorites";

export const Route = createFileRoute("/favorites")({
  head: () => ({
    meta: [
      { title: "Your favourites — Pathway Bike Shop" },
      { name: "description", content: "The bike parts and gear you saved for later." },
      { property: "og:title", content: "Your favourites — Pathway Bike Shop" },
      { property: "og:description", content: "Everything you saved for later at Pathway." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const { items } = useFavorites();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-[1200px] px-4 py-14">
        <p className="section-label">Saved for later</p>
        <h1 className="mt-2 text-2xl text-ink">Your favourites</h1>
        <p className="mt-2 text-xs text-muted-foreground">
          {items.length === 0
            ? "Nothing saved yet."
            : `${items.length} ${items.length === 1 ? "item" : "items"} saved.`}
        </p>

        {items.length === 0 ? (
          <div className="mt-10 border border-border p-12 text-center">
            <Heart className="mx-auto size-6 text-primary" />
            <p className="mt-4 text-sm text-ink">No favourites yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Tap the heart on any product to keep it here.
            </p>
            <Link to="/shop" className="btn-brand mt-6 inline-block">
              Browse the shop
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-6 lg:grid-cols-4">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
