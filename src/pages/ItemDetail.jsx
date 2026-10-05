// @ts-nocheck
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import { MessageCircle, CheckCircle2, Loader2, Pencil, Trash2, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { db } from "@/lib/db";
import { awardPoints } from "@/lib/rewards";
import { useAuth } from "@/lib/AuthContext";
import { usePageMode, useSite } from "@/lib/SiteContext";
import { labelFor } from "@/lib/categories";
import { toast } from "@/components/ui/use-toast";
import { findExampleItem } from "@/lib/showcase";
import { Container, ItemArt, Pill, ItemTile, shortDate } from "@/components/site/parts";
import JoinGate, { HiddenText } from "@/components/site/JoinGate";

/* Simple text/category/location similarity used to suggest possible matches. */
function calculateMatchScore(a, b) {
  let score = 0;
  const textA = `${a.title || ""} ${a.description || ""} ${a.category || ""}`.toLowerCase();
  const textB = `${b.title || ""} ${b.description || ""} ${b.category || ""}`.toLowerCase();
  const words = [...new Set(textA.split(/\s+/).map((w) => w.trim()).filter((w) => w.length > 2))];
  words.forEach((w) => { if (textB.includes(w)) score += 12; });
  if (a.category && a.category === b.category) score += 35;
  if (a.location_name && b.location_name && a.location_name.toLowerCase() === b.location_name.toLowerCase()) score += 20;
  if (a.type && b.type && a.type !== b.type) score += 15;
  return Math.min(score, 100);
}

export default function ItemDetail() {
  usePageMode("l");
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const { openHelp } = useSite();
  const [busy, setBusy] = useState("");

  const { data: item, isLoading } = useQuery({
    queryKey: ["item", id],
    queryFn: () => (id.startsWith("example-") ? findExampleItem(id) : db.entities.Item.getById(id)),
    enabled: !!id,
  });
  const { data: allItems = [] } = useQuery({
    queryKey: ["items"],
    queryFn: () => db.entities.Item.list({ onlyActive: true }),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["item", id] });
    queryClient.invalidateQueries({ queryKey: ["items"] });
    queryClient.invalidateQueries({ queryKey: ["my-items"] });
  };

  const startChat = async () => {
    if (!user) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    if (!item.user_id) return toast({ title: "This post doesn't have an owner, so chat can't be started." });
    if (user.id === item.user_id) return;
    const participants = [user.id, item.user_id].sort();
    try {
      setBusy("chat");
      const { data: existing, error: existingError } = await supabase
        .from("conversations").select("*").eq("item_id", item.id).contains("participants", participants).maybeSingle();
      if (existingError) throw existingError;
      if (existing) return navigate(`/chat/${existing.id}`);
      const { data: conversation, error } = await supabase
        .from("conversations")
        .insert([{ item_id: item.id, item_title: item.title, participants, last_message: "", last_message_at: new Date().toISOString() }])
        .select().single();
      if (error) throw error;
      navigate(`/chat/${conversation.id}`);
    } catch (err) {
      console.error(err);
      toast({ title: "Couldn't start the chat", description: err.message });
    } finally {
      setBusy("");
    }
  };

  const markResolved = async () => {
    if (!window.confirm("Mark this post as resolved? It will be removed from the feed.")) return;
    try {
      setBusy("resolve");
      await db.entities.Item.update(item.id, { status: "resolved" });
      refresh();
      try {
        const earned = await awardPoints("reunite", item.id);
        if (earned > 0) toast({ title: `+${earned} points`, description: "Nice — you reunited someone with their item!" });
      } catch (e) { console.error(e); }
      navigate("/lost");
    } catch (err) {
      toast({ title: "Couldn't update the post", description: err.message });
    } finally { setBusy(""); }
  };

  const remove = async () => {
    if (!window.confirm("Delete this post? This can't be undone.")) return;
    try {
      setBusy("delete");
      await db.entities.Item.delete(item.id);
      refresh();
      navigate("/lost");
    } catch (err) {
      toast({ title: "Couldn't delete the post", description: err.message });
    } finally { setBusy(""); }
  };

  if (isLoading || authLoading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }
  if (!item) {
    return (
      <Container className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <b className="text-xl">This post isn&apos;t available</b>
        <Link to="/lost" className="rounded-xl bg-ink px-5 py-3 font-bold text-white">Back to Lost &amp; Found</Link>
      </Container>
    );
  }

  const found = item.type === "found";
  const isOwner = user?.id === item.user_id;
  const resolved = item.status === "resolved";
  const matches = allItems
    .filter((o) => o.id !== item.id && o.type !== item.type)
    .map((o) => ({ item: o, score: calculateMatchScore(item, o) }))
    .filter((m) => m.score >= 25)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  return (
    <Container className="pb-16">
      <nav aria-label="Breadcrumb" className="flex flex-wrap gap-2 pb-1 pt-6 text-sm text-muted-foreground">
        <Link to="/lost" className="underline underline-offset-4">Lost &amp; Found</Link><span>/</span>
        <span>{found ? "Found items" : "Lost reports"}</span><span>/</span>
        <span className="text-foreground">{item.title}</span>
      </nav>

      <div className="grid items-start gap-9 pt-4 lg:grid-cols-[1.1fr_.9fr]">
        <ItemArt imageUrl={item.image_url} category={item.category} kind="l" alt={item.title} className="h-[300px] w-full rounded-[26px] sm:h-[430px]" iconSize={110} />

        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Pill tone={found ? "found" : "lost"}>{found ? "Found" : "Lost"}</Pill>
            {item.example && <Pill tone="neutral" dot={false}>Example</Pill>}
            {resolved ? <Pill tone="ok">Resolved</Pill> : <Pill tone="neutral" dot={false}>{found ? "Waiting for the owner" : "Owner still searching"}</Pill>}
          </div>
          <h1 className="text-[clamp(28px,3.4vw,40px)] font-extrabold leading-[1.08] tracking-tight">{item.title}</h1>
          {!user ? (
            <>
              <p className="text-[15px] text-muted-foreground">{found ? "Found at" : "Last seen at"} <b className="text-foreground">{item.location_name || "Singapore"}</b></p>
              <HiddenText />
              <JoinGate reason="details" />
            </>
          ) : (
          <>
          {item.description && <p className="leading-relaxed text-muted-foreground">{item.description}</p>}

          <div className="grid grid-cols-2 gap-2.5">
            {[
              [found ? "Found at" : "Last seen", item.location_name || "Not given"],
              ["When", item.date ? new Date(item.date).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" }) : shortDate(item.created_date) || "Not given"],
              ["Category", labelFor(item.category) || "General"],
              ["Posted", shortDate(item.created_date) || "Recently"],
            ].map(([k, v]) => (
              <div key={k} className="flex min-w-0 flex-col gap-0.5 rounded-2xl bg-muted px-3.5 py-3">
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{k}</span>
                <b className="truncate">{v}</b>
              </div>
            ))}
          </div>

          {item.example ? (
            <div className="flex flex-col gap-1.5 rounded-[20px] border border-dashed border-border p-5">
              <b className="text-lg">This is an example post</b>
              <p className="text-sm leading-relaxed text-muted-foreground">It shows how lost & found posts on FindItLah look. Real posts will appear here as people post them.</p>
            </div>
          ) : isOwner ? (
            <div className="flex flex-col gap-3 rounded-[20px] border border-border p-5">
              <b className="text-lg">This is your post</b>
              <div className="flex flex-wrap gap-2.5">
                {!resolved && (
                  <button onClick={markResolved} disabled={!!busy} className="inline-flex items-center gap-2 rounded-xl bg-lost px-4 py-3 font-bold text-white disabled:opacity-60">
                    {busy === "resolve" ? <Loader2 size={17} className="animate-spin" /> : <CheckCircle2 size={17} />} Mark as resolved
                  </button>
                )}
                <Link to={`/edit-post/${item.id}`} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 font-bold"><Pencil size={16} /> Edit</Link>
                <button onClick={remove} disabled={!!busy} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 font-bold text-destructive disabled:opacity-60">
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          ) : !resolved && (
            <div className="flex flex-col gap-3 rounded-[20px] border border-border p-5">
              <b className="text-lg">{found ? "Is this yours?" : "Have you seen it?"}</b>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {found
                  ? "Message the finder and describe something only the owner would know, like what's inside or a mark on it."
                  : "Message the owner with where and when you saw it. Your contact details stay private."}
              </p>
              <button onClick={startChat} disabled={busy === "chat"} className="inline-flex items-center justify-center gap-2 rounded-xl bg-lost px-4 py-3 font-bold text-white disabled:opacity-60">
                {busy === "chat" ? <Loader2 size={17} className="animate-spin" /> : <MessageCircle size={17} />}
                {found ? "Message the finder" : "Message the owner"}
              </button>
            </div>
          )}
          </>
          )}
          <p className="text-sm text-muted-foreground">
            <button onClick={() => openHelp("safety")} className="font-bold text-foreground underline underline-offset-4">Safety tips</button> for handovers.
          </p>
        </div>
      </div>

      <section className="pt-12">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-[24px] font-extrabold tracking-tight">Possible matches</h2>
          <Link to="/lost" className="inline-flex items-center gap-1 font-bold">See all <ArrowRight size={16} /></Link>
        </div>
        {matches.length ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-4">
            {matches.map((m) => <ItemTile key={m.item.id} item={m.item} />)}
          </div>
        ) : (
          <p className="text-muted-foreground">No similar {found ? "lost reports" : "found items"} yet. We&apos;ll show them here when they&apos;re posted.</p>
        )}
      </section>
    </Container>
  );
}
