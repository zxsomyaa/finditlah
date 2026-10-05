import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { MessageCircle, CreditCard, Handshake, Check, Search, Tag, MapPin, ShieldCheck } from "lucide-react";
import { useSite } from "@/lib/SiteContext";
import { THRIFT_CATEGORIES } from "@/lib/categories";
import { ItemArt, Pill } from "./parts";

/** @param {{ icon: any, tone: "l"|"t"|"ok", title: string, children: any }} props */
function Step({ icon: Icon, tone, title, children }) {
  const cls = tone === "t" ? "bg-thrift-soft text-thrift" : tone === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-lost-soft text-lost";
  return (
    <div className="grid grid-cols-[40px_1fr] items-start gap-3 rounded-2xl border border-border bg-card p-4">
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${cls}`}><Icon size={18} /></span>
      <span>
        <b className="text-foreground">{title}</b>
        <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{children}</p>
      </span>
    </div>
  );
}

export default function HelpSheets() {
  const { help, closeHelp } = useSite();
  const navigate = useNavigate();
  /** @param {string} to */
  const go = (to) => { closeHelp(); navigate(to); };

  return (
    <Sheet open={!!help} onOpenChange={(o) => !o && closeHelp()}>
      <SheetContent side="right" className="w-full overflow-y-auto bg-background font-body sm:max-w-[520px]">
        {help === "thrift" && (
          <div className="flex flex-col gap-5 pt-2">
            <Pill tone="thrift" className="self-start">Thrift</Pill>
            <SheetHeader className="text-left">
              <SheetTitle className="text-3xl font-extrabold tracking-tight">How thrift works</SheetTitle>
              <SheetDescription className="text-base leading-relaxed">
                Buy and sell preloved clothes and small items with people nearby. Chat in the app, agree on a price, then meet up or arrange postage.
              </SheetDescription>
            </SheetHeader>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">What you can sell</span>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {THRIFT_CATEGORIES.filter((c) => c.value !== "others").slice(0, 6).map((c) => (
                  <div key={c.value} className="flex flex-col items-center gap-1.5 rounded-xl border border-border p-2 text-center text-xs font-bold">
                    <ItemArt category={c.value} kind="t" className="h-14 w-full rounded-lg" iconSize={24} />
                    {c.label}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Step icon={MessageCircle} tone="t" title="Chat in the app">Ask questions, see more photos and agree on a price. Your number stays private.</Step>
              <Step icon={CreditCard} tone="t" title="Agree on price and payment">Sort out the price and how to pay with the seller in chat. Only pay once you&apos;ve seen the item.</Step>
              <Step icon={Handshake} tone="t" title="Meet up or get it mailed">Pick a public spot like an MRT station, or ask the seller to post it to you.</Step>
            </div>
            <div className="rounded-2xl bg-thrift-soft p-4 text-sm leading-relaxed">
              <b className="text-thrift">Not allowed:</b> large furniture, food, counterfeit goods, and anything unsafe or illegal.
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button onClick={() => go("/thrift")} className="rounded-xl bg-thrift px-5 py-3 font-bold text-white">Shop thrift</button>
              <button onClick={() => go("/sell")} className="rounded-xl border border-border bg-card px-5 py-3 font-bold">Sell something</button>
            </div>
          </div>
        )}

        {help === "post" && (
          <div className="flex flex-col gap-5 pt-2">
            <Pill tone="ok" dot={false} className="self-start">Posting</Pill>
            <SheetHeader className="text-left">
              <SheetTitle className="text-3xl font-extrabold tracking-tight">Posting on FindItLah</SheetTitle>
              <SheetDescription className="text-base">There are three kinds of posts. Each takes about a minute.</SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-3">
              <Step icon={Check} tone="l" title="I found something">Add a photo, where you found it and when. The owner can message you in the app.</Step>
              <Step icon={Search} tone="l" title="I lost something">Describe it and roughly where and when, so finders can reach you.</Step>
              <Step icon={Tag} tone="t" title="Sell something">Clothes and small items only. Add photos, a price and the condition.</Step>
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tips for a good post</span>
              <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed text-muted-foreground">
                <li>Use clear photos in good light.</li>
                <li>For found items, keep one detail back so you can check the real owner.</li>
                <li>Meet in public places, like MRT stations or malls.</li>
                <li>Found something valuable? You can also hand it to a police post.</li>
              </ul>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button onClick={() => go("/post?type=found")} className="rounded-xl bg-ink px-5 py-3 font-bold text-white">Start a post</button>
            </div>
          </div>
        )}

        {help === "safety" && (
          <div className="flex flex-col gap-5 pt-2">
            <Pill tone="ok" dot={false} className="self-start">Safety</Pill>
            <SheetHeader className="text-left">
              <SheetTitle className="text-3xl font-extrabold tracking-tight">Staying safe</SheetTitle>
              <SheetDescription className="text-base">A few simple habits keep handovers and trades smooth.</SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-3">
              <Step icon={MessageCircle} tone="ok" title="Keep chats in the app">Your phone number and email stay hidden. Only pay once you have the item in hand.</Step>
              <Step icon={MapPin} tone="ok" title="Meet in public places">MRT stations work well.</Step>
              <Step icon={ShieldCheck} tone="ok" title="Check before you hand over">Ask the owner to describe something only they would know.</Step>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button onClick={closeHelp} className="rounded-xl bg-ink px-5 py-3 font-bold text-white">Got it</button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
