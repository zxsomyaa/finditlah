import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { iconFor, conditionLabel } from "@/lib/categories";
import { formatPrice } from "@/lib/thrift";
import { useSite, bandClass } from "@/lib/SiteContext";

/* ---------- Pill ---------- */
const TONES = {
  found: "bg-lost-soft text-lost",
  lost: "bg-muted text-ink border border-border",
  thrift: "bg-thrift-soft text-thrift",
  ok: "bg-emerald-50 text-emerald-800",
  neutral: "bg-muted text-muted-foreground",
};
const DOTS = { found: "bg-lost", lost: "bg-muted-foreground", thrift: "bg-thrift", ok: "bg-emerald-700", neutral: "bg-muted-foreground" };

/** @param {{ tone?: keyof typeof TONES, dot?: boolean, children: any, className?: string }} props */
export function Pill({ tone = "neutral", dot = true, children, className }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap", TONES[tone], className)}>
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", DOTS[tone])} />}
      {children}
    </span>
  );
}

/* ---------- Item artwork: photo if we have one, otherwise a category icon tile ---------- */
/** @param {{ imageUrl?: string, category?: string, kind?: "l"|"t", alt?: string, className?: string, iconSize?: number }} props */
export function ItemArt({ imageUrl, category, kind = "l", alt = "", className, iconSize = 44 }) {
  if (imageUrl) {
    return <img src={imageUrl} alt={alt} loading="lazy" className={cn("object-cover bg-muted", className)} />;
  }
  const Icon = iconFor(category || "", kind);
  return (
    <div className={cn("dot-tile relative flex items-center justify-center", kind === "t" ? "bg-thrift-soft text-thrift" : "bg-lost-soft text-lost", className)}>
      <Icon size={iconSize} strokeWidth={1.6} className="relative" aria-hidden="true" />
    </div>
  );
}

/** @param {string|undefined} d */
export const shortDate = (d) => {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString("en-SG", { day: "numeric", month: "short" });
};

/* ---------- Lost & Found tile ---------- */
/** @param {{ item: any }} props */
export function ItemTile({ item }) {
  const found = item.type === "found";
  const Wrap = item.example ? ExampleBox : Link;
  return (
    <Wrap to={`/item/${item.id}`} className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5">
      {item.example && <ExampleTag />}
      <ItemArt imageUrl={item.image_url} category={item.category} kind="l" alt={item.title} className="h-44 w-full" />
      <div className="flex flex-col gap-1.5 p-3.5">
        <Pill tone={found ? "found" : "lost"} className="self-start">{found ? "Found" : "Lost"}</Pill>
        <b className="truncate text-[15px] text-foreground">{item.title}</b>
        <span className="truncate text-[13px] text-muted-foreground">
          {[item.location_name, shortDate(item.date || item.created_date)].filter(Boolean).join(" · ")}
        </span>
      </div>
    </Wrap>
  );
}

/* ---------- Example posts: shown with a tag, not clickable ---------- */
/** @param {{ to?: string, className?: string, children: any }} props */
function ExampleBox({ to: _to, className, children }) {
  return <div className={className} title="Example post">{children}</div>;
}

export function ExampleTag({ className }) {
  return (
    <span className={cn("absolute left-2.5 top-2.5 z-10 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-ink shadow-sm backdrop-blur", className)}>
      Example
    </span>
  );
}

/* ---------- Thrift tile ---------- */
/** @param {{ listing: any }} props */
export function ListingTile({ listing }) {
  const Wrap = listing.example ? ExampleBox : Link;
  return (
    <Wrap to={`/thrift/${listing.id}`} className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5">
      {listing.example && <ExampleTag />}
      <ItemArt imageUrl={listing.image_url} category={listing.category} kind="t" alt={listing.title} className="h-44 w-full" />
      <div className="flex flex-col gap-1.5 p-3.5">
        <div className="flex items-center justify-between gap-2">
          <Pill tone="thrift">Thrift</Pill>
          <span className="text-lg font-extrabold text-foreground">{formatPrice(listing.price)}</span>
        </div>
        <b className="truncate text-[15px] text-foreground">
          {listing.title}{listing.size ? `, ${listing.size}` : ""}
        </b>
        <span className="truncate text-[13px] text-muted-foreground">
          {[listing.location_name, conditionLabel(listing.condition)].filter(Boolean).join(" · ")}
        </span>
      </div>
    </Wrap>
  );
}

/* ---------- Coloured page header band (matches the nav band) ---------- */
/** @param {{ children: any, className?: string }} props */
export function PageBand({ children, className }) {
  const { mode } = useSite();
  return (
    <section className={cn(bandClass(mode), "transition-colors duration-500")}>
      <div className={cn("mx-auto max-w-6xl px-4 pb-9 pt-4 sm:px-8", className)}>{children}</div>
    </section>
  );
}

/** @param {{ children: any, className?: string }} props */
export function Container({ children, className }) {
  return <div className={cn("mx-auto max-w-6xl px-4 sm:px-8", className)}>{children}</div>;
}

/** Grid skeleton while loading. */
export function TileSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-border">
          <div className="h-44 animate-pulse bg-muted" />
          <div className="space-y-2 p-3.5">
            <div className="h-4 w-16 animate-pulse rounded-full bg-muted" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** @param {{ title: string, children?: any, action?: any }} props */
export function EmptyState({ title, children, action }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border px-6 py-14 text-center">
      <b className="text-lg text-foreground">{title}</b>
      {children && <p className="max-w-md text-sm text-muted-foreground">{children}</p>}
      {action}
    </div>
  );
}

/* Shared input classes */
export const inputClass =
  "w-full rounded-xl border border-input bg-card px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground/80 outline-none transition focus:border-ink focus:ring-2 focus:ring-ink/10";
