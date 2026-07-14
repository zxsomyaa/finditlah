import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Send, ImagePlus, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase-client";

/* ---------------- CLOUDINARY ---------------- */
const CLOUD_NAME = "dlu21nvii";
const UPLOAD_PRESET = "fxipenex";

/** @param {File} file */
const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await res.json();

  if (!data.secure_url) {
    throw new Error(data.error?.message || "Image upload failed");
  }

  return data.secure_url;
};

export default function ChatRoom() {
  const { conversationId } = useParams();
  const bottomRef = useRef(/** @type {HTMLDivElement | null} */ (null));

  const [user, setUser] = useState(/** @type {any} */ (null));
  const [conversation, setConversation] = useState(/** @type {any} */ (null));
  const [messages, setMessages] = useState(/** @type {any[]} */ ([]));
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);

  /* ---------------- SAFETY ---------------- */
  if (!conversationId) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Invalid chat
      </div>
    );
  }

  /* ---------------- INIT ---------------- */
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        setUser(user);

        const { data: convo } = await supabase
          .from("conversations")
          .select("*")
          .eq("id", conversationId)
          .single();

        setConversation(convo);

        const { data: msgs } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

        setMessages(msgs || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [conversationId]);

  /* ---------------- REALTIME ---------------- */
  useEffect(() => {
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === payload.new.id);
            if (exists) return prev;
            return [...prev, payload.new];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  /* ---------------- AUTO SCROLL ---------------- */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ---------------- SEND ---------------- */
  const sendMessage = async ({ messageText = "", imageUrl = "" }) => {
    if (!messageText.trim() && !imageUrl) return;

    try {
      setSending(true);

      const { data: msg } = await supabase
        .from("messages")
        .insert([
          {
            conversation_id: conversationId,
            sender_id: user.id,
            text: messageText,
            image_url: imageUrl,
          },
        ])
        .select()
        .single();

      setMessages((prev) => [...prev, msg]);

      await supabase
        .from("conversations")
        .update({
          last_message: imageUrl ? "📷 Image" : messageText,
          last_message_at: new Date().toISOString(),
        })
        .eq("id", conversationId);

      setText("");
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  /* ---------------- IMAGE ---------------- */
  /** @param {React.ChangeEvent<HTMLInputElement>} e */
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const url = await uploadToCloudinary(file);
      await sendMessage({ imageUrl: url });
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  /* ---------------- UI ---------------- */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-6 h-6" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* HEADER */}
      <div className="sticky top-0 z-20 bg-background border-b border-border px-4 py-3">
        <h1 className="font-bold text-lg">
          {conversation?.item_title || "Chat"}
        </h1>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-40">
        {messages.map((msg) => {
          const mine = msg.sender_id === user?.id;

          return (
            <div
              key={msg.id}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                  mine
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {msg.image_url && (
                  <img
                    src={msg.image_url}
                    className="rounded-xl max-h-60 mb-2"
                  />
                )}
                {msg.text && <p>{msg.text}</p>}
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* INPUT (FIXED ABOVE NAVBAR) */}
      <div className="fixed bottom-20 left-0 right-0 bg-background border-t border-border p-3 z-50">
        <div className="max-w-xl mx-auto flex items-center gap-2">
          <label className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center cursor-pointer">
            {uploading ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <ImagePlus className="w-5 h-5" />
            )}

            <input type="file" hidden onChange={handleImageUpload} />
          </label>

          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border rounded-xl px-4 py-3"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage({ messageText: text });
              }
            }}
          />

          <button
            onClick={() => sendMessage({ messageText: text })}
            className="w-11 h-11 rounded-xl bg-primary text-white flex items-center justify-center"
          >
            {sending ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}