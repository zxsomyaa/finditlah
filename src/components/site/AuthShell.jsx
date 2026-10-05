import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { usePageMode } from "@/lib/SiteContext";
import { ItemArt, Pill, Container } from "./parts";

const SAMPLES = [
  { kind: "l", category: "wallet", title: "Black leather wallet", sub: "Found · Woodlands MRT" },
  { kind: "t", category: "tops", title: "Denim jacket · $18", sub: "Thrift · Tampines" },
  { kind: "l", category: "headphones", title: "AirPods Pro", sub: "Found · Bus 190" },
];

/** Two-panel card used by the Log in and Sign up pages. @param {{ children: any }} props */
export default function AuthShell({ children }) {
  usePageMode("l");
  return (
    <Container className="py-6 pb-16">
      <div className="mx-auto grid max-w-[1000px] overflow-hidden rounded-[30px] border border-border bg-card md:grid-cols-2">
        <div className="hidden flex-col justify-between gap-8 bg-[linear-gradient(160deg,#F2EEE6_0_50%,#FCF2F1_50%_100%)] p-10 md:flex">
          <h2 className="text-[34px] font-extrabold leading-[1.05] tracking-tight">Lost it? Find it.<br />Love it? Thrift it.</h2>
          <div className="flex flex-col gap-3">
            {SAMPLES.map((s) => (
              <div key={s.title} className="flex items-center gap-3.5 rounded-[20px] bg-white py-2.5 pl-2.5 pr-5 shadow-[0_14px_30px_-20px_rgba(36,33,28,.45)]">
                <ItemArt category={s.category} kind={/** @type {"l"|"t"} */ (s.kind)} className="h-16 w-16 shrink-0 rounded-2xl" iconSize={28} />
                <span className="flex flex-col items-start gap-1">
                  <Pill tone={s.kind === "t" ? "thrift" : "found"}>{s.kind === "t" ? "Thrift" : "Found"}</Pill>
                  <b>{s.title}</b>
                  <span className="text-[13px] text-muted-foreground">{s.sub}</span>
                </span>
              </div>
            ))}
          </div>
          <p className="text-sm">You can browse without an account. Sign in to post, chat or buy.</p>
        </div>
        <div className="p-6 sm:p-11">{children}</div>
      </div>
    </Container>
  );
}

/** @param {{ returnTo?: string, label?: string }} props */
export function GoogleButton({ returnTo = "/", label = "Continue with Google" }) {
  const { loginWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setError("");
          setBusy(true);
          try {
            await loginWithGoogle(returnTo);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Google sign-in isn't available right now.");
            setBusy(false);
          }
        }}
        className="flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-card font-bold transition hover:border-ink/40 disabled:opacity-60"
      >
        {busy ? <Loader2 size={18} className="animate-spin" /> : (
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z" />
            <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z" />
            <path fill="#FBBC05" d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2z" />
            <path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.4L6.4 10c.8-2.4 3-4.1 5.6-4.1z" />
          </svg>
        )}
        {label}
      </button>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export function OrDivider({ text = "or with email" }) {
  return (
    <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
      <span className="h-px flex-1 bg-border" />{text}<span className="h-px flex-1 bg-border" />
    </div>
  );
}
