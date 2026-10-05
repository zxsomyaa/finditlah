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
          <p className="text-sm">Browse freely. Create a free account to see full posts, post, chat or buy.</p>
        </div>
        <div className="p-6 sm:p-11">{children}</div>
      </div>
    </Container>
  );
}
