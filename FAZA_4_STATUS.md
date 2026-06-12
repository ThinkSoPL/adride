# 🚗 AdRide — FAZA 4: Status realizacji

**Audyt kodu:** 2026-06-10 (skan rzeczywistego repo, nie deklaracji)
**KPI Gate:** GPS App iOS+Android live + Panel kierowcy + Panel reklamodawcy z mapą LIVE + Stripe Connect

## Podsumowanie: 8 ✅ / 2 🟡 / 4 ⏳

| ID | Zadanie | Status | Dowód w kodzie |
|----|---------|--------|----------------|
| **4.01** | Wybór stacku Mobile | ✅ **GOTOWE** | `mobile/package.json` — Expo 51 + expo-location + expo-task-manager + expo-sqlite |
| **4.02** | **Tracker GPS — zbieranie danych** | 🔴 **BLOKER — zepsute** | Moduł `src/modules/gps-tracking` **NIE ISTNIEJE**, a `App.tsx` i `TrackingCard.tsx` go importują → apka się nie zbuduje |
| **4.03** | Panel kierowcy mobile | ✅ **GOTOWE** | `DashboardScreen`, `LoginScreen`, nawigacja, `StatCard`/`CampaignCard`/`SessionItem`, `queries-mobile.ts` |
| **4.04** | Zdjęcia dowodowe (proof-of-placement) | ✅ **GOTOWE** | `modules/proof-photos/` (camera hook + geotag + upload) + `ProofGalleryScreen` + migracja `proof_photos` |
| **4.05** | Algorytm impressions GPS (AADT) | ✅ **GOTOWE** | `features/impressions-calculator/` — `aadt-warsaw.ts` + `calculator.ts` + testy |
| **4.06** | TestFlight iOS + beta Android | ⏳ **TODO** | Brak konfiguracji EAS build / dystrybucji |
| **4.07** | UX/UI panelu reklamodawcy | ✅ **GOTOWE** | `dashboard/advertiser`, `features/fleet-dashboard/`, `campaign/[id]` |
| **4.08** | Mapa LIVE tras (Mapbox) | ✅ **GOTOWE** | `features/campaign-map/` — layers, popups, controls, colorScale (194 kB bundle) |
| **4.09** | Raporty automatyczne PDF + email | ⏳ **TODO** | Brak jsPDF / generatora PDF / auto-wysyłki |
| **4.10** | Stripe Connect — płatności | ✅ **GOTOWE** | `api/stripe/connect-link` + `connect-status` + `payment-intent` + webhook (zahartowane w QA) |
| **4.11** | Panel admina | 🟡 **CZĘŚCIOWO** | `admin/page.tsx` + `DriverActions.tsx` (zatwierdzanie KYC). Brak: CRUD kampanii, GPS monitoring, alerty |
| **4.12** | Supabase — baza + hosting | ✅ **GOTOWE** | 19 migracji: profiles, drivers, advertisers, vehicles, campaigns, gps_sessions, gps_points (partycjonowane), payouts, stripe_events, proof_photos, RLS |
| **4.13** | Testy E2E + soft launch | ⏳ **TODO** | Deploy na mikr.us w toku (10.06). Brak UAT z 10 kierowcami |

## 🔴 Krytyczny bloker KPI Gate: 4.02 (silnik GPS)

Cała otoczka jest gotowa — schema `gps_sessions`/`gps_points`, UI `TrackingCard`, zapytania mobilne — **brakuje tylko samego silnika**. Dwa pliki importują nieistniejący moduł:

- `mobile/App.tsx:3` → `import 'src/modules/gps-tracking';`
- `mobile/src/components/TrackingCard.tsx:2` → `import { useGpsTracking } from 'src/modules/gps-tracking';`

Moduł musi eksportować:
1. Hook `useGpsTracking()` → `{ isTracking, status, session, error, start, stop, pause }`
2. Side-effect `TaskManager.defineTask()` (background location) — zapis lat/lon co 30 s do `gps_points`

**Bez tego mobilna apka się nie uruchamia, a KPI Gate (GPS live) jest nieosiągalny.**

## Kolejność prac (do KPI Gate)

1. **4.02** — napisać moduł `gps-tracking` (background GPS + hook). #1 priorytet, odblokowuje całą apkę
2. **4.06** — EAS build + TestFlight + APK → 10 kierowców
3. **4.13** — UAT z kierowcami, fix bugów
4. **4.09** — raporty PDF (jsPDF) — ważne dla reklamodawcy, nie blokuje Gate
5. **4.11** — domknąć admina (CRUD kampanii, alerty nieaktywnego pojazdu)

## Gotowe i działające (nie ruszać)

Web (deploy na mikr.us): Stripe Connect, mapa Mapbox LIVE, kalkulator impressions z AADT, panele kierowcy/reklamodawcy, pełna schema + RLS, proof-photos. Apka mobilna: logowanie, dashboard, galeria zdjęć dowodowych — wszystko poza silnikiem GPS.
