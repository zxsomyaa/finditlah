import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { db } from "@/lib/db";
import { listListings, formatPrice } from "@/lib/thrift";
import { conditionLabel } from "@/lib/categories";
import { useSite, bandClass } from "@/lib/SiteContext";
import { cn } from "@/lib/utils";
import { ItemArt, ItemTile, ListingTile, Pill, Container } from "@/components/site/parts";

const COPY = {
  l: {
    lede: "Search what people have found across Singapore, from MRT stations to bus stops.",
    ph: "What did you lose, and where?",
  },
  t: {
    lede: "Buy and sell preloved clothes and small items. Chat and pay safely in the app.",
    ph: "Search preloved clothes and small items",
  },
};

/** @param {{ entries: any[], kind: "l"|"t" }} props */
function MarqueeRow({ entries, kind, reverse }) {
  const cards = (/** @type {boolean} */ dup) =>
    entries.map((x) => (
      <Link
        key={(dup ? "d" : "") + x.id}
        to={kind === "l" ? `/item/${x.id}` : `/thrift/${x.id}`}
        aria-hidden={dup || undefined}
        tabIndex={dup ? -1 : undefined}
        className="mr-3.5 flex min-w-[280px] items-center gap-3.5 rounded-[20px] bg-white py-2.5 pl-2.5 pr-5 text-ink shadow-[0_14px_30px_-20px_rgba(36,33,28,.45)] transition hover:-translate-y-0.5"
      >
        <ItemArt imageUrl={x.image_url} category={x.category} kind={kind} alt="" className="h-[76px] w-[76px] shrink-0 rounded-2xl" iconSize={34} />
        <span className="flex min-w-0 flex-col items-start gap-1">
          {kind === "l"
            ? <Pill tone={x.type === "found" ? "found" : "lost"}>{x.type === "found" ? "Found" : "Lost"}</Pill>
            : <Pill tone="thrift">Thrift</Pill>}
          <b className="max-w-[220px] truncate text-[15px]">
            {x.title}{kind === "t" ? ` · ${formatPrice(x.price)}` : ""}
          </b>
          <span className="max-w-[220px] truncate text-[13px] text-muted-foreground">
            {kind === "l" ? x.location_name : [x.location_name, conditionLabel(x.condition)].filter(Boolean).join(" · ")}
          </span>
        </span>
      </Link>
    ));
  return (
    <div className="overflow-hidden">
      <div className={cn("flex w-max", reverse ? "fil-marquee-reverse" : "fil-marquee")}>
        {cards(false)}
        {cards(true)}
      </div>
    </div>
  );
}

export default function Landing() {
  const { mode, setMode, openHelp } = useSite();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const { data: items = [] } = useQuery({
    queryKey: ["items"],
    queryFn: () => db.entities.Item.list({ onlyActive: true }),
  });
  const { data: listings = [] } = useQuery({
    queryKey: ["thrift-listings"],
    queryFn: () => listListings().catch(() => []),
  });

  const m = mode === "t" ? "t" : "l";
  const entries = (m === "l" ? items : listings).slice(0, 10);
  const half = Math.ceil(entries.length / 2);
  const rowA = entries.length >= 6 ? entries.slice(0, half) : entries;
  const rowB = entries.length >= 6 ? entries.slice(half) : entries.slice().reverse();

  /** @param {React.FormEvent} e */
  const submit = (e) => {
    e.preventDefault();
    const qs = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
    navigate((m === "l" ? "/lost" : "/thrift") + qs);
  };

  const foundRecent = items.filter((i) => i.type === "found").slice(0, 8);

  return (
    <>
      <section className={cn(bandClass(m), "pb-14 transition-colors duration-500")}>
        <Container className="flex flex-col items-center gap-5 pt-6 text-center">
          <h1 className="text-[clamp(40px,7vw,92px)] font-extrabold leading-[.98] tracking-[-0.04em]">
            Lost it? Find it.<br />Love it? Thrift it.
          </h1>
          <p className="max-w-[46ch] text-lg leading-relaxed opacity-90">{COPY[m].lede}</p>

          <div className="flex w-full max-w-[640px] flex-col items-center gap-3">
            <div role="group" aria-label="Search mode" className="inline-flex gap-0.5 rounded-2xl bg-black/[0.06] p-1">
              {[["l", "Lost & Found", "bg-lost"], ["t", "Thrift", "bg-thrift"]].map(([k, label, dot]) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={m === k}
                  onClick={() => setMode(k)}
                  className={cn("inline-flex h-[42px] items-center gap-2 rounded-xl px-4 text-[15px] font-bold transition",
                    m === k ? "bg-white text-ink shadow-[0_4px_12px_-6px_rgba(0,0,0,.3)]" : "")}
                >
                  <span className={cn("h-2 w-2 rounded-full", dot)} />
                  {label}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="flex w-full flex-wrap gap-1.5 rounded-[17px] border border-border bg-white p-1.5 shadow-[0_20px_44px_-26px_rgba(36,33,28,.4)]">
              <label className="flex min-w-0 flex-1 basis-44 items-center gap-2.5 px-2.5 text-muted-foreground">
                <Search size={20} />
                <span className="sr-only">Search</span>
                <input
                  id="home-search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={COPY[m].ph}
                  className="h-12 w-full bg-transparent text-base text-ink outline-none placeholder:text-muted-foreground"
                />
              </label>
              <button type="submit" className="h-12 rounded-xl bg-ink px-5 font-bold text-white">Search</button>
            </form>

            <p className="min-h-[21px] text-sm opacity-90">
              {m === "l" ? (
                <>Found something instead? <Link to="/post?type=found" className="font-bold underline underline-offset-4">Post it in a minute</Link></>
              ) : (
                <>Buy and sell preloved, then chat and pay in the app.{" "}
                  <button type="button" onClick={() => openHelp("thrift")} className="font-bold underline underline-offset-4">Learn more</button></>
              )}
            </p>
          </div>
        </Container>

        {entries.length > 0 && (
          <div key={m} className="fil-marquee-wrap fil-fade-edges mt-11 flex flex-col gap-3.5 animate-in fade-in duration-300" aria-label="Recent posts">
            <MarqueeRow entries={rowA} kind={m} />
            <MarqueeRow entries={rowB} kind={m} reverse />
          </div>
        )}
      </section>

      <Container className="py-10 pb-16">
        {m === "l" ? (
          <section>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <h2 className="text-[26px] font-extrabold tracking-tight">Found near you</h2>
              <Link to="/lost" className="font-bold">See all →</Link>
            </div>
            {foundRecent.length ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-4">
                {foundRecent.map((i) => <ItemTile key={i.id} item={i} />)}
              </div>
            ) : (
              <p className="text-muted-foreground">No found items yet. <Link to="/post?type=found" className="font-bold underline">Post the first one</Link>.</p>
            )}
          </section>
        ) : (
          <section>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <h2 className="text-[26px] font-extrabold tracking-tight">Fresh thrift</h2>
              <div className="flex items-center gap-4">
                <button onClick={() => openHelp("thrift")} className="font-bold underline underline-offset-4">Learn more about thrift</button>
                <Link to="/thrift" className="font-bold">See all →</Link>
              </div>
            </div>
            {listings.length ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-4">
                {listings.slice(0, 8).map((l) => <ListingTile key={l.id} listing={l} />)}
              </div>
            ) : (
              <p className="text-muted-foreground">No listings yet. <Link to="/sell" className="font-bold underline">Be the first to sell something</Link>.</p>
            )}
          </section>
        )}
      </Container>
    </>
  );
}
