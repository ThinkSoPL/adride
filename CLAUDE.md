# AdRide — CLAUDE.md

## Czym jest projekt
AdRide to marketplace reklamowy łączący lokalnych reklamodawców z kierowcami Uber/Bolt.
Kierowcy naklejają reklamy na auta i zarabiają 200–600 zł/mies. za przejechane kilometry.
Reklamodawcy płacą per km — nie za obietnicę zasięgu, tylko za faktyczną ekspozycję GPS.

**Tagline:** „Twoja reklama jedzie tam gdzie są Twoi klienci."

## Stan projektu
- **Etap:** 🟢 **LIVE** — aplikacja + seed data + gotowa do sprzedaży
- **Gotowe:** Kod aplikacji (26 testów ✓), regulaminy v1.3, landing pages, unit economics v2, deployment VPS + Vercel
- **🌐 LIVE URL (główna):** https://app.adride.pl — VPS mikr.us (PM2 + Nginx + Cloudflare), repo `/root/adride` gałąź **`master`**. Deploy: `git pull origin master && cd app && npm run build && pm2 restart adride`
- **🌐 LIVE URL (zapas/demo):** https://adride-iota.vercel.app/ — auto-deploy z `main`
- ⚠️ **Deploy gotcha:** przy błędzie Cloudflare **521** to nginx, nie app — patrz `DEPLOYMENT.md` Troubleshooting (osierocony `sites-available/ja-adride-log` → brak certu). Gałąź na VPS to `master`, NIE `main`.
- **Gotowe (aplikacja web):**
  - ✅ Next.js 15 + TypeScript + Tailwind
  - ✅ Auth (Supabase) — 3 role: admin/driver/advertiser
  - ✅ Middleware + routing — publiczny kalkulator, chronione dashboardy
  - ✅ Root page `/` — smart redirect (zalogowany → dashboard, anonim → kalkulator)
  - ✅ Dashboard kierowcy — pojazdy, wypłaty, status
  - ✅ Dashboard reklamodawcy — kampanie, KPI, pojazdy w terenie
  - ✅ Kalkulator publiczny (lead magnet)
  - ✅ Seed demo — 3 konta + kampania testowa + 3 pojazdy + 3 sesje GPS + 2 wypłaty
  - ✅ Vercel deploy — 17 functions, fast build (51s), auto-scaling
- **Gotowe (narzędzia):** UE v2 — HTML + XLSX (16 suwaków, per-km, split miejski/pozamiejski, narzut ABO 85%)
- **Gotowe (sprzedaż):** `_sprint/` — plan 14 dni, 3 pakiety flat-fee, skrypt 20 telefonów, deck 5 slajdów, umowa 1-str.
- **Następny krok:** 20 telefonów do lokalnych firm (Tier 1) → 3 spotkania → 1 podpisana umowa pilotowa

### FAZA 4 (Platforma MVP + GPS App) — status 2026-06-10
Pełny status: `FAZA_4_STATUS.md`. Skrót: **8 ✅ / 2 🟡 / 4 ⏳**
- ✅ Gotowe: 4.01 stack mobile, 4.03 panel kierowcy, 4.04 proof-photos, 4.05 impressions (AADT), 4.07 panel reklamodawcy, 4.08 mapa Mapbox LIVE, 4.10 Stripe Connect, 4.12 Supabase schema+RLS
- 🟡 Częściowo: 4.11 admin (jest KYC approve; brak CRUD kampanii/alertów)
- ⏳ TODO: 4.06 TestFlight/beta, 4.09 raporty PDF, 4.13 E2E+soft launch
- 🔴 **BLOKER 4.02:** moduł `mobile/src/modules/gps-tracking` NIE ISTNIEJE, a `App.tsx` + `TrackingCard.tsx` go importują → apka mobilna się nie buduje. To #1 priorytet do KPI Gate (GPS live)

## Stack technologiczny
- **Frontend/Backend:** Next.js (App Router) + TypeScript — folder `app/`
- **Mobile:** React Native / Expo — folder `mobile/`
- **Baza danych:** Supabase (PostgreSQL + Edge Functions)
- **Płatności:** Stripe (Connect — wypłaty dla kierowców, płatności od reklamodawców)
- **Mapy/GPS:** integracja GPS do śledzenia kilometrów z reklamą

## Struktura folderów
```
AdRide/
├── app/               # Next.js web app (dashboard reklamodawcy + admin)
├── mobile/            # Expo app dla kierowcy
├── css/ js/           # Landing page statyczne
├── index.html         # Landing page główna
├── kierowca.html      # Landing page dla kierowców
├── reklamodawca.html  # Landing page dla reklamodawców
├── adride_unit_economics.html   # Kalkulator unit economics (dark/light mode, suwaki)
├── adride_unit_economics.xlsx   # Arkusz Excel z suwakami (generowany z generate_xlsx.py)
├── generate_xlsx.py             # Generator XLSX (openpyxl + VML injection)
├── QUICK_START.md     # Instrukcja uruchomienia (5 min)
└── IMPLEMENTATION_CHECKLIST.md  # Szczegółowy checklist setupu
```

## Uruchomienie lokalne

### Setup (raz)
```bash
cd app
npm install
node scripts/seed-demo.mjs  # Tworzy 3 konta demo + dane testowe
npm run dev                 # localhost:3000
```

### Logowanie demo (hasło: AdRide2026!)
- Admin: `admin@adride.pl`
- Kierowca: `tomek@demo.adride.pl` (3 pojazdy, kampania aktywna, 629 zł wypłacone)
- Reklamodawca: `firma@demo.adride.pl` (kampania Mokotów, 3 pojazdy)

### Mobile (osobno)
```bash
cd mobile && npm install && npx expo start  # Expo DevTools
```

## Kluczowe komendy
```bash
cd app
npm run dev                    # Uruchomienie dev serwera (localhost:3000)
npm run build                  # Build produkcyjny
npm start                      # Run built production
npm run test                   # Uruchomienie testów (wymaga naprawy infrastruktury — task #12)
node scripts/seed-demo.mjs     # Seed danych demo (idempotentny — można uruchomić kilka razy)
```

## Zmienne środowiskowe (app/.env.local)
```
# Supabase (obtaj z panelu Supabase → Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://outbmkrkahnshzzxxven.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe (placeholder na starcie — wpisz klucze z https://dashboard.stripe.com)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...

# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Produkcja:** sekrety Stripe → Supabase Vault (nie commituj do git).

## Dwa segmenty klientów
**Kierowca** — Uber/Bolt, ~31 lat, 3–5 tys. km/mies., chce dochód pasywny bez zmian nawyków
**Reklamodawca** — lokalny biznes (restauracja, klinika, salon), budżet 2–10k zł/mies., zmęczony Meta/Google

## Priorytet działań — model sprzedażowy (nie techniczny)
> **Insight COO (31.05):** nie iteruj kalkulatora — sprzedawaj. Flat-fee > per-km w cenniku klienta. Kalkulator per-km to Twoja tajemnica operacyjna.

1. **DZIŚ:** `_sprint/01_checklista_blokery.md` — T&C Uber/Bolt + leasing + AC/OC (blocker podaży)
2. Lista 20 firm Tier 1 (stomatologie, kliniki, salony) → 20 telefonów → 3 spotkania
3. Pakiet Dzielnica (3 auta, 2 800 zł/mc, 3 mc) → 1 podpisana umowa → przelew
4. Pilot → raport tygodniowy → referencja → skaluj do Metro (7 aut)
5. *(odłożone)* Stripe + Supabase Vault — po pierwszym przychodzie

## Ważne pliki kontekstowe

### Sprzedaż — zacznij tutaj
- `_sprint/00_plan_14_dni.md` — plan dzienny z KPI do pierwszej złotówki
- `_sprint/01_checklista_blokery.md` — **PRIORYTET #1** — weryfikacja prawna/ubezp./leasing
- `_sprint/02_pakiety_cenowe.md` — 3 pakiety flat-fee z argumentami cenowymi
- `_sprint/03_skrypt_telefoniczny.md` — skrypt 20 telefonów + obiekcje + email follow-up
- `_sprint/04_deck_1str.md` — deck 5 slajdów na spotkanie z klientem
- `_sprint/05_umowa_pilotowa_1str.md` — umowa 1-stronicowa, podpisywalnie na pierwszym spotkaniu

### Techniczne / strategiczne
- `QUICK_START.md` — instrukcja setup krok po kroku
- `IMPLEMENTATION_CHECKLIST.md` — pełny checklist implementacji
- `AdRide-strategia-i-timeline.md` — strategia i timeline (w Downloads/)
- `adride_plan_dzialan.md` — plan działań wg 8 ekspertów (Hormozi, Godin, Brunson...)

## Unit Economics — kalkulator i arkusz
**Pliki:** `adride_unit_economics.html` + `adride_unit_economics.xlsx` + `generate_xlsx.py`

### Model biznesowy v2 — PER-KM (kluczowe założenia)
- Model **per-km** (zgodny z istotą produktu: reklamodawca płaci za faktyczną ekspozycję GPS, nie za budżet ryczałtowy)
- Dwa modele kampanii: **Subskrypcyjny** (reklamodawca org. oklejenie, płaci osobno) i **Abonamentowy** (AdRide org. oklejenie; cena z **narzutem ABO** kryjącym oklejenie+logistykę; **min. 12 miesięcy**)
- **Stawka mieszana** = `stawka_miejska × (1 − % pozamiejskich) + stawka_pozamiejska × % pozamiejskich` (liczona OSOBNO dla kierowcy i reklamodawcy — split obustronny)
- Przychód SUB / auto / mies. = `km × stawka_rekl_mieszana × prestiż`
- Przychód ABO / auto / mies. = `km × stawka_rekl_mieszana × prestiż × (1 + narzut_ABO)`
- Wypłata kierowcy = `km × stawka_kier_mieszana × prestiż × wsp_oklejenia` (identyczna w obu modelach)
- **Prestiż = SYMETRYCZNY:** `1 + (wartość_auta/200k − 1) × prestige_coeff` — ten sam współczynnik po stronie przychodu i wypłaty → marża % stała niezależnie od wartości auta
- 🚦 **Split miejski/pozamiejski (OBUSTRONNY):** km miejskie (teren zabud. ≤50 km/h, wyższa ekspozycja) vs pozamiejskie (>50 km/h, niższa). Kierowca: **0,60 / 0,25** zł/km (zgodnie z regulaminem). Reklamodawca: **1,20 / 0,50** zł/km (ten sam stosunek 2:1 → marża % stała niezależnie od udziału km). GPS dzieli km automatycznie.
- **Domyślne:** km=1000, **% pozamiejskich=30%**, stawka_kier=0,60/0,25, stawka_rekl=1,20/0,50, prestige_coeff=0,30, **narzut_ABO=85%** (suwak 0–250%)
- **ABO: minimum 12 miesięcy** — amortyzacja oklejenia liczona z podłogą `MAX(miesiące,12)`
- **Audyt prawny = koszt jednorazowy startu** (NIE miesięczny, NIE per-umowa) — poza miesięcznym P&L
- BEP audytu = `koszt_prawny / zysk_operacyjny_miesięczny`
- 📊 **Wyniki domyślne (10 aut, 1000 km, 30% pozamiejskich, auto 200k):** SUB — przychód 990 zł, marża 495 zł (50%), zysk oper. 2 950 zł/mc, BEP audytu ~5,1 mc. ABO (narzut 85%, 12 mc) — przychód 1 832 zł, marża 570 zł (31%), zysk oper. 3 698 zł/mc, BEP ~4,1 mc. Przy 0% pozamiejskich (same km miejskie): SUB 1200/600 zł. Narzut +64% = pass-through oklejenia (marża ABO = marża SUB w zł).

**Regulaminy:** zaktualizowane do modelu v2 (`_materialy/regulamin-adride-pl.md` v1.3, `umowa-reklamodawca-adride.md`, `umowa-kierowca-adride.md`) — dwa modele kampanii, ABO min. 12 mc, rozliczenie per-km. ⚠ Wersje robocze — wymagają weryfikacji prawnika przed publikacją.

### HTML (`adride_unit_economics.html`)
- Dark/light mode toggle (localStorage + prefers-color-scheme)
- Tryb ciemny domyślny; CSS custom properties w `:root` i `[data-theme="light"]`
- Suwaki parametrów (w tym km/mies., stawki per-km, prestiż), tabela wrażliwości na **km/mies.**, waterfall P&L (operacyjny, audyt poza P&L), scenariusze liczby aut

### XLSX (`generate_xlsx.py` → `adride_unit_economics.xlsx`)
- 6 arkuszy: Dane wejściowe, Subskrypcyjny, Abonamentowy, Porównanie, Scenariusze, **Wrażliwość — km na mies.**
- **16 suwaków** w arkuszu "Dane wejściowe" (w tym narzut ABO, % km pozamiejskich, stawki miejska/pozamiejska) — VML form controls wstrzyknięte do ZIP
- Parametry ze skalą (wartość auta ×10 000; stawki/prestiż ze skalą ułamkową np. ×0,05) mają helper-cell w kolumnie F; B = F × skala
- Aby regenerować XLSX: `python generate_xlsx.py` (wymaga `pip install openpyxl`)

### Znane pułapki techniczne (VML injection)
- openpyxl nie deklaruje `xmlns:r` w `<worksheet>` gdy brak hyperlinków → trzeba dodać przy injekcie `<legacyDrawing>`
- Poprawny element do linkowania suwaka z komórką: `<x:FmlaLink>` (NIE `<x:LinkedCell>`)
- Kolejność w `<x:ClientData>`: `<x:Horiz/>` PRZED `<x:FmlaLink>`
- Formuły w openpyxl: buduj czyste wyrażenia (bez leading `=`), dodaj `=` dopiero przy `sc()`

---

## Deployment

### Opcja A: Vercel (3 minuty, zalecane)
```bash
npm i -g vercel
cd app
vercel --prod
```
- Automatycznie buduje + wdrażahost
- Darmowy tier wystarczy
- Własna domena: Vercel dashboard → Settings → Domains

### Opcja B: SSH na mikr.us (lub inny serwer Linux)

**Lokalne przygotowanie:**
```bash
cd app
npm run build
mkdir -p deploy
cp -r .next public package.json package-lock.json deploy/
cp .env.local deploy/.env.production
```

**Na serwerze (SSH):**
```bash
ssh user@natalia132.mikrus.xyz
cd /home/user && mkdir -p adride/app && cd adride/app

# Z lokalnej maszyny: scp deploy/* user@natalia132.mikrus.xyz:/home/user/adride/app/
npm install --production
sudo npm i -g pm2
pm2 start 'npm start' --name adride
pm2 save && pm2 startup
```

**Nginx reverse proxy:**
```bash
sudo nano /etc/nginx/sites-available/adride
# Dodaj:
# server {
#   listen 80;
#   server_name natalia132.mikrus.xyz;
#   location / {
#     proxy_pass http://localhost:3000;
#     proxy_set_header Host $host;
#   }
# }

sudo ln -s /etc/nginx/sites-available/adride /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

**SSL (opcjonalne, zalecane):**
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d natalia132.mikrus.xyz
```

---

## Infrastruktura projektowa (status 2026-06-10)

| Element | Status | Lokacja |
|---|---|---|
| **Aplikacja Web** | ✅ Live | `app/` + https://outbmkrkahnshzzxxven.supabase.co |
| **Landing Pages** | ✅ Live | http://localhost:8080 (statyczne) + adride.pl (domain) |
| **Seed Demo** | ✅ Idempotentny | `app/scripts/seed-demo.mjs` |
| **Testy** | ⏳ Wymaga naprawy | `app/jest.config.js` + task #12 (backlog) |
| **Regulaminy** | ✅ v1.3 | `_materialy/` (do weryfikacji prawnika) |
| **Playbook** | ✅ v3 Updated | `AdRide_Playbook_8Expert_v3_UPDATED.xlsx` |
| **Sprint Plan** | ✅ Gotowy | `_sprint/` (14 dni do 1. umowy) |

---

## Przyszłe prace (P2 — po pierwszej umowie)

1. **Infrastruktura testów** (task #12) — naprawić jest.config.js, zainstalować @types/jest
2. **Stripe Live Keys** — wpisać klucze produkcyjne do `.env.production`
3. **Mobile App** (Expo) — integracja GPS + dashboard kierowcy
4. **Supabase Edge Functions** — real-time kalkulacja km-ów
5. **Push Notifications** — powiadomienia dla kierowców o kampaniach
