import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.0';

const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!STRIPE_WEBHOOK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required env vars: STRIPE_WEBHOOK_SECRET, SUPABASE_URL, or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type StripeEvent = {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
};

// Timing-safe equality check
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Verify Stripe webhook signature using HMAC-SHA256.
 * Spec: https://stripe.com/docs/webhooks/signatures
 */
async function verifyStripeSignature(
  body: string,
  signatureHeader: string,
  secret: string,
  toleranceSeconds = 300,
): Promise<boolean> {
  // Parse signature header: t=timestamp,v1=signature1,v1=signature2,...
  const parts = signatureHeader.split(',');
  let timestamp = '';
  const signatures: string[] = [];

  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key === 't') timestamp = value;
    if (key === 'v1' && value) signatures.push(value);
  }

  if (!timestamp || signatures.length === 0) {
    console.warn('[stripe-webhook] Malformed signature header');
    return false;
  }

  // Check timestamp tolerance to prevent replay attacks
  const timestampNum = Number(timestamp);
  if (!Number.isFinite(timestampNum)) return false;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestampNum) > toleranceSeconds) {
    console.warn('[stripe-webhook] Signature timestamp outside tolerance window');
    return false;
  }

  // Compute expected signature
  const signedPayload = `${timestamp}.${body}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const expectedSig = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload)),
  );

  // Compare against all provided signatures (Stripe may include rotated secrets)
  for (const sig of signatures) {
    const sigBytes = hexToBytes(sig);
    if (timingSafeEqual(expectedSig, sigBytes)) {
      return true;
    }
  }

  return false;
}

async function recordStripeEvent(event: StripeEvent): Promise<boolean> {
  // Idempotency: skip if already processed
  const { data: existing } = await supabase
    .from('stripe_events')
    .select('id')
    .eq('id', event.id)
    .maybeSingle();

  if (existing) {
    console.log('[stripe-webhook] Event already processed, skipping:', event.id);
    return false;
  }

  await supabase
    .from('stripe_events')
    .insert({
      id: event.id,
      type: event.type,
      payload: event,
    });

  return true;
}

async function handlePaymentIntentSucceeded(event: StripeEvent): Promise<boolean> {
  const paymentIntent = event.data.object as {
    id: string;
    amount: number;
    metadata?: Record<string, string>;
  };

  const campaignId = paymentIntent.metadata?.campaign_id;
  const driverId = paymentIntent.metadata?.driver_id;

  if (!campaignId || !driverId) {
    console.warn('[stripe-webhook] Missing campaign_id or driver_id in metadata', paymentIntent.id);
    return true;
  }

  // amount is in grosze (cents) per Stripe convention
  const amountGrosze = paymentIntent.amount;

  const today = new Date().toISOString().split('T')[0];
  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStartStr = monthStart.toISOString().split('T')[0];

  const { error: payoutError } = await supabase.from('payouts').insert({
    driver_id: driverId,
    campaign_id: campaignId,
    amount_grosze: amountGrosze,
    status: 'pending',
    period_start: monthStartStr,
    period_end: today,
  });

  if (payoutError) {
    console.error('[stripe-webhook] Payout insert error:', payoutError);
    return false;
  }

  console.log('[stripe-webhook] Created payout record', { campaignId, driverId, amountGrosze });
  return true;
}

async function handleTransferCreated(event: StripeEvent): Promise<boolean> {
  const transfer = event.data.object as {
    id: string;
    amount: number;
    destination?: string;
    metadata?: Record<string, string>;
  };

  const campaignId = transfer.metadata?.campaign_id;
  const driverId = transfer.metadata?.driver_id;
  if (!campaignId) {
    console.warn('[stripe-webhook] Missing campaign_id in transfer metadata', transfer.id);
    return true;
  }

  // Dopasuj po campaign_id ORAZ driver_id (z metadata payment_intent).
  // Bez driver_id przy kampaniach wielu kierowców transfer trafiałby do złego kierowcy.
  let query = supabase
    .from('payouts')
    .select('id')
    .eq('campaign_id', campaignId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1);

  if (driverId) {
    query = query.eq('driver_id', driverId);
  } else {
    console.warn('[stripe-webhook] Missing driver_id in transfer metadata — falling back to campaign-only match', transfer.id);
  }

  const { data: targetPayout, error: selectError } = await query.single();

  if (selectError || !targetPayout) {
    console.warn('[stripe-webhook] No pending payout found for campaign', campaignId);
    return true;
  }

  const { error: updateError } = await supabase
    .from('payouts')
    .update({ status: 'paid', stripe_transfer_id: transfer.id })
    .eq('id', targetPayout.id);

  if (updateError) {
    console.error('[stripe-webhook] Payout update error:', updateError);
    return false;
  }

  console.log('[stripe-webhook] Marked payout as paid', { payoutId: targetPayout.id, transferId: transfer.id });
  return true;
}

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return new Response(JSON.stringify({ error: 'Missing stripe-signature header' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const isValid = await verifyStripeSignature(body, signature, STRIPE_WEBHOOK_SECRET);
  if (!isValid) {
    console.warn('[stripe-webhook] Invalid signature — rejecting request');
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(body);
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  console.log('[stripe-webhook] Received event:', event.type, event.id);

  try {
    // Idempotency check — skip if already processed
    const isNew = await recordStripeEvent(event);
    if (!isNew) {
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let success = true;
    switch (event.type) {
      case 'payment_intent.succeeded':
        success = await handlePaymentIntentSucceeded(event);
        break;
      case 'transfer.created':
        success = await handleTransferCreated(event);
        break;
      default:
        console.log('[stripe-webhook] Unhandled event type:', event.type);
    }

    return new Response(JSON.stringify({ received: true, success }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[stripe-webhook] Processing error:', error);
    return new Response(
      JSON.stringify({
        error: 'Webhook processing failed',
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
