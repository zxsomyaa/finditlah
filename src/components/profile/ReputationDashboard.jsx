import { useMemo } from "react";
import { Shield, Star, Trophy, Heart, Zap, Award, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const BADGES = [
  {
    id: "first_return",
    icon: Heart,
    label: "First Return",
    description: "Helped someone get their item back",
    color: "text-pink-500",
    bg: "bg-pink-50 border-pink-200 dark:bg-pink-950/40 dark:border-pink-800/40",
    requiredReturns: 1,
  },
  {
    id: "good_samaritan",
    icon: Star,
    label: "Good Samaritan",
    description: "5 successful returns",
    color: "text-yellow-500",
    bg: "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/40 dark:border-yellow-800/40",
    requiredReturns: 5,
  },
  {
    id: "community_hero",
    icon: Trophy,
    label: "Community Hero",
    description: "10 successful returns",
    color: "text-orange-500",
    bg: "bg-orange-50 border-orange-200 dark:bg-orange-950/40 dark:border-orange-800/40",
    requiredReturns: 10,
  },
  {
    id: "guardian",
    icon: Shield,
    label: "Guardian",
    description: "25 successful returns",
    color: "text-blue-500",
    bg: "bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800/40",
    requiredReturns: 25,
  },
  {
    id: "legend",
    icon: Zap,
    label: "FindIt Legend",
    description: "50 successful returns",
    color: "text-purple-500",
    bg: "bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:border-purple-800/40",
    requiredReturns: 50,
  },
];

function getReputationLevel(returns) {
  if (returns >= 50) return { label: "Legend", color: "text-purple-600", next: null };
  if (returns >= 25) return { label: "Guardian", color: "text-blue-600", next: 50 };
  if (returns >= 10) return { label: "Hero", color: "text-orange-600", next: 25 };
  if (returns >= 5)  return { label: "Samaritan", color: "text-yellow-600", next: 10 };
  if (returns >= 1)  return { label: "Helper", color: "text-pink-600", next: 5 };
  return { label: "Newcomer", color: "text-muted-foreground", next: 1 };
}

// Trusted User = resolved >= 3 items
export function isTrustedUser(items) {
  return items.filter((i) => i.status === "resolved").length >= 3;
}

export function TrustedUserBadge({ className }) {
  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full",
      "bg-primary/10 border border-primary/25 text-primary",
      className
    )}>
      <BadgeCheck className="w-4 h-4" />
      <span className="text-xs font-bold tracking-wide">Trusted User</span>
    </div>
  );
}

export default function ReputationDashboard({ items }) {
  const successfulReturns = useMemo(
    () => items.filter((i) => i.status === "resolved").length,
    [items]
  );

  const trusted = isTrustedUser(items);
  const level = getReputationLevel(successfulReturns);
  const earnedBadges = BADGES.filter((b) => successfulReturns >= b.requiredReturns);
  const nextBadge = BADGES.find((b) => successfulReturns < b.requiredReturns);
  const progressToNext = nextBadge
    ? Math.round((successfulReturns / nextBadge.requiredReturns) * 100)
    : 100;

  return (
    <div className="space-y-4">
      {/* Trusted User Banner */}
      {trusted && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-primary/8 border border-primary/20">
          <BadgeCheck className="w-6 h-6 text-primary flex-shrink-0" />
          <div>
            <p className="font-heading font-bold text-sm text-primary">Trusted User</p>
            <p className="text-xs text-muted-foreground">You've earned the community's trust through verified returns.</p>
          </div>
        </div>
      )}

      {/* Reputation Header */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            <h3 className="font-heading font-bold text-base">Reputation</h3>
          </div>
          <span className={cn("text-sm font-semibold", level.color)}>{level.label}</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-3xl font-heading font-bold text-foreground">{successfulReturns}</p>
            <p className="text-xs text-muted-foreground">Successful Returns</p>
          </div>
          <div className="flex-1">
            {level.next ? (
              <>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{successfulReturns} returns</span>
                  <span>{level.next} for next badge</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-700"
                    style={{ width: `${progressToNext}%` }}
                  />
                </div>
              </>
            ) : (
              <div className="h-2 bg-primary rounded-full" />
            )}
            {nextBadge && (
              <p className="text-xs text-muted-foreground mt-1.5">
                {nextBadge.requiredReturns - successfulReturns} more to earn{" "}
                <span className="font-medium text-foreground">{nextBadge.label}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Badges */}
      <div>
        <h3 className="font-heading font-semibold text-sm text-muted-foreground mb-2 px-0.5">Badges</h3>
        <div className="grid grid-cols-3 gap-2">
          {BADGES.map((badge) => {
            const earned = successfulReturns >= badge.requiredReturns;
            const Icon = badge.icon;
            return (
              <div
                key={badge.id}
                className={cn(
                  "rounded-2xl border p-3 text-center transition-all",
                  earned ? badge.bg : "bg-secondary/40 border-border opacity-50 grayscale"
                )}
              >
                <Icon className={cn("w-6 h-6 mx-auto mb-1.5", earned ? badge.color : "text-muted-foreground")} />
                <p className="text-[11px] font-semibold leading-tight">{badge.label}</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">{badge.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}