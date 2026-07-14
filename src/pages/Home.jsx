import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { db } from "@/lib/db";
import { supabase } from "@/lib/supabase-client";
import {
  Pencil,
  Trash2,
  MessageCircle,
  CheckCircle2,
  Eye,
  Plus,
  MapPin,
  Tag,
  CalendarDays,
  Loader2,
  PackageSearch,
  ImageOff,
} from "lucide-react";

const categories = [
  "all",
  "general",
  "electronics",
  "wallet",
  "keys",
  "bags",
  "documents",
  "jewellery",
  "clothing",
  "phone",
  "laptop",
  "watch",
  "id card",
  "passport",
  "student card",
  "books",
  "water bottle",
  "umbrella",
  "accessories",
  "sports items",
  "headphones",
  "charger",
  "others",
];

export default function Home() {
  const [typeFilter, setTypeFilter] = useState("lost");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentUser, setCurrentUser] = useState(/** @type {any} */ (null));

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  React.useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setCurrentUser(user);
    };

    getUser();
  }, []);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["items"],
    queryFn: () => db.entities.Item.list({ onlyActive: true }),
  });

  /** @param {string} itemId */
  const handleDelete = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      await db.entities.Item.delete(itemId);
      queryClient.invalidateQueries({ queryKey: ["items"] });
    } catch (err) {
      console.error(err);
      alert((err instanceof Error && err.message) || "Failed to delete post");
    }
  };

  /** @param {string} itemId */
  const handleMarkResolved = async (itemId) => {
    if (
      !window.confirm(
        "Mark this post as resolved? It will be removed from the Home Feed."
      )
    )
      return;

    try {
      await db.entities.Item.update(itemId, {
        status: "resolved",
      });

      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["my-items"] });
    } catch (err) {
      console.error(err);
      alert((err instanceof Error && err.message) || "Failed to update status");
    }
  };

  /** @param {any} item */
  const handleStartChat = async (item) => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      alert("Please login first");
      return;
    }

    if (!item.user_id) {
      alert("This post does not have an owner, so chat cannot be started.");
      return;
    }

    if (user.id === item.user_id) {
      alert("You cannot chat with yourself");
      return;
    }

    const participants = [user.id, item.user_id].sort();

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
      alert((err instanceof Error && err.message) || "Failed to start chat");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="animate-spin" size={22} />
        <span className="text-sm">Loading posts...</span>
      </div>
    );
  }

  const filteredItems = items
    .filter((i) => i.type === typeFilter)
    .filter((i) =>
      categoryFilter === "all" ? true : i.category === categoryFilter
    );

  return (
    <div className="min-h-screen bg-background px-4 py-4 pb-28 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">Home Feed</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Lost & Found items near you
          </p>
        </div>

        <Link
          to="/post"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-sm hover:bg-primary/90 transition"
        >
          <Plus size={16} />
          Create
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2 bg-muted rounded-2xl p-1">
        <button
          onClick={() => setTypeFilter("lost")}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition ${
            typeFilter === "lost"
              ? "bg-card text-red-600 shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-red-500" />
          Lost
        </button>

        <button
          onClick={() => setTypeFilter("found")}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition ${
            typeFilter === "found"
              ? "bg-card text-emerald-600 shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Found
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition ${
              categoryFilter === cat
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border"
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center gap-2 text-center mt-16 text-muted-foreground">
          <PackageSearch size={28} className="opacity-60" />
          <p className="text-sm">No {typeFilter} items found</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              currentUser={currentUser}
              onView={() => navigate(`/item/${item.id}`)}
              onDelete={() => handleDelete(item.id)}
              onEdit={() => navigate(`/edit-post/${item.id}`)}
              onResolved={() => handleMarkResolved(item.id)}
              onChat={() => handleStartChat(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * @param {{ item: any, currentUser: any, onView: () => void, onDelete: () => void, onEdit: () => void, onResolved: () => void, onChat: () => void }} props
 */
function ItemCard({
  item,
  currentUser,
  onView,
  onDelete,
  onEdit,
  onResolved,
  onChat,
}) {
  const isOwner = currentUser?.id === item.user_id;

  return (
    <div
      onClick={onView}
      className="bg-card border border-border rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 transition cursor-pointer"
    >
      <div className="flex gap-4 items-start">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-28 h-28 object-cover rounded-xl border border-border shrink-0"
          />
        ) : (
          <div className="w-28 h-28 rounded-xl border border-border bg-muted flex items-center justify-center shrink-0">
            <ImageOff size={22} className="text-muted-foreground/60" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold text-foreground truncate">
              {item.title}
            </h3>

            <span
              className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full font-medium shrink-0 ${
                item.type === "lost"
                  ? "bg-red-500/10 text-red-600"
                  : "bg-emerald-500/10 text-emerald-600"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${item.type === "lost" ? "bg-red-500" : "bg-emerald-500"}`} />
              {item.type}
            </span>
          </div>

          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {item.description}
          </p>

          <div className="flex flex-wrap gap-2 mt-3 text-[11px] text-muted-foreground">
            {item.location_name && (
              <span className="flex items-center gap-1 px-2 py-1 bg-muted rounded-full">
                <MapPin size={11} />
                {item.location_name}
              </span>
            )}

            {item.category && (
              <span className="flex items-center gap-1 px-2 py-1 bg-muted rounded-full">
                <Tag size={11} />
                {item.category}
              </span>
            )}

            {item.date && (
              <span className="flex items-center gap-1 px-2 py-1 bg-muted rounded-full">
                <CalendarDays size={11} />
                {new Date(item.date).toLocaleDateString()}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView();
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted text-foreground text-xs font-medium hover:bg-muted/70 transition"
            >
              <Eye className="w-3.5 h-3.5" />
              View Details
            </button>

            {isOwner ? (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted text-foreground text-xs font-medium hover:bg-muted/70 transition"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-500/10 text-red-600 text-xs font-medium hover:bg-red-500/20 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onResolved();
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-500/10 text-green-600 text-xs font-medium hover:bg-green-500/20 transition"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Resolved
                </button>
              </>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onChat();
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Chat
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}