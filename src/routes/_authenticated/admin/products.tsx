import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  createProduct,
  deleteProduct,
  loadCatalogAdmin,
  updateProduct,
  type AdminCategoryRow,
  type AdminProductRow,
} from "@/integrations/turso/catalog.functions";
import { ProductForm, type ProductFormValues } from "@/components/admin/ProductForm";
import { Button } from "@/components/ui/button";
import { useAdminWriteGuard } from "@/hooks/use-admin-write-guard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/admin/products")({
  head: () => ({
    meta: [
      { title: "Products — Pathway Admin" },
      {
        name: "description",
        content: "Manage the Pathway product catalog: add, edit and remove products.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProductsPage,
});

type ModalMode = "create" | "edit";

function ProductsPage() {
  const [products, setProducts] = useState<AdminProductRow[]>([]);
  const [categories, setCategories] = useState<AdminCategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [editingProduct, setEditingProduct] = useState<AdminProductRow | null>(null);
  const [saving, setSaving] = useState(false);
  const { requireWrite } = useAdminWriteGuard();

  async function load() {
    try {
      const data = await loadCatalogAdmin();
      setProducts(data.products);
      setCategories(data.categories);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load products");
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  function openCreate() {
    if (!requireWrite()) return;
    setModalMode("create");
    setEditingProduct(null);
    setModalOpen(true);
  }

  function openEdit(product: AdminProductRow) {
    if (!requireWrite()) return;
    setModalMode("edit");
    setEditingProduct(product);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setSaving(false);
  }

  async function submit(values: ProductFormValues) {
    if (!requireWrite()) return;
    setSaving(true);
    try {
      if (modalMode === "create") {
        await createProduct({ data: values });
        toast.success("Product created");
      } else if (editingProduct) {
        await updateProduct({ data: { ...values, id: editingProduct.id } });
        toast.success("Product saved");
      }
      closeModal();
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save product");
      setSaving(false);
    }
  }

  async function remove(product: AdminProductRow) {
    if (!requireWrite()) return;
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await deleteProduct({ data: { id: product.id } });
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      toast.success("Product deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete product");
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
          <h1 className="font-display text-3xl font-bold text-ink">Products</h1>
          <p className="mt-1 font-sans text-sm text-muted-foreground">
            Everything shown in the storefront shop. Products live in the catalog table.
          </p>
        </div>
        <Button onClick={openCreate} className="btn-brand">
          <Plus className="mr-2 size-4" /> Add product
        </Button>
      </header>

      {products.length === 0 ? (
        <div className="mt-8 rounded-lg border border-border p-10 text-center font-sans text-sm text-muted-foreground">
          No products yet.
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[760px] font-sans text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Badge</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt=""
                          loading="lazy"
                          width={56}
                          height={56}
                          className="size-14 shrink-0 rounded object-cover"
                        />
                      ) : (
                        <span className="size-14 shrink-0 rounded bg-surface" />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-ink">{p.name}</p>
                        <p className="text-xs text-muted-foreground">/{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.category_name ?? "—"}</td>
                  <td className="px-4 py-3 font-semibold text-ink">
                    ${p.price.toFixed(2)}
                    {p.old_price !== null ? (
                      <span className="ml-1.5 text-xs font-normal text-muted-foreground line-through">
                        ${p.old_price.toFixed(2)}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.badge ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(p)}
                        aria-label={`Edit ${p.name}`}
                      >
                        <Pencil className="size-4 text-primary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(p)}
                        aria-label={`Delete ${p.name}`}
                      >
                        <Trash2 className="size-4 text-primary" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 font-sans text-xs text-muted-foreground">
        {products.length} product{products.length === 1 ? "" : "s"} across {categories.length}{" "}
        categor
        {categories.length === 1 ? "y" : "ies"}.
      </p>

      <Dialog open={modalOpen} onOpenChange={(open) => (open ? null : closeModal())}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {modalMode === "create" ? "Add product" : `Edit "${editingProduct?.name ?? ""}"`}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create"
                ? "Fill in the details below. The product appears in the shop immediately."
                : "Changes go live on the shop immediately after saving."}
            </DialogDescription>
          </DialogHeader>
          <ProductForm
            product={editingProduct}
            categories={categories}
            submitting={saving}
            submitLabel={modalMode === "create" ? "Create product" : "Save changes"}
            onSubmit={submit}
            onCancel={closeModal}
          />
        </DialogContent>
      </Dialog>
    </main>
  );
}
