import { Link, useLocation } from "react-router-dom";
import { Home, Map, Plus, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLastTabPath, useRecordTabPath } from "@/lib/TabNavigationContext";

const navItems = [
  { root: "/",        icon: Home,          label: "Home" },
  { root: "/map",     icon: Map,           label: "Map" },
  { root: "/post",    icon: Plus,          label: "Post", isAction: true },
  { root: "/chats",   icon: MessageCircle, label: "Chats" },
  { root: "/profile", icon: User,          label: "Me" },
];

function NavItem({ item, isActive }) {
  const lastPath = useLastTabPath(item.root);
  const Icon = item.icon;

  if (item.isAction) {
    return (
      <Link
        to={item.root}
        className="mx-1.5 flex items-center justify-center w-11 h-11 rounded-2xl active:scale-90 transition-transform shadow-lg shadow-primary/40"
        style={{ background: "linear-gradient(135deg, hsl(222 68% 68%), hsl(222 68% 52%))" }}
      >
        <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
      </Link>
    );
  }

  return (
    <Link
      to={lastPath}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] px-3 py-2 rounded-2xl transition-all duration-200 active:scale-90 relative",
        isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.5 : 1.8} />
      <span className="text-[9px] font-semibold tracking-wide">{item.label}</span>
      {isActive && (
        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
      )}
    </Link>
  );
}

export default function MobileNav() {
  const location = useLocation();
  // Record current path for the active tab on every render
  useRecordTabPath();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center"
      style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="flex items-center gap-0.5 px-2 py-1.5 rounded-[1.75rem] bg-card/75 backdrop-blur-2xl border border-border/50 shadow-xl shadow-black/30">
        {navItems.map((item) => {
          const isActive = item.root === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(item.root);

          return <NavItem key={item.root} item={item} isActive={isActive} />;
        })}
      </div>
    </nav>
  );
}