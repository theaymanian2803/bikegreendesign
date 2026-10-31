import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";

import type { CatalogProduct } from "@/lib/catalog";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={i < rating ? "size-3 fill-star text-star" : "size-3 fill-border text-border"}
        />
      ))}
    </div>
  );
}

export function ProductCard({ product }: { product: CatalogProduct }) {
  return (
    <article className="group">
      <Link to="/product/$id" params={{ id: product.id }} className="block">
        <div className="product-photo relative overflow-hidden">
          {product.badge ? (
            <span className="absolute left-3 top-3 z-10 bg-primary px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.12em] text-primary-foreground">
              {product.badge}
            </span>
          ) : null}
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            width={700}
            height={700}
            className="aspect-[4/4.5] w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
          <span
            className="absolute bottom-3 right-3 flex size-10 translate-y-2 items-center justify-center bg-background text-ink opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
            aria-hidden="true"
          >
            ↗
          </span>
        </div>
        <div className="space-y-2 py-4">
          <p className="text-[9px] font-bold uppercase tracking-[.15em] text-muted-foreground">
            {product.category}
          </p>
          <h3 className="line-clamp-2 font-display text-[15px] font-semibold leading-snug text-ink transition-colors group-hover:text-primary">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            <Stars rating={product.rating} />
            <span className="text-[10px] text-muted-foreground">{product.rating.toFixed(1)}</span>
          </div>
          <p className="flex items-center gap-2 pt-0.5 text-sm font-semibold text-ink">
            {product.oldPrice ? (
              <span className="text-muted-foreground line-through">
                ${product.oldPrice.toFixed(2)}
              </span>
            ) : null}
            ${product.price.toFixed(2)}
          </p>
        </div>
      </Link>
    </article>
  );
}
