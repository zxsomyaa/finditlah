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
  const [currentUser, setCurrentUser] = useState(null);

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

  const handleDelete = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      await db.entities.Item.delete(itemId);
      queryClient.invalidateQueries({ queryKey: ["items"] });
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to delete post");
    }
  };

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
      alert(err.message || "Failed to update status");
    }
  };

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
      alert(err.message || "Failed to start chat");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading posts...
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
          <h1 className="text-xl font-semibold text-foreground">Home Feed</h1>
          <p className="text-xs text-muted-foreground">
            Lost & Found items near you
          </p>
        </div>

        <Link
          to="/post"
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium shadow-sm hover:opacity-90 transition"
        >
          + Create
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setTypeFilter("lost")}
          className={`py-2 rounded-xl text-sm font-medium border transition ${
            typeFilter === "lost"
              ? "bg-red-500/10 border-red-200 text-red-600"
              : "bg-card border-border text-muted-foreground"
          }`}
        >
          🔴 Lost
        </button>

        <button
          onClick={() => setTypeFilter("found")}
          className={`py-2 rounded-xl text-sm font-medium border transition ${
            typeFilter === "found"
              ? "bg-emerald-500/10 border-emerald-200 text-emerald-600"
              : "bg-card border-border text-muted-foreground"
          }`}
        >
          🟢 Found
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
        <div className="text-center mt-16 text-muted-foreground">
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
      className="bg-card border border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition cursor-pointer"
    >
      <div className="flex gap-4 items-start">
        {item.image_url && (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-24 h-24 object-cover rounded-xl border border-border"
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold text-foreground truncate">
              {item.title}
            </h3>

            <span
              className={`text-[10px] px-2 py-1 rounded-full font-medium shrink-0 ${
                item.type === "lost"
                  ? "bg-red-500/10 text-red-600"
                  : "bg-emerald-500/10 text-emerald-600"
              }`}
            >
              {item.type}
            </span>
          </div>

          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {item.description}
          </p>

          <div className="flex flex-wrap gap-2 mt-3 text-[11px] text-muted-foreground">
            {item.location_name && (
              <span className="px-2 py-1 bg-muted rounded-full">
                📍 {item.location_name}
              </span>
            )}

            {item.category && (
              <span className="px-2 py-1 bg-muted rounded-full">
                🏷 {item.category}
              </span>
            )}

            {item.date && (
              <span className="px-2 py-1 bg-muted rounded-full">
                📅 {new Date(item.date).toLocaleDateString()}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView();
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted text-foreground text-xs font-medium"
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
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted text-foreground text-xs font-medium"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-600 text-xs font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onResolved();
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-600 text-xs font-medium"
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
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium"
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