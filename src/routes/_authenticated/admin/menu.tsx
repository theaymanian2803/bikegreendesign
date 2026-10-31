import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  addMegaMenuCategory,
  addMegaMenuProduct,
  loadMegaMenuAdmin,
  removeMegaMenuCategory,
  removeMegaMenuProduct,
  saveMegaMenu,
} from "@/integrations/turso/mega-menu.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminWriteGuard } from "@/hooks/use-admin-write-guard";

export const Route = createFileRoute("/_authenticated/admin/menu")({
  head: () => ({
    meta: [
      { title: "Mega Menu Admin — Pathway" },
      {
        name: "description",
        content:
          "Manage Pathway's mega menu: categories, featured products, images, labels and link targets.",
      },
      { property: "og:title", content: "Mega Menu Admin — Pathway" },
      {
        property: "og:description",
        content: "Edit mega menu categories, products, images and links.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type MenuRow = {
  key: string;
  title: string;
  categories_title: string;
  products_title: string;
  left_banner_image: string | null;
  left_banner_alt: string | null;
  right_banner_image: string | null;
  right_banner_alt: string | null;
  sort_order: number;
};

type CategoryRow = {
  id: number;
  menu_key: string;
  label: string;
  image_url: string;
  href: string;
  sort_order: number;
};

type ProductRow = {
  id: number;
  menu_key: string;
  name: string;
  price: number;
  old_price: number | null;
  badge: string | null;
  image_url: string;
  href: string;
  sort_order: number;
};

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      <Input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Thumb({ src }: { src: string }) {
  if (!src) return <span className="size-14 shrink-0 rounded bg-surface" />;
  return (
    <img
      src={src}
      alt=""
      className="size-14 shrink-0 rounded object-cover"
      loading="lazy"
      width={112}
      height={112}
    />
  );
}

function AdminPage() {
  const [menus, setMenus] = useState<MenuRow[]>([]);
  const [activeKey, setActiveKey] = useState<string>("");
  const [allCategories, setAllCategories] = useState<CategoryRow[]>([]);
  const [allProducts, setAllProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { requireWrite } = useAdminWriteGuard();

  const menu = useMemo(() => menus.find((m) => m.key === activeKey), [menus, activeKey]);
  const categories = useMemo(
    () => allCategories.filter((c) => c.menu_key === activeKey),
    [allCategories, activeKey],
  );
  const products = useMemo(
    () => allProducts.filter((p) => p.menu_key === activeKey),
    [allProducts, activeKey],
  );

  useEffect(() => {
    (async () => {
      try {
        const data = await loadMegaMenuAdmin();
        setMenus(data.menus);
        setAllCategories(data.categories);
        setAllProducts(data.products);
        setActiveKey((k) => k || data.menus[0]?.key || "");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not load the mega menu");
      }
      setLoading(false);
    })();
  }, []);

  function setCategories(update: (prev: CategoryRow[]) => CategoryRow[]) {
    setAllCategories((prev) => {
      const others = prev.filter((c) => c.menu_key !== activeKey);
      return [...others, ...update(prev.filter((c) => c.menu_key === activeKey))];
    });
  }

  function setProducts(update: (prev: ProductRow[]) => ProductRow[]) {
    setAllProducts((prev) => {
      const others = prev.filter((p) => p.menu_key !== activeKey);
      return [...others, ...update(prev.filter((p) => p.menu_key === activeKey))];
    });
  }

  function patchMenu(patch: Partial<MenuRow>) {
    setMenus((prev) => prev.map((m) => (m.key === activeKey ? { ...m, ...patch } : m)));
  }

  async function saveAll() {
    if (!menu) return;
    if (!requireWrite()) return;
    setSaving(true);
    try {
      await saveMegaMenu({
        data: {
          menu,
          categories: categories.map((c, i) => ({ ...c, sort_order: i + 1 })),
          products: products.map((p, i) => ({ ...p, sort_order: i + 1 })),
        },
      });
      toast.success("Mega menu saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the mega menu");
    }
    setSaving(false);
  }

  async function addCategory() {
    if (!requireWrite()) return;
    try {
      const row = await addMegaMenuCategory({ data: { menuKey: activeKey } });
      setCategories((prev) => [...prev, row]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add a category");
    }
  }

  async function addProduct() {
    if (!requireWrite()) return;
    try {
      const row = await addMegaMenuProduct({ data: { menuKey: activeKey } });
      setProducts((prev) => [...prev, row]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add a product");
    }
  }

  async function removeCategory(id: number) {
    if (!requireWrite()) return;
    try {
      await removeMegaMenuCategory({ data: { id } });
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove the category");
    }
  }

  async function removeProduct(id: number) {
    if (!requireWrite()) return;
    try {
      await removeMegaMenuProduct({ data: { id } });
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove the product");
    }
  }

  if (loading) {
    return <div className="py-20 font-sans text-muted-foreground">Loading…</div>;
  }

  return (
    <main className="py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-label">Admin</p>
          <h1 className="font-display text-3xl font-bold text-ink">Mega menu content</h1>
          <p className="mt-1 font-sans text-sm text-muted-foreground">
            Images, labels and link targets for every dropdown in the main navigation.
          </p>
        </div>
        <Button onClick={saveAll} disabled={saving} className="btn-brand">
          <Save className="mr-2 size-4" />
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </header>

      <div className="mt-8 flex flex-wrap gap-2">
        {menus.map((m) => (
          <button
            key={m.key}
            onClick={() => setActiveKey(m.key)}
            className={`rounded-full px-4 py-2 font-sans text-sm transition-colors ${
              m.key === activeKey
                ? "bg-primary text-primary-foreground"
                : "bg-surface text-ink hover:bg-surface/70"
            }`}
          >
            {m.title}
          </button>
        ))}
      </div>

      {menu ? (
        <div className="mt-8 space-y-10">
          <section className="rounded-lg border border-border p-6">
            <h2 className="font-display text-lg font-bold text-ink">Menu settings</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field
                label="Nav label"
                value={menu.title}
                onChange={(v) => patchMenu({ title: v })}
              />
              <Field
                label="Categories heading"
                value={menu.categories_title}
                onChange={(v) => patchMenu({ categories_title: v })}
              />
              <Field
                label="Products heading"
                value={menu.products_title}
                onChange={(v) => patchMenu({ products_title: v })}
              />
              <Field
                label="Left banner image URL"
                value={menu.left_banner_image ?? ""}
                onChange={(v) => patchMenu({ left_banner_image: v })}
              />
              <Field
                label="Left banner alt"
                value={menu.left_banner_alt ?? ""}
                onChange={(v) => patchMenu({ left_banner_alt: v })}
              />
              <Field
                label="Right banner image URL"
                value={menu.right_banner_image ?? ""}
                onChange={(v) => patchMenu({ right_banner_image: v })}
              />
              <Field
                label="Right banner alt"
                value={menu.right_banner_alt ?? ""}
                onChange={(v) => patchMenu({ right_banner_alt: v })}
              />
            </div>
          </section>

          <section className="rounded-lg border border-border p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-ink">
                Categories ({categories.length})
              </h2>
              <Button variant="outline" onClick={addCategory}>
                <Plus className="mr-2 size-4" /> Add category
              </Button>
            </div>
            <div className="mt-4 space-y-4">
              {categories.map((c, i) => (
                <div
                  key={c.id}
                  className="flex flex-wrap items-start gap-4 rounded border border-border p-4"
                >
                  <Thumb src={c.image_url} />
                  <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-3">
                    <Field
                      label="Label"
                      value={c.label}
                      onChange={(v) =>
                        setCategories((prev) =>
                          prev.map((x, xi) => (xi === i ? { ...x, label: v } : x)),
                        )
                      }
                    />
                    <Field
                      label="Image URL"
                      value={c.image_url}
                      placeholder="/menu/p-helmet-red.jpg"
                      onChange={(v) =>
                        setCategories((prev) =>
                          prev.map((x, xi) => (xi === i ? { ...x, image_url: v } : x)),
                        )
                      }
                    />
                    <Field
                      label="Link target"
                      value={c.href}
                      placeholder="/shop"
                      onChange={(v) =>
                        setCategories((prev) =>
                          prev.map((x, xi) => (xi === i ? { ...x, href: v } : x)),
                        )
                      }
                    />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeCategory(c.id)}>
                    <Trash2 className="size-4 text-primary" />
                  </Button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-border p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-ink">
                Featured products ({products.length})
              </h2>
              <Button variant="outline" onClick={addProduct}>
                <Plus className="mr-2 size-4" /> Add product
              </Button>
            </div>
            <div className="mt-4 space-y-4">
              {products.map((p, i) => (
                <div
                  key={p.id}
                  className="flex flex-wrap items-start gap-4 rounded border border-border p-4"
                >
                  <Thumb src={p.image_url} />
                  <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-3">
                    <Field
                      label="Name"
                      value={p.name}
                      onChange={(v) =>
                        setProducts((prev) =>
                          prev.map((x, xi) => (xi === i ? { ...x, name: v } : x)),
                        )
                      }
                    />
                    <Field
                      label="Price"
                      value={String(p.price)}
                      onChange={(v) =>
                        setProducts((prev) =>
                          prev.map((x, xi) => (xi === i ? { ...x, price: Number(v) || 0 } : x)),
                        )
                      }
                    />
                    <Field
                      label="Old price"
                      value={p.old_price === null ? "" : String(p.old_price)}
                      onChange={(v) =>
                        setProducts((prev) =>
                          prev.map((x, xi) =>
                            xi === i ? { ...x, old_price: v === "" ? null : Number(v) || 0 } : x,
                          ),
                        )
                      }
                    />
                    <Field
                      label="Badge"
                      value={p.badge ?? ""}
                      placeholder="-10%"
                      onChange={(v) =>
                        setProducts((prev) =>
                          prev.map((x, xi) =>
                            xi === i ? { ...x, badge: v === "" ? null : v } : x,
                          ),
                        )
                      }
                    />
                    <Field
                      label="Image URL"
                      value={p.image_url}
                      placeholder="/menu/p-stem.jpg"
                      onChange={(v) =>
                        setProducts((prev) =>
                          prev.map((x, xi) => (xi === i ? { ...x, image_url: v } : x)),
                        )
                      }
                    />
                    <Field
                      label="Link target"
                      value={p.href}
                      placeholder="/shop"
                      onChange={(v) =>
                        setProducts((prev) =>
                          prev.map((x, xi) => (xi === i ? { ...x, href: v } : x)),
                        )
                      }
                    />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeProduct(p.id)}>
                    <Trash2 className="size-4 text-primary" />
                  </Button>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
