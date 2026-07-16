import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Trophy,
  PackagePlus,
  Search,
  HandHeart,
  UserPlus,
  Sparkles,
  Heart,
  Medal,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import { getMyRewards, getReferralLink } from "@/lib/rewards";

const WAYS_TO_EARN = [
  { icon: PackagePlus, label: "Post a found item", points: 20 },
  { icon: Search, label: "Report a lost item", points: 10 },
  { icon: HandHeart, label: "Successfully reunite an item", points: 50, highlight: true },
  { icon: UserPlus, label: "Invite a friend who signs up", points: 20 },
];

const GOAL = 100;

export default function Rewards() {
  const { data: rawData, isLoading, isError } = useQuery({
    queryKey: ["my-rewards"],
    queryFn: getMyRewards,
  });
  const data = /** @type {any} */ (rawData);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="animate-spin" size={22} />
        <span className="text-sm">Loading your rewards...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-2 text-center px-6 text-muted-foreground">
        <Trophy size={28} className="opacity-50" />
        <p className="text-sm">Rewards aren't set up yet — check back soon.</p>
      </div>
    );
  }

  const points = data?.points ?? 0;
  const isFoundingMember = data?.is_founding_member ?? false;
  const referralCount = data?.referral_count ?? 0;
  const progress = Math.min(100, Math.round((points / GOAL) * 100));

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-primary px-4 lg:px-10 pt-8 pb-28">
      <div className="max-w-md lg:max-w-4xl mx-auto text-center text-primary-foreground">
        <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur border border-white/20 text-xs font-semibold tracking-wide rounded-full px-3 py-1">
          <Trophy size={13} className="text-amber-300" />
          COMMUNITY REWARDS
        </div>

        <h1 className="font-heading text-3xl lg:text-4xl font-bold mt-4 leading-tight">
          Earn points, make a difference
        </h1>
        <p className="text-primary-foreground/80 text-sm lg:text-base mt-2 lg:max-w-xl lg:mx-auto">
          Help grow FindItLah — every action you take builds a stronger community.
        </p>
      </div>

      <div className="max-w-md lg:max-w-4xl mx-auto">
        {/* WAYS TO EARN */}
        <div className="bg-card rounded-3xl shadow-xl p-5 lg:p-6 mt-6">
          <p className="text-xs font-semibold tracking-wide text-primary mb-3">
            HOW TO EARN POINTS
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
            {WAYS_TO_EARN.map(({ icon: Icon, label, points: pts, highlight }) => (
              <div
                key={label}
                className={`flex flex-col items-start gap-2 rounded-2xl px-3 py-3 ${
                  highlight ? "bg-amber-500/10 border border-amber-500/30" : "bg-muted"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    highlight ? "bg-amber-500/20 text-amber-600" : "bg-primary/10 text-primary"
                  }`}
                >
                  <Icon size={15} />
                </div>
                <span className="text-xs font-medium text-foreground text-left leading-snug">{label}</span>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    highlight ? "bg-amber-500 text-white" : "bg-primary text-primary-foreground"
                  }`}
                >
                  +{pts} pts
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start">
          {/* PROGRESS */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-primary-foreground mb-2">
              <span className="text-sm font-semibold">
                🎉 Reach {GOAL} points and unlock:
              </span>
              <span className="text-sm font-bold">{points} / {GOAL}</span>
            </div>

            <div className="h-2.5 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-400 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-4 space-y-3 text-primary-foreground">
              <div className="flex items-start gap-2.5">
                <Sparkles size={16} className="text-amber-300 shrink-0 mt-0.5" />
                <p className="text-sm font-medium">Free access to upcoming premium features</p>
              </div>
              <div className="flex items-start gap-2.5">
                <Heart size={16} className="text-red-300 shrink-0 mt-0.5" />
                <p className="text-sm">
                  Every member who hits {GOAL} points contributes towards our community donation —
                  as more reach this milestone, we'll donate to a local charity.
                </p>
              </div>
            </div>
          </div>

          {/* FOUNDING MEMBER */}
          <div className="mt-6">
            {isFoundingMember ? (
              <div className="flex items-center gap-3 bg-amber-400 rounded-2xl p-4 h-full">
                <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shrink-0">
                  <Medal size={20} className="text-amber-500" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-amber-950">You're a Founding Member 🎉</p>
                  <p className="text-sm text-amber-950/80">
                    You were among the first {GOAL} to sign up — that badge is yours forever.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-2xl p-4 h-full">
                <div className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                  <Medal size={20} className="text-primary-foreground/70" />
                </div>
                <div className="text-left text-primary-foreground">
                  <p className="font-bold">Founding Member badge</p>
                  <p className="text-sm text-primary-foreground/70">
                    Reserved for the first {GOAL} people to join FindItLah.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* REFERRAL LINK */}
        <div className="mt-6">
          <ReferralCard referralCode={data?.referral_code} referralCount={referralCount} />
        </div>
      </div>
    </div>
  );
}

/** @param {{ referralCode?: string | null, referralCount: number }} props */
function ReferralCard({ referralCode, referralCount }) {
  const [copied, setCopied] = useState(false);
  const link = getReferralLink(referralCode);

  const handleCopy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-card rounded-2xl p-4">
      <p className="text-sm font-semibold text-foreground">Your invite link</p>
      <p className="text-xs text-muted-foreground mt-0.5">
        {referralCount > 0
          ? `${referralCount} friend${referralCount === 1 ? "" : "s"} joined so far`
          : "Share it — you'll earn 20 points when a friend signs up"}
      </p>

      <div className="flex items-center gap-2 mt-3">
        <div className="flex-1 min-w-0 bg-muted rounded-xl px-3 py-2 text-xs text-muted-foreground truncate">
          {link || "Loading..."}
        </div>
        <button
          onClick={handleCopy}
          disabled={!link}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shrink-0 disabled:opacity-50"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
