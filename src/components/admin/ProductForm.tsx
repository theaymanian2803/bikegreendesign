import { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";

import type {
  AdminCategoryRow,
  AdminProductRow,
  Spec,
} from "@/integrations/turso/catalog.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type ProductFormValues = {
  name: string;
  slug: string;
  brand: string;
  sku: string;
  price: number;
  old_price: number | null;
  badge: string | null;
  rating: number;
  image_url: string;
  category_id: number | null;
  description: string;
  highlights: string[];
  specs: Spec[];
};

type Props = {
  product: AdminProductRow | null;
  categories: AdminCategoryRow[];
  submitting: boolean;
  submitLabel: string;
  onSubmit: (values: ProductFormValues) => Promise<void> | void;
  onCancel: () => void;
};

function Field({
  label,
  value,
  onChange,
  placeholder,
  type,
  step,
  textarea,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  step?: string;
  textarea?: boolean;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {textarea ? (
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={4} />
      ) : (
        <Input
          value={value}
          placeholder={placeholder}
          type={type}
          step={step}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function ProductForm({
  product,
  categories,
  submitting,
  submitLabel,
  onSubmit,
  onCancel,
}: Props) {
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [brand, setBrand] = useState(product?.brand ?? "");
  const [sku, setSku] = useState(product?.sku ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [oldPrice, setOldPrice] = useState(
    product?.old_price === null ? "" : String(product?.old_price ?? ""),
  );
  const [badge, setBadge] = useState(product?.badge ?? "");
  const [rating, setRating] = useState(product ? String(product.rating) : "5");
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? "/menu/p-stem.jpg");
  const [categoryId, setCategoryId] = useState(
    product?.category_id === null ? "" : String(product?.category_id ?? ""),
  );
  const [description, setDescription] = useState(product?.description ?? "");
  const [highlights, setHighlights] = useState(product?.highlights?.join("\n") ?? "");
  const [specs, setSpecs] = useState(
    product?.specs?.map((s) => `${s.label}: ${s.value}`).join("\n") ?? "",
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedSpecs = specs
      .split("\n")
      .map((line) => {
        const idx = line.indexOf(":");
        if (idx === -1) return null;
        return { label: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim() };
      })
      .filter((s): s is Spec => s !== null && (s.label.length > 0 || s.value.length > 0));
    void onSubmit({
      name: name.trim(),
      slug: slug.trim(),
      brand: brand.trim(),
      sku: sku.trim(),
      price: Number(price) || 0,
      old_price: oldPrice === "" ? null : Number(oldPrice) || 0,
      badge: badge.trim() === "" ? null : badge.trim(),
      rating: Math.min(5, Math.max(0, Number(rating) || 5)),
      image_url: imageUrl.trim(),
      category_id: categoryId === "" ? null : Number(categoryId),
      description: description.trim(),
      highlights: highlights
        .split("\n")
        .map((h) => h.trim())
        .filter(Boolean),
      specs: parsedSpecs,
    });
  }

  const inputCls =
    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Name" value={name} onChange={setName} placeholder="Giro Syntax MIPS Helmet" />
        <Field
          label="Slug"
          value={slug}
          onChange={setSlug}
          placeholder="auto-generated from name"
          hint="Used in the product URL. Leave empty to generate."
        />
        <Field label="Brand" value={brand} onChange={setBrand} placeholder="Giro" />
        <Field label="SKU" value={sku} onChange={setSku} placeholder="PW-1049" />
        <Field label="Price ($)" value={price} onChange={setPrice} type="number" step="0.01" />
        <Field
          label="Old price ($)"
          value={oldPrice}
          onChange={setOldPrice}
          type="number"
          step="0.01"
          hint="Optional. Shown struck-through next to the price."
        />
        <Field
          label="Badge"
          value={badge}
          onChange={setBadge}
          placeholder="-10% or Out of stock"
          hint="Leave empty for no badge."
        />
        <Field label="Rating" value={rating} onChange={setRating} type="number" step="0.5" />
        <Field
          label="Image URL"
          value={imageUrl}
          onChange={setImageUrl}
          placeholder="/menu/p-stem.jpg"
        />
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Category</Label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={inputCls}
          >
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Field label="Description" value={description} onChange={setDescription} textarea />
      <Field
        label="Highlights"
        value={highlights}
        onChange={setHighlights}
        textarea
        hint="One highlight per line."
      />
      <Field
        label="Specs"
        value={specs}
        onChange={setSpecs}
        textarea
        hint="One spec per line as 'Label: Value'."
      />

      <div className="flex items-center gap-3 border-t border-border pt-5">
        <Button type="submit" disabled={submitting} className="btn-brand">
          <Save className="mr-2 size-4" />
          {submitting ? "Saving…" : submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          <ArrowLeft className="mr-2 size-4" /> Back
        </Button>
      </div>
    </form>
  );
}
