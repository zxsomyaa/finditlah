import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Check, Copy, HandHeart, Heart, Medal, PackagePlus, Search, Share2, Sparkles, UserPlus } from "lucide-react";
import { getMyRewards, getReferralLink } from "@/lib/rewards";
import { usePageMode } from "@/lib/SiteContext";
import { cn } from "@/lib/utils";
import { PageBand, Container } from "@/components/site/parts";

const GOAL = 100;

const WAYS_TO_EARN = [
  { icon: PackagePlus, label: "Post a found item", sub: "Help someone get it back", points: 20 },
  { icon: Search, label: "Report a lost item", sub: "So finders can reach you", points: 10 },
  { icon: HandHeart, label: "Reunite an item", sub: "When it's marked returned", points: 50, highlight: true },
  { icon: UserPlus, label: "Invite a friend", sub: "When they sign up", points: 20 },
];

export default function Rewards() {
  usePageMode("t");
  const { data: raw, isLoading, isError } = useQuery({ queryKey: ["my-rewards"], queryFn: getMyRewards, retry: false });
  const data = /** @type {any} */ (raw);

  const points = data?.points ?? 0;
  const pct = Math.min(100, Math.round((points / GOAL) * 100));
  const done = points >= GOAL;

  return (
    <>
      <PageBand>
        <div className="grid grid-cols-1 items-center gap-8 pt-2 md:grid-cols-[minmax(0,1fr)_380px]">
          <div className="flex flex-col gap-3.5">
            <span className="text-xs font-bold uppercase tracking-[0.14em] opacity-70">Community rewards</span>
            <h1 className="text-[clamp(32px,4.6vw,52px)] font-extrabold leading-[1.04] tracking-tight">Earn points for helping out</h1>
            <p className="max-w-[48ch] text-[17px] leading-relaxed opacity-85">
              Every post, return and invite helps FindItLah grow. Reach {GOAL} points to unlock premium features for free.
            </p>
          </div>

          <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 text-ink shadow-[0_24px_50px_-30px_rgba(58,28,32,.45)]" aria-live="polite">
            <span className="text-sm font-bold text-muted-foreground">Your points</span>
            {isLoading ? (
              <div className="h-14 w-32 animate-pulse rounded-xl bg-muted" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-extrabold tracking-tight">{points}</span>
                <span className="text-lg font-semibold text-muted-foreground">/ {GOAL}</span>
              </div>
            )}
            <div className="h-3 overflow-hidden rounded-full bg-thrift-soft">
              <div className="h-full rounded-full bg-thrift transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-sm text-muted-foreground">
              {isError ? "Rewards aren't switched on yet. Your points will appear here soon."
                : done ? "Goal reached. Premium features are yours when they launch."
                : `${GOAL - points} points to go.`}
            </p>
          </div>
        </div>
      </PageBand>

      <Container className="pb-16">
        <section className="pt-10" aria-labelledby="earn-h">
          <h2 id="earn-h" className="text-2xl font-extrabold tracking-tight">How to earn</h2>
          <ul className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {WAYS_TO_EARN.map(({ icon: Icon, label, sub, points: pts, highlight }) => (
              <li key={label} className={cn("flex flex-col gap-3 rounded-2xl p-5", highlight ? "bg-blush" : "border border-border bg-card")}>
                <span className={cn("flex h-11 w-11 items-center justify-center rounded-xl", highlight ? "bg-white text-thrift" : "bg-cream text-lost")}>
                  <Icon size={20} />
                </span>
                <span className="flex flex-col gap-0.5">
                  <b className="leading-snug">{label}</b>
                  <span className="text-sm text-muted-foreground">{sub}</span>
                </span>
                <span className={cn("mt-auto text-2xl font-extrabold tracking-tight", highlight && "text-thrift")}>+{pts}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="grid grid-cols-1 gap-4 pt-10 md:grid-cols-2">
          <section className="flex flex-col gap-4 rounded-3xl bg-cream p-6" aria-labelledby="unlock-h">
            <h2 id="unlock-h" className="text-xl font-extrabold tracking-tight">At {GOAL} points</h2>
            <div className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lost"><Sparkles size={18} /></span>
              <p className="text-[15px] leading-relaxed"><b>Free premium features</b><br /><span className="text-muted-foreground">You get them at no cost when they launch.</span></p>
            </div>
            <div className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-thrift"><Heart size={18} /></span>
              <p className="text-[15px] leading-relaxed"><b>A gift to charity</b><br /><span className="text-muted-foreground">Each member who reaches {GOAL} adds to a donation we&apos;ll make to a local charity.</span></p>
            </div>
          </section>

          <section className={cn("flex flex-col gap-3 rounded-3xl p-6", data?.is_founding_member ? "bg-ink text-white" : "border border-dashed border-border bg-card")} aria-labelledby="founder-h">
            <span className={cn("flex h-12 w-12 items-center justify-center rounded-full", data?.is_founding_member ? "bg-white/10 text-[#F3C9CF]" : "bg-muted text-muted-foreground")}>
              <Medal size={22} />
            </span>
            <h2 id="founder-h" className="text-xl font-extrabold tracking-tight">
              {data?.is_founding_member ? "You're a Founding Member" : "Founding Member badge"}
            </h2>
            <p className={cn("text-[15px] leading-relaxed", data?.is_founding_member ? "text-white/75" : "text-muted-foreground")}>
              {data?.is_founding_member
                ? `You were one of the first ${GOAL} people to join FindItLah. The badge is yours for good.`
                : `Reserved for the first ${GOAL} people to join FindItLah.`}
            </p>
          </section>
        </div>

        <InviteCard code={data?.referral_code} count={data?.referral_count ?? 0} loading={isLoading} />

        <p className="pt-8 text-sm text-muted-foreground">
          See your posts and badges on your <Link to="/profile" className="font-semibold text-foreground underline underline-offset-4">profile</Link>.
        </p>
      </Container>
    </>
  );
}

/** @param {{ code?: string | null, count: number, loading: boolean }} props */
function InviteCard({ code, count, loading }) {
  const [copied, setCopied] = useState(false);
  const link = getReferralLink(code);
  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  const copy = async () => {
    if (!link) return;
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* clipboard blocked */ }
  };
  const share = async () => {
    try { await navigator.share({ title: "FindItLah", text: "Join me on FindItLah, lost & found and thrift for Singapore", url: link }); } catch { /* cancelled */ }
  };

  return (
    <section className="mt-10 flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 sm:p-8" aria-labelledby="invite-h">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="invite-h" className="text-xl font-extrabold tracking-tight">Invite friends, earn 20 points each</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {count > 0 ? `${count} ${count === 1 ? "friend has" : "friends have"} joined with your link.` : "You get points when a friend signs up with your link."}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="flex h-12 min-w-0 flex-1 basis-60 items-center rounded-xl bg-muted px-4 text-sm text-muted-foreground">
          <span className="truncate">{link || (loading ? "Loading your link…" : "Your invite link will appear here soon")}</span>
        </div>
        <button onClick={copy} disabled={!link} className="inline-flex h-12 items-center gap-2 rounded-xl bg-ink px-5 text-sm font-bold text-white disabled:opacity-40">
          {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied" : "Copy link"}
        </button>
        {canShare && (
          <button onClick={share} disabled={!link} className="inline-flex h-12 items-center gap-2 rounded-xl border border-border px-5 text-sm font-bold disabled:opacity-40">
            <Share2 size={16} /> Share
          </button>
        )}
      </div>
    </section>
  );
}
