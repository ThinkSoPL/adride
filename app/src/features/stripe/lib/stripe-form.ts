/**
 * Encode JS object into Stripe's expected application/x-www-form-urlencoded format.
 * Stripe API does NOT accept JSON-encoded nested objects in form data — it requires
 * bracket notation:
 *   { transfer_data: { destination: 'acct_xxx' } } → transfer_data[destination]=acct_xxx
 *   { metadata: { key: 'v' } } → metadata[key]=v
 *   { payment_method_types: ['card'] } → payment_method_types[]=card
 */
export function toStripeFormBody(
  input: Record<string, unknown>,
  prefix = '',
): string {
  const params = new URLSearchParams();
  appendStripeParams(params, input, prefix);
  return params.toString();
}

function appendStripeParams(
  params: URLSearchParams,
  value: unknown,
  prefix: string,
): void {
  if (value === undefined || value === null) return;

  if (Array.isArray(value)) {
    value.forEach((item, idx) => {
      const key = `${prefix}[${idx}]`;
      appendStripeParams(params, item, key);
    });
    return;
  }

  if (typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      const key = prefix ? `${prefix}[${k}]` : k;
      appendStripeParams(params, v, key);
    }
    return;
  }

  // primitive: string, number, boolean
  params.append(prefix, String(value));
}
