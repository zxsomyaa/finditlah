import { Link } from "react-router-dom";
import { MapPin, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const categoryLabels = {
  electronics: "Electronics",
  wallet_cards: "Wallet",
  keys: "Keys",
  bags: "Bags",
  clothing: "Clothing",
  jewelry: "Jewelry",
  documents: "Docs",
  pets: "Pets",
  others: "Others",
};

function timeAgo(dateStr) {
  if (!dateStr) return null;
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return null;
  }
}

export default function ItemCard({ item }) {
  const isLost = item.type === "lost";
  const dateLabel = timeAgo(item.date_lost_found || item.created_date);

  return (
    <Link to={`/item/${item.id}`} className="block group select-none">
      <div className="bg-card rounded-3xl overflow-hidden border border-border/40 hover:-translate-y-0.5 hover:border-border/70 transition-all duration-300">
        
        {/* Image */}
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          {item.image_urls?.length > 0 ? (
            <img
              src={item.image_urls[0]}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-3xl opacity-30">📦</span>
            </div>
          )}

          {/* Bottom gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

          {/* Type badge — glassy */}
          <span className={cn(
            "absolute top-2.5 left-2.5 text-[9px] font-bold tracking-widest px-2 py-[3px] rounded-full backdrop-blur-md border",
            isLost
              ? "bg-red-500/20 border-red-400/30 text-red-300"
              : "bg-emerald-500/20 border-emerald-400/30 text-emerald-300"
          )}>
            {isLost ? "LOST" : "FOUND"}
          </span>

          {/* Status badge */}
          {item.status === "matched" && (
            <span className="absolute top-2.5 right-2.5 text-[9px] font-bold px-2 py-[3px] rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 backdrop-blur-md">
              Matched
            </span>
          )}
          {item.status === "resolved" && (
            <span className="absolute top-2.5 right-2.5 text-[9px] font-bold px-2 py-[3px] rounded-full bg-emerald-400/20 border border-emerald-400/30 text-emerald-300 backdrop-blur-md">
              Resolved
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-3.5 pt-3">
          <h3 className="font-heading font-bold text-[13px] leading-snug line-clamp-1 text-foreground mb-2">
            {item.title}
          </h3>

          <span className="inline-block text-[9px] font-semibold tracking-wider uppercase px-2 py-[3px] rounded-full bg-muted/60 text-muted-foreground border border-border/40">
            {categoryLabels[item.category] || item.category}
          </span>

          <div className="mt-2.5 space-y-1">
            {item.location_name && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="w-2.5 h-2.5 flex-shrink-0" strokeWidth={1.8} />
                <span className="text-[11px] line-clamp-1">{item.location_name}</span>
              </div>
            )}
            {dateLabel && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="w-2.5 h-2.5 flex-shrink-0" strokeWidth={1.8} />
                <span className="text-[11px]">{dateLabel}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}