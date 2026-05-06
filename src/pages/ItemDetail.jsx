// @ts-nocheck

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase-client";
import { db } from "@/lib/db";

import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  MapPin,
  MessageCircle,
  CheckCircle,
  Loader2,
  Brain,
  ArrowRight,
} from "lucide-react";

const categoryLabels = {
  general: "General",
  electronics: "Electronics",
  wallet: "Wallet",
  keys: "Keys",
  bags: "Bags",
  documents: "Documents",
  jewellery: "Jewellery",
  clothing: "Clothing",
  phone: "Phone",
  laptop: "Laptop",
  watch: "Watch",
  "id card": "ID Card",
  passport: "Passport",
  "student card": "Student Card",
  books: "Books",
  "water bottle": "Water Bottle",
  umbrella: "Umbrella",
  accessories: "Accessories",
  "sports items": "Sports Items",
  headphones: "Headphones",
  charger: "Charger",
  others: "Others",
};

function calculateMatchScore(currentItem, otherItem) {
  let score = 0;

  const currentText = `
    ${currentItem.title || ""}
    ${currentItem.description || ""}
    ${currentItem.category || ""}
  `.toLowerCase();

  const otherText = `
    ${otherItem.title || ""}
    ${otherItem.description || ""}
    ${otherItem.category || ""}
  `.toLowerCase();

  const words = currentText
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2);

  const uniqueWords = [...new Set(words)];

  uniqueWords.forEach((word) => {
    if (otherText.includes(word)) {
      score += 12;
    }
  });

  if (currentItem.category && currentItem.category === otherItem.category) {
    score += 35;
  }

  if (
    currentItem.location_name &&
    otherItem.location_name &&
    currentItem.location_name.toLowerCase() ===
      otherItem.location_name.toLowerCase()
  ) {
    score += 20;
  }

  if (
    currentItem.type &&
    otherItem.type &&
    currentItem.type !== otherItem.type
  ) {
    score += 15;
  }

  return Math.min(score, 100);
}

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: item, isLoading } = useQuery({
    queryKey: ["item", id],
    queryFn: () => db.entities.Item.getById(id),
    enabled: !!id,
  });

  const { data: allItems = [] } = useQuery({
    queryKey: ["items-all"],
    queryFn: () => db.entities.Item.list({ onlyActive: true }),
  });

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      return user;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates) => {
      return await db.entities.Item.update(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["item", id] });
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["items-all"] });
      navigate("/");
    },
    onError: (err) => {
      console.error(err);
      alert(err.message || "Failed to update item");
    },
  });

  const startChat = async () => {
    if (!currentUser || !item) {
      alert("Please login first");
      return;
    }

    if (!item.user_id) {
      alert("This post does not have an owner.");
      return;
    }

    if (currentUser.id === item.user_id) {
      alert("You cannot chat with yourself");
      return;
    }

    const participants = [currentUser.id, item.user_id].sort();

    try {
      const { data: existing, error: existingError } = await supabase
        .from("conversations")
        .select("*")
        .eq("item_id", item.id)
        .contains("participants", participants)
        .maybeSingle();

      if (existingError) throw existingError;

      if (existing) {
        navigate(`/chat/${existing.id}`);
        return;
      }

      const { data: conversation, error } = await supabase
        .from("conversations")
        .insert([
          {
            item_id: item.id,
            item_title: item.title,
            participants,
            last_message: "",
            last_message_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      navigate(`/chat/${conversation.id}`);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to start chat");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-background">
        <p className="text-foreground">Item not found</p>
        <Button onClick={() => navigate("/")}>Go Home</Button>
      </div>
    );
  }

  const isOwner = currentUser?.id === item.user_id;

  const matches = allItems
    .filter((other) => other.id !== item.id)
    .filter((other) => other.type !== item.type)
    .map((other) => ({
      item: other,
      score: calculateMatchScore(item, other),
    }))
    .filter((match) => match.score >= 25)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="sticky top-0 z-20 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-foreground">
          <ArrowLeft />
        </button>

        <h1 className="font-bold text-xl flex-1 text-foreground">
          Item Details
        </h1>

        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            item.status === "resolved"
              ? "bg-green-500/10 text-green-600"
              : "bg-blue-500/10 text-blue-600"
          }`}
        >
          {item.status || "active"}
        </span>
      </div>

      <div className="p-4 space-y-5">
        {item.image_url && (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full max-h-80 object-contain rounded-2xl bg-muted border border-border"
          />
        )}

        <div>
          <div
            className={`inline-flex mb-2 px-2 py-1 rounded-full text-xs font-semibold ${
              item.type === "lost"
                ? "bg-red-500/10 text-red-600"
                : "bg-emerald-500/10 text-emerald-600"
            }`}
          >
            {item.type?.toUpperCase()}
          </div>

          <h2 className="text-2xl font-bold text-foreground">{item.title}</h2>

          <p className="text-sm text-muted-foreground mt-1">
            {categoryLabels[item.category] || item.category}
          </p>

          <p className="text-base text-muted-foreground mt-4">
            {item.description}
          </p>

          {item.location_name && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground mt-4">
              <MapPin className="w-4 h-4" />
              {item.location_name}
            </p>
          )}
        </div>

        {!isOwner && item.status !== "resolved" && (
          <Button onClick={startChat} className="w-full">
            <MessageCircle className="mr-2 w-4 h-4" />
            Contact User
          </Button>
        )}

        {isOwner && item.status !== "resolved" && (
          <Button
            variant="outline"
            onClick={() => updateMutation.mutate({ status: "resolved" })}
            disabled={updateMutation.isPending}
            className="w-full"
          >
            {updateMutation.isPending ? (
              <Loader2 className="mr-2 w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 w-4 h-4" />
            )}
            Mark as Resolved
          </Button>
        )}

        <div>
          <h3 className="font-bold text-xl text-foreground mb-3 flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            AI-Matched Items ({matches.length})
          </h3>

          {matches.length === 0 ? (
            <div className="border border-border rounded-2xl p-5 text-center text-muted-foreground">
              No matching items found yet.
            </div>
          ) : (
            <div className="space-y-3">
              {matches.map(({ item: match, score }) => (
                <Link
                  key={match.id}
                  to={`/item/${match.id}`}
                  className="block border border-border bg-card rounded-2xl p-4 hover:bg-muted/50 transition"
                >
                  <div className="flex items-center gap-4">
                    {match.image_url && (
                      <img
                        src={match.image_url}
                        alt={match.title}
                        className="w-20 h-20 object-cover rounded-xl border border-border"
                      />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                            match.type === "lost"
                              ? "bg-red-500/10 text-red-600"
                              : "bg-emerald-500/10 text-emerald-600"
                          }`}
                        >
                          {match.type?.toUpperCase()}
                        </span>

                        <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                          {score}% match
                        </span>

                        <span className="text-[10px] text-primary font-semibold">
                          AI Match
                        </span>
                      </div>

                      <h4 className="font-semibold text-foreground truncate">
                        {match.title}
                      </h4>

                      {match.location_name && (
                        <p className="text-sm text-muted-foreground truncate">
                          {match.location_name}
                        </p>
                      )}
                    </div>

                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}