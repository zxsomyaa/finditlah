// Supabase Edge Function: stripe-webhook
// Marks thrift orders as paid when Stripe confirms the payment.
//
// Deploy:   supabase functions deploy stripe-webhook --no-verify-jwt
// Secrets:  supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
// In Stripe: Developers > Webhooks > Add endpoint
//   URL: https://<project-ref>.supabase.co/functions/v1/stripe-webhook
//   Events: checkout.session.completed, checkout.session.async_payment_succeeded, checkout.session.expired

import Stripe from "npm:stripe@17.7.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const ok = () => new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);
  const signature = req.headers.get("Stripe-Signature") ?? "";
  const payload = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      payload,
      signature,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!,
      undefined,
      Stripe.createSubtleCryptoProvider(),
    );
  } catch (err) {
    return new Response(`Webhook signature check failed: ${(err as Error).message}`, { status: 400 });
  }

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status !== "paid") return ok();

    const orderId = session.metadata?.order_id;
    const paymentIntent = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
    const { data: order } = await admin.from("thrift_orders").select("*").eq("id", orderId).maybeSingle();
    if (!order || order.status !== "pending_payment") return ok();

    // Reserve the listing. If someone else paid first, refund this buyer.
    const { data: reserved } = await admin
      .from("thrift_listings")
      .update({ status: "reserved" })
      .eq("id", order.listing_id)
      .eq("status", "active")
      .select("id, title, user_id");

    if (!reserved?.length) {
      if (paymentIntent) await stripe.refunds.create({ payment_intent: paymentIntent });
      await admin.from("thrift_orders").update({ status: "refunded", stripe_payment_intent: paymentIntent }).eq("id", order.id);
      return ok();
    }

    await admin
      .from("thrift_orders")
      .update({ status: "paid", paid_at: new Date().toISOString(), stripe_payment_intent: paymentIntent })
      .eq("id", order.id);

    // Let the seller know in their chat with the buyer.
    try {
      const listing = reserved[0];
      const participants = [order.buyer_id, order.seller_id].sort();
      let { data: convo } = await admin
        .from("conversations")
        .select("id")
        .eq("listing_id", order.listing_id)
        .contains("participants", participants)
        .maybeSingle();
      if (!convo) {
        const created = await admin
          .from("conversations")
          .insert({ listing_id: order.listing_id, item_title: `Thrift · ${listing.title}`, participants, last_message: "", last_message_at: new Date().toISOString() })
          .select("id")
          .single();
        convo = created.data;
      }
      if (convo) {
        const text = `I've paid $${Number(order.amount).toFixed(2)} through FindItLah (${order.delivery === "mail" ? "please mail it to me" : "let's meet up"}). Let's arrange the handover!`;
        await admin.from("messages").insert({ conversation_id: convo.id, sender_id: order.buyer_id, text, image_url: "" });
        await admin.from("conversations").update({ last_message: text, last_message_at: new Date().toISOString() }).eq("id", convo.id);
      }
    } catch (err) {
      console.error("Couldn't post the payment message", err);
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.order_id;
    if (orderId) {
      await admin.from("thrift_orders").update({ status: "cancelled" }).eq("id", orderId).eq("status", "pending_payment");
    }
  }

  return ok();
});
