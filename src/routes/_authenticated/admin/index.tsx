import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogOut, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/admin/")({
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
  id: string;
  menu_key: string;
  label: string;
  image_url: string;
  href: string;
  sort_order: number;
};

type ProductRow = {
  id: string;
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
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const menu = useMemo(() => menus.find((m) => m.key === activeKey), [menus, activeKey]);



  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("mega_menus")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) toast.error(error.message);
      const rows = (data ?? []) as MenuRow[];
      setMenus(rows);
      setActiveKey((k) => k || rows[0]?.key || "");
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!activeKey) return;
    (async () => {
      const [c, p] = await Promise.all([
        supabase
          .from("mega_menu_categories")
          .select("*")
          .eq("menu_key", activeKey)
          .order("sort_order", { ascending: true }),
        supabase
          .from("mega_menu_products")
          .select("*")
          .eq("menu_key", activeKey)
          .order("sort_order", { ascending: true }),
      ]);
      if (c.error) toast.error(c.error.message);
      if (p.error) toast.error(p.error.message);
      setCategories((c.data ?? []) as CategoryRow[]);
      setProducts(((p.data ?? []) as ProductRow[]).map((r) => ({ ...r, price: Number(r.price) })));
    })();
  }, [activeKey]);

  function patchMenu(patch: Partial<MenuRow>) {
    setMenus((prev) => prev.map((m) => (m.key === activeKey ? { ...m, ...patch } : m)));
  }

  async function saveAll() {
    if (!menu) return;
    setSaving(true);
    const { error: menuErr } = await supabase
      .from("mega_menus")
      .update({
        title: menu.title,
        categories_title: menu.categories_title,
        products_title: menu.products_title,
        left_banner_image: menu.left_banner_image,
        left_banner_alt: menu.left_banner_alt,
        right_banner_image: menu.right_banner_image,
        right_banner_alt: menu.right_banner_alt,
      })
      .eq("key", menu.key);

    const catErr = categories.length
      ? (
          await supabase.from("mega_menu_categories").upsert(
            categories.map((c, i) => ({
              id: c.id,
              menu_key: c.menu_key,
              label: c.label,
              image_url: c.image_url,
              href: c.href,
              sort_order: i + 1,
            })),
          )
        ).error
      : null;

    const prodErr = products.length
      ? (
          await supabase.from("mega_menu_products").upsert(
            products.map((p, i) => ({
              id: p.id,
              menu_key: p.menu_key,
              name: p.name,
              price: p.price,
              old_price: p.old_price,
              badge: p.badge,
              image_url: p.image_url,
              href: p.href,
              sort_order: i + 1,
            })),
          )
        ).error
      : null;

    setSaving(false);
    const err = menuErr || catErr || prodErr;
    if (err) toast.error(err.message);
    else toast.success("Mega menu saved");
  }

  async function addCategory() {
    const { data, error } = await supabase
      .from("mega_menu_categories")
      .insert({
        menu_key: activeKey,
        label: "New category",
        image_url: "/menu/p-helmet-red.jpg",
        href: "/shop",
        sort_order: categories.length + 1,
      })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setCategories((prev) => [...prev, data as CategoryRow]);
  }

  async function addProduct() {
    const { data, error } = await supabase
      .from("mega_menu_products")
      .insert({
        menu_key: activeKey,
        name: "New product",
        price: 0,
        image_url: "/menu/p-stem.jpg",
        href: "/shop",
        sort_order: products.length + 1,
      })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setProducts((prev) => [...prev, { ...(data as ProductRow), price: Number(data.price) }]);
  }

  async function removeCategory(id: string) {
    const { error } = await supabase.from("mega_menu_categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  async function removeProduct(id: string) {
    const { error } = await supabase.from("mega_menu_products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setProducts((prev) => prev.filter((p) => p.id !== id));
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
              <Field label="Nav label" value={menu.title} onChange={(v) => patchMenu({ title: v })} />
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
                <div key={c.id} className="flex flex-wrap items-start gap-4 rounded border border-border p-4">
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
                <div key={p.id} className="flex flex-wrap items-start gap-4 rounded border border-border p-4">
                  <Thumb src={p.image_url} />
                  <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-3">
                    <Field
                      label="Name"
                      value={p.name}
                      onChange={(v) =>
                        setProducts((prev) => prev.map((x, xi) => (xi === i ? { ...x, name: v } : x)))
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
                          prev.map((x, xi) => (xi === i ? { ...x, badge: v === "" ? null : v } : x)),
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
                        setProducts((prev) => prev.map((x, xi) => (xi === i ? { ...x, href: v } : x)))
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
