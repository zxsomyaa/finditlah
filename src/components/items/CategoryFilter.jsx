import { cn } from "@/lib/utils";
import { Smartphone, Wallet, Key, ShoppingBag, Shirt, Gem, FileText, Dog, LayoutGrid, Package } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const categories = [
  { value: "all",          label: "All",         icon: LayoutGrid },
  { value: "electronics",  label: "Electronics", icon: Smartphone },
  { value: "wallet_cards", label: "Wallet",      icon: Wallet },
  { value: "keys",         label: "Keys",        icon: Key },
  { value: "bags",         label: "Bags",        icon: ShoppingBag },
  { value: "clothing",     label: "Clothing",    icon: Shirt },
  { value: "jewelry",      label: "Jewelry",     icon: Gem },
  { value: "documents",    label: "Docs",        icon: FileText },
  { value: "pets",         label: "Pets",        icon: Dog },
  { value: "others",       label: "Others",      icon: Package },
];

export default function CategoryFilter({ selected, onSelect }) {
  return (
    <ScrollArea className="w-full">
      <div className="flex gap-2 px-4 pb-2">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = selected === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => onSelect(cat.value)}
              className={cn(
                "flex flex-col items-center gap-1 px-2.5 py-2 rounded-xl border transition-all duration-200 whitespace-nowrap flex-shrink-0 min-w-[52px] active:scale-95 select-none",
                isActive
                  ? "bg-primary/12 border-primary/25 text-primary shadow-sm shadow-primary/10"
                  : "bg-card/60 text-muted-foreground border-border/40 hover:text-foreground hover:border-border/70"
              )}
            >
              <Icon className="w-3.5 h-3.5" strokeWidth={isActive ? 2.5 : 1.7} />
              <span className="text-[9px] font-semibold tracking-wide">{cat.label}</span>
            </button>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" className="h-0" />
    </ScrollArea>
  );
}