import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAuthClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export async function GET(req: NextRequest) {
  if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { connected: false, error: 'Server configuration error' },
      { status: 500 },
    );
  }

  // Autoryzacja: driver może sprawdzić tylko swój status
  const authClient = await createAuthClient();
  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ connected: false, error: 'Brak autoryzacji' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const driverId = searchParams.get('driverId');

  if (!driverId || !isValidUuid(driverId)) {
    return NextResponse.json(
      { connected: false, error: 'Missing or invalid driverId' },
      { status: 400 },
    );
  }

  // Ownership check: driver może sprawdzić tylko swój status
  if (driverId !== user.id) {
    return NextResponse.json({ connected: false, error: 'Brak uprawnień' }, { status: 403 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { data: driver, error: fetchError } = await supabase
      .from('drivers')
      .select('stripe_account_id, stripe_payouts_enabled')
      .eq('id', driverId)
      .maybeSingle();

    if (fetchError) {
      console.error('[stripe] Driver fetch error:', fetchError);
      return NextResponse.json({ connected: false }, { status: 500 });
    }

    if (!driver?.stripe_account_id) {
      return NextResponse.json({ connected: false, accountId: null });
    }

    const statusRes = await fetch(
      `https://api.stripe.com/v1/accounts/${driver.stripe_account_id}`,
      { headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` } },
    );

    if (!statusRes.ok) {
      console.error('[stripe] Account fetch failed:', await statusRes.text());
      // Account exists in our DB but Stripe doesn't return it — return cached state
      return NextResponse.json({
        connected: driver.stripe_payouts_enabled === true,
        accountId: driver.stripe_account_id,
      });
    }

    const account = (await statusRes.json()) as {
      charges_enabled?: boolean;
      payouts_enabled?: boolean;
      id: string;
    };

    const isConnected = Boolean(account.charges_enabled && account.payouts_enabled);

    // Sync database if status changed
    if (isConnected !== driver.stripe_payouts_enabled) {
      await supabase
        .from('drivers')
        .update({ stripe_payouts_enabled: isConnected })
        .eq('id', driverId);
    }

    return NextResponse.json({
      connected: isConnected,
      accountId: driver.stripe_account_id,
    });
  } catch (error) {
    console.error('[stripe] Error:', error);
    return NextResponse.json(
      { connected: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
