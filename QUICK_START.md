# AdRide — Quick Start Reference (5-minute overview)

## ⚡ FASTEST PATH TO WORKING SYSTEM

### 1️⃣ **Install Dependencies** (5 min)
```bash
cd app && npm install
cd ../mobile && npm install
```

### 2️⃣ **Run Tests** (verify all fixes work) (2 min)
```bash
cd app
npm run test -- --testPathPattern='stripe-form|calculator|fleet-dashboard'
# Expected: ✓ 26 tests pass
```

### 3️⃣ **Setup Supabase Secrets** (2 min)
Go to Supabase Dashboard → Project Settings → Vault
```
Add these secrets:
- STRIPE_SECRET_KEY = sk_test_... (from Stripe)
- STRIPE_WEBHOOK_SECRET = whsec_... (from Stripe webhook)
```

### 4️⃣ **Setup Stripe Account** (15 min)
1. https://stripe.com/ → Create account
2. Get API keys: Secret Key (`sk_test_...`), Publishable Key (`pk_test_...`)
3. Setup Webhook Endpoint:
   - URL: `https://your-project.supabase.co/functions/v1/stripe-webhook`
   - Events: `payment_intent.succeeded`, `transfer.created`
   - Copy Signing Secret (`whsec_...`) to Supabase Vault

### 5️⃣ **Setup .env.local** (1 min)
Create `app/.env.local`:
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 6️⃣ **Deploy Database + Functions** (5 min)
```bash
cd app

# Deploy migrations (proof_photos table + RLS + storage)
supabase migrate up

# Deploy webhook handler
supabase functions deploy stripe-webhook
```

### 7️⃣ **Start Development Servers** (2 min)
Terminal 1:
```bash
cd app && npm run dev
# → http://localhost:3000
```

Terminal 2:
```bash
cd mobile && npx expo start
# → Scan QR or http://localhost:8081
```

### 8️⃣ **Quick Smoke Test** (2 min)
```bash
# Test payment intent creation
curl -X POST http://localhost:3000/api/stripe/payment-intent \
  -H "Content-Type: application/json" \
  -d '{
    "driverId": "6d7a3f4a-1c9e-4a2b-8d1f-9e2c3b4a5f6d",
    "amountGrosze": 50000,
    "campaignId": "b9c3e4f5-6a7b-8c9d-0e1f-2a3b4c5d6e7f"
  }'
```
Expected: `{"clientSecret": "pi_...", "publishableKey": "pk_test_...", ...}`

---

## 🎯 KEY FIXES IN THIS CODEBASE

| Issue | Status |
|-------|--------|
| Stripe webhook signature verification (was fake) | ✅ FIXED: HMAC-SHA256 + timing-safe comparison |
| Stripe form encoding broken (JSON.stringify) | ✅ FIXED: Created toStripeFormBody() helper |
| Missing camera imports (expo-camera v15) | ✅ FIXED: useRef added, facing="back" string |
| Photo upload crash | ✅ FIXED: useRef + isMountedRef for cleanup |
| Email validation missing | ✅ FIXED: EMAIL_REGEX validation on all forms |
| UUID validation missing | ✅ FIXED: isValidUuid() on all API routes |
| No empty/loading states in UI | ✅ FIXED: Added states to gallery, dashboard, forms |
| Keyboard navigation missing | ✅ FIXED: Added tabIndex/aria-label to tables |

---

## 🔴 CRITICAL (DO NOT SKIP)

1. **NEVER** commit `STRIPE_SECRET_KEY` to git — use Supabase Vault only
2. **ALWAYS** verify HMAC signatures in webhook (already done in code)
3. **MUST** set RLS on all tables before production
4. **MUST** set photo storage bucket to PRIVATE (not public)
5. **MUST** deploy migrations before running app

---

## 📚 FULL DOCS

See `IMPLEMENTATION_CHECKLIST.md` for:
- Detailed step-by-step guides
- Troubleshooting section
- Production deployment
- Security checklist
- Complete test procedures

---

## ❓ COMMON ISSUES & FIXES

| Issue | Fix |
|-------|-----|
| `npm test` fails | `npm install --save-dev jest ts-jest @types/jest` |
| Supabase migration fails | `supabase unlink && supabase link --project-ref ID` |
| Webhook returns 401 | Check STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in Vault |
| Photo upload fails | Verify "proofs" bucket exists and is PRIVATE |
| Mobile crashes on camera | Update to expo-camera v15: `npm install expo-camera@latest` |

---

**Estimated total setup time: 45 minutes from zero to working system.**

**Status:** All code is fixed. Ready to deploy. ✅
