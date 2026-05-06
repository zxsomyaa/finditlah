import { Link } from "react-router-dom";
import { MapPin, ArrowRight, Sparkles, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

function MatchPercentageBadge({ percentage }) {
  const color =
    percentage >= 80
      ? "bg-emerald-500/20 border-emerald-400/30 text-emerald-300"
      : percentage >= 60
      ? "bg-amber-500/20 border-amber-400/30 text-amber-300"
      : "bg-blue-500/20 border-blue-400/30 text-blue-300";

  return (
    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", color)}>
      {percentage}% match
    </span>
  );
}

export default function MatchCard({ match, score, percentage }) {
  const isLost = match.type === "lost";
  const pct = percentage ?? Math.min(Math.round(score), 100);

  return (
    <Link to={`/item/${match.id}`} className="block">
      <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/15 hover:bg-primary/10 transition-colors">
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted flex-shrink-0">
          {match.image_urls?.length > 0 ? (
            <img src={match.image_urls[0]} alt={match.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg">📦</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={cn(
              "text-[9px] font-bold px-1.5 py-0.5 rounded-full",
              isLost ? "bg-red-500/20 text-red-300" : "bg-emerald-500/20 text-emerald-300"
            )}>
              {isLost ? "LOST" : "FOUND"}
            </span>
            <MatchPercentageBadge percentage={pct} />
            <div className="flex items-center gap-0.5 text-primary">
              <Brain className="w-2.5 h-2.5" />
              <span className="text-[9px] font-semibold">AI Match</span>
            </div>
          </div>
          <h4 className="font-semibold text-sm mt-1 line-clamp-1">{match.title}</h4>
          {match.location_name && (
            <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
              <MapPin className="w-3 h-3" />
              <span className="text-xs line-clamp-1">{match.location_name}</span>
            </div>
          )}
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      </div>
    </Link>
  );
}