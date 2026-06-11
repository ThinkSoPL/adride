# Stripe + Supabase Setup — Instrukcja Krok po Kroku

**Status:** Claude stworzył pliki. Czekaj na manualny setup Supabase.
**Czas:** ~45 minut od zera do działającego webhooków.

---

## 🔵 KROK 1: Utwórz projekt Supabase

```
1. Idź na: https://supabase.com/dashboard
2. Kliknij: "New Project"
3. Wypełnij:
   - Name: adride
   - Database Password: ZAPISZ GDZIEŚ (będzie potrzebny)
   - Region: Central EU (Frankfurt)
4. Kliknij: "Create new project"
5. Czekaj ~2 minuty na provisioning (patrz animation)
```

**Kiedy gotowe:** zobaczysz Dashboard z SQL Editor, Storage, Functions itp.

---

## 🔵 KROK 2: Skopiuj klucze Supabase

W Supabase Dashboard:

```
1. Kliknij: Project Settings (gear icon, prawy górny róg)
2. Kliknij: "API" (z lewego menu)
3. Skopiuj do notatnika (te 3):
   - Project URL (https://xxxxx.supabase.co)
   - anon public key (eyJhbGc...)
   - service_role secret key (eyJhbGc...)
```

**Będą potrzebne za chwilę.**

---

## 🔵 KROK 3: Skopiuj klucze Stripe

W Stripe Dashboard:

```
1. Idź na: https://dashboard.stripe.com
2. (Upewnij się, że jesteś w TEST mode — lewy górny róg)
3. Kliknij: Developers (lewy sidebar)
4. Kliknij: API Keys
5. Skopiuj do notatnika (te 2):
   - Publishable key (pk_test_...)
   - Secret key (sk_test_...)
```

---

## 🔵 KROK 4: Wypełnij `.env.local` w APP

```powershell
# Otwórz: C:\Users\andrz\Downloads\AdRide\app\.env.local
# Zamień YOUR_... wartościami ze KROKÓW 2 i 3:

NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co          # z KROKU 2
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...                    # z KROKU 2
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...                        # z KROKU 2

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...              # z KROKU 3
STRIPE_SECRET_KEY=sk_test_...                               # z KROKU 3
STRIPE_WEBHOOK_SECRET=whsec_test                            # PLACEHOLDER NA RAZIE
```

**Zapamiętaj:**
- `STRIPE_WEBHOOK_SECRET` zmienimy po dodaniu webhooków (KROK 8)
- `.env.local` powinny być w `.gitignore` (powinno być)

---

## 🔵 KROK 5: Zainstaluj + zaloguj Supabase CLI

```powershell
# Terminal (PowerShell)

# 1. Zainstaluj
winget install Supabase.CLI

# 2. Zaloguj się
supabase login
# → Otworzy przeglądarkę, zaloguj się na supabase.com
```

---

## 🔵 KROK 6: Link projekt Supabase do lokalnego

```powershell
# W terminalu, przejdź do app/
cd C:\Users\andrz\Downloads\AdRide\app

# Link do projektu
supabase link --project-ref YOUR_PROJECT_ID
# WHERE: YOUR_PROJECT_ID = ostatni segment URL z KROKU 2
# Np. jeśli URL = https://abcdef123.supabase.co
#     to PROJECT_ID = abcdef123

# Potwierdzenie
supabase status
# Powinna pokazać: ✓ Linked to project abcdef123
```

---

## 🔵 KROK 7: Deploy migracji (tworzy tabele w bazie)

```powershell
cd C:\Users\andrz\Downloads\AdRide\app

supabase db push
# Powinna wgrać 19 migracji:
# - drivers, campaigns, vehicles, payouts, stripe_events, itd.
```

**Weryfikacja:** W Supabase Dashboard → SQL Editor, uruchom:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema='public' 
ORDER BY table_name;
```
Powinna być widoczna: `stripe_events`, `payouts`, `drivers`, itd.

---

## 🔵 KROK 8: Ustaw sekrety Edge Functions

```powershell
cd C:\Users\andrz\Downloads\AdRide\app

supabase secrets set \
  STRIPE_SECRET_KEY="sk_test_YOUR_SECRET" \
  STRIPE_WEBHOOK_SECRET="whsec_test" \
  SUPABASE_SERVICE_ROLE_KEY="eyjhbGc..."

# Weryfikacja
supabase secrets list
# Powinna być widoczna lista tych 3 sekretów
```

---

## 🔵 KROK 9: Deploy Edge Function

```powershell
cd C:\Users\andrz\Downloads\AdRide\app

supabase functions deploy stripe-webhook

# Powinna zwrócić URL:
# ✓ Deployed stripe-webhook to https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook
```

---

## 🔵 KROK 10: Konfiguruj Stripe Webhook

W Stripe Dashboard:

```
1. Idź na: Developers → Webhooks (lewy sidebar)
2. Kliknij: "+ Add endpoint"
3. Endpoint URL: https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook
   (WHERE: YOUR_PROJECT = z KROKU 2)
4. Events to send (zmień z Select events):
   ✓ payment_intent.succeeded
   ✓ transfer.created
   ✓ account.updated
5. Kliknij: "Add endpoint"
6. Kliknij na endpoint → skopiuj "Signing secret" (whsec_...)
```

**Zaktualizuj sekret w Supabase:**
```powershell
supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_PRAWDZIWY_Z_STRIPE"
```

---

## 🔵 KROK 11: Weryfikacja — Testy

```powershell
cd C:\Users\andrz\Downloads\AdRide\app

# 1. Zainstaluj zależności
npm install

# 2. Uruchom testy (26 powinno przejść)
npm test

# Oczekiwany wynik:
# PASS  src/features/stripe/lib/__tests__/stripe-form.test.ts
# PASS  src/features/impressions-calculator/lib/__tests__/calculator.test.ts
# PASS  src/features/fleet-dashboard/lib/__tests__/calculations.test.ts
# Test Suites: 3 passed
# Tests:       26 passed
```

---

## 🔵 KROK 12: Dev Server

```powershell
# Terminal 1: Next.js webapp
cd C:\Users\andrz\Downloads\AdRide\app
npm run dev
# → http://localhost:3000

# Terminal 2 (opcjonalnie): Expo mobile app
cd C:\Users\andrz\Downloads\AdRide\mobile
npx expo start
# → http://localhost:8081
```

---

## 🔵 KROK 13: Smoke Test — Payment Intent

```powershell
# Terminal, w app/ directory

curl -X POST http://localhost:3000/api/stripe/payment-intent `
  -H "Content-Type: application/json" `
  -d '{
    "driverId": "6d7a3f4a-1c9e-4a2b-8d1f-9e2c3b4a5f6d",
    "amountGrosze": 50000,
    "campaignId": "b9c3e4f5-6a7b-8c9d-0e1f-2a3b4c5d6e7f"
  }'

# Oczekiwany wynik (JSON):
# {"clientSecret":"pi_..._secret_...","publishableKey":"pk_test_...","driverId":"6d7a...","amountGrosze":50000}
```

Jeśli zwróci `clientSecret` → **OK! Stripe + Next.js działają.**

---

## 🟢 Status: GIT READY

```powershell
# Sprawdź czy .env.local w .gitignore
cat C:\Users\andrz\Downloads\AdRide\app\.gitignore | Select-String "env.local"
# Powinna być widoczna: .env.local

# Wszystko gotowe do gita
git status
# Powinna być: .env.local (ignored), config.toml (new), stripe-webhook fix (modified)
```

---

## ❌ Troubleshooting

| Problem | Rozwiązanie |
|---------|-------------|
| `supabase: command not found` | Zainstaluj CLI: `winget install Supabase.CLI` |
| `Error: Unauthorized (401)` przy `supabase link` | Zaloguj się: `supabase logout` → `supabase login` |
| `error: cannot find STRIPE_WEBHOOK_SECRET` przy `functions deploy` | Ustaw sekrety: `supabase secrets set STRIPE_WEBHOOK_SECRET="..."` |
| Testy failują | `npm install` → `npm test` |
| Payment intent zwraca 401 | Sprawdź czy `.env.local` ma wszystkie klucze |

---

## 🎯 Gdy wszystko działa

1. ✅ 26 testów przechodzi
2. ✅ Stripe payment intent response zwraca `clientSecret`
3. ✅ Edge Function na Supabase działa
4. ✅ Webhook endpoint dodany w Stripe

**Kolejny krok:** Pozyskanie 10 kierowców + 3 reklamodawców → kampania pilotażowa.

---

**Pytania? Odpowiadamy na nich w repo lub zdokumentuj w CLAUDE.md.**
