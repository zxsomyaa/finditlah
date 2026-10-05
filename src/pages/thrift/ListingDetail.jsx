import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Loader2, MessageCircle, CreditCard, Pencil, Trash2, CheckCircle2, ShieldCheck } from "lucide-react";
import { getListing, listListings, startListingChat, startCheckout, updateListing, removeListing, formatPrice } from "@/lib/thrift";
import { thriftCategoryLabel, conditionLabel } from "@/lib/categories";
import { useAuth } from "@/lib/AuthContext";
import { usePageMode, useSite } from "@/lib/SiteContext";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Container, ItemArt, Pill, ListingTile, shortDate } from "@/components/site/parts";

export default function ListingDetail() {
  usePageMode("t");
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { openHelp } = useSite();
  const [delivery, setDelivery] = useState(/** @type {"meetup"|"mail"} */ ("meetup"));
  const [busy, setBusy] = useState("");
  const [payError, setPayError] = useState("");

  const { data: listing, isLoading } = useQuery({ queryKey: ["thrift-listing", id], queryFn: () => getListing(id), enabled: !!id });
  const { data: all = [] } = useQuery({ queryKey: ["thrift-listings"], queryFn: () => listListings().catch(() => []) });

  const needLogin = () => navigate("/login", { state: { from: location.pathname } });
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["thrift-listing", id] });
    queryClient.invalidateQueries({ queryKey: ["thrift-listings"] });
  };

  const chat = async () => {
    if (!user) return needLogin();
    try {
      setBusy("chat");
      const convoId = await startListingChat(listing, user);
      navigate(`/chat/${convoId}`);
    } catch (err) {
      toast({ title: "Couldn't open the chat", description: err instanceof Error ? err.message : "" });
    } finally { setBusy(""); }
  };

  const pay = async () => {
    if (!user) return needLogin();
    setPayError("");
    try {
      setBusy("pay");
      const url = await startCheckout(listing.id, delivery);
      window.location.assign(url);
    } catch (err) {
      setPayError(err instanceof Error ? err.message : "Couldn't start the payment.");
      setBusy("");
    }
  };

  /** @param {"sold"|"active"} status */
  const setStatus = async (status) => {
    try {
      setBusy(status);
      await updateListing(listing.id, { status });
      refresh();
      toast({ title: status === "sold" ? "Marked as sold" : "Listing is live again" });
    } catch (err) {
      toast({ title: "Couldn't update the listing", description: err instanceof Error ? err.message : "" });
    } finally { setBusy(""); }
  };

  const remove = async () => {
    if (!window.confirm("Remove this listing? Buyers won't see it any more.")) return;
    try {
      setBusy("remove");
      await removeListing(listing.id);
      refresh();
      navigate("/orders");
    } catch (err) {
      toast({ title: "Couldn't remove the listing", description: err instanceof Error ? err.message : "" });
      setBusy("");
    }
  };

  if (isLoading) return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!listing || listing.status === "removed") {
    return (
      <Container className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <b className="text-xl">This listing isn&apos;t available</b>
        <Link to="/thrift" className="rounded-xl bg-thrift px-5 py-3 font-bold text-white">Back to Thrift</Link>
      </Container>
    );
  }

  const isOwner = user?.id === listing.user_id;
  const available = listing.status === "active";
  const similar = all
    .filter((l) => l.id !== listing.id)
    .sort((a, b) => (b.category === listing.category ? 1 : 0) - (a.category === listing.category ? 1 : 0))
    .slice(0, 4);

  return (
    <Container className="pb-16">
      <nav aria-label="Breadcrumb" className="flex flex-wrap gap-2 pb-1 pt-6 text-sm text-muted-foreground">
        <Link to="/thrift" className="underline underline-offset-4">Thrift</Link><span>/</span>
        <Link to={`/thrift?category=${listing.category}`} className="underline underline-offset-4">{thriftCategoryLabel(listing.category)}</Link><span>/</span>
        <span className="text-foreground">{listing.title}</span>
      </nav>

      <div className="grid items-start gap-9 pt-4 lg:grid-cols-[1.1fr_.9fr]">
        <ItemArt imageUrl={listing.image_url} category={listing.category} kind="t" alt={listing.title} className="h-[300px] w-full rounded-[26px] sm:h-[460px]" iconSize={110} />

        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Pill tone="thrift">Thrift</Pill>
            {listing.condition && <Pill tone="ok" dot={false}>{conditionLabel(listing.condition)}</Pill>}
            {!available && <Pill tone="neutral" dot={false}>{listing.status === "sold" ? "Sold" : "Reserved"}</Pill>}
          </div>
          <h1 className="text-[clamp(28px,3.4vw,40px)] font-extrabold leading-[1.08] tracking-tight">
            {listing.title}{listing.size ? `, ${listing.size}` : ""}
          </h1>
          <div className="text-[40px] font-extrabold leading-none tracking-tight">{formatPrice(listing.price)}</div>
          {listing.description && <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{listing.description}</p>}

          <div className="grid grid-cols-2 gap-2.5">
            {[
              ["Area", listing.location_name || "Singapore"],
              ["Seller", listing.seller_name || "FindItLah member"],
              ["Category", thriftCategoryLabel(listing.category)],
              ["Posted", shortDate(listing.created_at) || "Recently"],
            ].map(([k, v]) => (
              <div key={k} className="flex min-w-0 flex-col gap-0.5 rounded-2xl bg-muted px-3.5 py-3">
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{k}</span>
                <b className="truncate">{v}</b>
              </div>
            ))}
          </div>

          {isOwner ? (
            <div className="flex flex-col gap-3 rounded-[20px] border border-border p-5">
              <b className="text-lg">This is your listing</b>
              <div className="flex flex-wrap gap-2.5">
                {listing.status !== "sold" && (
                  <button onClick={() => setStatus("sold")} disabled={!!busy} className="inline-flex items-center gap-2 rounded-xl bg-thrift px-4 py-3 font-bold text-white disabled:opacity-60">
                    {busy === "sold" ? <Loader2 size={17} className="animate-spin" /> : <CheckCircle2 size={17} />} Mark as sold
                  </button>
                )}
                {listing.status === "sold" && (
                  <button onClick={() => setStatus("active")} disabled={!!busy} className="rounded-xl border border-border bg-card px-4 py-3 font-bold">Relist</button>
                )}
                <Link to={`/sell/${listing.id}/edit`} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 font-bold"><Pencil size={16} /> Edit</Link>
                <button onClick={remove} disabled={!!busy} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 font-bold text-destructive"><Trash2 size={16} /> Remove</button>
              </div>
            </div>
          ) : available ? (
            <>
              <button onClick={chat} disabled={busy === "chat"} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-card font-bold transition hover:border-ink/40 disabled:opacity-60">
                {busy === "chat" ? <Loader2 size={17} className="animate-spin" /> : <MessageCircle size={17} />}
                Chat with {listing.seller_name || "the seller"}
              </button>

              <fieldset className="flex flex-col gap-2.5 rounded-[20px] border border-border p-5">
                <legend className="px-1 text-lg font-bold">Get it</legend>
                {[
                  ["meetup", "Meet up", "At a public spot you agree on in chat."],
                  ["mail", "Mail it to me", "Agree on postage with the seller in chat first."],
                ].map(([v, t, d]) => (
                  <label key={v} className={cn("flex cursor-pointer items-start gap-3 rounded-2xl border-[1.5px] p-3.5 transition", delivery === v ? "border-thrift bg-thrift-soft" : "border-border")}>
                    <input type="radio" name="delivery" value={v} checked={delivery === v} onChange={() => setDelivery(/** @type {any} */ (v))} className="mt-1 h-[18px] w-[18px] accent-[#A8404F]" />
                    <span><b>{t}</b><br /><span className="text-sm text-muted-foreground">{d}</span></span>
                  </label>
                ))}
                <button onClick={pay} disabled={busy === "pay"} className="mt-1 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-thrift font-bold text-white disabled:opacity-60">
                  {busy === "pay" ? <Loader2 size={17} className="animate-spin" /> : <CreditCard size={17} />}
                  Pay {formatPrice(listing.price)} in app
                </button>
                {payError && <p role="alert" className="text-sm text-destructive">{payError}</p>}
                <p className="flex items-start gap-2 text-[13px] leading-relaxed text-muted-foreground">
                  <ShieldCheck size={16} className="mt-0.5 shrink-0" />
                  The seller is paid after you confirm you&apos;ve received the item.
                </p>
              </fieldset>
              {!user && <p className="-mt-2 text-xs text-muted-foreground">You&apos;ll be asked to log in first.</p>}
            </>
          ) : (
            <p className="rounded-2xl bg-muted p-4 text-muted-foreground">This item is {listing.status === "sold" ? "sold" : "reserved for a buyer"}.</p>
          )}

          <p className="text-sm text-muted-foreground">
            <button onClick={() => openHelp("thrift")} className="font-bold text-foreground underline underline-offset-4">How buying on FindItLah works</button>
          </p>
        </div>
      </div>

      {similar.length > 0 && (
        <section className="pt-12">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-[24px] font-extrabold tracking-tight">More thrift</h2>
            <Link to="/thrift" className="font-bold">See all →</Link>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-4">
            {similar.map((l) => <ListingTile key={l.id} listing={l} />)}
          </div>
        </section>
      )}
    </Container>
  );
}
