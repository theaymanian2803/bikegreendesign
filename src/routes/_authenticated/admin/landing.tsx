import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ImageField } from "@/components/admin/ImageField";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAdminWriteGuard } from "@/hooks/use-admin-write-guard";
import {
  createLandingSection,
  deleteLandingSection,
  getLandingAdmin,
  moveLandingSection,
  setLandingVisibility,
  updateLandingSection,
} from "@/integrations/turso/landing.functions";
import {
  LANDING_ICON_OPTIONS,
  LANDING_PLATFORM_LABELS,
  LANDING_SECTION_LABELS,
  LANDING_SECTION_TYPES,
  defaultConfigFor,
  defaultTitleFor,
  type LandingIconKey,
  type LandingPlatform,
  type LandingSection,
  type LandingSectionType,
} from "@/lib/landing";
import { getTopBarSettings, saveTopBarSettings, type TopBarSettings } from "@/lib/topbar.functions";
import { getAdminSettings, setHomeSource } from "@/lib/settings.functions";

export const Route = createFileRoute("/_authenticated/admin/landing")({
  head: () => ({
    meta: [
      { title: "Landing Page — Pathway Admin" },
      {
        name: "description",
        content: "Control the homepage sections: order, visibility, copy, images and CTAs.",
      },
      { property: "og:title", content: "Landing Page — Pathway Admin" },
      { property: "og:description", content: "Edit the Pathway homepage sections." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LandingAdminPage,
});

function updateItem<T>(items: T[], index: number, patch: Partial<T>): T[] {
  return items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item));
}

function removeItem<T>(items: T[], index: number): T[] {
  return items.filter((_, itemIndex) => itemIndex !== index);
}

function getThumbnail(section: LandingSection): string {
  switch (section.type) {
    case "hero":
    case "about":
    case "cta":
      return section.imageUrl;
    case "services":
    case "category_cards":
    case "gallery":
      return section.config.items[0]?.image ?? "";
    default:
      return "";
  }
}

function makeDraft(type: LandingSectionType): LandingSection {
  return {
    id: 0,
    sectionKey: "",
    type,
    title: defaultTitleFor(type),
    subtitle: "",
    imageUrl: "",
    visible: true,
    sortOrder: 0,
    platform: "both",
    config: defaultConfigFor(type),
  } as LandingSection;
}

function editableTypes() {
  return LANDING_SECTION_TYPES.filter((type) => type !== "promo_popup");
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function Area({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      <Textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-ink outline-none focus:border-primary"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ItemShell({ children, onRemove }: { children: ReactNode; onRemove: () => void }) {
  return (
    <div className="rounded border border-border p-3">
      <div className="flex items-start gap-3">
        <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">{children}</div>
        <Button variant="ghost" size="icon" onClick={onRemove} aria-label="Remove item">
          <Trash2 className="size-4 text-primary" />
        </Button>
      </div>
    </div>
  );
}

function AddItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button variant="outline" onClick={onClick}>
      <Plus className="mr-2 size-4" /> {label}
    </Button>
  );
}

function SectionEditor({
  draft,
  onChange,
}: {
  draft: LandingSection;
  onChange: (next: LandingSection) => void;
}) {
  switch (draft.type) {
    case "hero":
      return (
        <div className="grid gap-4">
          <Field
            label="Eyebrow"
            value={draft.subtitle}
            onChange={(value) => onChange({ ...draft, subtitle: value })}
          />
          <Area
            label="Headline"
            value={draft.title}
            onChange={(value) => onChange({ ...draft, title: value })}
          />
          <ImageField
            value={draft.imageUrl}
            onChange={(value) => onChange({ ...draft, imageUrl: value })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="CTA label"
              value={draft.config.ctaLabel}
              onChange={(value) =>
                onChange({ ...draft, config: { ...draft.config, ctaLabel: value } })
              }
            />
            <Field
              label="CTA link"
              value={draft.config.ctaHref}
              onChange={(value) =>
                onChange({ ...draft, config: { ...draft.config, ctaHref: value } })
              }
            />
          </div>
        </div>
      );

    case "categories":
      return (
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Heading"
              value={draft.title}
              onChange={(value) => onChange({ ...draft, title: value })}
            />
            <Field
              label="Eyebrow"
              value={draft.subtitle}
              onChange={(value) => onChange({ ...draft, subtitle: value })}
            />
          </div>
          <Field
            label="Maximum categories"
            type="number"
            value={String(draft.config.limit)}
            onChange={(value) =>
              onChange({
                ...draft,
                config: { ...draft.config, limit: Math.max(1, Number(value) || 1) },
              })
            }
          />
        </div>
      );

    case "reviews":
      return (
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Heading"
              value={draft.title}
              onChange={(value) => onChange({ ...draft, title: value })}
            />
            <Field
              label="Eyebrow"
              value={draft.subtitle}
              onChange={(value) => onChange({ ...draft, subtitle: value })}
            />
          </div>
          <Field
            label="Maximum reviews"
            type="number"
            value={String(draft.config.limit)}
            onChange={(value) =>
              onChange({
                ...draft,
                config: { ...draft.config, limit: Math.max(1, Number(value) || 1) },
              })
            }
          />
        </div>
      );

    case "services":
      return (
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Heading"
              value={draft.title}
              onChange={(value) => onChange({ ...draft, title: value })}
            />
            <Field
              label="Eyebrow"
              value={draft.subtitle}
              onChange={(value) => onChange({ ...draft, subtitle: value })}
            />
          </div>
          <div className="space-y-3">
            {draft.config.items.map((item, index) => (
              <ItemShell
                key={index}
                onRemove={() =>
                  onChange({
                    ...draft,
                    config: { ...draft.config, items: removeItem(draft.config.items, index) },
                  })
                }
              >
                <Field
                  label="Title"
                  value={item.title}
                  onChange={(value) =>
                    onChange({
                      ...draft,
                      config: {
                        ...draft.config,
                        items: updateItem(draft.config.items, index, { title: value }),
                      },
                    })
                  }
                />
                <Field
                  label="Label"
                  value={item.label}
                  onChange={(value) =>
                    onChange({
                      ...draft,
                      config: {
                        ...draft.config,
                        items: updateItem(draft.config.items, index, { label: value }),
                      },
                    })
                  }
                />
                <div className="sm:col-span-2">
                  <Area
                    label="Description"
                    rows={3}
                    value={item.description}
                    onChange={(value) =>
                      onChange({
                        ...draft,
                        config: {
                          ...draft.config,
                          items: updateItem(draft.config.items, index, { description: value }),
                        },
                      })
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <ImageField
                    label="Image"
                    value={item.image}
                    onChange={(value) =>
                      onChange({
                        ...draft,
                        config: {
                          ...draft.config,
                          items: updateItem(draft.config.items, index, { image: value }),
                        },
                      })
                    }
                  />
                </div>
              </ItemShell>
            ))}
            <AddItem
              label="Add service"
              onClick={() =>
                onChange({
                  ...draft,
                  config: {
                    ...draft.config,
                    items: [
                      ...draft.config.items,
                      { title: "New service", label: "Bike Service", description: "", image: "" },
                    ],
                  },
                })
              }
            />
          </div>
        </div>
      );

    case "about":
      return (
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Heading"
              value={draft.title}
              onChange={(value) => onChange({ ...draft, title: value })}
            />
            <Field
              label="Eyebrow"
              value={draft.subtitle}
              onChange={(value) => onChange({ ...draft, subtitle: value })}
            />
          </div>
          <ImageField
            label="Primary image"
            value={draft.imageUrl}
            onChange={(value) => onChange({ ...draft, imageUrl: value })}
          />
          <Area
            label="Body"
            rows={5}
            value={draft.config.body}
            onChange={(value) => onChange({ ...draft, config: { ...draft.config, body: value } })}
          />
          <ImageField
            label="Secondary image"
            value={draft.config.secondaryImage}
            onChange={(value) =>
              onChange({ ...draft, config: { ...draft.config, secondaryImage: value } })
            }
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="CTA label"
              value={draft.config.ctaLabel}
              onChange={(value) =>
                onChange({ ...draft, config: { ...draft.config, ctaLabel: value } })
              }
            />
            <Field
              label="CTA link"
              value={draft.config.ctaHref}
              onChange={(value) =>
                onChange({ ...draft, config: { ...draft.config, ctaHref: value } })
              }
            />
          </div>
        </div>
      );

    case "product_row":
      return (
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Heading"
              value={draft.title}
              onChange={(value) => onChange({ ...draft, title: value })}
            />
            <Field
              label="Eyebrow"
              value={draft.subtitle}
              onChange={(value) => onChange({ ...draft, subtitle: value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Product source"
              value={draft.config.source}
              onChange={(value) =>
                onChange({
                  ...draft,
                  config: {
                    ...draft.config,
                    source: value as "latest" | "category" | "manual",
                  },
                })
              }
              options={[
                { value: "latest", label: "Newest products" },
                { value: "category", label: "Products in a category" },
                { value: "manual", label: "Hand-picked products" },
              ]}
            />
            <Field
              label="Limit"
              type="number"
              value={String(draft.config.limit)}
              onChange={(value) =>
                onChange({
                  ...draft,
                  config: { ...draft.config, limit: Math.max(1, Number(value) || 1) },
                })
              }
            />
            {draft.config.source === "category" ? (
              <Field
                label="Category name"
                value={draft.config.category}
                placeholder="Mountain Bikes"
                onChange={(value) =>
                  onChange({ ...draft, config: { ...draft.config, category: value } })
                }
              />
            ) : null}
            {draft.config.source === "latest" ? (
              <Field
                label="Skip first N products"
                type="number"
                value={String(draft.config.offset)}
                onChange={(value) =>
                  onChange({
                    ...draft,
                    config: { ...draft.config, offset: Math.max(0, Number(value) || 0) },
                  })
                }
              />
            ) : null}
            {draft.config.source === "manual" ? (
              <div className="sm:col-span-2">
                <Field
                  label="Product slugs (comma separated)"
                  value={draft.config.productIds.join(", ")}
                  placeholder="giro-syntax, bell-avenue"
                  onChange={(value) =>
                    onChange({
                      ...draft,
                      config: {
                        ...draft.config,
                        productIds: value
                          .split(",")
                          .map((slug) => slug.trim())
                          .filter(Boolean),
                      },
                    })
                  }
                />
              </div>
            ) : null}
          </div>
        </div>
      );

    case "cta":
      return (
        <div className="grid gap-4">
          <Field
            label="Eyebrow"
            value={draft.subtitle}
            onChange={(value) => onChange({ ...draft, subtitle: value })}
          />
          <Area
            label="Headline"
            value={draft.title}
            onChange={(value) => onChange({ ...draft, title: value })}
          />
          <ImageField
            value={draft.imageUrl}
            onChange={(value) => onChange({ ...draft, imageUrl: value })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="CTA label"
              value={draft.config.ctaLabel}
              onChange={(value) =>
                onChange({ ...draft, config: { ...draft.config, ctaLabel: value } })
              }
            />
            <Field
              label="CTA link"
              value={draft.config.ctaHref}
              onChange={(value) =>
                onChange({ ...draft, config: { ...draft.config, ctaHref: value } })
              }
            />
          </div>
        </div>
      );

    case "features":
      return (
        <div className="space-y-3">
          {draft.config.items.map((item, index) => (
            <ItemShell
              key={index}
              onRemove={() =>
                onChange({
                  ...draft,
                  config: { ...draft.config, items: removeItem(draft.config.items, index) },
                })
              }
            >
              <SelectField
                label="Icon"
                value={item.icon}
                onChange={(value) =>
                  onChange({
                    ...draft,
                    config: {
                      ...draft.config,
                      items: updateItem(draft.config.items, index, {
                        icon: value as LandingIconKey,
                      }),
                    },
                  })
                }
                options={LANDING_ICON_OPTIONS}
              />
              <Field
                label="Title"
                value={item.title}
                onChange={(value) =>
                  onChange({
                    ...draft,
                    config: {
                      ...draft.config,
                      items: updateItem(draft.config.items, index, { title: value }),
                    },
                  })
                }
              />
              <div className="sm:col-span-2">
                <Area
                  label="Text"
                  value={item.text}
                  onChange={(value) =>
                    onChange({
                      ...draft,
                      config: {
                        ...draft.config,
                        items: updateItem(draft.config.items, index, { text: value }),
                      },
                    })
                  }
                />
              </div>
            </ItemShell>
          ))}
          <AddItem
            label="Add feature"
            onClick={() =>
              onChange({
                ...draft,
                config: {
                  ...draft.config,
                  items: [...draft.config.items, { icon: "bike", title: "New feature", text: "" }],
                },
              })
            }
          />
        </div>
      );

    case "category_cards":
      return (
        <div className="space-y-3">
          {draft.config.items.map((item, index) => (
            <ItemShell
              key={index}
              onRemove={() =>
                onChange({
                  ...draft,
                  config: { ...draft.config, items: removeItem(draft.config.items, index) },
                })
              }
            >
              <Field
                label="Label"
                value={item.label}
                onChange={(value) =>
                  onChange({
                    ...draft,
                    config: {
                      ...draft.config,
                      items: updateItem(draft.config.items, index, { label: value }),
                    },
                  })
                }
              />
              <Field
                label="Title"
                value={item.title}
                onChange={(value) =>
                  onChange({
                    ...draft,
                    config: {
                      ...draft.config,
                      items: updateItem(draft.config.items, index, { title: value }),
                    },
                  })
                }
              />
              <Field
                label="Link"
                value={item.href}
                onChange={(value) =>
                  onChange({
                    ...draft,
                    config: {
                      ...draft.config,
                      items: updateItem(draft.config.items, index, { href: value }),
                    },
                  })
                }
              />
              <div className="sm:col-span-2">
                <ImageField
                  label="Image"
                  value={item.image}
                  onChange={(value) =>
                    onChange({
                      ...draft,
                      config: {
                        ...draft.config,
                        items: updateItem(draft.config.items, index, { image: value }),
                      },
                    })
                  }
                />
              </div>
            </ItemShell>
          ))}
          <AddItem
            label="Add card"
            onClick={() =>
              onChange({
                ...draft,
                config: {
                  ...draft.config,
                  items: [
                    ...draft.config.items,
                    { label: "New collection", title: "New category", image: "", href: "/shop" },
                  ],
                },
              })
            }
          />
        </div>
      );

    case "testimonials":
      return (
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Heading"
              value={draft.title}
              onChange={(value) => onChange({ ...draft, title: value })}
            />
            <Field
              label="Eyebrow"
              value={draft.subtitle}
              onChange={(value) => onChange({ ...draft, subtitle: value })}
            />
          </div>
          <Field
            label="Brands (comma separated)"
            value={draft.config.brands.join(", ")}
            onChange={(value) =>
              onChange({
                ...draft,
                config: {
                  ...draft.config,
                  brands: value
                    .split(",")
                    .map((brand) => brand.trim())
                    .filter(Boolean),
                },
              })
            }
          />
          <div className="space-y-3">
            {draft.config.items.map((item, index) => (
              <ItemShell
                key={index}
                onRemove={() =>
                  onChange({
                    ...draft,
                    config: { ...draft.config, items: removeItem(draft.config.items, index) },
                  })
                }
              >
                <Field
                  label="Name"
                  value={item.name}
                  onChange={(value) =>
                    onChange({
                      ...draft,
                      config: {
                        ...draft.config,
                        items: updateItem(draft.config.items, index, { name: value }),
                      },
                    })
                  }
                />
                <Field
                  label="Role"
                  value={item.role}
                  onChange={(value) =>
                    onChange({
                      ...draft,
                      config: {
                        ...draft.config,
                        items: updateItem(draft.config.items, index, { role: value }),
                      },
                    })
                  }
                />
                <div className="sm:col-span-2">
                  <Area
                    label="Quote"
                    value={item.text}
                    onChange={(value) =>
                      onChange({
                        ...draft,
                        config: {
                          ...draft.config,
                          items: updateItem(draft.config.items, index, { text: value }),
                        },
                      })
                    }
                  />
                </div>
              </ItemShell>
            ))}
            <AddItem
              label="Add testimonial"
              onClick={() =>
                onChange({
                  ...draft,
                  config: {
                    ...draft.config,
                    items: [
                      ...draft.config.items,
                      { name: "Customer", role: "Customer", text: "" },
                    ],
                  },
                })
              }
            />
          </div>
        </div>
      );

    case "gallery":
      return (
        <div className="grid gap-4">
          <Field
            label="Heading"
            value={draft.title}
            onChange={(value) => onChange({ ...draft, title: value })}
          />
          <p className="text-xs text-muted-foreground">
            Each gallery item uses a title and an image. Add as many as you like; order controls
            apply to the whole section.
          </p>
          <div className="space-y-3">
            {draft.config.items.map((item, index) => (
              <ItemShell
                key={index}
                onRemove={() =>
                  onChange({
                    ...draft,
                    config: { ...draft.config, items: removeItem(draft.config.items, index) },
                  })
                }
              >
                <Field
                  label="Title"
                  value={item.title}
                  onChange={(value) =>
                    onChange({
                      ...draft,
                      config: {
                        ...draft.config,
                        items: updateItem(draft.config.items, index, { title: value }),
                      },
                    })
                  }
                />
                <div className="sm:col-span-2">
                  <ImageField
                    label="Image"
                    value={item.image}
                    onChange={(value) =>
                      onChange({
                        ...draft,
                        config: {
                          ...draft.config,
                          items: updateItem(draft.config.items, index, { image: value }),
                        },
                      })
                    }
                  />
                </div>
              </ItemShell>
            ))}
            <AddItem
              label="Add gallery item"
              onClick={() =>
                onChange({
                  ...draft,
                  config: {
                    ...draft.config,
                    items: [...draft.config.items, { title: "New gallery item", image: "" }],
                  },
                })
              }
            />
          </div>
        </div>
      );

    case "promo_popup":
      return null;
  }
}

function LandingAdminPage() {
  const [sections, setSections] = useState<LandingSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [draft, setDraft] = useState<LandingSection | null>(null);
  const [topBar, setTopBar] = useState<TopBarSettings | null>(null);
  const [topBarBusy, setTopBarBusy] = useState(false);
  const { requireWrite } = useAdminWriteGuard();

  async function load() {
    try {
      setSections(await getLandingAdmin());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load landing sections");
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    let active = true;
    getTopBarSettings()
      .then((data) => {
        if (active) setTopBar(data);
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Could not load top bar settings");
      });
    return () => {
      active = false;
    };
  }, []);

  async function saveTopBar() {
    if (!requireWrite()) return;
    if (!topBar) return;
    setTopBarBusy(true);
    try {
      await saveTopBarSettings({ data: topBar });
      toast.success("Top bar saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save top bar");
    }
    setTopBarBusy(false);
  }

  function openCreate() {
    if (!requireWrite()) return;
    setMode("create");
    setDraft(makeDraft("hero"));
    setDialogOpen(true);
  }

  function openEdit(section: LandingSection) {
    if (!requireWrite()) return;
    setMode("edit");
    setDraft(section);
    setDialogOpen(true);
  }

  function closeDialog() {
    if (busy) return;
    setDialogOpen(false);
    setDraft(null);
  }

  function changeDraftType(type: LandingSectionType) {
    setDraft(makeDraft(type));
  }

  async function saveDraft() {
    if (!requireWrite()) return;
    if (!draft) return;
    setBusy(true);
    try {
      if (mode === "create") {
        await createLandingSection({
          data: {
            type: draft.type,
            title: draft.title,
            subtitle: draft.subtitle,
            imageUrl: draft.imageUrl,
            platform: draft.platform,
            config: draft.config,
          },
        });
        toast.success("Section added");
      } else {
        await updateLandingSection({
          data: {
            id: draft.id,
            title: draft.title,
            subtitle: draft.subtitle,
            imageUrl: draft.imageUrl,
            platform: draft.platform,
            config: draft.config,
          },
        });
        toast.success("Section saved");
      }
      await load();
      setDialogOpen(false);
      setDraft(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save section");
    }
    setBusy(false);
  }

  async function toggleVisible(section: LandingSection) {
    if (!requireWrite()) return;
    setBusy(true);
    try {
      await setLandingVisibility({ data: { id: section.id, visible: !section.visible } });
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update visibility");
    }
    setBusy(false);
  }

  async function move(section: LandingSection, direction: "up" | "down") {
    if (!requireWrite()) return;
    setBusy(true);
    try {
      await moveLandingSection({ data: { id: section.id, direction } });
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not reorder section");
    }
    setBusy(false);
  }

  async function remove(section: LandingSection) {
    if (!requireWrite()) return;
    const label = section.title || LANDING_SECTION_LABELS[section.type];
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await deleteLandingSection({ data: { id: section.id } });
      await load();
      toast.success("Section deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete section");
    }
    setBusy(false);
  }

  if (loading) {
    return <div className="py-20 font-sans text-muted-foreground">Loading…</div>;
  }

  return (
    <main className="py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-label">Admin</p>
          <h1 className="font-display text-3xl font-bold text-ink">Landing page</h1>
          <p className="mt-1 font-sans text-sm text-muted-foreground">
            Control the homepage sections, their order and visibility.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <Button onClick={openCreate} disabled={busy} className="btn-brand">
            <Plus className="mr-2 size-4" /> Add section
          </Button>
        </div>
      </header>

      <section className="mt-8 rounded-lg border border-border p-4 sm:p-6">
        <HomeSourceCard />
      </section>

      <section className="mt-8 rounded-lg border border-border p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">Top bar</h2>
            <p className="mt-1 font-sans text-xs text-muted-foreground">
              The slim strip above the main navigation. Language and currency stay fixed for now.
            </p>
          </div>
          {topBar ? (
            <button
              type="button"
              role="switch"
              aria-checked={topBar.enabled}
              onClick={() => setTopBar({ ...topBar, enabled: !topBar.enabled })}
              className={`inline-flex h-8 items-center gap-2 rounded-full px-3 text-xs font-bold uppercase tracking-wide transition-colors ${
                topBar.enabled
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface text-muted-foreground hover:text-ink"
              }`}
            >
              <span
                className={`size-2 rounded-full ${
                  topBar.enabled ? "bg-primary-foreground" : "bg-muted-foreground"
                }`}
              />
              {topBar.enabled ? "Visible" : "Hidden"}
            </button>
          ) : null}
        </div>

        {topBar ? (
          <>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field
                label="Location"
                value={topBar.location}
                onChange={(value) => setTopBar({ ...topBar, location: value })}
                placeholder="507 Union Trade Center, USA"
              />
              <Field
                label="Phone"
                value={topBar.phone}
                onChange={(value) => setTopBar({ ...topBar, phone: value })}
                placeholder="(+91) 9876-543-210"
              />
              <Field
                label="Email"
                type="email"
                value={topBar.email}
                onChange={(value) => setTopBar({ ...topBar, email: value })}
                placeholder="demo@example.com"
              />
              <Field
                label="Track order link"
                value={topBar.trackOrderHref}
                onChange={(value) => setTopBar({ ...topBar, trackOrderHref: value })}
                placeholder="/admin/orders"
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <p className="font-sans text-xs text-muted-foreground">
                Leave a field empty to hide it. Help Center is removed.
              </p>
              <Button onClick={saveTopBar} disabled={topBarBusy} className="btn-brand">
                <Save className="mr-2 size-4" /> {topBarBusy ? "Saving…" : "Save top bar"}
              </Button>
            </div>
          </>
        ) : (
          <p className="mt-4 font-sans text-sm text-muted-foreground">Loading…</p>
        )}
      </section>

      <div className="mt-8 space-y-4">
        {sections.map((section, index) => {
          const thumbnail = getThumbnail(section);
          return (
            <section key={section.id} className="rounded-lg border border-border">
              <div className="flex flex-wrap items-center gap-4 p-4">
                <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded bg-surface">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt=""
                      loading="lazy"
                      width={112}
                      height={112}
                      className="size-14 object-cover"
                    />
                  ) : (
                    <span className="font-sans text-[10px] uppercase text-muted-foreground">
                      {LANDING_SECTION_LABELS[section.type]}
                    </span>
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="font-sans text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    {LANDING_SECTION_LABELS[section.type]}
                  </p>
                  <h2 className="truncate font-display text-lg font-bold text-ink">
                    {section.title || "(untitled section)"}
                  </h2>
                  <p className="font-sans text-xs text-muted-foreground">
                    {section.visible ? "Visible" : "Hidden"} · position {index + 1} ·{" "}
                    {LANDING_PLATFORM_LABELS[section.platform]}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={busy || index === 0}
                    onClick={() => move(section, "up")}
                    aria-label="Move section up"
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={busy || index === sections.length - 1}
                    onClick={() => move(section, "down")}
                    aria-label="Move section down"
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => toggleVisible(section)}
                  >
                    {section.visible ? "Hide" : "Show"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => openEdit(section)}
                  >
                    <Pencil className="mr-2 size-4" /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={busy}
                    onClick={() => remove(section)}
                    aria-label="Delete section"
                  >
                    <Trash2 className="size-4 text-primary" />
                  </Button>
                </div>
              </div>
            </section>
          );
        })}

        {sections.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-10 text-center">
            <p className="font-sans text-sm text-muted-foreground">
              No landing sections yet. Add one above to start building the homepage.
            </p>
          </div>
        ) : null}
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent className="flex max-h-[90dvh] w-[calc(100vw-2rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0">
          <div className="border-b border-border px-4 py-4 sm:px-6">
            <DialogTitle className="font-display text-xl font-bold text-ink">
              {mode === "create" ? "Add section" : "Edit section"}
            </DialogTitle>
            <DialogDescription className="mt-1 font-sans text-sm text-muted-foreground">
              {mode === "create"
                ? "Pick a section type, fill in the fields and add it to the homepage."
                : draft
                  ? `${LANDING_SECTION_LABELS[draft.type]} · ${draft.title || "Untitled"}`
                  : ""}
            </DialogDescription>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
            {draft ? (
              <div className="grid gap-5">
                {mode === "create" ? (
                  <SelectField
                    label="Section type"
                    value={draft.type}
                    onChange={(value) => changeDraftType(value as LandingSectionType)}
                    options={editableTypes().map((type) => ({
                      value: type,
                      label: LANDING_SECTION_LABELS[type],
                    }))}
                  />
                ) : null}
                <SelectField
                  label="Show on"
                  value={draft.platform}
                  onChange={(value) => setDraft({ ...draft, platform: value as LandingPlatform })}
                  options={[
                    { value: "both", label: "Website + mobile app" },
                    { value: "web", label: "Website only" },
                    { value: "mobile", label: "Mobile app only" },
                  ]}
                />
                <SectionEditor draft={draft} onChange={setDraft} />
              </div>
            ) : null}
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-border px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
            <Button variant="outline" onClick={closeDialog} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={saveDraft} disabled={busy || !draft} className="btn-brand">
              <Save className="mr-2 size-4" />
              {busy ? "Saving…" : mode === "create" ? "Add section" : "Save changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

/** Switches the public homepage between the designed page and these sections. */
function HomeSourceCard() {
  const [homeSource, setSource] = useState<"static" | "cms">("static");
  const [busy, setBusy] = useState(false);
  const { requireWrite } = useAdminWriteGuard();

  useEffect(() => {
    getAdminSettings()
      .then((settings) => setSource(settings.homeSource === "cms" ? "cms" : "static"))
      .catch(() => undefined);
  }, []);

  async function choose(next: "static" | "cms") {
    if (!requireWrite()) return;
    setBusy(true);
    try {
      await setHomeSource({ data: { homeSource: next } });
      setSource(next);
      toast.success(
        next === "cms"
          ? "Homepage now renders these sections"
          : "Homepage restored to the designed page",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not change the homepage");
    }
    setBusy(false);
  }

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="font-display text-lg font-bold text-ink">Homepage source</h2>
        <p className="mt-1 max-w-xl font-sans text-xs text-muted-foreground">
          The storefront currently renders the{" "}
          <span className="text-ink">
            {homeSource === "cms" ? "sections below" : "designed homepage"}
          </span>
          . Switching to the sections replaces it; the sections keep working either way.
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          variant={homeSource === "static" ? "default" : "outline"}
          disabled={busy}
          onClick={() => choose("static")}
        >
          Designed page
        </Button>
        <Button
          variant={homeSource === "cms" ? "default" : "outline"}
          disabled={busy}
          onClick={() => choose("cms")}
        >
          These sections
        </Button>
      </div>
    </div>
  );
}
