import { toStripeFormBody } from '../stripe-form';

describe('toStripeFormBody', () => {
  it('encodes flat primitives', () => {
    const result = toStripeFormBody({
      amount: 1000,
      currency: 'pln',
    });
    const params = new URLSearchParams(result);
    expect(params.get('amount')).toBe('1000');
    expect(params.get('currency')).toBe('pln');
  });

  it('encodes nested objects with bracket notation (Stripe format)', () => {
    const result = toStripeFormBody({
      transfer_data: { destination: 'acct_123' },
      metadata: { driver_id: 'driver-uuid', campaign_id: 'campaign-uuid' },
    });
    const params = new URLSearchParams(result);
    expect(params.get('transfer_data[destination]')).toBe('acct_123');
    expect(params.get('metadata[driver_id]')).toBe('driver-uuid');
    expect(params.get('metadata[campaign_id]')).toBe('campaign-uuid');
  });

  it('encodes arrays with bracketed indexes', () => {
    const result = toStripeFormBody({
      payment_method_types: ['card', 'p24'],
    });
    const params = new URLSearchParams(result);
    expect(params.get('payment_method_types[0]')).toBe('card');
    expect(params.get('payment_method_types[1]')).toBe('p24');
  });

  it('encodes deeply nested objects (capabilities)', () => {
    const result = toStripeFormBody({
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
    const params = new URLSearchParams(result);
    expect(params.get('capabilities[card_payments][requested]')).toBe('true');
    expect(params.get('capabilities[transfers][requested]')).toBe('true');
  });

  it('skips null and undefined values', () => {
    const result = toStripeFormBody({
      amount: 100,
      undef: undefined,
      nul: null,
    });
    const params = new URLSearchParams(result);
    expect(params.get('amount')).toBe('100');
    expect(params.has('undef')).toBe(false);
    expect(params.has('nul')).toBe(false);
  });

  it('does NOT JSON-encode objects (regression test)', () => {
    // Bug we fixed: previously transfer_data was JSON.stringify'd
    const result = toStripeFormBody({
      transfer_data: { destination: 'acct_xxx' },
    });
    expect(result).not.toContain('%7B'); // No JSON `{`
    expect(result).toContain('transfer_data%5Bdestination%5D=acct_xxx'); // bracket notation
  });
});
