import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { db } from "@/lib/db";
import { usePageMode } from "@/lib/SiteContext";
import { cn } from "@/lib/utils";
import { lookupPlace, geocodeRemaining } from "@/lib/geocode";
import { EXAMPLE_ITEMS, withExamples } from "@/lib/showcase";
import { PageBand, Container, Pill, ItemArt, ExampleTag, shortDate } from "@/components/site/parts";

const SINGAPORE = /** @type {[number, number]} */ ([1.3521, 103.8198]);

const TYPES = [
  { value: "all", label: "All" },
  { value: "found", label: "Found items" },
  { value: "lost", label: "Lost reports" },
];

/** Soft round pin: filled brown for found items, white with an ink ring for lost reports. */
/** @param {boolean} found @param {boolean} active */
const pin = (found, active) =>
  new L.DivIcon({
    className: "",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -14],
    html: `<span style="display:block;width:${active ? 30 : 24}px;height:${active ? 30 : 24}px;margin:${active ? 0 : 3}px;border-radius:50%;
      background:${found ? "#6A5332" : "#FFFFFF"};border:${found ? "3px solid #FFFFFF" : "4px solid #24211C"};
      box-shadow:0 6px 14px -4px rgba(36,33,28,.45);transition:all .15s"></span>`,
  });

/** Small, stable offset so several posts at the same place don't hide each other. */
/** @param {string} id */
const jitter = (id) => {
  let h = 0;
  for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return [((h & 0xff) / 255 - 0.5) * 0.004, (((h >> 8) & 0xff) / 255 - 0.5) * 0.004];
};

export default function MapView() {
  usePageMode("l");
  const [type, setType] = useState("all");
  const [activeId, setActiveId] = useState(/** @type {string|null} */ (null));
  const [extraCoords, setExtraCoords] = useState(/** @type {Record<string, [number, number]>} */ ({}));
  /** @type {React.MutableRefObject<L.Map|null>} */
  const mapRef = useRef(null);
  /** @type {React.MutableRefObject<Record<string, L.Marker>>} */
  const markers = useRef({});

  const { data: items = [], isLoading, isError } = useQuery({
    queryKey: ["items"],
    queryFn: () => db.entities.Item.list({ onlyActive: true }),
  });

  // Place names the built-in list doesn't know get looked up slowly in the background.
  useEffect(() => {
    const unknown = items.map((i) => i.location_name).filter((n) => n && !lookupPlace(n));
    if (!unknown.length) return;
    const ctrl = new AbortController();
    geocodeRemaining(unknown, (name, c) => setExtraCoords((prev) => ({ ...prev, [name]: c })), ctrl.signal);
    return () => ctrl.abort();
  }, [items]);

  const all = useMemo(() => withExamples(items, EXAMPLE_ITEMS, 3), [items]);

  const placed = useMemo(() => {
    return all
      .filter((i) => type === "all" || i.type === type)
      .map((i) => {
        const base =
          i.latitude && i.longitude ? [Number(i.latitude), Number(i.longitude)]
          : lookupPlace(i.location_name) || extraCoords[i.location_name];
        if (!base) return null;
        const [dy, dx] = jitter(i.id);
        return { ...i, pos: /** @type {[number, number]} */ ([base[0] + dy, base[1] + dx]) };
      })
      .filter(Boolean);
  }, [all, type, extraCoords]);

  const unplaced = items.filter((i) => (type === "all" || i.type === type)).length -
    placed.filter((i) => !i.example).length;

  /** @param {any} item */
  const focus = (item) => {
    setActiveId(item.id);
    mapRef.current?.flyTo(item.pos, 15, { duration: 0.6 });
    setTimeout(() => markers.current[item.id]?.openPopup(), 650);
  };

  return (
    <>
      <PageBand>
        <div className="flex max-w-3xl flex-col gap-3">
          <span className="text-xs font-bold uppercase tracking-[0.14em] opacity-70">Map</span>
          <h1 className="text-[clamp(32px,4.6vw,52px)] font-extrabold leading-[1.04] tracking-tight">What&apos;s been lost and found near you</h1>
          <p className="max-w-[56ch] text-[17px] leading-relaxed opacity-85">Every lost &amp; found post, pinned where it happened. Tap a pin or a post to see more.</p>
        </div>
      </PageBand>

      <Container className="pb-16">
        <div className="flex flex-wrap items-center justify-between gap-3 py-5">
          <div role="group" aria-label="Show" className="inline-flex gap-0.5 rounded-2xl border border-border bg-muted p-1">
            {TYPES.map((t) => (
              <button key={t.value} aria-pressed={type === t.value} onClick={() => setType(t.value)}
                className={cn("h-10 rounded-xl px-3.5 text-sm font-bold transition", type === t.value ? "bg-white text-ink shadow-sm" : "text-muted-foreground")}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full border-2 border-white bg-lost shadow" />Found</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full border-[3px] border-ink bg-white" />Lost</span>
            <span aria-live="polite">{isLoading ? "Loading…" : `${placed.length} on the map`}</span>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="relative isolate h-[60vh] min-h-[380px] overflow-hidden rounded-3xl border border-border bg-cream lg:h-[640px]">
            <MapContainer ref={mapRef} center={SINGAPORE} zoom={typeof window !== "undefined" && window.innerWidth < 640 ? 11 : 12} minZoom={10} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
              <TileLayer
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              {placed.map((item) => (
                <Marker
                  key={item.id}
                  position={item.pos}
                  icon={pin(item.type === "found", activeId === item.id)}
                  ref={(m) => { if (m) markers.current[item.id] = m; }}
                  eventHandlers={{ click: () => setActiveId(item.id) }}
                >
                  <Popup>
                    <MapCard item={item} />
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <aside aria-label="Posts on the map" className="flex max-h-[640px] flex-col gap-2 overflow-y-auto rounded-3xl border border-border bg-card p-2">
            {isError && <p className="p-4 text-sm text-muted-foreground">Couldn&apos;t load posts right now. Please refresh to try again.</p>}
            {!isLoading && !placed.length && !isError && (
              <p className="p-4 text-sm text-muted-foreground">No posts to show yet.</p>
            )}
            {placed.map((item) => (
              <button
                key={item.id}
                onClick={() => focus(item)}
                aria-pressed={activeId === item.id}
                className={cn("relative flex items-center gap-3 rounded-2xl p-2 text-left transition hover:bg-muted", activeId === item.id && "bg-cream")}
              >
                <ItemArt imageUrl={item.image_url} category={item.category} kind="l" alt="" iconSize={24} className="h-16 w-16 shrink-0 rounded-xl" />
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="flex items-center gap-1.5">
                    <Pill tone={item.type === "found" ? "found" : "lost"} className="py-0.5">{item.type === "found" ? "Found" : "Lost"}</Pill>
                    {item.example && <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Example</span>}
                  </span>
                  <b className="truncate text-sm text-foreground">{item.title}</b>
                  <span className="truncate text-xs text-muted-foreground">
                    {[item.location_name, shortDate(item.date || item.created_date)].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </button>
            ))}
            {unplaced > 0 && !isLoading && (
              <Link to="/lost" className="p-3 text-xs text-muted-foreground underline underline-offset-4">
                {unplaced} more {unplaced === 1 ? "post has a location" : "posts have locations"} we couldn&apos;t pin. See all posts
              </Link>
            )}
          </aside>
        </div>
      </Container>
    </>
  );
}

/** @param {{ item: any }} props */
function MapCard({ item }) {
  const found = item.type === "found";
  const body = (
    <span className="relative flex w-48 flex-col gap-1.5 font-sans">
      {item.example && <ExampleTag className="left-1.5 top-1.5" />}
      <ItemArt imageUrl={item.image_url} category={item.category} kind="l" alt={item.title} iconSize={30} className="h-28 w-full rounded-xl" />
      <Pill tone={found ? "found" : "lost"} className="self-start">{found ? "Found" : "Lost"}</Pill>
      <b className="text-sm leading-snug text-ink">{item.title}</b>
      <span className="text-xs text-muted-foreground">{item.location_name}</span>
      {!item.example && <span className="text-xs font-bold text-ink underline underline-offset-4">View post</span>}
    </span>
  );
  return item.example ? body : <Link to={`/item/${item.id}`} className="block !text-ink no-underline">{body}</Link>;
}
