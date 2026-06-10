export interface CreateConnectLinkResponse {
  url: string;
  error?: string;
}

export interface VerifyConnectStatusResponse {
  connected: boolean;
  accountId?: string;
  error?: string;
}

/**
 * Create a Stripe Connect onboarding link for a driver
 * Backend will generate an Account Link that redirects to hosted Stripe flow
 */
export async function createStripeConnectLink(
  driverId: string,
): Promise<CreateConnectLinkResponse> {
  try {
    const res = await fetch('/api/stripe/connect-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driverId }),
    });

    if (!res.ok) {
      const error = await res.json();
      return { url: '', error: error.message || 'Failed to create link' };
    }

    const data = (await res.json()) as { url: string };
    return { url: data.url };
  } catch (error) {
    return { url: '', error: error instanceof Error ? error.message : 'Network error' };
  }
}

/**
 * Verify if driver has connected Stripe account
 */
export async function verifyStripeConnectStatus(
  driverId: string,
): Promise<VerifyConnectStatusResponse> {
  try {
    const res = await fetch(`/api/stripe/connect-status?driverId=${driverId}`);

    if (!res.ok) {
      return { connected: false, error: 'Failed to check status' };
    }

    const data = (await res.json()) as {
      connected: boolean;
      accountId?: string;
    };
    return data;
  } catch (error) {
    return { connected: false, error: error instanceof Error ? error.message : 'Network error' };
  }
}

/**
 * Create a payment intent for campaign activation
 */
export async function createCampaignPaymentIntent(
  driverId: string,
  campaignId: string,
  amountGrosze: number,
): Promise<{ clientSecret: string; error?: string }> {
  try {
    const res = await fetch('/api/stripe/payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        driverId,
        campaignId,
        amountGrosze,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      return { clientSecret: '', error: error.message };
    }

    const data = (await res.json()) as { clientSecret: string };
    return data;
  } catch (error) {
    return {
      clientSecret: '',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}
