import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import {
  deleteOrder,
  getOrder,
  ORDER_STATUSES,
  updateOrder,
  updateOrderStatus,
  type OrderDetail,
  type OrderStatus,
} from "@/lib/orders.functions";
import { formatMoney } from "@/lib/money";
import { StatusBadge } from "@/components/admin/order-status";
import { Button } from "@/components/ui/button";
import { useAdminWriteGuard } from "@/hooks/use-admin-write-guard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/orders/$orderId")({
  head: () => ({
    meta: [
      { title: "Order — Pathway Admin" },
      { name: "description", content: "Order detail and status management." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderDetailPage,
});

type EditableItem = { id: string; name: string; price: number; qty: number };

function OrderDetailPage() {
  const { orderId } = useParams({ from: "/_authenticated/admin/orders/$orderId" });
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const { requireWrite } = useAdminWriteGuard();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [country, setCountry] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<EditableItem[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOrder({ data: { id: Number(orderId) } });
      setOrder(data);
      setFirstName(data.firstName);
      setLastName(data.lastName);
      setEmail(data.email);
      setPhone(data.phone);
      setAddress(data.address);
      setCity(data.city);
      setPostcode(data.postcode);
      setCountry(data.country);
      setNotes(data.notes ?? "");
      setItems(
        data.items.map((i) => ({ id: i.id, name: i.name, price: i.priceCents / 100, qty: i.qty })),
      );
      setEditing(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load order");
    }
    setLoading(false);
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function changeStatus(status: OrderStatus) {
    if (!requireWrite()) return;
    setUpdatingStatus(true);
    try {
      await updateOrderStatus({ data: { id: Number(orderId), status } });
      setOrder((prev) => (prev ? { ...prev, status, updatedAt: new Date().toISOString() } : prev));
      toast.success(`Order marked as ${status}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update status");
    }
    setUpdatingStatus(false);
  }

  function patchItem(index: number, patch: Partial<EditableItem>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function addItem() {
    setItems((prev) => [...prev, { id: `new-${Date.now()}`, name: "", price: 0, qty: 1 }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function saveOrder() {
    if (!requireWrite()) return;
    if (items.length === 0) {
      toast.error("An order needs at least one item");
      return;
    }
    if (items.some((i) => !i.name.trim() || i.qty < 1 || i.price < 0)) {
      toast.error("Fill in a name, a quantity of at least 1, and a valid price for every item");
      return;
    }
    setSaving(true);
    try {
      await updateOrder({
        data: {
          id: Number(orderId),
          firstName,
          lastName,
          email,
          phone,
          address,
          city,
          postcode,
          country,
          notes: notes.trim() || null,
          items: items.map((i) => ({ id: i.id, name: i.name.trim(), price: i.price, qty: i.qty })),
        },
      });
      toast.success("Order updated");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save order");
    }
    setSaving(false);
  }

  async function removeOrder() {
    if (!requireWrite()) return;
    if (!window.confirm(`Delete order ${order?.publicId}? This cannot be undone.`)) return;
    try {
      await deleteOrder({ data: { id: Number(orderId) } });
      toast.success("Order deleted");
      navigate({ to: "/admin/orders" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete order");
    }
  }

  if (loading) {
    return <div className="py-20 font-sans text-muted-foreground">Loading…</div>;
  }

  if (!order) {
    return (
      <main className="py-8">
        <p className="font-sans text-sm text-muted-foreground">Order not found.</p>
        <Link to="/admin/orders" className="btn-brand mt-4 inline-block">
          Back to orders
        </Link>
      </main>
    );
  }

  return (
    <main className="py-8">
      <Link
        to="/admin/orders"
        className="flex items-center gap-1 font-sans text-xs font-bold uppercase tracking-wide text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-3.5" /> Back to orders
      </Link>

      <header className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-3xl font-bold text-ink">{order.publicId}</h1>
          <StatusBadge status={order.status} />
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button variant="outline" onClick={() => load()}>
                <X className="mr-2 size-4" /> Cancel
              </Button>
              <Button onClick={saveOrder} disabled={saving} className="btn-brand">
                <Save className="mr-2 size-4" /> {saving ? "Saving…" : "Save changes"}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="mr-2 size-4" /> Edit order
            </Button>
          )}
          <Button variant="ghost" onClick={removeOrder}>
            <Trash2 className="mr-2 size-4 text-primary" /> Delete
          </Button>
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rounded-lg border border-border p-6">
            <h2 className="font-display text-lg font-bold text-ink">Items</h2>
            <div className="mt-4 space-y-3">
              {items.map((item, index) =>
                editing ? (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-end gap-3 rounded border border-border p-3"
                  >
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                        Name
                      </Label>
                      <Input
                        value={item.name}
                        onChange={(e) => patchItem(index, { name: e.target.value })}
                      />
                    </div>
                    <div className="w-28 space-y-1.5">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                        Price
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={Number.isNaN(item.price) ? "" : item.price}
                        onChange={(e) => patchItem(index, { price: Number(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="w-20 space-y-1.5">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                        Qty
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        value={item.qty}
                        onChange={(e) =>
                          patchItem(index, {
                            qty: Math.max(1, Math.floor(Number(e.target.value) || 1)),
                          })
                        }
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      aria-label="Remove item"
                    >
                      <Trash2 className="size-4 text-primary" />
                    </Button>
                  </div>
                ) : (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded border border-border px-4 py-3"
                  >
                    <span className="font-sans text-sm text-ink">{item.name}</span>
                    <span className="font-sans text-sm text-muted-foreground">
                      {item.qty} × {formatMoney(Math.round(item.price * 100))} ={" "}
                      <span className="font-semibold text-ink">
                        {formatMoney(Math.round(item.price * 100) * item.qty)}
                      </span>
                    </span>
                  </div>
                ),
              )}
            </div>
            {editing ? (
              <Button variant="outline" className="mt-4" onClick={addItem}>
                <Plus className="mr-2 size-4" /> Add item
              </Button>
            ) : null}
            <dl className="mt-5 space-y-2 border-t border-border pt-4 font-sans text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="text-ink">{formatMoney(order.subtotalCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd className="text-ink">
                  {order.shippingCents === 0 ? "Free" : formatMoney(order.shippingCents)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <dt className="font-bold text-ink">Total</dt>
                <dd className="font-display text-lg font-bold text-primary">
                  {formatMoney(order.totalCents)}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-border p-6">
            <h2 className="font-display text-lg font-bold text-ink">Customer &amp; shipping</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  First name
                </Label>
                {editing ? (
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                ) : (
                  <p className="font-sans text-sm text-ink">{order.firstName}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Last name
                </Label>
                {editing ? (
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                ) : (
                  <p className="font-sans text-sm text-ink">{order.lastName}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Email
                </Label>
                {editing ? (
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                ) : (
                  <p className="font-sans text-sm text-ink">{order.email}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Phone
                </Label>
                {editing ? (
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                ) : (
                  <p className="font-sans text-sm text-ink">{order.phone}</p>
                )}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Address
                </Label>
                {editing ? (
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} />
                ) : (
                  <p className="font-sans text-sm text-ink">{order.address}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  City
                </Label>
                {editing ? (
                  <Input value={city} onChange={(e) => setCity(e.target.value)} />
                ) : (
                  <p className="font-sans text-sm text-ink">{order.city}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Postcode
                </Label>
                {editing ? (
                  <Input value={postcode} onChange={(e) => setPostcode(e.target.value)} />
                ) : (
                  <p className="font-sans text-sm text-ink">{order.postcode}</p>
                )}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Country
                </Label>
                {editing ? (
                  <Input value={country} onChange={(e) => setCountry(e.target.value)} />
                ) : (
                  <p className="font-sans text-sm text-ink">{order.country}</p>
                )}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Delivery notes
                </Label>
                {editing ? (
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full border border-border bg-background px-3 py-2.5 font-sans text-sm text-ink outline-none focus:border-primary"
                  />
                ) : (
                  <p className="font-sans text-sm text-ink">{order.notes || "—"}</p>
                )}
              </div>
            </div>
          </section>
        </div>

        <aside className="h-fit space-y-6">
          <section className="rounded-lg border border-border p-6">
            <h2 className="font-display text-lg font-bold text-ink">Update status</h2>
            <div className="mt-4">
              <Select
                value={order.status}
                onValueChange={(v) => changeStatus(v as OrderStatus)}
                disabled={updatingStatus}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="mt-3 font-sans text-xs text-muted-foreground">
              Placed {new Date(order.createdAt).toLocaleString()}
              {order.updatedAt
                ? ` · Last updated ${new Date(order.updatedAt).toLocaleString()}`
                : ""}
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}
