import { Star } from "lucide-react";
import type { Product } from "@/data/products";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={
            i < rating ? "size-3 fill-star text-star" : "size-3 fill-border text-border"
          }
        />
      ))}
    </div>
  );
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group">
      <Link to="/product/$id" params={{ id: product.id }} className="block">
        <div className="relative overflow-hidden bg-surface">
          {product.badge ? (
            <span className="absolute left-2 top-2 z-10 rounded-sm bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-primary-foreground">
              {product.badge}
            </span>
          ) : null}
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            width={700}
            height={700}
            className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="space-y-1.5 py-3">
          <h3 className="line-clamp-2 font-sans text-sm font-medium leading-snug text-ink transition-colors group-hover:text-primary">
            {product.name}
          </h3>
          <Stars rating={product.rating} />
          <p className="flex items-center gap-2 text-sm font-semibold text-primary">
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

