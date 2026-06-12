# AdRide — Checklist Implementacji i Setup (ang. Implementation & Setup Checklist)

**Data:** 2026-05-21 | **Status:** Post-Audit Implementation Phase  
**Kontekst:** Wszystkie kody zostały naprawione i przetestowane. Poniżej znajduje się lista rzeczy, które musisz zrobić i jak to zrobić.

---

## 📋 CZĘŚĆ 1: Prerequisites I LOKALNY SETUP

### 1.1 Instalacja zależności (Node.js + npm packages)

```bash
# W katalogu /app
cd C:\Users\andrz\Downloads\AdRide\app
npm install

# W katalogu /mobile  
cd C:\Users\andrz\Downloads\AdRide\mobile
npm install
```

**Co to robi:** Ściąga wszystkie pakiety z package.json (React, Next.js, Supabase client, Stripe SDK, expo-camera, etc.)

**Czas:** ~5 minut (pierwsze uruchomienie)

**Weryfikacja:** 
```bash
# Powinny się nie pojawić błędy o missing dependencies
npm list stripe-js
npm list supabase
npm list expo-camera
```

---

### 1.2 Zainstaluj Supabase CLI (dla migracji + Edge Functions)

```bash
# Windows PowerShell
choco install supabase-cli

# Lub download bezpośrednio:
# https://github.com/supabase/cli/releases
```

**Weryfikacja:**
```bash
supabase --version
# Powinno zwrócić: supabase version X.X.X
```

---

### 1.3 Konfiguracja lokalnego projektu Supabase

```bash
cd C:\Users\andrz\Downloads\AdRide\app

# Zaloguj się do Supabase
supabase login

# Link lokalnego projektu do zdalnego
supabase link --project-ref YOUR_PROJECT_ID
# (project-id z https://supabase.com/dashboard/project/YOUR_ID/settings)

# Sprawdź status
supabase status
```

---

## 📋 CZĘŚĆ 2: URUCHAMIANIE TESTÓW (WERYFIKACJA POPRAWEK)

### 2.1 Run Jest unit tests (26 testów)

```bash
cd C:\Users\andrz\Downloads\AdRide\app

# Uruchom wszystkie testy z ostatniego audytu
npm run test -- \
  --testPathPattern='stripe-form|calculator.test|fleet-dashboard' \
  --no-coverage

# Lub uruchom wszystkie testy
npm test
```

**Oczekiwany wynik:**
```
PASS  src/features/stripe/lib/__tests__/stripe-form.test.ts (6 tests)
PASS  src/features/impressions-calculator/lib/__tests__/calculator.test.ts (10 tests)
PASS  src/features/fleet-dashboard/lib/__tests__/calculations.test.ts (10 tests)

Test Suites: 3 passed, 3 total
Tests:       26 passed, 26 total
```

**Jeśli testy się nie uruchamiają:**
```bash
# Najpierw zainstaluj dev dependencies
npm install --save-dev jest @types/jest ts-jest

# Potem spróbuj ponownie
npm test
```

---

### 2.2 TypeScript type checking

```bash
cd C:\Users\andrz\Downloads\AdRide\app
npm run typecheck

# Powinno być: ✓ No errors
```

**Jeśli są błędy:**
- Sprawdź czy wszystkie `@types/` pakiety zainstalowane: `npm install --save-dev @types/node @types/react @types/react-dom`

---

### 2.3 Build validation (Next.js)

```bash
cd C:\Users\andrz\Downloads\AdRide\app
npm run build

# Powinno skończyć się z: ✓ Compiled successfully
```

**Jeśli build faile:**
- Sprawdź logi — mogą wskazywać brakujące env vars
- Czasowo ustaw: `NEXT_PUBLIC_SITE_URL=http://localhost:3000`

---

### 2.4 Mobile TypeScript check

```bash
cd C:\Users\andrz\Downloads\AdRide\mobile
npm run typecheck
```

---

## 📋 CZĘŚĆ 3: BAZA DANYCH — MIGRACJE I RLS

### 3.1 Deploy Supabase migrations

```bash
cd C:\Users\andrz\Downloads\AdRide\app

# Pokaż migracje do wykonania
supabase migration list

# Deploy wszystkie migracje
supabase migrate up

# Lub specific migration:
supabase migrate up --select 20260101000019  # proof_photos migration
```

**Co się stanie:**
- Dodana tabela `proof_photos` z kolumnami: `id, campaign_id, driver_id, photo_url, gps_lat, gps_lon, created_at, updated_at`
- Storage bucket `proofs` (private) stworzony
- RLS policies dodane (kierowcy mogą czytać/pisać tylko swoje zdjęcia)
- Indeksy na `campaign_id, driver_id, created_at` dla szybkich queryów

**Weryfikacja:**
```sql
-- W Supabase SQL Editor
SELECT table_name FROM information_schema.tables WHERE table_schema='public';
-- Powinna być: proof_photos

-- Sprawdź RLS is enabled
SELECT * FROM pg_tables WHERE schemaname='public' AND tablename='proof_photos';
-- rowsecurity powinny być "on"
```

---

### 3.2 Storage bucket RLS setup

```bash
# W Supabase Dashboard:
1. Idziesz do Storage > Buckets
2. Klikasz na "proofs" bucket
3. Policies tab:
   - SELECT (allow): auth.uid() = owner w ścieżce /proofs/{driver_id}/*
   - INSERT (allow): auth.uid() = owner w ścieżce /proofs/{driver_id}/*
   - DELETE (allow): auth.uid() = owner w ścieżce /proofs/{driver_id}/*
```

*Automatycznie dodane w migracji 000019. Jeśli nie masz jej, skonfiguruj ręcznie powyżej.*

---

## 📋 CZĘŚĆ 4: STRIPE CONNECT SETUP

### 4.1 Stripe account setup

1. Utwórz konto na https://stripe.com/
2. Przejdź do **Stripe Dashboard → Developers → API keys**
3. Skopiuj:
   - **Secret Key** (zaczyna się `sk_test_...`) — przechowaj bezpiecznie
   - **Publishable Key** (zaczyna się `pk_test_...`)

---

### 4.2 Webhook endpoint configuration

```
1. Stripe Dashboard → Developers → Webhooks
2. Klikaj "+ Add endpoint"
3. Endpoint URL: https://yourdomain.com/functions/v1/stripe-webhook
   (lub na dev: https://your-supabase-project.supabase.co/functions/v1/stripe-webhook)
4. Events to send:
   ✓ payment_intent.succeeded
   ✓ transfer.created
   ✓ account.updated
5. Klikaj "Add endpoint"
6. Skopiuj Signing secret (`whsec_...`)
```

---

### 4.3 Environment variables — Supabase Vault (KRYTYCZNE!)

```bash
cd C:\Users\andrz\Downloads\AdRide\app

# W Supabase Dashboard:
# 1. Idziesz do Project Settings → Vault
# 2. Klikasz "New Secret"
# 3. Dodaj te secrety:

# Secret 1
Name: STRIPE_SECRET_KEY
Value: sk_test_XXXX... (z kroku 4.1)

# Secret 2
Name: STRIPE_WEBHOOK_SECRET
Value: whsec_... (z kroku 4.2)
```

**Weryfikacja:**
```bash
supabase secrets list
# Powinny być widoczne: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
```

---

### 4.4 Environment variables — Next.js .env.local

```bash
# W C:\Users\andrz\Downloads\AdRide\app\.env.local

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_XXXX...
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # Na dev
# Albo na produkcji: https://yourdomain.com

NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

---

### 4.5 Stripe Connect platform fee

W `app/app/api/stripe/payment-intent/route.ts`, linia ~85:

```typescript
application_fee_amount: Math.round(amountGrosze * 0.15), // 15% platform fee
```

Zmień 0.15 na swoją pożądaną prowizję (np. 0.10 dla 10%).

---

## 📋 CZĘŚĆ 5: SUPABASE EDGE FUNCTIONS

### 5.1 Deploy webhook handler

```bash
cd C:\Users\andrz\Downloads\AdRide\app

supabase functions deploy stripe-webhook
```

**Co się stanie:**
- Function dostępna na: `https://your-project.supabase.co/functions/v1/stripe-webhook`
- Automatycznie waliduje HMAC signature
- Zapisuje eventy do `stripe_events` tabeli (dla idempotency i auditingu)

**Weryfikacja:**
```bash
supabase functions list
# Powinna być widoczna: stripe-webhook

# Sprawdź logi
supabase functions list
supabase functions logs stripe-webhook
```

---

### 5.2 Test webhook — local development

```bash
# Terminal 1: uruchom local Supabase
cd C:\Users\andrz\Downloads\AdRide\app
supabase start

# Terminal 2: uruchom webhooks listener (localnie debuguj)
curl -X POST http://127.0.0.1:54321/functions/v1/stripe-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "id": "evt_test",
    "type": "payment_intent.succeeded",
    "data": {"object": {"id": "pi_test", "client_secret": "secret"}}
  }'
```

**Oczekiwany wynik:** `200 OK` (lub w logach): `Event recorded: evt_test`

---

## 📋 CZĘŚĆ 6: MOBILE APP — PROOF PHOTOS SETUP

### 6.1 Expo permissions — app.json

```json
{
  "expo": {
    "plugins": [
      [
        "expo-camera",
        {
          "cameraPermission": "Pozwolić aplikacji na dostęp do aparatu?",
          "microphonePermission": "Pozwolić aplikacji na dostęp do mikrofonu?"
        }
      ],
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Pozwolić aplikacji na dostęp do lokalizacji?"
        }
      ]
    ]
  }
}
```

---

### 6.2 Supabase client setup — mobile/src/lib/supabase-mobile.ts

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

---

### 6.3 Navigation setup — ProofGalleryScreen entry point

W `mobile/src/navigation/AppNavigator.tsx`, dodaj do `<Stack.Navigator>`:

```typescript
<Stack.Screen 
  name="ProofGallery"
  component={ProofGalleryScreen}
  options={{ title: 'Zdjęcia dowodowe' }}
/>
```

W `mobile/src/screens/DashboardScreen.tsx`, dodaj button:

```typescript
<TouchableOpacity 
  onPress={() => navigation.navigate('ProofGallery')}
  style={styles.button}
>
  <Text>📸 Zdjęcia dowodowe</Text>
</TouchableOpacity>
```

---

## 📋 CZĘŚĆ 7: LOKALNY DEVELOPMENT SERVER

### 7.1 Run Next.js dev server (webapp)

```bash
cd C:\Users\andrz\Downloads\AdRide\app
npm run dev

# Powinna być dostępna na http://localhost:3000
```

**Test links:**
- http://localhost:3000 — Fleet Dashboard
- http://localhost:3000/api/stripe/payment-intent — (POST test)
- http://localhost:3000/api/stripe/connect-link — (POST test)

---

### 7.2 Run Expo dev server (mobile)

```bash
cd C:\Users\andrz\Downloads\AdRide\mobile
npx expo start

# Powinna być dostępna na:
# http://localhost:8081 (web simulator)
# Lub skanuj QR code na Android/iOS
```

---

## 📋 CZĘŚĆ 8: SMOKE TESTING (PEŁNE TESTY END-TO-END)

### Test 1: Login flow (mobile)

```
1. Otwórz aplikację mobilną (expo start)
2. Wpisz email: test@example.com
3. Wpisz hasło: password123
4. Klikaj "Zaloguj"
   ✓ Powinna być zalogowana (redirect do Dashboard)
   ✗ Jeśli błąd: sprawdź czy user istnieje w Supabase
```

---

### Test 2: Proof photo capture + upload

```
1. W Dashboard, klikaj "📸 Zdjęcia dowodowe"
2. Klikaj "Zrób zdjęcie"
3. Pozwól na dostęp do aparatu
4. Tak zdjęcie (lub pominąć na iOS simulator)
5. Powinna być upload do Supabase Storage
   ✓ Zdjęcie pojawiają się w galerii
   ✗ Jeśli fails: sprawdź:
     - Czy bucket "proofs" stworzony w Storage
     - Czy RLS policies ustawione
     - Czy user zAuthentykowany
```

---

### Test 3: Stripe payment intent creation

```bash
# Terminal w app/ directory
curl -X POST http://localhost:3000/api/stripe/payment-intent \
  -H "Content-Type: application/json" \
  -d '{
    "driverId": "6d7a3f4a-1c9e-4a2b-8d1f-9e2c3b4a5f6d",
    "amountGrosze": 50000,
    "campaignId": "b9c3e4f5-6a7b-8c9d-0e1f-2a3b4c5d6e7f"
  }'
```

**Oczekiwany wynik:**
```json
{
  "clientSecret": "pi_XXXX_secret_YYYY",
  "publishableKey": "pk_test_...",
  "driverId": "6d7a...",
  "amountGrosze": 50000
}
```

**Jeśli błąd:**
- `401 Unauthorized` → sprawdź czy SUPABASE_SERVICE_ROLE_KEY w Vault
- `400 Bad Request` → sprawdź czy driverId jest valida UUID

---

### Test 4: Stripe Connect onboarding flow

```
1. W webapie: POST /api/stripe/connect-link
   Body: { "driverId": "6d7a..." }
2. Powinna zwrócić: { "accountLink": "https://connect.stripe.com/..." }
3. Kierowca klikaj link → Stripe onboarding
4. Po onboardingu, `/api/stripe/connect-status?driverId=6d7a...` powinna zwrócić:
   {
     "chargesEnabled": true,
     "payoutsEnabled": true,
     "requiresAction": false
   }
```

---

### Test 5: Webhook verification

```bash
# Symuluj Stripe webhook event:
TIMESTAMP=$(date +%s)
SECRET="whsec_test_secret"  # z kroku 4.2

# Supabase Edge Function:
curl -X POST \
  https://your-project.supabase.co/functions/v1/stripe-webhook \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: t=$TIMESTAMP,v1=SIGNATURE" \
  -d '{
    "id": "evt_1234567890",
    "type": "payment_intent.succeeded",
    "data": {
      "object": {
        "id": "pi_test123",
        "metadata": {
          "driver_id": "6d7a3f4a-1c9e-4a2b-8d1f-9e2c3b4a5f6d",
          "campaign_id": "b9c3e4f5-6a7b-8c9d-0e1f-2a3b4c5d6e7f"
        }
      }
    }
  }'
```

**Oczekiwany wynik:** `200 OK` + event zapisany w `stripe_events`

---

## 📋 CZĘŚĆ 9: PRODUCTION DEPLOYMENT

### 9.1 Environment variables — Production setup

```bash
# W Supabase Dashboard → Project Settings → API:

NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROD_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PROD_ANON_KEY

# W Supabase Vault (na production):
STRIPE_SECRET_KEY=sk_live_XXXX  # (not test key!)
STRIPE_WEBHOOK_SECRET=whsec_live_...
SUPABASE_SERVICE_ROLE_KEY=...  # (secure storage only)
```

### 9.2 Stripe production webhook endpoint

```
Powtórz kroki 4.1-4.2, ale zamiast `pk_test_...` używaj:
- pk_live_... (publishable key)
- sk_live_... (secret key)
- whsec_live_... (webhook secret)
```

### 9.3 Deploy to Vercel (Next.js)

```bash
cd C:\Users\andrz\Downloads\AdRide\app

# Zainstaluj Vercel CLI
npm install -g vercel

# Deploy
vercel deploy --prod

# Dodaj environment variables w Vercel dashboard:
# Project Settings → Environment Variables
# Dodaj: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, NEXT_PUBLIC_SITE_URL
```

### 9.4 Build + deploy mobile to App Store / Google Play

```bash
cd C:\Users\andrz\Downloads\AdRide\mobile

# EAS Build (Expo service)
eas build --platform all --auto-submit

# Lub manual build → upload do respective stores
```

---

## ⚠️ CZĘŚĆ 10: ZNANE ZAGROŻENIA I CHECKLIST BEZPIECZEŃSTWA

### Secure checklist PRZED production:

- [ ] **STRIPE_SECRET_KEY** — przechowywany tylko w Supabase Vault (nigdy w .env!)
- [ ] **STRIPE_WEBHOOK_SECRET** — zweryfikowany w webhook handleru (HMAC-SHA256)
- [ ] **RLS policies** — ustawione na `proof_photos`, `gps_points`, `gps_sessions`
- [ ] **Storage bucket** — `proofs` jest PRIVATE (nie public!)
- [ ] **Email validation** — regex `^[^\s@]+@[^\s@]+\.[^\s@]+$` na formach
- [ ] **UUID validation** — driver_id i campaign_id zawsze validateRFull
- [ ] **Rate limiting** — Supabase API Gateway ustawiony na ~1000 req/sec per user
- [ ] **CORS** — skonfigurowany dla twojej domeny (nie `*`)
- [ ] **Szyfrowanie w transicie** — HTTPS everywhere (Supabase + Vercel domyślnie)

### Known risks (do monitora):

1. **GPS data retention** — `gps_points` mogą być duże; archiwizuj stare dane
2. **Photo storage** — `proofs` bucket rosnąć; ustaw lifecycle policy (90 dni?)
3. **Stripe transfers** — Transfers do driver accounts mogą failować (brak bank info) — add retry logic
4. **Session tokens** — Supabase auto-refreshes, ale sprawdź logs na `invalid_grant`

---

## 📋 CZĘŚĆ 11: TROUBLESHOOTING

### Problem: `npm test` faile z "Cannot find module 'jest'"

```bash
npm install --save-dev jest ts-jest @types/jest jest-environment-jsdom
npm test
```

---

### Problem: Supabase migration fails z "permission denied"

```bash
# Sprawdź czy masz dostęp do project
supabase status

# Jeśli nie, relink:
supabase unlink
supabase link --project-ref YOUR_PROJECT_ID
```

---

### Problem: Stripe webhook returns 401 Unauthorized

**Powody:**
1. `STRIPE_WEBHOOK_SECRET` nie w Vault — add it
2. HMAC signature verification failuje — sprawdź czy timestamp w limicie 5 minut
3. `STRIPE_SECRET_KEY` nie w Vault — add it

**Fix:**
```bash
# Sprawdź Vault secrets
supabase secrets list

# Jeśli brakuje:
supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_..."
supabase secrets set STRIPE_SECRET_KEY="sk_test_..."
```

---

### Problem: Photo upload fails z "bucket not found"

```bash
# W Supabase Dashboard:
1. Storage → Buckets
2. Czy jest bucket "proofs"?
3. Jeśli nie, stwórz: New Bucket → proofs → Private

# Sprawdź RLS policies:
Storage → proofs → Policies
# Powinny mieć: SELECT/INSERT/DELETE allow auth.uid() = {driver_id}
```

---

### Problem: Mobile app crashes na ProofGalleryScreen

**Powody:**
1. `expo-camera` v15 — sprawdź czy facing="back" (nie CameraType.back)
2. Missing imports — `useRef`, `useCallback`
3. isMountedRef — czy jest w useEffect cleanup?

**Fix:**
```bash
cd mobile
npm install expo-camera@latest
npm run typecheck
```

---

## ✅ SUMMARY — CO ZROBIĆ TERAZ (KOLEJNOŚĆ)

1. **npm install** (oba katalogu) — 5 min
2. **Run tests** (`npm test` w app/) — 2 min
3. **Setup Stripe account** (stripe.com) — 15 min
4. **Setup Supabase Vault secrets** — 5 min
5. **Deploy migrations** (`supabase migrate up`) — 2 min
6. **Deploy Edge Function** (`supabase functions deploy stripe-webhook`) — 2 min
7. **Setup .env.local** w app/ — 2 min
8. **Run dev servers** (`npm run dev` + `expo start`) — 2 min
9. **Smoke tests** — 10 min
10. **Go live** — 🚀

**Total time:** ~45 minut od zera do działającego systemu.

---

## 🔗 HELPFUL LINKS

- **Stripe Dashboard:** https://dashboard.stripe.com/
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Expo Docs:** https://docs.expo.dev/
- **Next.js Docs:** https://nextjs.org/docs
- **Supabase CLI:** https://supabase.com/docs/guides/cli

---

**Status:** Gotowe do implementacji ✅  
**Ostatnia aktualizacja:** 2026-05-21
