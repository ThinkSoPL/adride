# Stripe Connect Setup Guide

## Overview

G.11 implements Stripe Connect marketplace for AdRide drivers to receive payouts. Architecture:

- **Edge Function**: `/functions/stripe-webhook` (Deno) handles `payment_intent.succeeded` and `transfer.created` events
- **API Routes**: `/api/stripe/*` (Next.js) create Account Links and payment intents
- **Frontend**: `StripeConnect` component for driver onboarding

## Setup Steps

### 1. Create Stripe Account

1. Go to [stripe.com](https://stripe.com) and create an account
2. Get your Stripe keys:
   - **Publishable Key** (pk_live_...)
   - **Secret Key** (sk_live_...)

### 2. Add Keys to Environment

```bash
# .env.local
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### 3. Create Stripe Webhook

1. In Stripe Dashboard → Webhooks → Add Endpoint
2. Endpoint URL: `https://yourdomain.com/functions/v1/stripe-webhook`
3. Events to listen:
   - `payment_intent.succeeded`
   - `transfer.created`
4. Copy the **Signing Secret** (whsec_...)

### 4. Add Webhook Secret to Supabase Vault

```bash
# Store in Supabase Dashboard → Project Settings → Vault
Key: STRIPE_WEBHOOK_SECRET
Value: whsec_xxx
```

### 5. Deploy Edge Function

```bash
cd app
supabase functions deploy stripe-webhook \
  --project-ref YOUR_PROJECT_REF
```

### 6. Test Webhook Locally (Optional)

```bash
supabase functions serve stripe-webhook
```

Then use Stripe CLI:

```bash
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
```

## How It Works

### Driver Onboarding

1. Driver clicks "Połącz Stripe Connect" button
2. Frontend calls `POST /api/stripe/connect-link`
3. Backend creates Stripe Express Account (if not exists)
4. Backend creates Account Link and redirects driver
5. Driver onboards bank account on Stripe's hosted form
6. Driver redirected back to dashboard

### Payment Flow

1. Advertiser pays for campaign → `payment_intent.created`
2. `payment_intent.succeeded` webhook fires
3. Edge Function:
   - Creates payout record in DB
   - Activates campaign for driver
4. Funds transfer to driver's bank account
5. `transfer.created` webhook fires
6. Edge Function updates payout status to `paid`

### Commission Structure

- Campaign cost (PLN): set by advertiser
- Platform commission: 15% of campaign cost
- Driver receives: 85% of campaign cost

Example:
- Campaign cost: 1000 PLN
- Platform fee: 150 PLN
- Driver payout: 850 PLN

## Database Schema

Tables already created (via migrations):

- `drivers.stripe_account_id` — Stripe account ID
- `drivers.stripe_payouts_enabled` — boolean flag
- `payouts` — records of driver payouts
- `stripe_events` — webhook events log (for debugging)

## Testing

### Simulate payment_intent.succeeded

```bash
stripe trigger payment_intent.succeeded
```

Set metadata:

```json
{
  "driver_id": "driver-uuid",
  "campaign_id": "campaign-uuid",
  "amount": "100000"
}
```

### Check Database

```sql
SELECT * FROM payouts WHERE driver_id = 'driver-uuid';
SELECT * FROM stripe_events LIMIT 10;
```

## Troubleshooting

### Webhook not receiving events

1. Check Stripe webhook endpoint is registered and active
2. Check `STRIPE_WEBHOOK_SECRET` is correct in Supabase Vault
3. Check Edge Function logs: `supabase functions logs stripe-webhook --project-ref YOUR_PROJECT_REF`

### Account Link creation fails

1. Verify `STRIPE_SECRET_KEY` is correct in environment
2. Check driver exists in database
3. Check Stripe API status at [status.stripe.com](https://status.stripe.com)

### Payment intent fails

1. Verify driver has Stripe account (`drivers.stripe_payouts_enabled = true`)
2. Check amount is > 0 (minimum 1 PLN = 100 groszy)
3. Verify campaign_id and driver_id are valid UUIDs

## Environment Variables

| Variable | Source | Used By |
|----------|--------|---------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard | Frontend (Stripe.js) |
| `STRIPE_SECRET_KEY` | Stripe Dashboard | API routes |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard | Edge Function |
| `NEXT_PUBLIC_SITE_URL` | Your app URL | Account Link redirects |

## API Endpoints

### POST /api/stripe/connect-link
Creates Account Link for driver onboarding

```json
{
  "driverId": "uuid"
}
```

Response:
```json
{
  "url": "https://connect.stripe.com/..."
}
```

### GET /api/stripe/connect-status
Check if driver has connected Stripe account

```
?driverId=uuid
```

Response:
```json
{
  "connected": true,
  "accountId": "acct_xxx"
}
```

### POST /api/stripe/payment-intent
Create payment intent for campaign activation

```json
{
  "driverId": "uuid",
  "campaignId": "uuid",
  "amountGrosze": 100000
}
```

Response:
```json
{
  "clientSecret": "pi_xxx_secret_yyy"
}
```

## Security

- Driver can only connect their own Stripe account (auth validated in API routes)
- Webhook signature verified using `STRIPE_WEBHOOK_SECRET`
- All sensitive keys stored in Supabase Vault or environment
- RLS policies ensure drivers only see their own payouts
- Application fees captured before transfer to driver

## Next Steps

1. Implement payment UI component (Stripe Elements for card input)
2. Add payout history view to driver dashboard
3. Set up monthly automatic transfers
4. Add dispute/chargeback handling
5. Implement webhook retry logic for failed events
