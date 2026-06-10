import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { checkLeadsRateLimit } from '@/lib/rate-limit';

interface LeadPayload {
  email: string;
  company?: string | null;
  phone?: string | null;
  districtId: string;
  numVehicles: number;
  kmDailyPerVehicle: number;
  months: number;
  budgetMonthlyPLN?: number | null;
  impressionsTotal: number;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_STR_LEN = 200;

function getRateLimitKey(req: NextRequest): string {
  return req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'unknown';
}

function clampInt(value: unknown, min: number, max: number): number | null {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const int = Math.round(n);
  if (int < min || int > max) return null;
  return int;
}

export async function POST(req: NextRequest) {
  // Rate limiting check (rozproszony przez Upstash, fallback in-memory)
  const clientIp = getRateLimitKey(req);
  const { success } = await checkLeadsRateLimit(clientIp);
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': '3600' } }
    );
  }

  let body: LeadPayload;
  try {
    body = (await req.json()) as LeadPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Validate email
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || !EMAIL_REGEX.test(email) || email.length > MAX_STR_LEN) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }

  // Validate districtId (must be one of known IDs — simple length check; full check in DB)
  const districtId = typeof body.districtId === 'string' ? body.districtId.trim() : '';
  if (!districtId || districtId.length > 64) {
    return NextResponse.json({ error: 'Invalid districtId' }, { status: 400 });
  }

  // Validate numeric inputs with bounds (matching DB CHECK constraints)
  const numVehicles = clampInt(body.numVehicles, 1, 200);
  const kmDaily = clampInt(body.kmDailyPerVehicle, 1, 1000);
  const months = clampInt(body.months, 1, 24);
  const impressionsTotal = clampInt(body.impressionsTotal, 0, Number.MAX_SAFE_INTEGER);
  if (numVehicles === null || kmDaily === null || months === null || impressionsTotal === null) {
    return NextResponse.json({ error: 'Invalid numeric fields' }, { status: 400 });
  }

  let budgetMonthly: number | null = null;
  if (body.budgetMonthlyPLN !== null && body.budgetMonthlyPLN !== undefined) {
    budgetMonthly = clampInt(body.budgetMonthlyPLN, 0, 10_000_000);
    if (budgetMonthly === null) {
      return NextResponse.json({ error: 'Invalid budget' }, { status: 400 });
    }
  }

  // Sanitize optional fields
  const company =
    typeof body.company === 'string' && body.company.trim().length > 0
      ? body.company.trim().slice(0, MAX_STR_LEN)
      : null;
  const phone =
    typeof body.phone === 'string' && body.phone.trim().length > 0
      ? body.phone.trim().slice(0, 40)
      : null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error('[leads] Missing env vars');
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  const supabase = createClient(url, key);

  const { error } = await supabase.from('calculator_leads').insert({
    email,
    company,
    phone,
    district_id: districtId,
    num_vehicles: numVehicles,
    km_daily: kmDaily,
    months,
    budget_monthly_pln: budgetMonthly,
    impressions_total: impressionsTotal,
  });

  if (error) {
    console.error('[leads] insert error:', error.message);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
