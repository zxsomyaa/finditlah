import React, { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { MessageCircle, Loader2, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase-client";

export default function Chats() {
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      return user;
    },
  });

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["conversations", currentUser?.id],
    enabled: !!currentUser,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .contains("participants", [currentUser?.id])
        .order("last_message_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    if (!currentUser?.id) return;

    const channel = supabase
      .channel(`conversations-${currentUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["conversations", currentUser.id],
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, queryClient]);

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-xl border-b border-border px-4 py-3">
        <h1 className="font-bold text-xl flex items-center gap-2 text-foreground">
          <MessageCircle className="w-5 h-5 text-primary" />
          Messages
        </h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-4xl mb-3 block">💬</span>
          <p className="text-muted-foreground font-medium">No messages yet</p>
          <p className="text-muted-foreground text-sm mt-1">
            Start a conversation from an item listing
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {conversations.map((convo) => (
            <Link
              key={convo.id}
              to={`/chat/${convo.id}`}
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm truncate text-foreground">
                    {convo.item_title || "Conversation"}
                  </p>

                  {convo.last_message_at && (
                    <span className="text-[10px] text-muted-foreground ml-2">
                      {format(new Date(convo.last_message_at), "d MMM")}
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {convo.last_message || "No messages yet"}
                </p>
              </div>

              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}