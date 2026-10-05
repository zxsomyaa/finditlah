# FindItLah redesign: setup steps

This branch adds:

- **The new cream & blush design** for every page, with a top navigation bar, a colour-flip home page, and a bottom tab bar on phones.
- **Browsing without an account.** Home, Lost & Found, Thrift, item pages and the map are public. Posting, chatting, buying and the profile still need a login.
- **Continue with Google** on the log in and sign up pages.
- **Thrift**: listings for clothes and small items, chat with the seller, and card payments through Stripe. The seller is paid after the buyer confirms they received the item.

The code works as soon as it's merged, but a few things need to be switched on in Supabase, Google and Stripe. Do them in this order.

---

## 1. Run the database update (required)

1. Open your project in the **Supabase dashboard**.
2. Go to **SQL Editor → New query**.
3. Paste the whole of `supabase/migrations/0003_thrift_and_public_browsing.sql` and press **Run**.

This:

- lets logged-out visitors see active Lost & Found posts
- creates the `thrift_listings` and `thrift_orders` tables, with security rules
- lets chats be about a thrift listing

It's safe to run more than once.

---

## 2. Turn on Google sign-in

**In Google Cloud Console** (console.cloud.google.com):

1. Create a project, or pick an existing one.
2. Go to **APIs & Services → OAuth consent screen**. Choose **External**, then fill in the app name (FindItLah), your support email and the domain `finditlah.com`.
3. Go to **APIs & Services → Credentials → Create credentials → OAuth client ID** and choose **Web application**.
4. Under **Authorized redirect URIs**, add:
   `https://<your-project-ref>.supabase.co/auth/v1/callback`
   (Your project ref is the code in your Supabase project URL.)
5. Copy the **Client ID** and **Client secret**.

**In Supabase:**

1. Go to **Authentication → Sign In / Providers → Google**. Turn it on and paste the Client ID and secret.
2. Go to **Authentication → URL Configuration**:
   - **Site URL:** `https://www.finditlah.com`
   - **Redirect URLs:** add `https://www.finditlah.com/**`. If you also test on Vercel preview links, add `https://*.vercel.app/**` too.

People who sign in with Google get a profile created automatically the first time.

---

## 3. Turn on Thrift payments (Stripe)

Until this step is done, Thrift still works for listing and chatting. The **Pay in app** button shows the message "Payments aren't set up yet."

1. Create a Stripe account at stripe.com for your business and complete activation for Singapore.
2. Install the Supabase CLI and link your project:
   ```bash
   npm install -g supabase
   supabase login
   supabase link --project-ref <your-project-ref>
   ```
3. Add your Stripe secret key and site address as secrets:
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_live_xxx SITE_URL=https://www.finditlah.com
   ```
   Use an `sk_test_...` key first if you want to try it with Stripe's test cards.
4. Deploy the two payment functions:
   ```bash
   supabase functions deploy create-checkout
   supabase functions deploy stripe-webhook --no-verify-jwt
   ```
5. In Stripe, go to **Developers → Webhooks → Add endpoint**:
   - **URL:** `https://<your-project-ref>.supabase.co/functions/v1/stripe-webhook`
   - **Events:** `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired`
6. Copy the endpoint's **Signing secret** (`whsec_...`) and save it:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
   ```

### How a purchase works

1. The buyer taps **Pay in app** and pays on Stripe's checkout page.
2. Stripe tells the `stripe-webhook` function. The function marks the order **paid**, sets the listing to **reserved**, and posts a message in the buyer and seller's chat.
   - If two people pay for the same item at the same moment, the second payment is refunded automatically.
3. They meet up, or the seller mails the item. The buyer taps **I've received it** under **My thrift & orders**.
4. The order shows `payout_status = pending`. That means you owe the seller.

### Paying sellers

For now, payouts are manual. The money sits in your Stripe balance.

1. In Supabase, go to **Table Editor → thrift_orders** and filter `payout_status = pending`.
2. Pay the seller, for example by PayNow. Their email is in `profiles`.
3. Set that order's `payout_status` to `paid_out`.

To make payouts automatic later, the next step is **Stripe Connect**, where each seller links their own Stripe account.

---

## 4. Deploy the website

The site is on Vercel, which deploys automatically from GitHub:

- Merging this branch's pull request into `main` publishes it to finditlah.com.
- The pull request also gets a **Vercel preview link**, so you can click around before merging. Google sign-in only works there if you added the `vercel.app` redirect URL in step 2.

No new environment variables are needed on Vercel. The site still uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

---

## What changed in the code

| Area | Files |
|---|---|
| Theme colours | `src/index.css`, `tailwind.config.js` |
| Layout (header, footer, phone tab bar, help panels) | `src/components/site/*`, `src/lib/SiteContext.jsx` |
| Home | `src/pages/Landing.jsx` |
| Lost & Found list | `src/pages/LostFound.jsx` (replaces the old `Home.jsx` feed) |
| Item page and posting | `src/pages/ItemDetail.jsx`, `src/pages/PostItem.jsx` |
| Log in, sign up, Google | `src/pages/Login.jsx`, `src/pages/Signup.jsx`, `src/lib/AuthContext.jsx` |
| Thrift pages | `src/pages/thrift/*`, `src/lib/thrift.js`, `src/lib/categories.js` |
| Database | `supabase/migrations/0003_thrift_and_public_browsing.sql` |
| Payments | `supabase/functions/create-checkout`, `supabase/functions/stripe-webhook` |

Profile, Chats, Map, Rewards, Edit post and Admin keep their existing logic. They pick up the new colours and the new header automatically.
