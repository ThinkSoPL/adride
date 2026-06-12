# AdRide — prompty do wygenerowania modułów aplikacji

> 5 osobnych promptów do wklejenia w Claude Code / Cursor / Claude.ai.
> Każdy jest samodzielny — możesz uruchamiać je w dowolnej kolejności, ale rekomendowana sekwencja: **D → A → B → C → E** (najpierw schemat bazy, potem klienci, na końcu raporty).
> Stack: Expo SDK 51+, Next.js 14 (App Router), Supabase (Postgres + PostGIS + Edge Functions), Stripe Connect, Mapbox GL.

---

## PROMPT A — Moduł GPS tracking (React Native + Expo)

```
ROLA: Jesteś senior React Native developerem z 8-letnim doświadczeniem w aplikacjach fleet/logistics. Specjalizujesz się w background location tracking, optymalizacji baterii i niezawodności na iOS + Android.

KONTEKST PROJEKTU:
Buduję aplikację mobilną dla kierowców Uber/Bolt, którzy mają oklejone auto reklamą AdRide. Aplikacja musi rejestrować trasy w tle, liczyć kilometry i wysyłać dane do Supabase. Na podstawie tych danych liczymy płatność dla kierowcy i raport dla reklamodawcy. Średni kierowca robi 100–200 km dziennie przez 10–14 godzin.

ZADANIE:
Napisz kompletny moduł `gps-tracking` dla aplikacji Expo (managed workflow + dev client), gotowy do uruchomienia. Wszystkie komentarze w kodzie po polsku. Krótkie, rzeczowe.

WYMAGANIA TECHNICZNE:
- Expo SDK 51+
- expo-location (foreground + background)
- expo-task-manager (background task)
- expo-secure-store (token sesji)
- @supabase/supabase-js v2
- @react-native-community/netinfo (status sieci)
- expo-battery (monitorowanie naładowania)
- TypeScript, strict mode
- Zero `any` w publicznym API

STRUKTURA PLIKÓW (do wygenerowania):
src/modules/gps-tracking/
├── index.ts                      // public exports
├── types.ts                      // GpsPoint, GpsSession, TrackingConfig, BatteryState
├── config.ts                     // stałe: MIN_DISTANCE_M, MAX_SPEED_KMH, BATCH_SIZE, ACCURACY_THRESHOLD
├── haversine.ts                  // wzór Haversine + filtr outlierów
├── storage.ts                    // SQLite (expo-sqlite) — buffer offline
├── supabase-uploader.ts          // batch upload + retry z exponential backoff
├── background-task.ts            // TaskManager.defineTask("ADRIDE_LOCATION_TASK")
├── permissions.ts                // request foreground + background + always
├── tracking-service.ts           // startSession() / stopSession() / pauseSession()
├── hooks/
│   ├── useGpsTracking.ts         // hook React dla UI
│   └── useTrackingStats.ts       // km, czas, średnia prędkość — live
└── __tests__/
    └── haversine.test.ts         // jest + co najmniej 6 test cases

FUNKCJONALNOŚĆ — SZCZEGÓŁY:

1) HAVERSINE:
   - Funkcja `haversineDistance(p1, p2): number` zwraca metry.
   - Funkcja `filterOutlier(prev, current): boolean` — odrzuć punkty, gdzie obliczona prędkość przekracza MAX_SPEED_KMH (domyślnie 200 km/h, bo to oczywisty błąd GPS).
   - Funkcja `cumulativeDistance(points: GpsPoint[]): number` z odrzucaniem outlierów.

2) BACKGROUND TASK:
   - Task name: "ADRIDE_LOCATION_TASK".
   - Tryb: `Location.Accuracy.Balanced` (BalancedPowerAccuracy na Androidzie).
   - `timeInterval: 10000` (10s) na drogach miejskich; jeśli prędkość < 5 km/h przez 60s → przejdź w tryb `timeInterval: 30000`.
   - `distanceInterval: 50` (zbieraj punkt min. co 50m).
   - `deferredUpdatesInterval: 60000` — Android może batchować.
   - `foregroundService` (Android) z notyfikacją typu "AdRide rejestruje Twoją trasę — 124 km dziś".
   - `pausesUpdatesAutomatically: false` (iOS).

3) BUFFER OFFLINE (SQLite):
   - Tabela `gps_buffer (id INTEGER PK, session_id TEXT, lat REAL, lng REAL, speed REAL, accuracy REAL, heading REAL, recorded_at INTEGER, uploaded INTEGER DEFAULT 0)`.
   - Każdy punkt zapisz lokalnie ZANIM wyślesz. Upload to drugi krok.
   - Po pomyślnym uploadzie flaguj `uploaded = 1`.
   - Po 30 dniach od uploadu — usuń (vacuum).

4) UPLOAD DO SUPABASE:
   - Batch po 50 punktów lub co 60s (zależnie co pierwsze).
   - Endpoint: insert do `gps_points` (tabela zdefiniowana w schemacie — patrz PROMPT D).
   - Retry: 3 próby z exponential backoff (1s, 4s, 16s).
   - Jeśli brak sieci (NetInfo) → odłóż na potem, nie próbuj.
   - Jeśli błąd 401/403 → zatrzymaj sesję, wyemituj event `AUTH_ERROR`.
   - Wszystkie inserty z user_id z auth.getUser() — RLS to wymusi.

5) ZARZĄDZANIE SESJĄ:
   - `startSession({ vehicleId, campaignId })` — generuje sessionId (uuid), zapisuje start do Supabase tabeli `gps_sessions`.
   - `stopSession()` — flush buffera, update `ended_at` w sessions.
   - `pauseSession()` — wstrzymaj task bez kończenia sesji (np. kierowca tankuje).
   - Persystencja: jeśli appka zostanie zabita w trakcie sesji → po restarcie automatycznie wznów (sessionId w SecureStore).

6) UPRAWNIENIA:
   - `requestPermissions()` z czytelnymi prośbami po polsku.
   - Wymagaj `Location.PermissionStatus.GRANTED` na foreground.
   - Wymagaj `requestBackgroundPermissionsAsync` — bez tego nie startuj sesji.
   - Na Android 14+ obsłuż `FOREGROUND_SERVICE_LOCATION`.
   - Jeśli user odrzuci — pokaż AlertModal z instrukcją „Ustawienia → AdRide → Lokalizacja → Zawsze".

7) BATERIA:
   - Co 5 minut sprawdzaj `Battery.getBatteryLevelAsync()`.
   - Jeśli < 15% i nie ładuje się → przejdź w tryb LOW_POWER (timeInterval 60s, accuracy Low).
   - Emituj event `LOW_BATTERY_MODE` do UI.

8) HOOK `useGpsTracking`:
   ```typescript
   const { 
     isTracking, 
     session, 
     stats: { km, durationSec, avgSpeedKmh, pointsCount }, 
     error,
     start, 
     stop, 
     pause 
   } = useGpsTracking();
   ```

9) APP.JSON / EXPO CONFIG:
   - Wygeneruj snippet plugins:
     - "expo-location" z permissions message po polsku
     - "expo-task-manager"
   - Wygeneruj snippet dla Info.plist (NSLocationAlwaysAndWhenInUseUsageDescription) i AndroidManifest (ACCESS_BACKGROUND_LOCATION, FOREGROUND_SERVICE, FOREGROUND_SERVICE_LOCATION).

10) TESTY:
    - Minimum 6 test cases dla Haversine: identyczne punkty, antypody, krótki dystans (10m), długi dystans (100km), outlier (skok 50km w 1s), normalna jazda miejska.
    - Mock dla `expo-sqlite` i `@supabase/supabase-js`.

ACCEPTANCE CRITERIA:
✓ Po `expo prebuild` aplikacja kompiluje się na iOS i Android bez warningów.
✓ Po zamknięciu aplikacji (swipe up) tracking działa dalej co najmniej 4 godziny.
✓ Po wyłączeniu sieci na 30 minut i włączeniu z powrotem — wszystkie punkty docierają do Supabase.
✓ Zużycie baterii < 8% / godzinę na średnim Pixelu i iPhone 12.
✓ Testy haversine.test.ts zielone.
✓ TypeScript `strict: true` bez błędów.

PODAJ TEŻ:
- README.md z instrukcją integracji (pełną).
- Listę zmiennych env (.env.example).
- Zrzut przykładowego payloadu wysyłanego do Supabase.

ZACZNIJ od `types.ts` i `config.ts`, potem `haversine.ts` z testami, potem reszta. Po każdym pliku — krótki komentarz co dalej.
```

---

## PROMPT B — Komponent mapy Mapbox (Next.js 14)

```
ROLA: Jesteś senior frontend developerem specjalizującym się w geo-wizualizacjach. Pracowałeś z Mapbox GL JS, deck.gl, react-map-gl. Znasz Next.js 14 App Router od podszewki.

KONTEKST PROJEKTU:
Reklamodawca po zalogowaniu do panelu AdRide widzi mapę Warszawy z trasami pojazdów, na których jest oklejona jego kampania. Trasy aktualizują się na żywo (Supabase Realtime). Reklamodawca może filtrować po pojeździe, dniu, dzielnicy. Klikając pojazd widzi szczegóły (km dziś, w kampanii, ostatnia lokalizacja).

ZADANIE:
Napisz kompletny komponent React `<CampaignMap />` w Next.js 14 (App Router, RSC + Client Components mądrze rozdzielone), gotowy do uruchomienia. Wszystkie komentarze po polsku.

STACK:
- Next.js 14+, App Router
- TypeScript strict
- react-map-gl v7+ (mapbox-gl v3)
- @supabase/ssr (server) + @supabase/supabase-js (client realtime)
- TailwindCSS + shadcn/ui (Button, Sheet, Card, Select, DateRangePicker)
- date-fns + date-fns-tz (timezone Europe/Warsaw)
- zustand (lokalny store mapy)

STRUKTURA PLIKÓW:
src/features/campaign-map/
├── index.ts
├── CampaignMap.tsx                    // główny komponent (client)
├── CampaignMap.server.tsx             // server wrapper z initial data
├── types.ts                           // RouteFeature, VehicleMarker, MapFilters
├── store.ts                           // zustand: filters, selectedVehicle, hoveredRoute
├── hooks/
│   ├── useRealtimeRoutes.ts           // Supabase Realtime subscription
│   ├── useRoutesQuery.ts              // historical routes (react-query)
│   └── useDistrictBoundaries.ts       // GeoJSON dzielnic Warszawy
├── layers/
│   ├── RoutesLayer.tsx                // LineString trasy
│   ├── VehicleMarkersLayer.tsx        // markery pojazdów (live)
│   ├── HeatmapLayer.tsx               // heatmap pokrycia
│   └── DistrictsLayer.tsx             // poligony dzielnic (targetowanie)
├── controls/
│   ├── MapFilters.tsx                 // sheet z filtrami
│   ├── DateRangeControl.tsx
│   ├── VehiclePicker.tsx
│   ├── LayerToggle.tsx                // przełącz routes/heatmap/districts
│   └── TimeSlider.tsx                 // scrubbing po godzinach dnia
├── popups/
│   └── VehicleDetailPopup.tsx         // popup po kliknięciu pojazdu
└── utils/
    ├── geojson.ts                     // konwersja gps_points → LineString
    ├── colorScale.ts                  // kolory tras (gradient po prędkości lub czasie)
    └── simplify.ts                    // douglas-peucker dla wielu punktów

FUNKCJONALNOŚĆ:

1) MAPA BAZOWA:
   - Style: `mapbox://styles/mapbox/dark-v11` (domyślnie) z opcją toggle na `streets-v12`.
   - Initial viewport: Warszawa, center [21.0122, 52.2297], zoom 11.
   - Bounds limit: nie pozwól oddalić się dalej niż 50 km od centrum WAW.
   - Token z env: NEXT_PUBLIC_MAPBOX_TOKEN.

2) WARSTWA TRAS (RoutesLayer):
   - Każda sesja GPS → jedna LineString.
   - Kolor: gradient od szarego (stara) do pomarańczowego AdRide (#FF6B35, świeża, <1h).
   - Szerokość: 3px, hover 5px + glow.
   - Click → otwórz popup z statystykami sesji.
   - Performance: jeśli > 100 tras → simplify (douglas-peucker, tolerance 0.0001).
   - Użyj `source-layer` Mapbox z `type: "line"` zamiast osobnych markerów per punkt.

3) WARSTWA POJAZDÓW LIVE (VehicleMarkersLayer):
   - Marker dla każdego pojazdu aktywnego w ostatnich 5 min.
   - Niestandardowa ikonka SVG (auto) z rotacją wg headingu z GPS.
   - Pulsujący ring (CSS animation) wokół markera „live".
   - Klik → popup: numer rejestracyjny (zmaskowany ostatnimi 3 cyframi: `WA ••• 47`), km dziś, km w kampanii, ostatnia aktualizacja.

4) REALTIME (useRealtimeRoutes):
   - Subscribe na kanał Supabase: `campaign:${campaignId}:gps`.
   - Postgres changes na tabeli `gps_points` z filtrem `campaign_id=eq.${campaignId}`.
   - Throttle: aktualizuj mapę max co 2 sekundy (debounce z lodash lub własny).
   - Cleanup w useEffect (unsubscribe).

5) HEATMAP:
   - Toggle z LayerToggle.
   - Mapbox heatmap layer z gps_points, weight = 1.
   - radius: zoom-dependent (interpolacja: 10 na zoom 10, 30 na zoom 14).
   - Useful dla reklamodawcy: „gdzie najbardziej widziano moją reklamę".

6) DZIELNICE WARSZAWY:
   - Load GeoJSON z `/public/geo/warsaw-districts.geojson` (18 dzielnic).
   - Hover dzielnicy → highlight + tooltip „Mokotów — 234 km ekspozycji w tej kampanii".
   - Click → filtr: pokaż tylko trasy w tej dzielnicy (turf.js booleanPointInPolygon).

7) FILTRY (zustand store):
   - dateRange: { from: Date, to: Date }
   - vehicleIds: string[] (multi-select)
   - districts: string[] (multi-select dzielnice)
   - layerVisibility: { routes: boolean, heatmap: boolean, live: boolean, districts: boolean }
   - timeOfDay: [number, number] (0–24, slider, filtruje sesje wg godziny startu)

8) TIME SLIDER:
   - Pod mapą, 0:00 → 23:59.
   - Scrubbing animuje warstwę tras (pokazuje punkty do tej godziny).
   - Auto-play (przycisk ▶) — ekstrapolacja 24h w 60 sekund.

9) DATA FETCHING:
   - Server Component pobiera initial routes (ostatnie 7 dni) — `CampaignMap.server.tsx`.
   - Przekazuje jako props do client componentu.
   - Client subskrybuje realtime + dociąga przez react-query gdy zmienia się dateRange.
   - Cache: react-query z staleTime 30s.

10) ACCESSIBILITY:
    - Wszystkie kontrolki keyboard-accessible.
    - Marker pojazdów: rola button, aria-label.
    - Tryb high-contrast (toggle).
    - Skip-to-map link.

11) WYDAJNOŚĆ:
    - Lazy load Mapbox GL (`import dynamic from 'next/dynamic'` z ssr: false).
    - Memoize warstw (useMemo na features).
    - Wirtualizacja popupów.
    - Cluster pojazdów przy zoom < 12.

ENV:
- NEXT_PUBLIC_MAPBOX_TOKEN
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

ACCEPTANCE CRITERIA:
✓ `next build` przechodzi bez warningów (typecheck strict).
✓ 200 tras × 500 punktów renderuje się płynnie (60 FPS na MacBook M1).
✓ Realtime aktualizacja widoczna < 3s od inserta w Supabase.
✓ Filtry zachowują state w URL searchParams (shareable links).
✓ Mobile responsive (sheet z filtrami zamiast sidebara).
✓ Lighthouse Performance > 85.

PODAJ TEŻ:
- Storybook stories dla kluczowych komponentów (CampaignMap, MapFilters, VehicleDetailPopup).
- Mock dataset (10 sesji, 5 pojazdów) w `mocks/routes.json` do dev.
- README z instrukcją uruchomienia + zrzut ekranu jak to powinno wyglądać (opisowo).

ZACZNIJ od types.ts → store.ts → CampaignMap.tsx (szkielet) → kolejno warstwy → kontrolki → popupy → server wrapper.
```

---

## PROMPT C — Stripe Connect Marketplace (charge + fee + payout)

```
ROLA: Jesteś senior backend developerem z doświadczeniem we wdrażaniu Stripe Connect (Standard, Express, Custom) dla marketplace'ów. Wdrażałeś flows dla Uber-likes, marketplaces P2P i SaaS subscription billing. Znasz polskie aspekty VAT i fakturowania.

KONTEKST PROJEKTU:
AdRide to marketplace dwustronny: reklamodawca płaci za kampanię → AdRide bierze prowizję → wypłaca kierowcy. Reklamodawca płaci subskrypcyjnie miesięcznie (Pakiet START 997 zł netto, SCALE 2497 zł netto). Kierowca dostaje wypłatę miesięcznie (200–600 zł). Marża AdRide: ~50%.

ZADANIE:
Napisz kompletny moduł `payments` w Next.js 14 (App Router, route handlers) z integracją Stripe Connect, gotowy do uruchomienia. Komentarze po polsku. Mode: Express (kierowca przechodzi krótki onboarding Stripe, ale my zarządzamy UI po naszej stronie).

STACK:
- Next.js 14 App Router (route handlers)
- stripe v17+ (oficjalny SDK)
- @supabase/ssr
- zod (walidacja payloadu)
- TypeScript strict

STRUKTURA PLIKÓW:
src/features/payments/
├── server/
│   ├── stripe-client.ts                 // singleton Stripe SDK
│   ├── connect-accounts.ts              // tworzenie/aktualizacja Express accounts dla kierowców
│   ├── customers.ts                     // Customer per reklamodawca
│   ├── subscriptions.ts                 // subskrypcje pakietów START/SCALE
│   ├── transfers.ts                     // przelewy do kierowców
│   ├── webhooks.ts                      // handler eventów Stripe
│   └── invoices.ts                      // pobieranie faktur PDF
├── app/api/
│   ├── stripe/
│   │   ├── connect/onboard/route.ts     // POST: tworzy Account Link dla kierowcy
│   │   ├── connect/status/route.ts      // GET: status verification
│   │   ├── subscriptions/create/route.ts
│   │   ├── subscriptions/cancel/route.ts
│   │   ├── portal/route.ts              // Customer Portal session
│   │   └── webhooks/route.ts            // POST: webhook endpoint
│   └── payouts/
│       ├── calculate/route.ts           // oblicz wypłatę kierowcy za miesiąc
│       └── execute/route.ts             // wykonaj transfer (admin only)
├── lib/
│   ├── fees.ts                          // logika prowizji
│   ├── pricing.ts                       // SKU pakietów
│   └── vat.ts                           // PL VAT 23%
└── types.ts

FUNKCJONALNOŚĆ:

1) KONTA KIEROWCÓW (Express):
   - Endpoint POST /api/stripe/connect/onboard:
     - Wejście: driverId (z sesji Supabase).
     - Sprawdź czy kierowca już ma stripe_account_id w tabeli `drivers`.
     - Jeśli nie → `stripe.accounts.create({ type: 'express', country: 'PL', email, capabilities: { transfers: { requested: true } }, business_type: 'individual' })`.
     - Zapisz account_id do Supabase.
     - Stwórz Account Link (`account_links.create`) z return_url i refresh_url.
     - Zwróć URL do redirectu.
   - Endpoint GET /api/stripe/connect/status:
     - `stripe.accounts.retrieve(accountId)`.
     - Zwróć: { chargesEnabled, payoutsEnabled, detailsSubmitted, requirements: { currentlyDue, eventuallyDue } }.

2) KLIENCI / REKLAMODAWCY:
   - Customer tworzony lazy przy pierwszym checkoucie.
   - Metadata: { advertiser_id, supabase_uid, vat_id (NIP), legal_name }.

3) PAKIETY (Prices w Stripe):
   - Setup script: `scripts/seed-stripe-products.ts` tworzy Products + Prices:
     - `pkg_start_setup`: jednorazowo 497 zł netto (oklejenie)
     - `pkg_start_monthly`: subskrypcja 997 zł netto/mc, min. 3 cykle
     - `pkg_start_demount`: jednorazowo 197 zł netto
     - `pkg_scale_setup`: jednorazowo 997 zł netto
     - `pkg_scale_monthly`: subskrypcja 2497 zł netto/mc, min. 6 cykli
     - `pkg_scale_demount`: jednorazowo 397 zł netto
   - Wszystkie z PLN, tax_behavior: 'exclusive' (VAT dolicza Stripe Tax).

4) SUBSKRYPCJE:
   - POST /api/stripe/subscriptions/create:
     - Body (zod): { advertiserId, packageType: 'START' | 'SCALE', startDate }.
     - Stwórz lub pobierz Customer.
     - Stwórz Subscription z 2 items: setup (one-off invoice) + monthly recurring.
     - `cancel_at_period_end: false`, `payment_behavior: 'default_incomplete'`.
     - Zapisz subscription_id do Supabase `campaigns.stripe_subscription_id`.
     - Zwróć client_secret z `latest_invoice.payment_intent` (do PaymentElement na froncie).

5) PROWIZJA — KLUCZOWA LOGIKA (fees.ts):
   - Reklamodawca płaci np. 997 zł netto/mc.
   - AdRide bierze prowizję per kampania: zmienna, zależna od liczby kierowców.
   - Funkcja `calculateDriverPayouts(campaignId, periodStart, periodEnd)`:
     - Pobierz wszystkich kierowców kampanii.
     - Dla każdego: zsumuj km z `gps_sessions` w okresie.
     - Stawka: 0.20 zł / km, min. 200 zł, max. 600 zł.
     - Sprawdź czy spełnia próg ekspozycji (1500 km min — gwarancja).
     - Zwróć: [{ driverId, stripeAccountId, amountGrosze, kmTotal, withinGuarantee }].

6) TRANSFERY DO KIEROWCÓW:
   - POST /api/payouts/execute (admin auth):
     - Body: { campaignId, periodMonth }.
     - Wywołaj calculateDriverPayouts.
     - Dla każdego kierowcy: `stripe.transfers.create({ amount, currency: 'pln', destination: accountId, transfer_group: campaignId, metadata: { driver_id, km_total, period } })`.
     - Zapisz do Supabase `payouts` z transfer_id.
     - Idempotency key: `payout_${campaignId}_${driverId}_${periodMonth}`.

7) WEBHOOKS (krytyczne!):
   - POST /api/stripe/webhooks:
     - Verify signature z STRIPE_WEBHOOK_SECRET (`stripe.webhooks.constructEvent`).
     - Handle eventy:
       - `account.updated` → update verification status w Supabase
       - `invoice.payment_succeeded` → mark campaign as paid, trigger oklejenie
       - `invoice.payment_failed` → pause campaign, notify advertiser
       - `customer.subscription.deleted` → mark campaign cancelled
       - `transfer.failed` → flag w Supabase, notify admin
       - `transfer.paid` → mark payout completed
       - `payout.failed` (z connected account przez Connect webhooks)
     - Idempotency: zapisz event.id w tabeli `stripe_events`, skip duplicate.
     - Zwróć 200 ZAWSZE jeśli signature OK (nawet jeśli logika failuje — log + retry mechanism).

8) CUSTOMER PORTAL:
   - POST /api/stripe/portal: stwórz session.create dla zalogowanego reklamodawcy.
   - Skonfiguruj portal (jednorazowo w Dashboard albo via API) — pozwól: update payment method, view invoices, cancel subscription.

9) FAKTURY:
   - Stripe automatycznie generuje faktury (PDF).
   - Endpoint GET /api/stripe/invoices/:id/pdf — proxy do `invoice.hosted_invoice_url` lub `invoice_pdf`.
   - Polish requirements: na fakturze musi być NIP klienta — w metadata Customer + invoice_settings.custom_fields.

10) VAT (vat.ts):
    - Stripe Tax włączony.
    - tax_id_collection: enabled (przy checkout zbieraj NIP).
    - Reverse charge dla B2B EU (jeśli kiedyś rozszerzymy).
    - Dla osoby prywatnej (kierowca jako payee przez Connect): nie ma VAT na transferze, bo to wypłata, nie faktura.

11) BEZPIECZEŃSTWO:
    - Wszystkie endpointy poza webhook: wymagaj sesji Supabase + role check.
    - Endpoint /api/payouts/execute: TYLKO admin (role w JWT).
    - Webhook secret rotuje co 90 dni — readme z procedurą.
    - Brak secrets w kodzie. STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_CONNECT_WEBHOOK_SECRET w .env.

12) IDEMPOTENCY:
    - Każde tworzenie Customer/Subscription/Transfer z idempotency_key.
    - Format: `${operation}_${entity_id}_${timestamp_hour}`.

ACCEPTANCE CRITERIA:
✓ TypeScript strict, zero `any`.
✓ Każdy endpoint zwalidowany zodem (request + response schemas).
✓ Webhook signature verification działa (test z Stripe CLI: `stripe listen --forward-to ...`).
✓ Subskrypcja od strony reklamodawcy: utworzenie → płatność testową kartą → mark paid w Supabase < 5s.
✓ Onboarding kierowcy: redirect → KYC → callback → status `charges_enabled: false, payouts_enabled: true`.
✓ Transfer: w trybie test mode kwota pojawia się na koncie Express w Stripe Dashboard.
✓ Wszystkie operacje idempotentne — można wywołać 3x i będzie 1 efekt.

PODAJ TEŻ:
- `scripts/seed-stripe-products.ts` (uruchomieniowy).
- `scripts/stripe-webhook-events.md` — lista wszystkich eventów + reakcji.
- `.env.example`.
- Diagram sekwencji (ASCII) dla: onboarding kierowcy, subskrypcja reklamodawcy, miesięczna wypłata.
- README z procedurą deploy (Vercel + webhook endpoints registration).

ZACZNIJ od stripe-client.ts → pricing.ts → connect-accounts.ts (z endpointem) → subscriptions.ts (z endpointem) → fees.ts + transfers.ts → webhooks (najbardziej rozbudowany) → reszta.
```

---

## PROMPT D — Supabase schema + Row Level Security

```
ROLA: Jesteś senior database engineerem ze specjalizacją PostgreSQL + PostGIS. Pracowałeś z Supabase production-grade dla aplikacji fleet/geo (Uber-likes). Znasz pułapki RLS, indeksowanie geo i partycjonowanie tabel time-series.

KONTEKST PROJEKTU:
AdRide ma 3 typy użytkowników (driver, advertiser, admin), 2 modele biznesowe (subskrypcje + payouts) i ogromny strumień danych GPS (1 kierowca = ~10k punktów dziennie; 100 kierowców = 1M punktów dziennie = 30M/mc).

ZADANIE:
Wygeneruj kompletny zestaw migracji SQL dla Supabase, gotowy do uruchomienia przez `supabase db push`. Wszystkie komentarze SQL po polsku (`COMMENT ON ...`). Naming convention: snake_case.

WYMAGANIA:
- PostgreSQL 15+ (Supabase default)
- Rozszerzenia: `postgis`, `pgcrypto`, `pg_cron`, `pg_stat_statements`
- RLS na każdej tabeli, bez wyjątków
- Indeksy geo (GIST) na kolumnach geometry
- Partycjonowanie `gps_points` po miesiącach (declarative partitioning)
- Materialized views dla raportów
- Triggers updated_at na wszystkich tabelach
- Type-safe enums (CREATE TYPE)

STRUKTURA MIGRACJI:
supabase/migrations/
├── 20260101000001_extensions.sql
├── 20260101000002_enums.sql
├── 20260101000003_profiles.sql
├── 20260101000004_drivers.sql
├── 20260101000005_advertisers.sql
├── 20260101000006_vehicles.sql
├── 20260101000007_campaigns.sql
├── 20260101000008_gps_sessions.sql
├── 20260101000009_gps_points.sql
├── 20260101000010_payouts.sql
├── 20260101000011_stripe_events.sql
├── 20260101000012_indexes.sql
├── 20260101000013_functions.sql
├── 20260101000014_triggers.sql
├── 20260101000015_rls_policies.sql
├── 20260101000016_views.sql
└── 20260101000017_seed_dev.sql

TABELE — SZCZEGÓŁY:

1) profiles (extension auth.users):
   - id UUID PK (FK → auth.users.id ON DELETE CASCADE)
   - role user_role (enum: 'driver', 'advertiser', 'admin')
   - full_name TEXT
   - phone TEXT
   - language TEXT DEFAULT 'pl'
   - avatar_url TEXT
   - created_at, updated_at TIMESTAMPTZ

2) drivers:
   - id UUID PK = profiles.id
   - status driver_status ('pending', 'approved', 'active', 'paused', 'rejected')
   - city TEXT (NOT NULL, default 'Warszawa')
   - stripe_account_id TEXT UNIQUE (Connect Express)
   - stripe_payouts_enabled BOOLEAN DEFAULT false
   - kyc_completed_at TIMESTAMPTZ
   - bank_account_verified BOOLEAN DEFAULT false
   - referral_code TEXT UNIQUE
   - referred_by UUID FK → drivers.id
   - notes TEXT (admin only via RLS)

3) advertisers:
   - id UUID PK = profiles.id
   - company_name TEXT NOT NULL
   - vat_id TEXT (NIP)
   - billing_address JSONB
   - stripe_customer_id TEXT UNIQUE
   - industry TEXT
   - district_focus TEXT[] (dzielnice Warszawy)

4) vehicles:
   - id UUID PK DEFAULT gen_random_uuid()
   - driver_id UUID FK → drivers.id
   - registration_plate TEXT NOT NULL UNIQUE
   - registration_plate_masked TEXT GENERATED ALWAYS AS (
       substring(registration_plate from 1 for 2) || ' ••• ' || right(registration_plate, 3)
     ) STORED
   - make TEXT, model TEXT, year INT, color TEXT
   - mileage_monthly_estimate INT
   - status vehicle_status ('available', 'wrapped', 'in_campaign', 'inactive')
   - created_at, updated_at

5) campaigns:
   - id UUID PK
   - advertiser_id UUID FK
   - name TEXT NOT NULL
   - package campaign_package ('START', 'SCALE')
   - status campaign_status ('draft', 'pending_payment', 'active', 'paused', 'completed', 'cancelled')
   - stripe_subscription_id TEXT UNIQUE
   - start_date DATE, end_date DATE
   - min_km_per_vehicle_monthly INT DEFAULT 1500 (gwarancja)
   - target_districts TEXT[]
   - vehicle_ids UUID[] (denormalizowane dla szybkości; spójność przez trigger)
   - design_artwork_url TEXT
   - created_at, updated_at

6) campaign_vehicles (M:N):
   - campaign_id UUID FK
   - vehicle_id UUID FK
   - assigned_at TIMESTAMPTZ
   - removed_at TIMESTAMPTZ (soft)
   - PRIMARY KEY (campaign_id, vehicle_id)

7) gps_sessions:
   - id UUID PK
   - driver_id UUID FK
   - vehicle_id UUID FK
   - campaign_id UUID FK (nullable — jeśli auto bez aktywnej kampanii)
   - started_at TIMESTAMPTZ NOT NULL
   - ended_at TIMESTAMPTZ
   - total_distance_m INT (denormalizowane, update przez trigger)
   - total_points INT
   - avg_speed_kmh NUMERIC(5,2)
   - route_geom GEOMETRY(LineString, 4326) (agregat — uzupełniany cron job)
   - device_info JSONB (model, os, app_version)
   - created_at

8) gps_points (PARTYCJONOWANA po recorded_at, miesięcznie):
   - id BIGSERIAL
   - session_id UUID
   - driver_id UUID (denormalizacja dla RLS)
   - campaign_id UUID (denormalizacja)
   - location GEOGRAPHY(Point, 4326) NOT NULL
   - speed_kmh NUMERIC(5,2)
   - accuracy_m NUMERIC(6,2)
   - heading NUMERIC(5,2)
   - battery_level NUMERIC(3,2)
   - recorded_at TIMESTAMPTZ NOT NULL
   - created_at TIMESTAMPTZ DEFAULT now()
   - PRIMARY KEY (id, recorded_at)
   - PARTITION BY RANGE (recorded_at)
   - Stwórz partycje na 2026-01..12 + DEFAULT partition.
   - Funkcja `create_monthly_partition()` wywoływana przez pg_cron 1-go każdego miesiąca.

9) payouts:
   - id UUID PK
   - driver_id UUID FK
   - campaign_id UUID FK
   - period_start DATE, period_end DATE
   - total_km NUMERIC(10,2)
   - amount_grosze BIGINT (zawsze w groszach — unikaj float)
   - within_guarantee BOOLEAN
   - stripe_transfer_id TEXT UNIQUE
   - status payout_status ('pending', 'processing', 'paid', 'failed', 'reversed')
   - paid_at TIMESTAMPTZ
   - created_at, updated_at

10) stripe_events:
    - id TEXT PK (event.id ze Stripe)
    - type TEXT
    - payload JSONB
    - processed_at TIMESTAMPTZ
    - processing_error TEXT

11) audit_log:
    - id BIGSERIAL PK
    - actor_id UUID (FK profiles, nullable for system)
    - action TEXT
    - entity_type TEXT, entity_id TEXT
    - diff JSONB
    - ip INET
    - created_at TIMESTAMPTZ

INDEKSY (12_indexes.sql):
- gps_points: BRIN na recorded_at, GIST na location, btree na (driver_id, recorded_at DESC), (campaign_id, recorded_at DESC)
- gps_sessions: btree (driver_id, started_at DESC), GIST (route_geom), btree (campaign_id, ended_at DESC)
- campaigns: btree (advertiser_id, status), btree (status, start_date)
- vehicles: btree (driver_id, status)
- payouts: btree (driver_id, period_start DESC), unique (campaign_id, driver_id, period_start)

FUNKCJE (13_functions.sql):
- `update_updated_at_column()` — trigger function.
- `aggregate_session_geom(session_id UUID)` — buduje route_geom z gps_points (ST_MakeLine).
- `compute_session_stats(session_id UUID)` — aktualizuje total_distance_m, total_points, avg_speed_kmh.
- `create_monthly_partition(target_month DATE)` — partycje gps_points.
- `points_in_district(district_name TEXT, since TIMESTAMPTZ) RETURNS bigint` — count z ST_Contains.
- `campaign_coverage_geojson(campaign_id UUID) RETURNS jsonb` — heatmap data.
- `monthly_km_for_driver(driver_id UUID, period DATE)` — dla wypłat.

TRIGGERY (14_triggers.sql):
- BEFORE UPDATE updated_at na wszystkich tabelach.
- AFTER INSERT na gps_points (per statement, nie per row!) → enqueue refresh stats.
- AFTER UPDATE status na campaigns → audit_log.
- BEFORE INSERT na drivers.referral_code → wygeneruj jeśli null (8 znaków alfanum).

RLS POLICIES (15_rls_policies.sql) — KRYTYCZNE:

Każda tabela: ENABLE ROW LEVEL SECURITY, FORCE ROW LEVEL SECURITY.

Helper functions:
- `auth.is_admin()` — sprawdza profiles.role.
- `auth.is_driver()` / `auth.is_advertiser()`.
- `auth.advertiser_owns_campaign(uuid)`.

Polityki — przykłady:

profiles:
- SELECT: self OR is_admin().
- UPDATE: self (z wyjątkiem kolumny `role` — tylko admin).
- INSERT: tylko trigger po auth.users insert.

drivers:
- SELECT: self OR admin OR (is_advertiser AND ten driver jest w mojej kampanii via campaign_vehicles).
- UPDATE: self (limited columns) OR admin.

advertisers:
- SELECT: self OR admin.
- UPDATE: self.

campaigns:
- SELECT: advertiser owner OR admin OR (driver przypisany do kampanii).
- INSERT: advertiser tylko jako siebie.
- UPDATE: advertiser owner (limited) OR admin.

gps_sessions:
- SELECT: driver owner OR admin OR (advertiser, którego kampania jest w session).
- INSERT/UPDATE: driver owner (own sessions only).

gps_points:
- SELECT: jak gps_sessions.
- INSERT: driver owner.
- DELETE: tylko admin.

payouts:
- SELECT: driver owner OR admin.
- INSERT/UPDATE: tylko service_role (przez Stripe webhooks).

stripe_events:
- ALL: tylko service_role.

audit_log:
- SELECT: admin only.
- INSERT: service_role.

WIDOKI MATERIALIZED (16_views.sql):
- `mv_driver_monthly_stats` (driver_id, year_month, total_km, total_sessions, days_active).
  Refresh: pg_cron daily 03:00.
- `mv_campaign_dashboard` (campaign_id, total_km, unique_vehicles, days_active, districts_covered jsonb).
  Refresh: pg_cron every 1h.
- `mv_district_exposure` (district, campaign_id, total_km, last_30d_km).

SEED DEV (17_seed_dev.sql):
- 3 admini, 20 kierowców (różne statusy), 8 reklamodawców, 15 pojazdów, 5 kampanii w różnych stanach, 100k gps_points zsyntezowanych w Warszawie (random walk od centrum).
- Wszystko warunkowe: `IF NOT EXISTS` lub `ON CONFLICT DO NOTHING`.

ACCEPTANCE CRITERIA:
✓ `supabase db reset && supabase db push` przechodzi bez błędów.
✓ `EXPLAIN ANALYZE` SELECT z gps_points dla 1 kierowcy w ostatnich 7 dniach < 100ms przy 30M wierszy.
✓ RLS testy (pgTAP lub pytest+supabase): driver A nie widzi sesji drivera B.
✓ Advertiser widzi tylko swoje kampanie i powiązane sesje.
✓ Anon role nie widzi nic poza publicznym (np. landing pages — brak takich tabel tutaj).
✓ Każda tabela ma indeks na FK i kolumnach query'owanych.

PODAJ TEŻ:
- ERD jako mermaid w README.
- `docs/rls-test-matrix.md` — tabela: rola × operacja × tabela → expected result.
- Skrypt benchmarkowy `scripts/benchmark.sql` (gps_points query'es).
- Procedura backupu i restore'u partycji historycznych do Supabase Storage (archiwum > 12 miesięcy).

ZACZNIJ od extensions + enums → profiles + auth trigger → tabele biznesowe → gps (najtrudniejsze, partycje!) → indeksy → funkcje → triggery → RLS (najbardziej rozbudowane) → views → seed.
```

---

## PROMPT E — Edge Function cron: raport PDF dla reklamodawcy

```
ROLA: Jesteś senior fullstack developerem z doświadczeniem w Deno + Supabase Edge Functions. Wdrażałeś zaplanowane joby PDF (raporty miesięczne, faktury, statementy) dla klientów enterprise.

KONTEKST PROJEKTU:
Każdy reklamodawca AdRide na koniec miesiąca dostaje raport PDF zawierający: liczbę pojazdów, total km, mapę pokrycia, top dzielnice, dzienny rozkład, screenshot heatmapy, zgodność z gwarancją 1500 km. Raport idzie też mailem (Resend) i jest dostępny w panelu (Supabase Storage signed URL 30 dni).

ZADANIE:
Napisz Supabase Edge Function `monthly-campaign-report` w Deno + TypeScript, uruchamianą przez pg_cron 1-go każdego miesiąca o 06:00 (Europe/Warsaw). Komentarze po polsku.

STACK:
- Supabase Edge Functions (Deno runtime)
- pg_cron + pg_net (HTTP call do Edge Function)
- pdf-lib (Deno-compatible) — generowanie PDF
- @supabase/supabase-js v2 (service_role key)
- Resend API — wysyłka email z attachmentem (lub link)
- @turf/turf — geo agregacja
- chart.js (server-side via canvas-deno) lub QuickChart API (prościej)

STRUKTURA:
supabase/functions/monthly-campaign-report/
├── index.ts                    // entry point (serve)
├── deno.json                   // imports
├── lib/
│   ├── supabase.ts             // klient z service_role
│   ├── queries.ts              // SQL queries (zbierane dane)
│   ├── pdf-builder.ts          // budowanie dokumentu pdf-lib
│   ├── charts.ts               // generowanie chartów (PNG przez QuickChart)
│   ├── map-snapshot.ts         // Mapbox Static Images API → PNG
│   ├── email.ts                // Resend
│   └── i18n.ts                 // strings PL
├── templates/
│   └── report-layout.ts        // struktura raportu
└── __tests__/
    └── pdf-builder.test.ts

FUNKCJONALNOŚĆ:

1) ENTRY POINT (index.ts):
   - Trigger: HTTP POST (uruchamiane przez pg_cron + pg_net).
   - Auth: header `x-cron-secret` musi zgadzać się z env CRON_SECRET. Jeśli nie → 401.
   - Body (opcjonalny override): { periodMonth?: 'YYYY-MM', campaignIds?: string[] }.
   - Jeśli brak → użyj poprzedniego miesiąca.
   - Iteruj po aktywnych kampaniach w okresie, dla każdej:
     - Wygeneruj PDF.
     - Upload do Storage (bucket `campaign-reports`, ścieżka `{advertiser_id}/{campaign_id}/{period}.pdf`).
     - Zapis do tabeli `campaign_reports` (id, campaign_id, period, storage_path, generated_at, sent_at).
     - Wyślij mail z signed URL (24h).
   - Return JSON: { processed: number, errors: [...], totalDurationMs: number }.
   - Concurrency: max 5 raportów równolegle (Promise.allSettled z limitem).

2) ZAPYTANIA SQL (queries.ts):
   Dla każdej kampanii pobierz:
   - Metadata kampanii (name, package, start_date).
   - Reklamodawca (company_name, email, language).
   - Liczba pojazdów aktywnych w okresie.
   - Suma km z gps_sessions WHERE campaign_id = ... AND started_at BETWEEN period_start AND period_end.
   - Per-vehicle breakdown (km, dni aktywne, czy w gwarancji).
   - Top 5 dzielnic (ST_Contains z geo dzielnic + sumowanie linii).
   - Dzienny rozkład km (group by date_trunc('day', ...)).
   - Bounding box wszystkich tras (do snapshot Mapbox).
   - LineStrings (uproszczone do max 50 punktów per session — pdf nie potrzebuje precyzji).

3) GENEROWANIE CHARTÓW (charts.ts):
   - Wykres słupkowy: km per dzień przez miesiąc → QuickChart API z konfiguracją Chart.js.
   - Donut: rozkład km per dzielnica top 5 + "inne".
   - Linia: skumulowane km vs cel kampanii.
   - Każdy chart: fetch z QuickChart, response → Uint8Array (PNG bytes).
   - Cache: identyczne dane → cache w pamięci edge function (LRU 20 entries).

4) MAPBOX STATIC IMAGE (map-snapshot.ts):
   - Endpoint: `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/{geojson_overlay}/{bbox}/1280x720@2x`.
   - Encode tras jako GeoJSON overlay (uproszczone Douglas-Peucker, tolerance 0.0005).
   - Limit URL: 8192 znaków → jeśli więcej tras, użyj POST endpoint do tymczasowego tilesetu albo dziel na 2 obrazy.
   - Token z env MAPBOX_TOKEN.

5) PDF BUILDER (pdf-builder.ts):
   - A4 portrait, marginesy 20mm.
   - Czcionka: Helvetica embed (dla PL znaków — opcjonalnie zaszyj font z polskim ogonkiem, np. Inter).
   - Struktura stron:
     1. Okładka: logo, nazwa kampanii, okres, nazwa reklamodawcy, hero map snapshot.
     2. Podsumowanie wykonawcze: 4 KPI w kafelkach (Total km, Pojazdy, Dni, Zgodność z gwarancją).
     3. Mapa pokrycia (pełna strona).
     4. Dzielnice: donut + tabela top 5.
     5. Dzienna aktywność: wykres słupkowy + krótki insight tekstowy.
     6. Per-vehicle breakdown: tabela.
     7. Gwarancja: status każdego pojazdu vs próg 1500 km, ew. compensation/przedłużenie.
     8. Kontakt + footer z numerem raportu (UUID skrócony).
   - Helper functions: drawKpiTile, drawTable, drawSectionHeader, embedPng.

6) I18N (i18n.ts):
   - Domyślnie PL. Przygotuj strukturę pod EN (na przyszłość).
   - Wszystkie napisy w pliku, zero hardcoded w pdf-builder.

7) EMAIL (email.ts):
   - Resend API.
   - Template: krótki HTML „Twój raport AdRide za październik 2026 jest gotowy".
   - Załącznik: PDF (mały, < 2MB) ALBO signed URL (jeśli > 2MB).
   - From: reports@adride.pl.
   - Reply-to: support@adride.pl.

8) PG_CRON SETUP (osobna migracja SQL):
   ```sql
   SELECT cron.schedule(
     'monthly-campaign-reports',
     '0 6 1 * *', -- 1-go o 06:00 UTC (= 07:00/08:00 Warszawa)
     $$
     SELECT net.http_post(
       url := 'https://{project}.supabase.co/functions/v1/monthly-campaign-report',
       headers := jsonb_build_object(
         'Content-Type', 'application/json',
         'x-cron-secret', '{CRON_SECRET}'
       ),
       body := '{}'::jsonb
     );
     $$
   );
   ```

9) RETRY / IDEMPOTENCY:
   - Sprawdź `campaign_reports` PRZED generowaniem — jeśli istnieje raport za ten okres dla tej kampanii i ma status = 'sent', skip.
   - Jeśli istnieje ze statusem 'failed' lub 'partial' → retry.
   - W razie błędu mid-process: zapisz status 'failed' + error message, kontynuuj kolejne kampanie.

10) MONITORING:
    - Każde uruchomienie → wpis do `cron_runs` (function_name, started_at, ended_at, status, summary).
    - Alert (przez Resend admin email) jeśli > 10% kampanii fail w jednym uruchomieniu.

ENV (wymagane):
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- MAPBOX_TOKEN
- RESEND_API_KEY
- CRON_SECRET
- ADMIN_ALERT_EMAIL
- TZ=Europe/Warsaw

ACCEPTANCE CRITERIA:
✓ `supabase functions deploy monthly-campaign-report` przechodzi bez błędów.
✓ Lokalne uruchomienie `supabase functions serve` + curl z `x-cron-secret` generuje PDF dla seed campaign w < 30s.
✓ PDF otwiera się poprawnie w Adobe Reader, Preview macOS, Chrome.
✓ Polskie znaki diakrytyczne (ąęćłńóśźż) renderowane poprawnie.
✓ Dla kampanii z 5 pojazdami i 100k punktów GPS: czas generacji < 60s, rozmiar PDF < 3MB.
✓ Mail z Resend dociera do skrzynki testowej z poprawnym tematem i załącznikiem/linkiem.
✓ Idempotentny: drugi run za ten sam okres → skip.

PODAJ TEŻ:
- Przykładowy wygenerowany PDF (struktura opisowa strona po stronie).
- Dashboard SQL do śledzenia historii: `SELECT * FROM cron_runs WHERE function_name = 'monthly-campaign-report' ORDER BY started_at DESC LIMIT 20;`.
- Plan migracji jeśli kiedyś chcemy wymienić Mapbox Static API na własny renderer (lib alternatywne: maplibre-gl headless w Playwright cluster).
- README z procedurą ręcznego re-run dla konkretnej kampanii (dla supportu).

ZACZNIJ od deno.json i lib/supabase.ts → queries.ts (cała logika SQL!) → charts.ts → map-snapshot.ts → i18n.ts → pdf-builder.ts (najwięcej kodu) → email.ts → index.ts (orchestrator) → migracja pg_cron na końcu.
```

---

## Jak używać tych promptów

1. **Kolejność rekomendowana: D → A → B → C → E.** Schemat bazy jest fundamentem — bez niego pozostałe moduły będą się odwoływać do nieistniejących tabel.
2. **Wklejaj jeden prompt na raz.** Każdy jest na tyle obszerny, że oczekuj 30–90 minut pracy AI per moduł.
3. **Po wygenerowaniu — zawsze code review.** Szczególnie:
   - PROMPT A: realne testy na fizycznym urządzeniu (nie tylko symulator).
   - PROMPT C: testy webhooków przez `stripe listen` lokalnie.
   - PROMPT D: testy RLS jako 3 różni użytkownicy.
4. **Iteruj.** Jeśli AI coś pominie — drugi prompt typu „W pliku X brakuje Y, dopisz" działa lepiej niż uruchamianie całości od nowa.
5. **Wersjonuj env-y od pierwszego commita.** Każdy z 5 modułów dokłada nowe zmienne — łatwo się pogubić.

**Łączny scope:** ~12–18 tysięcy linii kodu produkcyjnego + migracje + testy + dokumentacja.
**Realistyczny czas wdrożenia z code review:** 3–5 tygodni przy jednym developerze full-time.
