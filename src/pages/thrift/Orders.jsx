import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, CheckCircle2, Plus } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { listMyListings, listMyOrders, confirmReceived, formatPrice } from "@/lib/thrift";
import { conditionLabel } from "@/lib/categories";
import { usePageMode } from "@/lib/SiteContext";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { PageBand, Container, ItemArt, Pill, EmptyState, shortDate } from "@/components/site/parts";

const BUYER_STATUS = {
  pending_payment: ["Payment not finished", "neutral"],
  paid: ["Paid · waiting for handover", "thrift"],
  received: ["Completed", "ok"],
  cancelled: ["Cancelled", "neutral"],
  refunded: ["Refunded", "neutral"],
};
const SELLER_STATUS = {
  pending_payment: ["Waiting for payment", "neutral"],
  paid: ["Buyer has paid", "thrift"],
  received: ["Buyer received it", "ok"],
  cancelled: ["Cancelled", "neutral"],
  refunded: ["Refunded", "neutral"],
};

/** @param {{ art: any, title: string, sub: string, right?: any, children?: any, to?: string }} props */
function Row({ art, title, sub, right, children, to }) {
  const body = (
    <>
      {art}
      <span className="flex min-w-0 flex-col gap-1">
        <b className="truncate">{title}</b>
        <span className="truncate text-[13px] text-muted-foreground">{sub}</span>
        {children}
      </span>
      <span className="flex flex-col items-end gap-2">{right}</span>
    </>
  );
  const cls = "grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-4 rounded-[18px] border border-border bg-card p-2.5 pr-4";
  return to ? <Link to={to} className={cls}>{body}</Link> : <div className={cls}>{body}</div>;
}

export default function Orders() {
  usePageMode("t");
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || (params.get("paid") ? "purchases" : "listings");
  const justPaid = params.get("paid");
  const [busy, setBusy] = useState("");

  const { data: listings = [], isLoading: l1 } = useQuery({
    queryKey: ["my-listings", user?.id], enabled: !!user, queryFn: () => listMyListings(user.id),
  });
  const { data: orders = [], isLoading: l2 } = useQuery({
    queryKey: ["my-orders", user?.id], enabled: !!user, queryFn: () => listMyOrders(user.id),
    refetchInterval: justPaid ? 4000 : false,
  });

  const purchases = orders.filter((o) => o.buyer_id === user?.id && (o.status !== "pending_payment" || o.id === justPaid));
  const sales = orders.filter((o) => o.seller_id === user?.id && o.status !== "pending_payment");

  /** @param {string} orderId */
  const received = async (orderId) => {
    if (!window.confirm("Confirm you've received the item? This releases payment to the seller.")) return;
    try {
      setBusy(orderId);
      await confirmReceived(orderId);
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      toast({ title: "Thanks! The seller will be paid." });
    } catch (err) {
      toast({ title: "Couldn't update the order", description: err instanceof Error ? err.message : "" });
    } finally { setBusy(""); }
  };

  const tabs = [
    ["listings", `My listings (${listings.length})`],
    ["purchases", `Purchases (${purchases.length})`],
    ["sales", `Sales (${sales.length})`],
  ];
  const loading = l1 || l2;
  const paidOrder = orders.find((o) => o.id === justPaid);

  return (
    <>
      <PageBand>
        <span className="text-xs font-bold uppercase tracking-[0.14em] opacity-70">Thrift</span>
        <h1 className="mt-2 text-[clamp(30px,4.2vw,46px)] font-extrabold tracking-tight">My thrift &amp; orders</h1>
      </PageBand>
      <Container className="pb-16">
        {justPaid && (
          <div role="status" className="mt-6 flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-900">
            <CheckCircle2 className="mt-0.5 shrink-0" size={20} />
            <div>
              <b>{paidOrder?.status === "paid" ? "Payment received" : "Thanks! We're confirming your payment."}</b>
              <p className="text-sm">Arrange the handover with the seller in Chats. Tap &quot;I&apos;ve received it&quot; once you have the item.</p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <div role="group" aria-label="Section" className="inline-flex flex-wrap gap-0.5 rounded-2xl border border-border bg-muted p-1">
            {tabs.map(([k, label]) => (
              <button key={k} aria-pressed={tab === k} onClick={() => { const n = new URLSearchParams(params); n.set("tab", k); n.delete("paid"); setParams(n, { replace: true }); }}
                className={cn("h-10 rounded-xl px-3.5 text-sm font-bold", tab === k ? "bg-white shadow-sm" : "text-muted-foreground")}>
                {label}
              </button>
            ))}
          </div>
          <Link to="/sell" className="inline-flex items-center gap-1.5 rounded-xl bg-thrift px-4 py-2.5 font-bold text-white"><Plus size={16} /> Sell something</Link>
        </div>

        <div className="flex flex-col gap-3 pt-5">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="animate-spin" /></div>
          ) : tab === "listings" ? (
            listings.length ? listings.map((l) => (
              <Row key={l.id} to={`/thrift/${l.id}`}
                art={<ItemArt imageUrl={l.image_url} category={l.category} kind="t" className="h-16 w-16 rounded-2xl" iconSize={26} />}
                title={`${l.title}${l.size ? `, ${l.size}` : ""} · ${formatPrice(l.price)}`}
                sub={[l.location_name, conditionLabel(l.condition), shortDate(l.created_at)].filter(Boolean).join(" · ")}
                right={<Pill tone={l.status === "active" ? "ok" : "neutral"} dot={false}>{l.status === "active" ? "Live" : l.status === "sold" ? "Sold" : "Reserved"}</Pill>}
              />
            )) : <EmptyState title="You haven't listed anything yet" action={<Link to="/sell" className="rounded-xl bg-thrift px-5 py-3 font-bold text-white">Sell something</Link>} />
          ) : tab === "purchases" ? (
            purchases.length ? purchases.map((o) => {
              const [label, tone] = BUYER_STATUS[o.status] || [o.status, "neutral"];
              return (
                <Row key={o.id}
                  art={<ItemArt imageUrl={o.listing?.image_url} category={o.listing?.category} kind="t" className="h-16 w-16 rounded-2xl" iconSize={26} />}
                  title={`${o.listing?.title || "Item"} · ${formatPrice(o.amount)}`}
                  sub={`${o.delivery === "mail" ? "Mail" : "Meet up"} · ${shortDate(o.created_at)}`}
                  right={o.status === "paid" ? (
                    <button onClick={() => received(o.id)} disabled={busy === o.id} className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-3.5 py-2.5 text-sm font-bold text-white disabled:opacity-60">
                      {busy === o.id && <Loader2 size={15} className="animate-spin" />} I&apos;ve received it
                    </button>
                  ) : <Pill tone={/** @type {any} */ (tone)} dot={false}>{label}</Pill>}
                >
                  {o.listing?.id && <Link to={`/thrift/${o.listing.id}`} className="text-[13px] font-bold underline underline-offset-4">View listing</Link>}
                </Row>
              );
            }) : <EmptyState title="No purchases yet" action={<Link to="/thrift" className="rounded-xl bg-thrift px-5 py-3 font-bold text-white">Shop thrift</Link>} />
          ) : (
            sales.length ? sales.map((o) => {
              const [label, tone] = SELLER_STATUS[o.status] || [o.status, "neutral"];
              return (
                <Row key={o.id}
                  art={<ItemArt imageUrl={o.listing?.image_url} category={o.listing?.category} kind="t" className="h-16 w-16 rounded-2xl" iconSize={26} />}
                  title={`${o.listing?.title || "Item"} · ${formatPrice(o.amount)}`}
                  sub={o.status === "paid"
                    ? "Arrange the handover in Chats. You're paid after the buyer confirms."
                    : o.status === "received"
                      ? (o.payout_status === "paid_out" ? "Paid out to you" : "Payout on the way")
                      : shortDate(o.created_at)}
                  right={<Pill tone={/** @type {any} */ (tone)} dot={false}>{label}</Pill>}
                />
              );
            }) : <EmptyState title="No sales yet">When someone pays for one of your listings, it shows up here.</EmptyState>
          )}
        </div>
      </Container>
    </>
  );
}
