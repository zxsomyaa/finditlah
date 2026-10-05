import { supabase } from "@/lib/supabase-client";

/* =========================================================
   Thrift data layer (tables created in
   supabase/migrations/0003_thrift_and_public_browsing.sql)
   ========================================================= */

/** Active listings, newest first. */
export async function listListings() {
  const { data, error } = await supabase
    .from("thrift_listings")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

/** @param {string} id */
export async function getListing(id) {
  const { data, error } = await supabase
    .from("thrift_listings")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** @param {string} userId */
export async function listMyListings(userId) {
  const { data, error } = await supabase
    .from("thrift_listings")
    .select("*")
    .eq("user_id", userId)
    .neq("status", "removed")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

/** @param {Record<string, any>} listing */
export async function createListing(listing) {
  const { data, error } = await supabase
    .from("thrift_listings")
    .insert([listing])
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** @param {string} id @param {Record<string, any>} updates */
export async function updateListing(id, updates) {
  const allowed = [
    "title", "description", "category", "price", "condition", "size",
    "location_name", "image_url", "status",
  ];
  /** @type {Record<string, any>} */
  const clean = {};
  for (const k of allowed) if (updates[k] !== undefined) clean[k] = updates[k];
  const { data, error } = await supabase
    .from("thrift_listings")
    .update(clean)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Soft delete so existing orders and chats keep their reference. @param {string} id */
export async function removeListing(id) {
  return updateListing(id, { status: "removed" });
}

/**
 * Open (or reuse) a chat between the buyer and the seller about a listing.
 * @param {any} listing @param {any} user
 * @returns {Promise<string>} conversation id
 */
export async function startListingChat(listing, user) {
  const participants = [user.id, listing.user_id].sort();

  const { data: existing, error: existingError } = await supabase
    .from("conversations")
    .select("id")
    .eq("listing_id", listing.id)
    .contains("participants", participants)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) return existing.id;

  const { data, error } = await supabase
    .from("conversations")
    .insert([
      {
        listing_id: listing.id,
        item_title: `Thrift · ${listing.title}`,
        participants,
        last_message: "",
        last_message_at: new Date().toISOString(),
      },
    ])
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

/**
 * Ask the server to create a Stripe Checkout page for this listing.
 * Handled by the `create-checkout` Supabase Edge Function.
 * @param {string} listingId @param {"meetup"|"mail"} delivery
 * @returns {Promise<string>} Stripe checkout URL
 */
export async function startCheckout(listingId, delivery) {
  const { data, error } = await supabase.functions.invoke("create-checkout", {
    body: { listing_id: listingId, delivery },
  });
  if (error) {
    let message = "Payments aren't available right now. Please try again later.";
    try {
      const body = await error.context?.json?.();
      if (body?.error) message = body.error;
    } catch (_e) {
      /* keep default message */
    }
    throw new Error(message);
  }
  if (!data?.url) throw new Error("Couldn't start the payment. Please try again.");
  return data.url;
}

/** Orders where I'm the buyer or the seller. @param {string} userId */
export async function listMyOrders(userId) {
  const { data, error } = await supabase
    .from("thrift_orders")
    .select("*, listing:thrift_listings(id, title, image_url, category, price)")
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

/** Buyer confirms they received the item. @param {string} orderId */
export async function confirmReceived(orderId) {
  const { error } = await supabase.rpc("confirm_order_received", { p_order_id: orderId });
  if (error) throw error;
}

/** @param {number|string} n */
export const formatPrice = (n) => {
  const v = Number(n || 0);
  return `$${Number.isInteger(v) ? v : v.toFixed(2)}`;
};
