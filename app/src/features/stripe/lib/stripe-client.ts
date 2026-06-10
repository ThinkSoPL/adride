export function initStripeJs() {
  if (typeof window === 'undefined') return null;

  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    console.warn('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not found');
    return null;
  }

  // Load Stripe.js dynamically
  const script = document.createElement('script');
  script.src = 'https://js.stripe.com/v3/';
  script.async = true;
  document.head.appendChild(script);

  return key;
}

export async function getStripe() {
  if (typeof window === 'undefined') return null;

  // @ts-expect-error Stripe is loaded globally
  if (window.Stripe === undefined) {
    console.warn('Stripe.js not loaded');
    return null;
  }

  // @ts-expect-error Stripe is loaded globally
  return window.Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
}
