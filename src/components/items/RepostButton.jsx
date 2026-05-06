
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

// Auto-repost: show button if item is lost + active + last posted/reposted > 3 days ago
function canRepost(item) {
  if (item.type !== "lost" || item.status !== "active") return false;
  const ref = item.last_reposted_at || item.created_date;
  if (!ref) return true;
  const days = (new Date() - new Date(ref)) / (1000 * 60 * 60 * 24);
  return days >= 3;
}

export default function RepostButton({ item, onReposted }) {
  const [loading, setLoading] = useState(false);
  const eligible = canRepost(item);

  const handleRepost = async () => {
    setLoading(true);
    await db.entities.Item.update(item.id, {
      last_reposted_at: new Date().toISOString(),
      repost_count: (item.repost_count || 0) + 1,
      // Bump updated_date by touching status (toggle trick isn't needed — just update)
    });
    setLoading(false);
    toast.success("Post boosted! It's now back at the top of the feed.");
    onReposted?.();
  };

  const lastRef = item.last_reposted_at || item.created_date;
  const daysAgo = lastRef
    ? Math.floor((new Date() - new Date(lastRef)) / (1000 * 60 * 60 * 24))
    : null;
  const nextRepostIn = daysAgo !== null ? Math.max(0, 3 - daysAgo) : 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-primary" />
        <h3 className="font-heading font-semibold text-sm">Boost Visibility</h3>
        {item.repost_count > 0 && (
          <span className="ml-auto text-[10px] text-muted-foreground">
            Reposted {item.repost_count}×
          </span>
        )}
      </div>

      {eligible ? (
        <>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your post hasn't been updated in {daysAgo} day{daysAgo !== 1 ? "s" : ""}. Repost it to move it back to the top of the feed and increase visibility.
          </p>
          <Button
            size="sm"
            onClick={handleRepost}
            disabled={loading}
            className="w-full rounded-xl"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
            Repost & Boost
          </Button>
        </>
      ) : (
        <p className="text-xs text-muted-foreground">
          You can repost again in <span className="font-semibold text-foreground">{nextRepostIn} day{nextRepostIn !== 1 ? "s" : ""}</span>. Reposts are allowed every 3 days.
        </p>
      )}
    </div>
  );
}