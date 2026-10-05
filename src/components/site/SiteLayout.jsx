import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Search, Tag, Plus, Home, Shirt, User, MessageCircle, Gift, LogOut, Receipt, ChevronDown } from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import { useSite, bandClass } from "@/lib/SiteContext";
import HelpSheets from "./HelpSheets";

/** @param {any} user */
const initialOf = (user) =>
  (user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || "?").charAt(0).toUpperCase();

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 text-[21px] font-extrabold tracking-tight">
      <img src="/assets/logo.svg" alt="" className="h-8 w-8" width="32" height="32" />
      FindItLah
    </Link>
  );
}

function PostMenu() {
  const navigate = useNavigate();
  const { openHelp } = useSite();
  /** @param {any} props */
  const Row = ({ icon: Icon, tone, title, sub, to }) => (
    <DropdownMenuItem onSelect={() => navigate(to)} className="cursor-pointer gap-3 rounded-xl p-2.5">
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", tone === "t" ? "bg-thrift-soft text-thrift" : "bg-lost-soft text-lost")}>
        <Icon size={17} />
      </span>
      <span className="flex flex-col">
        <b className="text-[15px] text-foreground">{title}</b>
        <span className="text-[13px] text-muted-foreground">{sub}</span>
      </span>
    </DropdownMenuItem>
  );
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="ml-1 inline-flex h-11 items-center gap-1.5 rounded-xl bg-ink px-4 text-[15px] font-bold text-white transition hover:opacity-90">
          <Plus size={17} strokeWidth={2.6} /> Post
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={10} className="w-[290px] rounded-2xl p-2 font-body">
        <Row icon={Check} tone="l" title="I found something" sub="Help it get home" to="/post?type=found" />
        <Row icon={Search} tone="l" title="I lost something" sub="Post a report" to="/post?type=lost" />
        <Row icon={Tag} tone="t" title="Sell something" sub="Clothes and small items" to="/sell" />
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => openHelp("post")} className="cursor-pointer justify-between rounded-xl p-2.5 font-bold">
          Learn more about posting <span aria-hidden="true">→</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AccountMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) {
    return (
      <NavLink to="/login" className={({ isActive }) => cn("hidden rounded-xl px-3 py-2.5 font-semibold sm:inline-flex", isActive ? "bg-black/5" : "hover:bg-black/5")}>
        Log in
      </NavLink>
    );
  }
  /** @param {any} props */
  const Item = ({ icon: Icon, label, to }) => (
    <DropdownMenuItem onSelect={() => navigate(to)} className="cursor-pointer gap-2.5 rounded-lg p-2.5 text-[15px]">
      <Icon size={17} /> {label}
    </DropdownMenuItem>
  );
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="inline-flex items-center gap-1.5 rounded-xl px-2 py-2 font-semibold hover:bg-black/5" aria-label="Account menu">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-sm font-extrabold text-white">{initialOf(user)}</span>
          <ChevronDown size={16} className="hidden sm:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-56 rounded-2xl p-2 font-body">
        <Item icon={User} label="Profile" to="/profile" />
        <Item icon={Receipt} label="My thrift & orders" to="/orders" />
        <Item icon={MessageCircle} label="Chats" to="/chats" />
        <Item icon={Gift} label="Rewards" to="/rewards" />
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={async () => { await logout(); navigate("/"); }}
          className="cursor-pointer gap-2.5 rounded-lg p-2.5 text-[15px]"
        >
          <LogOut size={17} /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SiteHeader() {
  const { mode } = useSite();
  const { user } = useAuth();
  /** @param {{isActive:boolean}} a */
  const link = ({ isActive }) => cn("rounded-xl px-3 py-2.5 font-semibold transition", isActive ? "bg-black/[0.06]" : "hover:bg-black/5");
  return (
    <header className={cn(bandClass(mode), "transition-colors duration-500")} style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-8">
        <Logo />
        <nav aria-label="Main" className="flex items-center gap-1">
          <NavLink to="/lost" className={(a) => cn(link(a), "hidden md:inline-flex")}>Lost &amp; Found</NavLink>
          <NavLink to="/thrift" className={(a) => cn(link(a), "hidden md:inline-flex")}>Thrift</NavLink>
          <NavLink to="/map" className={(a) => cn(link(a), "hidden lg:inline-flex")}>Map</NavLink>
          {user && <NavLink to="/chats" className={(a) => cn(link(a), "hidden md:inline-flex")}>Chats</NavLink>}
          <AccountMenu />
          <PostMenu />
        </nav>
      </div>
    </header>
  );
}

function SiteFooter() {
  const { openHelp } = useSite();
  const linkCls = "block py-1 text-left text-sm text-muted-foreground hover:text-foreground";
  return (
    <footer className="mt-auto border-t border-border bg-muted/60">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-9 text-sm sm:px-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="col-span-2 md:col-span-1">
          <Logo />
          <p className="mt-2 max-w-[34ch] leading-relaxed text-muted-foreground">Lost &amp; found and preloved thrift for Singapore.</p>
          <a href="https://instagram.com/finditlah" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block font-semibold text-foreground underline underline-offset-4">
            @finditlah on Instagram
          </a>
        </div>
        <div>
          <b className="mb-2 block text-foreground">Use it</b>
          <Link to="/lost" className={linkCls}>Lost &amp; Found</Link>
          <Link to="/thrift" className={linkCls}>Thrift</Link>
          <Link to="/map" className={linkCls}>Map</Link>
        </div>
        <div>
          <b className="mb-2 block text-foreground">Help</b>
          <button onClick={() => openHelp("thrift")} className={linkCls}>How thrift works</button>
          <button onClick={() => openHelp("post")} className={linkCls}>Posting guide</button>
          <button onClick={() => openHelp("safety")} className={linkCls}>Safety tips</button>
        </div>
        <div>
          <b className="mb-2 block text-foreground">Account</b>
          <Link to="/profile" className={linkCls}>Profile</Link>
          <Link to="/orders" className={linkCls}>My thrift &amp; orders</Link>
          <Link to="/rewards" className={linkCls}>Rewards</Link>
        </div>
      </div>
    </footer>
  );
}

function MobileTabBar() {
  const location = useLocation();
  const { user } = useAuth();
  const items = [
    { to: "/", icon: Home, label: "Home", exact: true },
    { to: "/lost", icon: Search, label: "Lost & Found" },
    { to: "/post", icon: Plus, label: "Post", action: true },
    { to: "/thrift", icon: Shirt, label: "Thrift" },
    { to: user ? "/profile" : "/login", icon: User, label: user ? "Me" : "Log in" },
  ];
  return (
    <nav aria-label="Quick links" className="fixed inset-x-0 bottom-0 z-40 flex justify-center md:hidden" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}>
      <div className="flex items-center gap-0.5 rounded-[1.6rem] border border-border bg-card/90 px-2 py-1.5 shadow-xl shadow-black/10 backdrop-blur-xl">
        {items.map((it) => {
          const Icon = it.icon;
          const active = it.exact ? location.pathname === it.to : location.pathname.startsWith(it.to);
          if (it.action) {
            return (
              <Link key={it.to} to={it.to} aria-label="Post" className="mx-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-white">
                <Icon size={20} strokeWidth={2.6} />
              </Link>
            );
          }
          return (
            <Link key={it.to} to={it.to} className={cn("flex min-h-[44px] min-w-[52px] flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-1.5 text-[10px] font-semibold", active ? "text-ink" : "text-muted-foreground")}>
              <Icon size={19} strokeWidth={active ? 2.5 : 1.8} />
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function SiteLayout() {
  const location = useLocation();
  const hideFooter = location.pathname.startsWith("/chat/");
  return (
    <div className="flex min-h-screen flex-col bg-background font-body text-foreground">
      <SiteHeader />
      <main className="flex-1 pb-28 md:pb-0">
        <motion.div key={location.pathname} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <Outlet />
        </motion.div>
      </main>
      {!hideFooter && <SiteFooter />}
      <MobileTabBar />
      <HelpSheets />
    </div>
  );
}

