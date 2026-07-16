// @ts-nocheck

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase-client";
import { getMyRewards } from "@/lib/rewards";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { LogOut, User, Package, Loader2, Trash2, Trophy, ChevronRight } from "lucide-react";

import ReputationDashboard, {
  isTrustedUser,
  TrustedUserBadge,
} from "@/components/profile/ReputationDashboard";

export default function Profile() {
  /* 🔥 USER */
  const { data: currentUser, isLoading: loadingUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return null;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      return {
        ...user,
        ...(profile || {}),
      };
    },
  });

  /* 🏆 REWARDS */
  const { data: rewards } = useQuery({
    queryKey: ["my-rewards"],
    queryFn: getMyRewards,
    enabled: !!currentUser?.id,
  });

  /* 📦 USER ITEMS */
  const { data: items = [], isLoading: loadingItems } = useQuery({
    queryKey: ["my-items", currentUser?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_date", { ascending: false });

      if (error) throw error;

      return data || [];
    },
    enabled: !!currentUser?.id,
  });

  /* 🚪 LOGOUT */
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  /* 🧨 DELETE ACCOUNT (basic) */
  const deleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account?")) return;

    await supabase.auth.signOut();
    window.location.href = "/signup";
  };

  /* FILTERS */
  const lostItems = items.filter((i) => i.type === "lost");
  const foundItems = items.filter((i) => i.type === "found");
  const activeItems = items.filter((i) => i.status === "active");
  const resolvedItems = items.filter((i) => i.status === "resolved");

  /* ⏳ LOADING */
  if (loadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  /* ❌ NOT LOGGED IN */
  if (!currentUser) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Not logged in
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">

      {/* HEADER */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-4">

          <div className="w-14 h-14 rounded-2xl bg-primary/10 border flex items-center justify-center">
            <User className="w-7 h-7 text-primary" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold">
                {currentUser.username ||
                  currentUser.user_metadata?.username ||
                  "User"}
              </h1>

              {isTrustedUser(items) && <TrustedUserBadge />}
            </div>

            <p className="text-xs text-muted-foreground">
              {currentUser.email}
            </p>
          </div>

        </div>
      </div>

      {/* REWARDS */}
      <div className="px-4 mb-4">
        <Link
          to="/rewards"
          className="flex items-center gap-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-2xl p-4"
        >
          <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center shrink-0">
            <Trophy size={18} className="text-amber-300" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Community Rewards</p>
            <p className="text-xs text-primary-foreground/80">
              {rewards ? `${rewards.points} points earned` : "Earn points, make a difference"}
            </p>
          </div>
          <ChevronRight size={18} className="text-primary-foreground/70 shrink-0" />
        </Link>
      </div>

      {/* STATS */}
      <div className="px-4 flex gap-2">
        <Stat label="Posts" value={items.length} />
        <Stat label="Lost" value={lostItems.length} color="text-red-600" />
        <Stat label="Found" value={foundItems.length} color="text-emerald-600" />
      </div>

      <div className="px-4 flex gap-2 mt-2">
        <Stat label="Active" value={activeItems.length} color="text-blue-600" />
        <Stat label="Resolved" value={resolvedItems.length} color="text-green-600" />
      </div>

      {/* REPUTATION */}
      <div className="px-4 mt-4">
        <ReputationDashboard items={items} />
      </div>

      {/* ITEMS */}
      <div className="px-4 mt-4">

        <Tabs defaultValue="all">

          <TabsList className="w-full">
            <TabsTrigger value="all">All ({items.length})</TabsTrigger>
            <TabsTrigger value="lost">Lost ({lostItems.length})</TabsTrigger>
            <TabsTrigger value="found">Found ({foundItems.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <ItemGrid items={items} loading={loadingItems} />
          </TabsContent>

          <TabsContent value="lost">
            <ItemGrid items={lostItems} loading={loadingItems} />
          </TabsContent>

          <TabsContent value="found">
            <ItemGrid items={foundItems} loading={loadingItems} />
          </TabsContent>

        </Tabs>

      </div>

      {/* ACTIONS */}
      <div className="px-4 mt-6 space-y-3">

        <Button onClick={handleLogout} className="w-full">
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>

        <Button
          onClick={deleteAccount}
          variant="destructive"
          className="w-full"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Account
        </Button>

      </div>
    </div>
  );
}

/* 🔹 STAT */
function Stat({ label, value, color = "" }) {
  return (
    <div className="flex-1 p-3 border rounded-xl text-center bg-card">
      <p className={`font-bold ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

/* 🔥 FIXED ITEM GRID (MATCHES HOME) */
function ItemGrid({ items, loading }) {

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <Package className="mx-auto mb-2" />
        No items yet
      </div>
    );
  }

  return (
    <div className="grid gap-3 mt-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-card border border-border rounded-2xl p-4"
        >
          <div className="flex gap-4 items-start">

            {item.image_url && (
              <img
                src={item.image_url}
                alt={item.title}
                className="w-24 h-24 object-cover rounded-xl border"
              />
            )}

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">
                {item.title}
              </h3>

              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {item.description}
              </p>

              <div className="flex flex-wrap gap-2 mt-3 text-[11px] text-muted-foreground">

                <span className="px-2 py-1 bg-muted rounded-full">
                  {item.type}
                </span>

                {item.category && (
                  <span className="px-2 py-1 bg-muted rounded-full">
                    🏷 {item.category}
                  </span>
                )}

                {item.location_name && (
                  <span className="px-2 py-1 bg-muted rounded-full">
                    📍 {item.location_name}
                  </span>
                )}

              </div>
            </div>

          </div>
        </div>
      ))}
    </div>
  );
}