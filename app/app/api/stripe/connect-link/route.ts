import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createAuthClient } from '@/lib/supabase/server';
import { toStripeFormBody } from '@/features/stripe/lib/stripe-form';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export async function POST(req: NextRequest) {
  if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SITE_URL) {
    console.error('[stripe] Missing required environment variables');
    return NextResponse.json({ message: 'Server configuration error' }, { status: 500 });
  }

  // Verify caller is authenticated
  const authClient = await createAuthClient();
  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ message: 'Brak autoryzacji' }, { status: 401 });
  }

  let body: { driverId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }

  const { driverId } = body;
  if (!driverId || !isValidUuid(driverId)) {
    return NextResponse.json({ message: 'Missing or invalid driverId' }, { status: 400 });
  }

  // Ownership check: a driver can only connect their own Stripe account
  if (driverId !== user.id) {
    return NextResponse.json({ message: 'Brak uprawnień' }, { status: 403 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { data: driver, error: fetchError } = await supabase
      .from('drivers')
      .select('stripe_account_id')
      .eq('id', driverId)
      .single();

    if (fetchError || !driver) {
      console.error('[stripe] Driver fetch error:', fetchError);
      return NextResponse.json({ message: 'Driver not found' }, { status: 404 });
    }

    let stripeAccountId = driver.stripe_account_id;

    // Create Stripe Express account if not exists
    if (!stripeAccountId) {
      // Get email from profile (drivers don't directly have email)
      const accountRes = await fetch('https://api.stripe.com/v1/accounts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: toStripeFormBody({
          type: 'express',
          country: 'PL',
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          business_type: 'individual',
          metadata: {
            driver_id: driverId,
          },
        }),
      });

      const accountBody = await accountRes.json();
      if (!accountRes.ok) {
        console.error('[stripe] Account creation error:', accountBody);
        return NextResponse.json(
          { message: accountBody?.error?.message || 'Failed to create Stripe account' },
          { status: 500 },
        );
      }

      stripeAccountId = accountBody.id;

      const { error: updateError } = await supabase
        .from('drivers')
        .update({ stripe_account_id: stripeAccountId })
        .eq('id', driverId);

      if (updateError) {
        console.error('[stripe] Driver update error:', updateError);
        // Don't fail — the account is created, link still works
      }
    }

    // Create Account Link for onboarding
    const linkRes = await fetch('https://api.stripe.com/v1/account_links', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: toStripeFormBody({
        account: stripeAccountId,
        type: 'account_onboarding',
        return_url: `${SITE_URL}/dashboard?stripe_onboarded=true`,
        refresh_url: `${SITE_URL}/dashboard?stripe_refresh=true`,
      }),
    });

    const linkBody = await linkRes.json();
    if (!linkRes.ok) {
      console.error('[stripe] Account link creation error:', linkBody);
      return NextResponse.json(
        { message: linkBody?.error?.message || 'Failed to create onboarding link' },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: linkBody.url });
  } catch (error) {
    console.error('[stripe] Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
