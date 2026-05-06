/**
 * A mobile-friendly bottom-sheet replacement for Select on small screens.
 * Falls back to a standard <select> trigger look.
 */
import { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DrawerSelect({ value, onValueChange, placeholder, options, label }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "w-full h-11 rounded-xl border border-input bg-transparent px-3 flex items-center justify-between",
          "text-sm shadow-sm transition-colors select-none",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          !selected && "text-muted-foreground"
        )}
      >
        <span>{selected ? selected.label : placeholder}</span>
        <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      </button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader className="pb-2">
            <DrawerTitle className="font-heading text-base">{label}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 space-y-1 overflow-y-auto max-h-[60vh]">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onValueChange(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors select-none",
                  value === opt.value
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted/60 text-foreground active:bg-muted"
                )}
              >
                <span>{opt.label}</span>
                {value === opt.value && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}