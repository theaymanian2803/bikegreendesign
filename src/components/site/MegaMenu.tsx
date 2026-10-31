import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

import {
  getMegaMenu,
  getMegaMenuSync,
  type MegaMenuContent,
} from "@/lib/mega-menu";

/**
 * Mega menu panel. Content is fetched through `getMegaMenu(menuKey)` so the
 * whole panel becomes database-driven the moment that function reads from a
 * backend — this component never hardcodes content.
 */
export function MegaMenu({ menuKey }: { menuKey: string }) {
  const [content, setContent] = useState<MegaMenuContent | undefined>(() =>
    getMegaMenuSync(menuKey),
  );

  useEffect(() => {
    let active = true;
    getMegaMenu(menuKey).then((data) => {
      if (active) setContent(data);
    });
    return () => {
      active = false;
    };
  }, [menuKey]);

  if (!content) return null;

  return (
    <div className="grid w-full grid-cols-1 bg-background shadow-[0_20px_50px_-20px_rgba(0,0,0,0.35)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* Shop by categories */}
      <div className="border-b border-border p-8 lg:border-b-0 lg:border-r">
        <h3 className="text-center font-display text-base font-bold text-ink">
          {content.categoriesTitle}
        </h3>
        <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-4">
          {content.categories.map((c) => (
            <Link key={c.id} to={c.href} className="group text-center">
              <span className="mx-auto flex size-[104px] items-center justify-center overflow-hidden rounded-full bg-surface">
                <img
                  src={c.image}
                  alt={c.label}
                  loading="lazy"
                  width={208}
                  height={208}
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </span>
              <span className="mt-3 block font-sans text-[13px] text-ink transition-colors group-hover:text-primary">
                {c.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured products */}
      <div className="bg-surface/60 p-8">
        <h3 className="text-center font-display text-base font-bold text-ink">
          {content.productsTitle}
        </h3>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {content.products.map((p) => (
            <Link
              key={p.id}
              to={p.href}
              className="group flex items-center gap-3 bg-background p-3"
            >
              <span className="relative shrink-0 overflow-hidden bg-surface">
                {p.badge ? (
                  <span className="absolute left-0 top-0 z-10 bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase text-primary-foreground">
                    {p.badge}
                  </span>
                ) : null}
                <img
                  src={p.image}
                  alt={p.name}
                  loading="lazy"
                  width={160}
                  height={160}
                  className="size-[84px] object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </span>
              <span className="min-w-0">
                <span className="line-clamp-2 block font-sans text-[13px] leading-snug text-ink transition-colors group-hover:text-primary">
                  {p.name}
                </span>
                <span className="mt-1.5 flex items-center gap-2 text-sm font-semibold text-primary">
                  {p.oldPrice ? (
                    <span className="font-normal text-muted-foreground line-through">
                      ${p.oldPrice.toFixed(2)}
                    </span>
                  ) : null}
                  ${p.price.toFixed(2)}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
