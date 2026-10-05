import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { listListings } from "@/lib/thrift";
import { THRIFT_CATEGORIES } from "@/lib/categories";
import { usePageMode, useSite } from "@/lib/SiteContext";
import { cn } from "@/lib/utils";
import { PageBand, Container, ListingTile, TileSkeleton, EmptyState } from "@/components/site/parts";
import { EXAMPLE_LISTINGS, withExamples } from "@/lib/showcase";

export default function ThriftBrowse() {
  usePageMode("t");
  const { openHelp } = useSite();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const category = params.get("category") || "all";
  const sort = params.get("sort") || "new";
  const query = (params.get("q") || "").toLowerCase();

  /** @param {string} key @param {string} value */
  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (!value || value === "all" || (key === "sort" && value === "new")) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["thrift-listings"],
    queryFn: () => listListings().catch(() => []),
  });

  const results = useMemo(() => {
    const r = listings.filter((l) =>
      (category === "all" || l.category === category) &&
      (!query || `${l.title} ${l.description} ${l.location_name} ${l.size}`.toLowerCase().includes(query))
    );
    if (sort === "low") r.sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === "high") r.sort((a, b) => Number(b.price) - Number(a.price));
    return r;
  }, [listings, category, sort, query]);
  // While the site is new, top up the list with tagged example listings.
  const shown = !query
    ? withExamples(results, EXAMPLE_LISTINGS.filter((e) => category === "all" || e.category === category), 6)
    : results;

  return (
    <>
      <PageBand>
        <div className="flex max-w-3xl flex-col gap-3.5">
          <span className="text-xs font-bold uppercase tracking-[0.14em] opacity-70">Thrift</span>
          <h1 className="text-[clamp(32px,4.6vw,52px)] font-extrabold leading-[1.04] tracking-tight">Preloved finds from people nearby.</h1>
          <p className="max-w-[56ch] text-[17px] leading-relaxed opacity-85">
            Clothes and small items, bought and sold right here. Chat, agree on a price and pay in the app.{" "}
            <button type="button" onClick={() => openHelp("thrift")} className="font-bold underline underline-offset-4">How thrift works</button>
          </p>
          <form onSubmit={(e) => { e.preventDefault(); setParam("q", q.trim()); }}
            className="flex w-full flex-wrap gap-1.5 rounded-[17px] border border-border bg-white p-1.5 shadow-[0_20px_44px_-26px_rgba(36,33,28,.4)]">
            <label className="flex min-w-0 flex-1 basis-44 items-center gap-2.5 px-2.5 text-muted-foreground">
              <Search size={20} />
              <span className="sr-only">Search thrift</span>
              <input id="thrift-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Denim, sneakers, tote…" className="h-12 w-full bg-transparent text-base text-ink outline-none placeholder:text-muted-foreground" />
            </label>
            <button type="submit" className="h-12 rounded-xl bg-ink px-5 font-bold text-white">Search</button>
          </form>
        </div>
      </PageBand>

      <Container className="pb-16">
        <div className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <div role="group" aria-label="Category" className="-mx-1 flex gap-2 overflow-x-auto px-1 py-1">
            {[{ value: "all", label: "All" }, ...THRIFT_CATEGORIES].map((c) => (
              <button key={c.value} aria-pressed={category === c.value} onClick={() => setParam("category", c.value)}
                className={cn("h-9 shrink-0 rounded-full border px-3.5 text-sm font-semibold transition",
                  category === c.value ? "border-ink bg-ink text-white" : "border-border bg-card hover:border-ink/40")}>
                {c.label}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">Sort
            <select id="thrift-sort" value={sort} onChange={(e) => setParam("sort", e.target.value)} className="h-9 rounded-xl border border-border bg-card px-3 text-sm font-semibold text-foreground">
              <option value="new">Newest</option>
              <option value="low">Price: low to high</option>
              <option value="high">Price: high to low</option>
            </select>
          </label>
        </div>

        <p className="py-3 text-sm text-muted-foreground" aria-live="polite">
          {isLoading ? "Loading…" : `${results.length} ${results.length === 1 ? "item" : "items"}${query ? ` matching "${params.get("q")}"` : ""}`}
        </p>

        {isLoading ? (
          <TileSkeleton />
        ) : shown.length ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-4">
            {shown.map((l) => <ListingTile key={l.id} listing={l} />)}
          </div>
        ) : (
          <EmptyState title={listings.length ? "Nothing matches yet" : "No listings yet"} action={<Link to="/sell" className="rounded-xl bg-thrift px-5 py-3 font-bold text-white">Sell something</Link>}>
            {listings.length ? "Try another word or category." : "Be the first to list something you no longer need."}
          </EmptyState>
        )}

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-blush p-6 sm:p-8">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">Clearing your closet?</h2>
            <p className="mt-1 text-muted-foreground">List clothes and small items in about a minute. Buyers chat and pay in the app.</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button onClick={() => openHelp("thrift")} className="rounded-xl border border-border bg-card px-5 py-3 font-bold">Learn more</button>
            <Link to="/sell" className="rounded-xl bg-thrift px-5 py-3 font-bold text-white">Sell something</Link>
          </div>
        </div>
      </Container>
    </>
  );
}
