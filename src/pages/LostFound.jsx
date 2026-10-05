import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { db } from "@/lib/db";
import { usePageMode } from "@/lib/SiteContext";
import { LOST_CATEGORIES, labelFor } from "@/lib/categories";
import { cn } from "@/lib/utils";
import { PageBand, Container, ItemTile, TileSkeleton, EmptyState } from "@/components/site/parts";

const TYPES = [
  { value: "all", label: "All" },
  { value: "found", label: "Found items" },
  { value: "lost", label: "Lost reports" },
];

export default function LostFound() {
  usePageMode("l");
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const type = params.get("type") || "all";
  const category = params.get("category") || "all";
  const query = (params.get("q") || "").toLowerCase();

  /** @param {string} key @param {string} value */
  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (!value || value === "all") next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["items"],
    queryFn: () => db.entities.Item.list({ onlyActive: true }),
  });

  const results = useMemo(
    () =>
      items.filter((i) =>
        (type === "all" || i.type === type) &&
        (category === "all" || i.category === category) &&
        (!query || `${i.title} ${i.description} ${i.location_name}`.toLowerCase().includes(query))
      ),
    [items, type, category, query]
  );

  return (
    <>
      <PageBand>
        <div className="flex max-w-3xl flex-col gap-3.5">
          <span className="text-xs font-bold uppercase tracking-[0.14em] opacity-70">Lost &amp; Found</span>
          <h1 className="text-[clamp(32px,4.6vw,52px)] font-extrabold leading-[1.04] tracking-tight">Lost something? See what&apos;s been found.</h1>
          <p className="max-w-[56ch] text-[17px] leading-relaxed opacity-85">Items people found across Singapore, plus lost reports from people still searching.</p>
          <form
            onSubmit={(e) => { e.preventDefault(); setParam("q", q.trim()); }}
            className="flex w-full flex-wrap gap-1.5 rounded-[17px] border border-border bg-white p-1.5 shadow-[0_20px_44px_-26px_rgba(36,33,28,.4)]"
          >
            <label className="flex min-w-0 flex-1 basis-44 items-center gap-2.5 px-2.5 text-muted-foreground">
              <Search size={20} />
              <span className="sr-only">Search lost and found</span>
              <input id="lost-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Wallet, AirPods, keys, Bishan…" className="h-12 w-full bg-transparent text-base text-ink outline-none placeholder:text-muted-foreground" />
            </label>
            <button type="submit" className="h-12 rounded-xl bg-ink px-5 font-bold text-white">Search</button>
          </form>
        </div>
      </PageBand>

      <Container className="pb-16">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 pt-6">
          <div role="group" aria-label="Show" className="inline-flex gap-0.5 rounded-2xl border border-border bg-muted p-1">
            {TYPES.map((t) => (
              <button key={t.value} aria-pressed={type === t.value} onClick={() => setParam("type", t.value)}
                className={cn("h-10 rounded-xl px-3.5 text-sm font-bold transition", type === t.value ? "bg-white text-ink shadow-sm" : "text-muted-foreground")}>
                {t.label}
              </button>
            ))}
          </div>
          <Link to="/map" className="text-sm font-bold underline underline-offset-4">View on map</Link>
        </div>

        <div role="group" aria-label="Category" className="-mx-1 flex gap-2 overflow-x-auto px-1 py-3">
          {["all", ...LOST_CATEGORIES].map((c) => (
            <button key={c} aria-pressed={category === c} onClick={() => setParam("category", c)}
              className={cn("h-9 shrink-0 rounded-full border px-3.5 text-sm font-semibold transition",
                category === c ? "border-ink bg-ink text-white" : "border-border bg-card text-foreground hover:border-ink/40")}>
              {c === "all" ? "All" : labelFor(c)}
            </button>
          ))}
        </div>

        <p className="py-2 text-sm text-muted-foreground" aria-live="polite">
          {isLoading ? "Loading…" : `${results.length} ${results.length === 1 ? "item" : "items"}${query ? ` matching "${params.get("q")}"` : ""}`}
        </p>

        {isLoading ? (
          <TileSkeleton />
        ) : results.length ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-4">
            {results.map((i) => <ItemTile key={i.id} item={i} />)}
          </div>
        ) : (
          <EmptyState title="Nothing matches yet" action={<Link to="/post?type=lost" className="rounded-xl bg-lost px-5 py-3 font-bold text-white">Post a lost report</Link>}>
            Try another word or category, or post a lost report so finders can reach you.
          </EmptyState>
        )}

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-cream p-6 sm:p-8">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">Still can&apos;t find it?</h2>
            <p className="mt-1 text-muted-foreground">Post a lost report so anyone who finds it can message you.</p>
          </div>
          <Link to="/post?type=lost" className="rounded-xl bg-lost px-5 py-3 font-bold text-white">Post a lost report</Link>
        </div>
      </Container>
    </>
  );
}
