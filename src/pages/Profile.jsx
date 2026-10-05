import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Award, BadgeCheck, ChevronRight, Gift, Heart, Lock, LogOut, MessageCircle, Pencil, Receipt, Shield, Star, Trophy, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { useAuth } from "@/lib/AuthContext";
import { getMyRewards } from "@/lib/rewards";
import { usePageMode } from "@/lib/SiteContext";
import { cn } from "@/lib/utils";
import { PageBand, Container, ItemArt, Pill, EmptyState, shortDate } from "@/components/site/parts";

const REWARD_GOAL = 100;

const BADGES = [
  { label: "First Return", need: 1, icon: Heart },
  { label: "Good Samaritan", need: 5, icon: Star },
  { label: "Community Hero", need: 10, icon: Trophy },
  { label: "Guardian", need: 25, icon: Shield },
  { label: "FindIt Legend", need: 50, icon: Zap },
];

/** @param {number} n */
const levelFor = (n) =>
  n >= 50 ? "Legend" : n >= 25 ? "Guardian" : n >= 10 ? "Hero" : n >= 5 ? "Samaritan" : n >= 1 ? "Helper" : "Newcomer";

const TABS = [
  { value: "all", label: "All" },
  { value: "lost", label: "Lost" },
  { value: "found", label: "Found" },
];

export default function Profile() {
  usePageMode("l");
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("all");

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      return data;
    },
  });

  const { data: rewards } = useQuery({ queryKey: ["my-rewards"], queryFn: getMyRewards, enabled: !!user?.id, retry: false });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["my-items", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("items").select("*").eq("user_id", user.id).order("created_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const meta = user?.user_metadata || {};
  const name = profile?.username || meta.full_name || meta.name || meta.username || (user?.email || "").split("@")[0] || "You";
  const avatar = meta.avatar_url || meta.picture;
  const joined = user?.created_at ? new Date(user.created_at).toLocaleDateString("en-SG", { month: "long", year: "numeric" }) : "";

  const counts = useMemo(() => ({
    lost: items.filter((i) => i.type === "lost").length,
    found: items.filter((i) => i.type === "found").length,
    active: items.filter((i) => i.status === "active").length,
    resolved: items.filter((i) => i.status === "resolved").length,
  }), [items]);
  const returns = counts.resolved;
  const trusted = returns >= 3;
  const nextBadge = BADGES.find((b) => returns < b.need);
  const shown = tab === "all" ? items : items.filter((i) => i.type === tab);

  const points = rewards?.points ?? 0;
  const rewardPct = Math.min(100, Math.round((points / REWARD_GOAL) * 100));

  const signOut = async () => { await logout(); navigate("/"); };

  return (
    <>
      <PageBand>
        <div className="flex items-center gap-4 pt-2 sm:gap-5">
          {avatar ? (
            <img src={avatar} alt="" referrerPolicy="no-referrer" className="h-16 w-16 shrink-0 rounded-full border-4 sm:h-20 sm:w-20 border-white object-cover shadow-sm" />
          ) : (
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-white bg-ink text-2xl sm:h-20 sm:w-20 sm:text-3xl font-extrabold text-white shadow-sm">
              {name.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-[clamp(26px,3.6vw,38px)] font-extrabold leading-tight tracking-tight">{name}</h1>
              {trusted && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-lost shadow-sm">
                  <BadgeCheck size={14} /> Trusted
                </span>
              )}
            </div>
            <p className="truncate text-sm opacity-75 sm:text-[15px]">{[user?.email, joined && `Joined ${joined}`].filter(Boolean).join(" · ")}</p>
          </div>
          <button onClick={signOut} aria-label="Log out" className="inline-flex h-11 w-11 items-center justify-center gap-2 rounded-xl border border-ink/15 bg-white/70 text-sm font-bold hover:bg-white sm:w-auto sm:px-4">
            <LogOut size={16} /> <span className="hidden sm:inline">Log out</span>
          </button>
        </div>

        <dl className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-ink/10 bg-ink/10 sm:grid-cols-4">
          {[
            ["Posts", items.length],
            ["Still open", counts.active],
            ["Resolved", counts.resolved],
            ["Points", points],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col gap-0.5 bg-white/80 px-5 py-4">
              <dt className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</dt>
              <dd className="text-2xl font-extrabold tracking-tight">{value}</dd>
            </div>
          ))}
        </dl>
      </PageBand>

      <Container className="pb-16">
        <div className="grid grid-cols-1 gap-4 pt-8 md:grid-cols-2">
          {/* Rewards */}
          <Link to="/rewards" className="group flex flex-col gap-4 rounded-3xl bg-blush p-6 text-rosewood transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-sm font-bold"><Gift size={18} className="text-thrift" /> Community rewards</span>
              <ChevronRight size={20} className="opacity-60 transition group-hover:translate-x-0.5" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-extrabold tracking-tight">{points}</span>
              <span className="font-semibold opacity-70">/ {REWARD_GOAL} points</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-thrift transition-all duration-700" style={{ width: `${rewardPct}%` }} />
            </div>
            <p className="text-sm opacity-80">
              {points >= REWARD_GOAL ? "You've unlocked premium features. Thank you!" : `${REWARD_GOAL - points} more to unlock free premium features.`}
            </p>
          </Link>

          {/* Reputation */}
          <section className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6" aria-labelledby="rep-h">
            <div className="flex items-center justify-between">
              <h2 id="rep-h" className="inline-flex items-center gap-2 text-sm font-bold"><Award size={18} className="text-lost" /> Reputation</h2>
              <Pill tone="found">{levelFor(returns)}</Pill>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-extrabold tracking-tight">{returns}</span>
              <span className="font-semibold text-muted-foreground">{returns === 1 ? "item returned" : "items returned"}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-lost-soft">
              <div className="h-full rounded-full bg-lost transition-all duration-700" style={{ width: `${nextBadge ? Math.round((returns / nextBadge.need) * 100) : 100}%` }} />
            </div>
            <p className="text-sm text-muted-foreground">
              {nextBadge ? <>{nextBadge.need - returns} more to earn <b className="text-foreground">{nextBadge.label}</b></> : "You've earned every badge."}
            </p>
          </section>
        </div>

        {/* Badges */}
        <section className="pt-10" aria-labelledby="badges-h">
          <h2 id="badges-h" className="text-2xl font-extrabold tracking-tight">Badges</h2>
          <p className="mt-1 text-sm text-muted-foreground">Earned by helping people get their things back.</p>
          <ul className="-mx-1 mt-4 flex gap-3 overflow-x-auto px-1 pb-2 sm:grid sm:grid-cols-5 sm:overflow-visible">
            {BADGES.map(({ label, need, icon: Icon }) => {
              const earned = returns >= need;
              return (
                <li key={label} className={cn("flex w-36 shrink-0 flex-col items-center gap-2 rounded-2xl border p-4 text-center sm:w-auto",
                  earned ? "border-transparent bg-cream" : "border-dashed border-border bg-card")}>
                  <span className={cn("relative flex h-12 w-12 items-center justify-center rounded-full",
                    earned ? "bg-white text-thrift shadow-sm" : "bg-muted text-muted-foreground/60")}>
                    <Icon size={22} strokeWidth={1.8} />
                    {!earned && <Lock size={18} className="absolute -bottom-1 -right-1 rounded-full border border-border bg-white p-[3px] text-muted-foreground" aria-hidden="true" />}
                  </span>
                  <b className={cn("text-sm", !earned && "text-muted-foreground")}>{label}</b>
                  <span className="text-xs text-muted-foreground">{earned ? "Earned" : `${need} ${need === 1 ? "return" : "returns"}`}</span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Posts */}
        <section className="pt-10" aria-labelledby="posts-h">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="posts-h" className="text-2xl font-extrabold tracking-tight">My posts</h2>
              <p className="mt-1 text-sm text-muted-foreground">Your lost reports and found items.</p>
            </div>
            <div role="group" aria-label="Show" className="inline-flex gap-0.5 rounded-2xl border border-border bg-muted p-1">
              {TABS.map((t) => {
                const n = t.value === "all" ? items.length : counts[t.value];
                return (
                  <button key={t.value} aria-pressed={tab === t.value} onClick={() => setTab(t.value)}
                    className={cn("h-10 rounded-xl px-3.5 text-sm font-bold transition", tab === t.value ? "bg-white text-ink shadow-sm" : "text-muted-foreground")}>
                    {t.label} <span className="font-semibold opacity-60">{n}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5">
            {isLoading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {[0, 1].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />)}
              </div>
            ) : shown.length ? (
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {shown.map((item) => <PostRow key={item.id} item={item} />)}
              </ul>
            ) : (
              <EmptyState
                title={tab === "all" ? "No posts yet" : `No ${tab} posts yet`}
                action={<Link to={`/post?type=${tab === "lost" ? "lost" : "found"}`} className="rounded-xl bg-ink px-5 py-3 font-bold text-white">Make a post</Link>}
              >
                Found something, or lost something? Posting takes about a minute.
              </EmptyState>
            )}
          </div>
        </section>

        {/* Shortcuts */}
        <section className="grid grid-cols-1 gap-3 pt-10 sm:grid-cols-2" aria-label="More">
          <Shortcut to="/orders" icon={Receipt} title="My thrift" sub="Things you're selling" />
          <Shortcut to="/chats" icon={MessageCircle} title="Chats" sub="Messages with finders, owners and buyers" />
        </section>

        <p className="pt-10 text-sm text-muted-foreground">
          Want your account deleted? Message{" "}
          <a href="https://instagram.com/finditlah" target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground underline underline-offset-4">@finditlah on Instagram</a>{" "}
          and we&apos;ll remove it along with your posts.
        </p>
      </Container>
    </>
  );
}

const STATUS = { active: ["Open", "found"], resolved: ["Resolved", "ok"], expired: ["Hidden", "neutral"] };

/** @param {{ item: any }} props */
function PostRow({ item }) {
  const found = item.type === "found";
  const [label, tone] = STATUS[item.status] || [item.status, "neutral"];
  return (
    <li className="relative flex items-center gap-4 rounded-2xl border border-border bg-card p-3 transition hover:shadow-lg hover:shadow-black/5">
      <ItemArt imageUrl={item.image_url} category={item.category} kind="l" alt="" iconSize={28} className="h-24 w-24 shrink-0 rounded-xl" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Pill tone={found ? "found" : "lost"}>{found ? "Found" : "Lost"}</Pill>
          <Pill tone={/** @type {any} */ (tone)} dot={false}>{label}</Pill>
        </div>
        <Link to={`/item/${item.id}`} className="truncate text-[15px] font-bold after:absolute after:inset-0">{item.title}</Link>
        <span className="truncate text-[13px] text-muted-foreground">
          {[item.location_name, shortDate(item.date || item.created_date)].filter(Boolean).join(" · ")}
        </span>
      </div>
      <Link to={`/edit-post/${item.id}`} aria-label={`Edit ${item.title}`}
        className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground hover:border-ink/40 hover:text-ink">
        <Pencil size={16} />
      </Link>
    </li>
  );
}

/** @param {{ to: string, icon: any, title: string, sub: string }} props */
function Shortcut({ to, icon: Icon, title, sub }) {
  return (
    <Link to={to} className="group flex min-w-0 items-center gap-4 rounded-2xl border border-border bg-card p-4 transition hover:border-ink/30">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cream text-ink"><Icon size={20} /></span>
      <span className="flex min-w-0 flex-1 flex-col">
        <b>{title}</b>
        <span className="truncate text-sm text-muted-foreground">{sub}</span>
      </span>
      <ChevronRight size={18} className="text-muted-foreground transition group-hover:translate-x-0.5" />
    </Link>
  );
}
