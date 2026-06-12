# AdRide — Marketplace Reklamy Mobilnej

> Twoja reklama jedzie tam gdzie są Twoi klienci.

---

## Co to jest?

**AdRide** to marketplace łączący lokalnych reklamodawców z kierowcami prywatnymi. Kierowcy naklejają reklamy na auta i zarabiają za przejechane kilometry. Reklamodawcy płacą za faktyczną ekspozycję GPS — nie za obietnicę zasięgu.

---

## Szybki start (5 minut)

### 1. Zainstaluj i uruchom aplikację

```bash
cd app
npm install
node scripts/seed-demo.mjs  # Tworzy 3 konta demo + dane testowe
npm run dev                 # Uruchamia localhost:3000
```

### 2. Zaloguj się

```
Email:    firma@demo.adride.pl (reklamodawca) lub tomek@demo.adride.pl (kierowca)
Hasło:    AdRide2026!
```

### 3. Testuj dashboard

- **Jako kierowca:** zobacz pojazdy, kampanię, wypłaty
- **Jako reklamodawca:** zobacz kampanię Mokotów, 3 pojazdy w terenie, KPI

### 4. Kalkulator publiczny

Bez logowania: http://localhost:3000/kalkulator

---

## Struktura projektu

```
AdRide/
├── app/                    # Next.js 15 — aplikacja web
│   ├── app/               # Route handlers (Next.js App Router)
│   ├── src/               # Components, business logic
│   ├── supabase/          # Database migrations + Edge Functions
│   └── scripts/
│       └── seed-demo.mjs  # Seed testowych danych
├── mobile/                # React Native (Expo) — app kierowcy
├── _sprint/               # Plan sprzedażowy (14 dni)
├── _materialy/            # Regulaminy, umowy
├── CLAUDE.md              # Dokumentacja projektu
├── DEPLOYMENT.md          # Instrukcja wdrażania
└── README.md              # Ten plik
```

---

## Model biznesowy

### 3 pakiety dla reklamodawców

| Pakiet | Auta | Min. długość | Cena/mies |
|---|---|---|---|
| **START** (Dzielnica) | 3 | 3 mc | 2 800 zł |
| **SCALE** (Metro) | 7 | 6 mc | 17 500 zł |
| **PREMIUM** (Miasto) | 15+ | 12 mc | 33 000 zł |

### Stawki kierowcy

- **Miasto** (≤50 km/h): 0,60 zł/km
- **Pozamiejskie** (>50 km/h): 0,25 zł/km

Marża: ~30–50% w zależności od pakietu

---

## Technologia

- **Frontend:** Next.js 15 + TypeScript + Tailwind CSS
- **Backend:** Next.js API Routes + Edge Functions
- **Baza danych:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (SSR)
- **Mapy:** Mapbox GL (na dashboardzie)
- **Płatności:** Stripe (przyszłość)
- **Deploy:** Vercel lub SSH

---

## Kluczowe właściwości

✅ **Auth** — Supabase SSR middleware + role-based access (driver/advertiser/admin)
✅ **Public kalkulator** — Lead magnet (bez logowania)
✅ **Dashboards** — Kierowca (pojazdy, wypłaty), Reklamodawca (kampanie, KPI)
✅ **GPS tracking** — Sesje GPS + rozkład km (miejski vs pozamiejski)
✅ **Responsive design** — Mobile-first, dark mode
✅ **Demo data** — Seed script tworzy konta + kampanię testową
✅ **Ready to deploy** — Vercel (3 min) lub SSH (30 min)

---

## Deployment

### Produkcja — Vercel (3 minuty)

```bash
npm i -g vercel
cd app && vercel --prod
```

Więcej: zobacz [DEPLOYMENT.md](./DEPLOYMENT.md)

### Produkcja — SSH/Linux (30 minut)

```bash
cd app && npm run build
# scp wgranie + PM2 + Nginx setup
```

Pełna instrukcja: zobacz [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## Zmienne środowiskowe

```bash
# app/.env.local (git-ignored)
NEXT_PUBLIC_SUPABASE_URL=https://outbmkrkahnshzzxxven.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Klucze Supabase: https://app.supabase.com → Settings → API

---

## Useful commands

```bash
cd app

# Development
npm run dev                      # localhost:3000 + hot reload

# Production
npm run build
npm start

# Testing
npm run test                     # Jest (wymaga naprawy infrastruktury — task #12)
npx tsc --noEmit                # Type check

# Database
node scripts/seed-demo.mjs       # Seed danych demo
```

---

## FAQ

**P: Czy aplikacja jest gotowa na sprzedaż?**
T: Tak! Aplikacja + demo data są gotowe. Deployuj na Vercel/SSH i testuj z klientami.

**P: Jak dodać nowe konto?**
T: `/register` — utwórz nowe konto, wybierz rolę (kierowca/reklamodawca).

**P: Gdzie są testy?**
T: `app/src/features/*/lib/__tests__/` — 26 testów. Wymaga naprawy infrastruktury (task #12).

**P: Czy Stripe jest zintegrowany?**
T: Nie — klucze są placeholder'ami. Po pierwszej umowie: wpisz live keys do `.env.production`.

**P: Jak tracker GPS działa?**
T: Demo ma symulowane sesje GPS w bazie. Mobile app (Expo) będzie zbierać rzeczywiste dane.

---

## Roadmap

### ✅ Zrobione (v1.0)
- Aplikacja web + dashboards
- Auth + role-based access
- Kalkulator publiczny
- Seed demo

### 📋 Backlog (P2)
- [\#12] Infrastruktura testów (naprawić jest.config.js)
- [\#13] Stripe Live Keys
- [\#14] Mobile app (Expo) — GPS tracking
- [\#15] Real-time km calculation (Edge Functions)
- [\#16] Push notifications

---

## Support

- **Pytania o kod:** zobacz [CLAUDE.md](./CLAUDE.md)
- **Deployment:** zobacz [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Sprint sprzedażowy:** zobacz `_sprint/00_plan_14_dni.md`

---

## Licencja

Proprietary — Malik sp. z o.o.

---

**Gotowe? Zaloguj się i testuj demo!** 🚀

http://localhost:3000/login
