import { Link, useLocation } from "react-router-dom";
import { Lock, MessageCircle, PlusCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const COPY = {
  details: {
    title: "Create a free account to see the full post",
    body: "Members can see the full description, when it was found and who posted it, and message them directly.",
  },
  listing: {
    title: "Create a free account to see more and buy",
    body: "Members can read the full description, see the seller, chat with them and pay safely in the app.",
  },
  post: {
    title: "Create a free account to post",
    body: "It takes under a minute. Then post a found item, report something lost or sell your preloved pieces.",
  },
  account: {
    title: "Log in or create a free account",
    body: "Your profile, rewards, posts and orders are all in one place once you're a member.",
  },
  chat: {
    title: "Create a free account to chat",
    body: "Your chats with finders, owners and sellers live here, and your contact details stay private.",
  },
};

/**
 * Sign-up prompt shown to visitors who aren't logged in.
 * After signing up or logging in they come straight back to this page.
 * @param {{ reason?: keyof typeof COPY, tone?: "l"|"t", plain?: boolean, className?: string }} props
 */
export default function JoinGate({ reason = "details", tone = "l", plain = false, className }) {
  const location = useLocation();
  const from = location.pathname + location.search;
  const { title, body } = COPY[reason];
  const Icon = reason === "post" ? PlusCircle : reason === "chat" ? MessageCircle : Lock;

  return (
    <div className={cn("flex flex-col gap-4", plain ? "" : cn("rounded-[24px] p-6", tone === "t" ? "bg-blush" : "bg-cream"), className)}>
      <span className={cn("flex h-11 w-11 items-center justify-center rounded-xl", plain ? (tone === "t" ? "bg-blush" : "bg-cream") : "bg-white", tone === "t" ? "text-thrift" : "text-lost")}>
        <Icon size={20} />
      </span>
      <div className="flex flex-col gap-1.5">
        <h2 className="text-xl font-extrabold leading-snug tracking-tight">{title}</h2>
        <p className="text-[15px] leading-relaxed text-muted-foreground">{body}</p>
      </div>
      <Link
        to="/signup"
        state={{ from }}
        className={cn("flex h-12 items-center justify-center rounded-xl font-bold text-white", tone === "t" ? "bg-thrift" : "bg-ink")}
      >
        Create a free account
      </Link>
      <Link to="/login" state={{ from }} className="flex h-12 items-center justify-center rounded-xl border border-border bg-white font-bold">
        I already have an account
      </Link>
      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Sparkles size={13} /> Free, and you earn reward points as you go.
      </p>
    </div>
  );
}

/** Blurred placeholder lines that hint at hidden details. @param {{ lines?: number }} props */
export function HiddenText({ lines = 3 }) {
  return (
    <div aria-hidden="true" className="flex select-none flex-col gap-2 blur-[3px]">
      {Array.from({ length: lines }).map((_, i) => (
        <span key={i} className="h-3.5 rounded-full bg-muted-foreground/25" style={{ width: `${[92, 80, 64, 86][i % 4]}%` }} />
      ))}
    </div>
  );
}
