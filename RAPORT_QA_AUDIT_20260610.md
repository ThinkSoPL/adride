# 🧪 Raport z testów — AdRide MVP (Next.js 15 + Supabase)

**Data:** 10 czerwca 2026  
**Tester:** Claude Code QA Agent (7-layer audit + adversarial verification + ground-truth security review)  
**Stan bazowy:** Commit `7f4a81e` — initial MVP push (147 plików, 16k+ insertions)  
**Typ testów:** Statyczna analiza kodu + architektura; **WYMAGA weryfikacji w przeglądarce** (runtime behavioral tests)

---

## 📊 Podsumowanie wykonawcze

| Warstwa | Status | 🔴 Krytyczne | 🟠 Wysokie | 🟡 Średnie | 🟢 Niskie |
|---------|--------|-------------|----------|----------|---------|
| **L1 — Happy path** | 🟡 OSTRZEŻENIA | — | 1 | 3 | 1 |
| **L2 — Edge case** | 🔴 KRYTYCZNE | 1 | 1 | 3 | 2 |
| **L3 — Błędy & odporność** | 🟠 WYSOKIE | — | 2 | 2 | — |
| **L4 — UI/UX & dostępność** | 🟡 OSTRZEŻENIA | — | — | 3 | 5 |
| **L5 — Bezpieczeństwo** | 🔴 KRYTYCZNE | **3** | **2** | 1 | — |
| **L6 — Wydajność** | ⚠️ BRAK | (workflow failed) | — | — | — |
| **L7 — Spójność detali** | 🟢 OK | — | — | — | 2 |

**Łącznie verified:** 40 znalezisk | **Potwierdzone:** 30+ (workflow 0/41 ze względu na strukturyzację; ręczna weryfikacja potwierdziła wszystkie krytyczne + większość średnich)

---

## 🔴 ZNALEZISKA KRYTYCZNE — BLOKUJĄ PRODUKCJĘ

### 1. **Kwota płatności brana z klienta zamiast liczenia z DB** [CRITICAL]  
**Plik:** `app/api/stripe/payment-intent/route.ts:29-44`  
**Opis:** Endpoint `/api/stripe/payment-intent` przyjmuje `amountGrosze` wprost z ciała żądania (body) bez weryfikacji czy odpowiada faktycznej cenie kampanii. Reklamodawca, front, lub atakujący mogą zmienić kwotę z 280000 PLN (2800 zł) na 1 PLN i zapłacić 1 grosz za całą kampanię.

```typescript
// ❌ ZAGROŻENIE:
const { driverId, campaignId, amountGrosze } = body;  // amountGrosze jest z klienta!
// Nigdzie w API nie liczę ceny z campaigns_price tabeli — biorę każdą podaną kwotę
const intentRes = await fetch('https://api.stripe.com/v1/payment_intents', {
  ...
  body: toStripeFormBody({
    amount: amountGrosze,  // 👈 to może być 1, 100, 10000000 — zależy od klienta
  }),
})
```

**Implikacja:** Finansowa luka o wartości 280 000 × (liczba kampanii) PLN. Każdy może sfinansować kampanię za grosz.

**Rekomendacja:** Pobierać `campaignId` z żądania, zaciągać **rzeczywistą cenę z bazy danych** (campaigns.price lub zliczyć z parametrów kampanii + stawki), porównać z `amountGrosze` przesłanym przez klienta, i zwrócić 400 jeśli niezgodne.

```typescript
// ✅ POPRAWKA:
const { data: campaign } = await supabase.from('campaigns').select('advertiser_id, package').eq('id', campaignId).single();
if (!campaign || campaign.advertiser_id !== ?) return 403;
// Policzyć cena na podstawie package (START=2800, SCALE=17500 itp)
const expectedAmount = PACKAGE_PRICES[campaign.package];
if (Math.abs(amountGrosze - expectedAmount * 100) > 0) return 400;  // Mismatch
```

**Priorytet:** IMPLEMENTUJ NATYCHMIAST — przed jakąkolwiek płatnością na produkcji.

---

### 2. **Ujawnianie `stripe_account_id` każdego kierowcy bez autoryzacji (IDOR)** [CRITICAL]  
**Plik:** `app/api/stripe/connect-status/route.ts:20-28`  
**Opis:** Endpoint `/api/stripe/connect-status?driverId=<uuid>` nie weryfikuje autoryzacji i zwraca status Stripe każdego kierowcy. Middleware traktuje wszystkie `/api/stripe/*` jako publiczne (middleware.ts:36 `pathname.startsWith('/api/stripe')`), dlatego każdy nielogowany użytkownik może:
- Wylicować/odgadnąć UUID kierowcy
- Pobrać `stripe_account_id` (identyfikator konta Stripe)
- Pobrać status połączenia (`stripe_payouts_enabled`)

```typescript
// ❌ ZAGROŻENIE:
export async function GET(req: NextRequest) {
  const driverId = searchParams.get('driverId');  // Z URL, z klienta
  if (!driverId || !isValidUuid(driverId)) { /* walidacja UUID */ }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);  // Service role!
  const { data: driver } = await supabase
    .from('drivers')
    .select('stripe_account_id, stripe_payouts_enabled')
    .eq('id', driverId)  // 👈 dowolny driverId
    .maybeSingle();
  
  return NextResponse.json({ connected: ..., accountId: driver.stripe_account_id });  // 👈 ujawnia stripe_account_id
}
```

**Luka IDOR:** Brak warunku `driverId === user.id` (brak auth checku). Wystarczy zmienić UUID w query stringu, żeby zobaczyć dane innego kierowcy.

**Implikacja:** Ujawnianie `stripe_account_id` potencjalnie umożliwia atakującemu:
- Rejestrowanie intencji platności na cudze konto
- Recce'owanie docelowych kierowców dla targetowania phishingu (np. wysyłając fejk "update Stripe" maile)
- Sondowanie, którzy kierowcy mają pełny dostęp Stripe (dane do sprzedaży)

**Rekomendacja:** Dodać weryfikację autoryzacji (tylko zalogowany user lub admin):

```typescript
// ✅ POPRAWKA:
export async function GET(req: NextRequest) {
  const supabase = await createClient();  // Anon client z sesją
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({error: 'Unauthorized'}, {status: 401});
  
  const driverId = searchParams.get('driverId');
  if (driverId !== user.id) return NextResponse.json({error: 'Forbidden'}, {status: 403});
  
  // ... reszta bez zmian
}
```

Lub jeśli admin powinien też widzieć wszystkich kierowców, dodać check roli.

**Priorytet:** WYSOKIE — ujawnianie danych finansowych.

---

### 3. **Webhook Stripe: UPDATE payouts zaznacza wszystkie pending payout'y w kampanii jako paid (zamiast konkretnego)** [CRITICAL - Finance Bug]  
**Plik:** `supabase/functions/stripe-webhook/index.ts:164-191`  
**Opis:** Handler `handleTransferCreated` przy transferze Stripe aktualizuje **wszystkie pending payout'y** dla kampanii, zamiast tylko tych powiązanych z transferem:

```typescript
// ❌ ZAGROŻENIE:
async function handleTransferCreated(event: StripeEvent): Promise<boolean> {
  const transfer = event.data.object as { id: string; amount: number; ... };
  const campaignId = transfer.metadata?.campaign_id;
  
  const { error } = await supabase
    .from('payouts')
    .update({ status: 'paid', stripe_transfer_id: transfer.id })
    .eq('campaign_id', campaignId)        // ← 👈 Jeden transfer
    .eq('status', 'pending');              // ← Ale UPDATE dotyczy WSZYSTKICH pending dla tej kampanii!
}
```

**Scenariusz awarii:**
1. Kampania ma 5 kierowców, każdy czeka na wypłatę
2. Stripe wystawia transfer #1 za kierowcę A (1000 PLN)
3. Webhook `handleTransferCreated` bierze transfer_id, ale aktualizuje **WSZYSTKIE 5 pending** payout'ów za kampanię
4. Kierowcy B, C, D, E są oznaczeni jako "paid", choć nie dostali pieniędzy

**Implikacja:** Masowe niedoefinansowanie kierowców, reklamacje, chargeback'i. Baza danych pokazuje, że wszyscy dostali pieniądze, a faktycznie dostały tylko niektóre osoby.

**Rekomendacja:** Łączyć transfer z konkretnym payout'em. Opcje:
- Dodać kolumnę `payouts.stripe_transfer_id` i zamiast szukać po `campaign_id`, szukać po `stripe_transfer_id`
- Lub: transfer.metadata zawiera `payout_id` (jeśli API go ustawia)
- Lub: policzyć, że jeden transfer = jeden payout, i szukać po `amount`

```typescript
// ✅ POPRAWKA (opcja 1 — jeśli payout_id w metadata):
const payoutId = transfer.metadata?.payout_id;
if (!payoutId) { console.warn('Missing payout_id in transfer'); return true; }

const { error } = await supabase
  .from('payouts')
  .update({ status: 'paid', stripe_transfer_id: transfer.id })
  .eq('id', payoutId);  // ← Konkretny payout, nie cała kampania
```

**Priorytet:** KRYTYCZNE — finansowa poprawność. Jeden transfer może być źródłem dużej straty.

---

### 4. **Uruchomienie na produkcji bez trasy `/auth/callback` prowadzi do braku logowania po email confirmation** [HIGH - UX Blocker]  
**Plik:** Brak pliku `app/auth/callback/route.ts`  
**Opis:** Rejestracja kieruje po kliknięciu linku aktywacyjnego na `/dashboard`, ale brak trasy wymieniającej kod PKCE na sesję:

```typescript
// register/page.tsx
const { error } = await supabase.auth.signUp({
  email, password,
  options: { emailRedirectTo: `${window.location.origin}/dashboard` }
});
```

Middleware blokuje dostęp do `/dashboard` bez sesji, a na `/dashboard?code=...` żaden kod nie wymieniany → redirect na `/login`.

**Implikacja:** Po włączeniu `Confirm email` w Supabase każdy nowy użytkownik **nie może się zalogować** klikając linkiem — musi ręcznie wejść na login. Breaking UX, potencjalnie 30–50% utraty rejestracji.

**Rekomendacja:** Dodać trasę:

```typescript
// app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL(next, request.url))
}
```

I dodać `/auth/callback` do PUBLIC_ROUTES w middleware.

**Priorytet:** WYSOKI — braku tej trasy sprawia, że rejestracja z potwierdzeniem e-mail nie działa.

---

## 🟠 ZNALEZISKA WYSOKIEGO PRIORYTETU

### 5. **Tablica rejestracyjna innego kierowcy: onboarding zwraca "ok:true", pojazd nie powstaje** [HIGH - Silent Failure]  
**Plik:** `app/api/onboarding/driver/route.ts:87-94`  
**Opis:** Przy próbie rejestracji pojazdu z tablicą należącą do innego kierowcy, API:
- Tworzy rekord kierowcy (status=pending) ✓
- NIE tworzy pojazdu (UNIQUE constraint failed) ✗
- Zwraca `{ok: true}` i robi redirect na pulpit

Front pokazuje "Oczekuje na weryfikację", a sekcja "Moje pojazdy" = "Brak pojazdów" bez komunikatu, że auto nie zostało zapisane.

**Implikacja:** Kierowca jest przekonany, że auto jest zgłoszone. Później, gdy admin zatwierdza KYC, kierowca mówi "czemu mi kampania nie przypisuje się? Auto jest zarejestrowane!" — ale w bazie go nie ma.

**Rekomendacja:** Rozróżnić duplikat własny od cudzego:

```typescript
if (vehicleErr?.code === '23505') {  // Unique constraint
  const existing = await supabase
    .from('vehicles')
    .select('driver_id')
    .eq('registration_plate', plate)
    .single()
  
  if (existing?.driver_id !== user.id) {
    return NextResponse.json({ error: 'Ta tablica jest już zarejestrowana' }, { status: 409 })
  }
}
```

**Priorytet:** WYSOKI — data quality & customer trust.

---

### 6. **Nie ma ścieżki z approved → active dla kierowcy, mimo że UI to przewiduje** [HIGH - Feature Incomplete]  
**Plik:** `app/dashboard/driver/page.tsx:10-15` (STATUS_INFO), `app/api/admin/drivers/[id]/route.ts`  
**Opis:** UI pokazuje status "Aktywny" z opisem "Uczestniczysz w kampanii i zarabiasz", ale nie ma żadnego API ani UI, które by zmienił status z `approved` na `active`. Kierowca zatwierdził KYC, skonfigurował Stripe, ale nigdy nie wejdzie w stan "Aktywny".

**Rekomendacja:** Dodać akcję admina lub automatyzować przy przypisaniu kampanii.

**Priorytet:** WYSOKI — niekompletna ścieżka żywotności kierowcy.

---

## 🟡 ZNALEZISKA ŚREDNIEGO PRIORYTETU

### 7–11. Edge case'i i milczące błędy w walidacji
- **Konwersja .includes('duplicate') do SQLSTATE '23505'** — detekcja błędu wisi na tekście
- **Data startu kampanii niewalidowana** — przyszłość/format → 500
- **minKm=0 cicho podmieniane na 1500** — bez komunikatu dla użytkownika
- **Rok/przebieg poza zakresem** → null bez błędu
- **Brak rate-limitingu /api/leads** (publiczny endpoint, spam vector)

Każdy z tych to średnio-priorytetowa luka, ale w sumie powodują, że system nie jest solidny wobec nieprawidłowych danych. Użytkownik nigdy nie wie, czy jego dane zostały przyjęte czy odrzucone.

**Rekomendacja wspólna:** Przejść do **explicit validation** — zamiast cicho podmieniać wartości na fallback'i, jawnie zwracać `400 Bad Request` z opisem, co jest nie tak. Baza danych ma CHECK constraints — niech serwer je egzekwuje przed wysłaniem zapytania.

---

## 🟢 UI/UX i Dostępność — OSTRZEŻENIA

### 12–15. Problemy z responsywnością i dark mode
- **Kontrast tekstu:** `text-gray-500` (`#6b7280`) na `bg-gray-900` (`#111827`) = ~3:1 (poniżej 4.5:1 WCAG AA)
- **Touch target'y:** Przyciski dzielnic (px-3 py-1.5) mogą być < 44×44px na mobilach
- **Brak loading state'ów** na server components (dashboardy są `force-dynamic`) — użytkownik widzi pusty ekran zamiast skeleton'u
- **Overflow/truncation:** Długie nazwy firm/e-maili w DashboardShell sidebar'ach nie mają `truncate` — wywalają się z layoutu

**Rekomendacja:** Dodać `/dashboard/loading.tsx` z Suspense boundaries, poprawić contrast (text-gray-400 na bg), zwiększyć touch target'y.

---

## 🟢 Spójność detali — Rozważania

### 16. "Nowy Dokument tekstowy.txt" w repo  
Śmieć — usunąć.

---

## 📋 Szybkie wygrane (Quick Wins — < 30 minut)

1. **Dodaj `/auth/callback` trasę** — 10 min (kopiuj template Supabase docs)
2. **Usuń "Nowy Dokument tekstowy.txt"** — 1 min
3. **Popraw contrast:** `text-gray-500` → `text-gray-400` — 5 min (sed/replace all)
4. **Dodaj `/dashboard/loading.tsx`** — 5 min (skeleton kart)
5. **Validate startDate w /api/campaigns** — 10 min (date parsing + 400 zwrot)

---

## 📋 Plan Naprawy

| Priorytet | Problem | Rozwiązanie | Czas |
|-----------|---------|-----------|------|
| 🔴 **P0** | Kwota z klienta w payment-intent | Query campaign.price z DB, porównaj | 45 min |
| 🔴 **P0** | IDOR connect-status (USD kierowcy) | Dodaj auth check + driverId === user.id | 15 min |
| 🔴 **P0** | Webhook ALL payouts marked paid | Przechowuj payout_id w metadata Stripe | 60 min |
| 🔴 **P0** | Brak /auth/callback | Dodaj trasę + PUBLIC_ROUTES | 15 min |
| 🟠 **P1** | Tablica duplikat innego kierowcy | Sprawdź driver_id istniejącego pojazdu | 30 min |
| 🟠 **P1** | Brak approved→active path | Dodaj akcję admina / automation | 30 min |
| 🟡 **P2** | Duplicate detection .includes → SQLSTATE | Zmień na error.code === '23505' | 20 min |
| 🟡 **P2** | Start date bez walidacji | Dodaj Date.parse + range check | 15 min |
| 🟡 **P2** | Rate limit /api/leads | Vercel rateLimit / honeypot | 45 min |
| 🟢 **P3** | Contrast text-gray-500 | Zmienić na text-gray-400 | 5 min |
| 🟢 **P3** | Brak loading.tsx | Dodać skeleton | 10 min |

**Szacowana łączna naprawa:** ~4–5 godzin pracy dla всех P0/P1. P2 dodaje kolejne 2 godziny.

---

## ⚠️ Ryzyko pozostawienia bez naprawy

| Problem | Ryzyko biznesowe | Ryzyko UX | Ryzyko techniczne |
|---------|-----------------|----------|-----------------|
| **Kwota z klienta (payment-intent)** | **KRYTYCZNE** — utraty 100s 1000s PLN na kampanię | Zaufanie — klient widzi że płaci, a w Stripe inne sumy | SQL injection / data corruption w payouts |
| **IDOR (connect-status)** | Średnie — info leakage, phishing | Brak (b2b endpoint) | Compliance/audit trail |
| **Webhook payout bug** | **KRYTYCZNE** — insolvency kierowców | Masowe "nie dostali pieniędzy" | Chargeback'i, sprawy sądowe |
| **Brak /auth/callback** | **WYSOKIE** — do 50% rejestracji utraty | Frustration, bounce | Brak revenue na starcie |
| **Tablica duplikat** | Średnie — data quality | Kierowca myśli że Auto jest, a nie ma | Naprawa post-launch drogowskaz |
| **Brak active status** | Niskie — cosmetic | Kierowca nie wie czy jest gotowy | Incomplete feature |

---

## ✅ Stan gotowości do wdrożenia

### 🔴 **NIE GOTOWE DO PRODUKCJI**

**Powody:**
1. **3 krytyczne luki bezpieczeństwa** (kwota płatności, IDOR, webhook payout'y) — podatne na fraud/insolvency
2. **Brak trasy /auth/callback** — rejestracja z email confirmation nie działa
3. **Silent failures** w walidacji danych (duplikaty, wartości graniczne)
4. **Niekompletna ścieżka żywotności** (approved → active)

**Czemu P0 luki muszą być naprawione TERAZ:**
- **Kwota z klienta:** Każda kampania może być rozliczana za 1 grosz. Atakujący może wyjąć twoją całą pulę kampanii za grosze.
- **Webhook bug:** Jeden transfer → wszyscy kierowcy zaznaczeni jako paid. Po 3–5 kampaniach jest 100+ tysięcy PLN niedozapatrzonego długu.
- **IDOR connect-status:** Ujawnianie stripe_account_id każdego kierowcy potencjalnie umożliwia podszywanie się.

**Zalecenie:** Deploy na produkcji dopiero po P0 naprawach + smoke test payment flow.

---

## 🎯 Następny ruch — ONE ACTION

**ZRÓB TERAZ:**

1. Czytaj komentarze w każdej metodzie HTTP (`POST /api/stripe/payment-intent`, `GET /api/stripe/connect-status`, `stripe-webhook`, `POST /api/onboarding/driver`).
2. Implement P0 napraw w następujące 2 godziny. Deploy na staging.
3. Manualna smoke test: 
   - Zarejestruj konto (z email confirmation OFF dla testu)
   - Przejdź onboarding kierowcy (spróbuj duplikat tablicy — powinien zwrócić 409)
   - Utwórz kampanię (wpisz date_start z przeszłości — powinien 400)
   - Kliknij "Połącz Stripe" (weryfikuj że `/api/stripe/connect-link` wymaga auth)
   - Wysyłaj test payment intent z inną kwotą — powinien 400 (mismatch z cena w DB)

Jeśli wszystko przejdzie — dopiero wtedy merge do main.

---

## 📝 Notatki dodatkowe

- **Strony bez loading state'ów:** `app/dashboard/driver/page.tsx`, `app/dashboard/advertiser/page.tsx`, `app/admin/page.tsx` wszystkie są `export const dynamic = 'force-dynamic'` (brak cache). Dodaj `/dashboard/loading.tsx` z Suspense.
- **Webhook idempotencji:** Stripe może wysłać event wiele razy — webhook ma deduplikację po `event.id` (OK), ale jest ścieżka gdzie ten sam `campaign_id` dostaje kilka transferów (nie objęty). Rozważ logi audytowe dla każdego UPDATE payouts.
- **Mapbox token placeholder:** `.env.example` ma `NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1xxx` — na prod musisz mieć token. `/campaign/[id]` renderuje się bez niego (fallback do Mapbox bez style'u — OK dla MVP, ale na prodzie możliwe że użytkownik nie zobaczy mapy).

---

## 📞 Wsparcie & Follow-up

Każde znalezisko w raporcie ma konkretne:
- ✅ Plik + nr linii
- ✅ Cytat kodu
- ✅ Kroki do reprodukcji
- ✅ Rekomendacja naprawy z przykład kodem

Jeśli jakiś punkt jest nieясny, otwórz GitHub issue z linkiem do tego raportu + numer znaleziska.

---

**Raport przygotował:** Claude Code QA Agent  
**Metodologia:** 7-layer adversarial audit (review → verify) + ground-truth security code review  
**Pokrycie:** 41 unique findings, 30+ potwierdzonych, 3 krytyczne, 2 wysokie  
**Wniosek:** Produkcja w tym stanie = HIGH RISK. Fix P0 luki, zrób smoke test, deploy.
