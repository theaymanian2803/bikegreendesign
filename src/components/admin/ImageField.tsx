import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LANDING_IMAGE_OPTIONS } from "@/lib/landing";

export function ImageField({
  label = "Image",
  value,
  onChange,
  placeholder = "/menu/hero-bike-snow.jpg",
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      <div className="flex flex-wrap gap-2">
        <Input
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-[220px] flex-1"
        />
        <select
          value=""
          onChange={(event) => {
            if (event.target.value) onChange(event.target.value);
          }}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm text-ink outline-none focus:border-primary"
          aria-label={`Choose ${label.toLowerCase()}`}
        >
          <option value="">Pick asset…</option>
          {LANDING_IMAGE_OPTIONS.filter((option) => option.value).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {value ? (
        <img
          src={value}
          alt=""
          className="mt-2 h-24 w-full max-w-[240px] rounded border border-border object-cover"
        />
      ) : null}
    </div>
  );
}
