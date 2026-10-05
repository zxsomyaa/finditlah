// Supabase Edge Function: create-checkout
// Creates a pending order and a Stripe Checkout page for one thrift listing.
//
// Deploy:   supabase functions deploy create-checkout
// Secrets:  supabase secrets set STRIPE_SECRET_KEY=sk_live_... SITE_URL=https://www.finditlah.com
// (SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided automatically.)

import Stripe from "npm:stripe@17.7.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) return json({ error: "Payments aren't set up yet. Please chat with the seller for now." }, 503);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: "Please log in first." }, 401);

  let body: { listing_id?: string; delivery?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Bad request" }, 400);
  }
  const listingId = String(body.listing_id ?? "");
  const delivery = body.delivery === "mail" ? "mail" : "meetup";

  const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: listing } = await admin.from("thrift_listings").select("*").eq("id", listingId).maybeSingle();
  if (!listing || listing.status !== "active") return json({ error: "Sorry, this item is no longer available." }, 409);
  if (listing.user_id === user.id) return json({ error: "You can't buy your own listing." }, 400);

  const amountCents = Math.round(Number(listing.price) * 100);
  if (!(amountCents >= 50)) return json({ error: "Card payments need a price of at least $0.50." }, 400);

  const { data: order, error: orderError } = await admin
    .from("thrift_orders")
    .insert({
      listing_id: listing.id,
      buyer_id: user.id,
      seller_id: listing.user_id,
      amount: listing.price,
      delivery,
      status: "pending_payment",
    })
    .select()
    .single();
  if (orderError || !order) return json({ error: "Couldn't create the order. Please try again." }, 500);

  const siteUrl = (Deno.env.get("SITE_URL") || req.headers.get("origin") || "https://www.finditlah.com").replace(/\/$/, "");
  const stripe = new Stripe(stripeKey);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "sgd",
            unit_amount: amountCents,
            product_data: {
              name: listing.title,
              description: `FindItLah Thrift · ${delivery === "mail" ? "Mail" : "Meet up"}`,
              ...(listing.image_url ? { images: [listing.image_url] } : {}),
            },
          },
        },
      ],
      customer_email: user.email ?? undefined,
      client_reference_id: order.id,
      metadata: { order_id: order.id, listing_id: listing.id },
      payment_intent_data: { metadata: { order_id: order.id, listing_id: listing.id } },
      success_url: `${siteUrl}/orders?paid=${order.id}`,
      cancel_url: `${siteUrl}/thrift/${listing.id}`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });

    await admin.from("thrift_orders").update({ stripe_session_id: session.id }).eq("id", order.id);
    return json({ url: session.url });
  } catch (err) {
    console.error(err);
    await admin.from("thrift_orders").update({ status: "cancelled" }).eq("id", order.id);
    return json({ error: "Couldn't start the payment. Please try again." }, 502);
  }
});
