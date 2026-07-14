import { MapPin, MessageCircle, ShieldCheck } from "lucide-react"

/** @param {{ src: string, alt: string, className?: string, showNotch?: boolean }} props */
function PhoneMockup({ src, alt, className = "", showNotch = true }) {
  return (
    <div className={`absolute w-[220px] rounded-[2.3rem] border-[6px] border-neutral-900 bg-neutral-900 shadow-2xl overflow-hidden ${className}`}>
      {showNotch && (
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-16 h-4 bg-neutral-900 rounded-full z-10" />
      )}
      <img src={src} alt={alt} className="w-full h-auto block" />
    </div>
  )
}

export default function AuthShowcase() {
  return (
    <div className="relative hidden lg:flex flex-col items-center justify-center gap-16 w-1/2 min-h-screen overflow-hidden bg-gradient-to-br from-primary via-primary/85 to-accent px-12 py-14">
      <div className="pointer-events-none absolute -top-20 -right-16 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-black/10 blur-3xl" />

      <div className="relative z-10 w-full flex items-center justify-center mt-6" style={{ height: 460 }}>
        <PhoneMockup
          src="/assets/showcase-post.png"
          alt="FindItLah create post screen for reporting a lost or found item"
          className="-rotate-6 -translate-x-14 -translate-y-2"
          showNotch={false}
        />
        <PhoneMockup
          src="/assets/showcase-home.png"
          alt="FindItLah home feed showing lost and found items"
          className="rotate-6 translate-x-14 translate-y-10 z-20"
          showNotch={false}
        />
      </div>

      <div className="relative z-10 flex items-center gap-6 flex-wrap justify-center text-primary-foreground/90">
        <span className="flex items-center gap-1.5 text-xs font-medium">
          <MapPin size={14} /> Location tagging
        </span>
        <span className="flex items-center gap-1.5 text-xs font-medium">
          <MessageCircle size={14} /> In-app chat
        </span>
        <span className="flex items-center gap-1.5 text-xs font-medium">
          <ShieldCheck size={14} /> Secure sign-in
        </span>
      </div>
    </div>
  )
}
