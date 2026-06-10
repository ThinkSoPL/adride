import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAuthClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { toStripeFormBody } from '@/features/stripe/lib/stripe-form';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const PLATFORM_COMMISSION_PERCENT = 15;

// Pakiet → cena w groszach
const PACKAGE_PRICES: Record<string, number> = {
  START: 280000,   // 2 800 PLN
  SCALE: 1750000,  // 17 500 PLN
  PREMIUM: 3300000, // 33 000 PLN
};

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export async function POST(req: NextRequest) {
  if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[stripe] Missing required environment variables');
    return NextResponse.json({ message: 'Server configuration error' }, { status: 500 });
  }

  // Autoryzacja: tylko zalogowany reklamodawca może inicjować płatność
  const authClient = await createAuthClient();
  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ message: 'Brak autoryzacji' }, { status: 401 });
  }

  let body: { driverId?: string; campaignId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }

  const { driverId, campaignId } = body;

  if (!driverId || !campaignId) {
    return NextResponse.json({ message: 'Missing driverId or campaignId' }, { status: 400 });
  }

  if (!isValidUuid(driverId) || !isValidUuid(campaignId)) {
    return NextResponse.json({ message: 'Invalid driver or campaign ID' }, { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Pobierz kampanię i sprawdź cenę z DB (nie z klienta!)
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('advertiser_id, package')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { message: 'Campaign not found' },
        { status: 404 },
      );
    }

    // Ownership: tylko właściciel kampanii (reklamodawca) może za nią płacić
    if (campaign.advertiser_id !== user.id) {
      return NextResponse.json({ message: 'Brak uprawnień do tej kampanii' }, { status: 403 });
    }

    // Oblicz cenę z pakietu
    const expectedAmountGrosze = PACKAGE_PRICES[campaign.package as string];
    if (!expectedAmountGrosze) {
      return NextResponse.json(
        { message: 'Invalid campaign package' },
        { status: 400 },
      );
    }

    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('stripe_account_id, stripe_payouts_enabled')
      .eq('id', driverId)
      .single();

    if (driverError || !driver?.stripe_account_id) {
      return NextResponse.json(
        { message: 'Driver not found or not connected to Stripe' },
        { status: 404 },
      );
    }

    if (!driver.stripe_payouts_enabled) {
      return NextResponse.json(
        { message: 'Driver Stripe account onboarding incomplete' },
        { status: 400 },
      );
    }

    const applicationFeeAmount = Math.round((expectedAmountGrosze * PLATFORM_COMMISSION_PERCENT) / 100);

    const intentRes = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: toStripeFormBody({
        amount: expectedAmountGrosze,
        currency: 'pln',
        payment_method_types: ['card'],
        transfer_data: {
          destination: driver.stripe_account_id,
        },
        application_fee_amount: applicationFeeAmount,
        metadata: {
          driver_id: driverId,
          campaign_id: campaignId,
        },
        statement_descriptor: 'AdRide Campaign',
      }),
    });

    const intentBody = await intentRes.json();

    if (!intentRes.ok) {
      console.error('[stripe] Payment intent error:', intentBody);
      return NextResponse.json(
        { message: intentBody?.error?.message || 'Failed to create payment intent' },
        { status: 500 },
      );
    }

    return NextResponse.json({ clientSecret: intentBody.client_secret });
  } catch (error) {
    console.error('[stripe] Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
