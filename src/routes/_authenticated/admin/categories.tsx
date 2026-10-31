import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  createCategory,
  deleteCategory,
  loadCatalogAdmin,
  updateCategory,
  type AdminCategoryRow,
} from "@/integrations/turso/catalog.functions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminWriteGuard } from "@/hooks/use-admin-write-guard";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  head: () => ({
    meta: [
      { title: "Categories — Pathway Admin" },
      {
        name: "description",
        content: "Manage the Pathway shop categories.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CategoriesPage,
});

function Field({
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      <Input
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

const EMPTY_CATEGORY = { name: "", slug: "", image_url: "", description: "" };

function CategoriesPage() {
  const [categories, setCategories] = useState<AdminCategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState(EMPTY_CATEGORY);
  const [adding, setAdding] = useState(false);
  const { locked, requireWrite } = useAdminWriteGuard();

  async function load() {
    try {
      const data = await loadCatalogAdmin();
      setCategories(data.categories);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load categories");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function patch(id: number, patch: Partial<AdminCategoryRow>) {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function openAdd() {
    if (!requireWrite()) return;
    setDraft(EMPTY_CATEGORY);
    setAddOpen(true);
  }

  async function add(event: FormEvent) {
    event.preventDefault();
    if (!requireWrite()) return;
    const name = draft.name.trim();
    if (!name) {
      toast.error("Category name is required");
      return;
    }
    setAdding(true);
    try {
      await createCategory({ data: { ...draft, name, slug: draft.slug.trim() } });
      toast.success("Category created");
      setAddOpen(false);
      setDraft(EMPTY_CATEGORY);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add category");
    }
    setAdding(false);
  }

  async function save(category: AdminCategoryRow) {
    if (!requireWrite()) return;
    setSavingId(category.id);
    try {
      await updateCategory({
        data: {
          id: category.id,
          name: category.name,
          slug: category.slug,
          image_url: category.image_url,
          description: category.description,
          sort_order: category.sort_order,
        },
      });
      toast.success("Category saved");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save category");
    }
    setSavingId(null);
  }

  async function remove(category: AdminCategoryRow) {
    if (!requireWrite()) return;
    const productWord = category.product_count === 1 ? "product" : "products";
    if (
      !window.confirm(
        category.product_count > 0
          ? `Delete "${category.name}"? Its ${category.product_count} ${productWord} will be uncategorized.`
          : `Delete "${category.name}"?`,
      )
    ) {
      return;
    }
    try {
      await deleteCategory({ data: { id: category.id } });
      setCategories((prev) => prev.filter((c) => c.id !== category.id));
      toast.success("Category deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete category");
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
          <h1 className="font-display text-3xl font-bold text-ink">Categories</h1>
          <p className="mt-1 font-sans text-sm text-muted-foreground">
            The shop category tree. Products reference a category; deleting one uncategorizes its
            products.
          </p>
        </div>
        <Button onClick={openAdd} className="btn-brand">
          <Plus className="mr-2 size-4" /> Add category
        </Button>
      </header>

      <div className="mt-8 space-y-4">
        {categories.map((c) => (
          <div key={c.id} className="rounded-lg border border-border p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field
                label="Name"
                value={c.name}
                disabled={locked}
                onChange={(v) => patch(c.id, { name: v })}
              />
              <Field
                label="Slug"
                value={c.slug}
                placeholder="auto from name"
                disabled={locked}
                onChange={(v) => patch(c.id, { slug: v })}
              />
              <Field
                label="Image URL"
                value={c.image_url}
                placeholder="/menu/p-helmet-red.jpg"
                disabled={locked}
                onChange={(v) => patch(c.id, { image_url: v })}
              />
              <Field
                label="Description"
                value={c.description}
                disabled={locked}
                onChange={(v) => patch(c.id, { description: v })}
              />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="font-sans text-xs text-muted-foreground">
                {c.product_count} product{c.product_count === 1 ? "" : "s"} · order {c.sort_order}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={savingId === c.id}
                  onClick={() => save(c)}
                >
                  <Save className="mr-2 size-4" />
                  {savingId === c.id ? "Saving…" : "Save"}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => remove(c)}>
                  <Trash2 className="size-4 text-primary" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={addOpen} onOpenChange={(open) => (open ? null : setAddOpen(false))}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold text-ink">
              Add category
            </DialogTitle>
            <DialogDescription>
              Create the category here. It appears in the shop immediately and can be edited below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={add} className="space-y-4">
            <Field
              label="Name"
              value={draft.name}
              placeholder="Mountain bikes"
              onChange={(v) => setDraft({ ...draft, name: v })}
            />
            <Field
              label="Slug"
              value={draft.slug}
              placeholder="auto from name"
              onChange={(v) => setDraft({ ...draft, slug: v })}
            />
            <Field
              label="Image URL"
              value={draft.image_url}
              placeholder="/menu/p-helmet-red.jpg"
              onChange={(v) => setDraft({ ...draft, image_url: v })}
            />
            <Field
              label="Description"
              value={draft.description}
              placeholder="Short category description"
              onChange={(v) => setDraft({ ...draft, description: v })}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="btn-brand" disabled={adding || !draft.name.trim()}>
                {adding ? "Creating…" : "Create category"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
