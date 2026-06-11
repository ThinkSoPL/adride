# AdRide.pl — Master Project File
> Plik bazowy do analiz marketingowo-ekonomicznych | Wersja 1.0 | Maj 2026

---

## 1. ISTOTA PROJEKTU

**AdRide.pl** to dwustronny marketplace (B2B + B2C) łączący reklamodawców z właścicielami prywatnych samochodów, którzy otrzymują wynagrodzenie za oklejenie pojazdu brandingiem klienta i jeżdżenie po mieście.

**Wzorzec globalny:** Carvertise (USA, 300 tys. kierowców) i Wrapify (USA, 9 mln USD funding) — model zaadaptowany do polskich realiów kosztowych i rynkowych.

**Branża:** Out-of-Home (OOH) / reklama mobilna / sharing economy.

---

## 2. MODEL BIZNESOWY

### Jak działa

| Krok | Strona | Opis |
|------|--------|------|
| 1 | Reklamodawca | Zleca kampanię, płaci za oklejenie + miesięczną prowizję AdRide |
| 2 | AdRide | Matchuje kierowcę z kampanią, koordynuje oklejanie u Wodka (partnera) |
| 3 | Kierowca | Jedzie oklejonym autem po mieście, otrzymuje co miesiąc wynagrodzenie |
| 4 | AdRide | Zbiera dane GPS, raportuje zasięg reklamodawcy |

### Strumienie przychodów

- **Prowizja/marża na różnicy:** przychód od reklamodawcy minus wypłata dla kierowcy
- **Zarządzanie kampanią:** opłata miesięczna za matchmaking i raportowanie

### Unit Economics (model bazowy)

| Pozycja | Kwota |
|---------|-------|
| Przychód od reklamodawcy (per pojazd/mies.) | 2 000–3 000 zł |
| Wypłata dla kierowcy (per pojazd/mies.) | 1 500 zł |
| Marża brutto (per pojazd/mies.) | 500–1 500 zł |
| Koszt oklejenia (jednorazowy, realia rynku) | 8 000–15 000 zł |
| Zwrot kosztu oklejenia | po 6–8 miesiącach (kontrakt min. 12 mies.) |
| Break-even platformy | 100 aktywnych pojazdów → zysk ~25 000 zł/mies. |

### Model „Reklamo-Leasing" (innowacja)

- Reklamodawca finansuje oklejenie w zamian za dłuższy kontrakt (18 mies. w cenie 12)
- Koszt oklejenia 8 000 zł rozkłada się na 12 rat po 667 zł
- Faktyczna marża operacyjna per pojazd: `2 500 zł - 1 500 zł - 667 zł = 333 zł netto`
- Efekt: kapitał startowy AdRide drastycznie maleje

---

## 3. RYNEK

| Wskaźnik | Wartość | Źródło/uwaga |
|----------|---------|--------------|
| Polski rynek OOH (2025) | 870 mln zł | +7% r/r |
| Segment City Transport (reklama mobilna) | ~6,7% rynku OOH | biała plama, brak lidera |
| Segment DOOH | +16,4% r/r | najszybciej rosnący |
| Rynek docelowy — reklamodawcy | MŚP + korporacje szukające mobilnego zasięgu w miastach | —  |
| Rynek docelowy — kierowcy | właściciele aut, kierowcy Bolt/Uber/Glovo szukający pasywnego dochodu | — |

**Wniosek:** Segment reklamy mobilnej (nie tramwaje/busy, ale prywatne auta) jest praktycznie niezagospodarowany w Polsce — brak bezpośredniego lidera lokalnego.

---

## 4. PERSONY

### Persona A — Kierowca

- **Kim jest:** Adam, 32 lata, Warszawa; pracuje na etacie, jeździ 1 200–2 000 km/mies.; może być kierowcą Bolt/Uber
- **Cel:** pasywny przychód bez zmiany stylu życia
- **Problem:** nie wie, że może zarabiać na już posiadanym aucie
- **Motywacja:** 1 500 zł/mies. = pokrycie raty leasingu / paliwa
- **Bariera:** obawa o lakier, OCAC, formalności

### Persona B — Reklamodawca (MŚP)

- **Kim jest:** właściciel/marketing manager firmy lokalnej (gastro, fitness, klinika, deweloper, e-commerce), budżet marketingowy 5 000–30 000 zł/mies.
- **Cel:** tani, mierzalny zasięg lokalny w Warszawie
- **Problem:** billboardy drogie, digital ads drogie i nieskuteczne lokalnie
- **Motywacja:** logo na 10 autach jeżdżących po mieście = mobilny billboard
- **Bariera:** nie zna modelu, brak case study, ryzyko nieznanej platformy

---

## 5. OFERTA PAKIETOWA DLA REKLAMODAWCÓW

| Pakiet | Auta | Czas | Co obejmuje |
|--------|------|------|-------------|
| Starter | 3 | 3 mies. | Oklejenie, matchmaking, miesięczny raport GPS |
| Growth | 10 | 6 mies. | j.w. + case study, dedykowany opiekun kampanii |
| Scale | 20 | 12 mies. | j.w. + content wideo z aut, pierwszeństwo w wyborze trasy |

---

## 6. DOKUMENTY PRAWNE (gotowe)

| Dokument | Status |
|----------|--------|
| Regulamin Platformy AdRide | Gotowy, w weryfikacji prawnika |
| Polityka Prywatności (RODO) | Gotowa, w weryfikacji |
| Polityka Cookies | Gotowa |
| Umowa z kierowcą (udostępnienie pojazdu) | Gotowa, wzór |
| Załącznik nr 1 do umowy z kierowcą | Gotowy |
| Załącznik nr 2 do umowy z kierowcą | Gotowy |
| Umowa z reklamodawcą | Gotowa, wzór |
| Klauzula RODO + zgoda na dane | Gotowa |
| Protokół zdawczo-odbiorczy (demontaż folii) | Gotowy |
| Regulamin Reklamacji | Gotowy |
| Warunki Aplikacji Mobilnej AdRide GPS | Gotowy |

**Kwestie do weryfikacji prawnej:**
- Forma umowy z kierowcą (zlecenie vs B2B, PIT, ZUS)
- GPS tracking a RODO — wymagana wyraźna zgoda
- Wpływ oklejenia komercyjnego na ważność OC/AC
- Obowiązki informacyjne AdRide (PIT-11 dla kierowców)

---

## 7. TECHNOLOGIA I APLIKACJA

### Stack MVP (budżet ~5 000 zł)

| Warstwa | Narzędzie | Koszt |
|---------|-----------|-------|
| Frontend strona | HTML (prototyp gotowy) → Netlify/GitHub Pages | 0 zł |
| Panel (no-code) | Bubble.io lub Softr.io + Airtable | ~300 zł/mies. |
| CRM B2B | Google Sheets → Pipedrive (trial) | 0–100 zł/mies. |
| Automatyzacje | Zapier/n8n | 0–50 zł/mies. |
| Płatności | Stripe Connect / Przelewy24 | prowizja % |
| GPS tracking | Bouncie (~8 zł/mies./pojazd) lub Tracksolid (~20 zł) | per pojazd |
| Fakturowanie | Fakturownia.pl lub InFakt | ~50 zł/mies. |
| Marketing automation | Apollo.io (cold outreach) + Instantly.ai | ~100 zł/mies. |
| Analityka | Google Analytics 4 + Hotjar | 0 zł |

### Panele w MVP

- **Panel Kierowcy:** rejestracja, profil pojazdu, status kampanii, historia wypłat, przesyłanie zdjęć
- **Panel Reklamodawcy:** tworzenie kampanii, raportowanie GPS, faktury
- **Panel Admina:** lista aut, matchowanie, zarządzanie wypłatami

### Co AI automatyzuje (oszczędności czasu)

| Zadanie | Narzędzie | Oszczędność |
|---------|-----------|-------------|
| Cold email outreach | Apollo.io + ChatGPT + Instantly.ai | 80% |
| Rejestracja i onboarding kierowców | Google Form + Zapier + CRM | 90% |
| Raportowanie kampanii | Google Sheets + Looker Studio | 85% |
| Fakturowanie i płatności | Stripe Connect + Fakturownia API | 95% |
| Monitoring GPS / proof-of-delivery | Bouncie/Tracksolid API | 80% |
| Treści marketingowe | ChatGPT + Canva AI + Buffer | 70% |
| Wycena kampanii (kalkulator) | Tally Forms na stronie | 100% |

---

## 8. PARTNERZY I KLUCZOWE ZALEŻNOŚCI

| Partner | Rola | Status |
|---------|------|--------|
| Wodek (Robert) — autodetailing/foliowanie | Główny wykonawca oklejenia, planuje 2 nowe pawilony | Zidentyfikowany, rozmowy w toku |
| Piotr Gilarski | Pierwszy kierowca-case study, gotowy nagrać filmy | Zainteresowany |
| Sebastian | Potencjalny reklamodawca lub ambasador sieci kontaktów | Kontakt w toku |
| Prawnik (Agnieszka/Ola) | Weryfikacja dokumentów prawnych | W toku |
| Księgowa | Kwestie PIT, ZUS, rozliczeń | Do potwierdzenia |

---

## 9. KPI I METRYKI KLUCZOWE

### KPI Operacyjne

| Metryka | Cel Faza 2 | Cel Faza 5 | Cel Break-even |
|---------|-----------|-----------|---------------|
| Kierowcy na waitliście | 50 | — | — |
| Aktywne oklejone pojazdy | 5–10 | 50 | 100 |
| Aktywni reklamodawcy | 1 | 5 | 10+ |
| MRR (Monthly Recurring Revenue) | 1. faktura | 100 000 zł | 125 000+ zł |
| Zysk operacyjny/mies. | — | — | 25 000 zł |

### KPI Marketingowe

| Metryka | Opis |
|---------|------|
| CPM (szacowany) | Koszt dotarcia do 1 000 osób przez oklejone auto (wyliczany z GPS + natężenie ruchu) |
| Open rate cold mail | Target: min. 30% (świadczy o jakości listy) |
| Konwersja lead → umowa | Cel: min. 1 na 30 kontaktów w Fazie 2 |
| Koszt pozyskania kierowcy (CAC) | FB Ads + czas: budżet 1 000–2 000 zł / 50 kierowców |
| Retencja kierowców (12 mies.) | Cel: min. 80% (kara umowna jako retencja) |
| Uptime pojazdu | Pesymistyczny: 70%, bazowy: 85% |

### KPI Gates (warunki przejścia między fazami)

| Przejście | Warunek |
|-----------|---------|
| Faza 0→1 | Ownership Justyny potwierdzony + Deck gotowy + Unit economics policzone |
| Faza 1→2 | Umowa z Wodkiem + dokumenty prawne zweryfikowane + CRM 30 firm |
| Faza 2→3 | 50 kierowców na waitliście + 1 umowa pilotażowa podpisana |
| Faza 3→4 | Min. 5 aut aktywnych + raport wysłany + pierwsza faktura opłacona |
| Faza 4→5 | Panele online + Stripe działa + GPS zbiera dane |
| Faza 5→6 | 50 aut + 5 reklamodawców + MRR 100 000 zł |
| Faza 6 (break-even) | 100 aut + zysk 25 000 zł/mies. + start Kraków/Wrocław |

---

## 10. HARMONOGRAM FAZOWY

| Faza | Nazwa | Okres | Kluczowe działania |
|------|-------|-------|--------------------|
| Faza 0 | Fundamenty i Decyzje | 7–14.05.2026 | Ownership, model finansowy, deck, hero na stronie, kontakty z Sebastianem i Piotrem |
| Faza 1 | Prawna i Partnerstwa | 14–28.05.2026 | Weryfikacja prawna, umowa z Wodkiem, cennik foliowania, CRM 30 firm, cold mail template |
| Faza 2 | Akwizycja Kierowców + Lead B2B | 28.05–25.06.2026 | 50 kierowców waitlist, FB Ads, cold outreach 30 firm, case study Piotr Gilarski |
| Faza 3 | Pilotaż 5–10 aut | 25.06–31.07.2026 | Pierwsze oklejenia, GPS tracking v1, raport miesięczny, pierwsza faktura |
| Faza 4 | Platforma MVP | 01.07–15.08.2026 | Panel kierowcy/reklamodawcy/admina, Stripe Connect, GPS integracja |
| Faza 5 | Skalowanie 50 aut | 15.08–23.10.2026 | 5 reklamodawców, 50 aut, MRR 100 000 zł, program referralowy |
| Faza 6 | Break-even 100 aut | 23.10–31.12.2026 | 100 aut, zysk 25 000 zł/mies., ekspansja Kraków/Wrocław |

---

## 11. STRUKTURA KOSZTÓW

### Koszty startowe (scenariusz minimum)

| Pozycja | Kwota |
|---------|-------|
| Oklejenie pilotaż 15 aut (częściowe) | 120 000 zł |
| Oklejenie pilotaż 15 aut (pełne) | 225 000 zł |
| Platforma MVP (no-code dev) | 5 000 zł |
| Budżet prawny (weryfikacja umów) | 1 000–2 000 zł |
| Kampania FB Ads (akwizycja kierowców) | 1 000–2 000 zł |
| Sprzęt GPS (pilotaż 10 aut) | 800–2 000 zł |
| Narzędzia SaaS (mies.) | ~600–1 000 zł |
| **Łączny budżet startowy (szacunek)** | **175 000–205 000 zł** |

> **Uwaga krytyczna:** Oryginalny biznesplan zakładał koszt oklejenia 2 500 zł/pojazd. Realia rynku: **8 000–15 000 zł** (różnica 3–6x). W nowym modelu koszt oklejenia ponosi reklamodawca — co drastycznie obniża zapotrzebowanie kapitałowe AdRide.

### Koszty miesięczne operacyjne (od Fazy 3)

| Pozycja | Kwota/mies. |
|---------|-------------|
| PM (Justyna) — wynagrodzenie | TBD (odroczone lub equity) |
| Narzędzia SaaS | ~600–1 000 zł |
| GPS tracking (10 aut) | 80–200 zł |
| Marketing (social, ads) | 1 000–3 000 zł |
| Bookkeeping/prawnik (ad hoc) | ~500 zł |

---

## 12. ANALIZA SWOT / RYZYKA

### Mocne strony

- Sprawdzony model globalnie (Carvertise, Wrapify)
- Polski rynek OOH rośnie 7% r/r — wchodzisz w rosnący segment bez lokalnego lidera
- MVP możliwy za 5 000 zł (gotowy prototyp HTML + no-code)
- Zidentyfikowany partner wykonawczy (Wodek)
- Case study w toku (Piotr Gilarski) — dowód koncepcji
- Oferta dla kierowcy 1 500 zł/mies. atrakcyjna vs Carvertise (100–400 USD)
- Break-even na 100 pojazdach — konkretny, osiągalny cel

### Słabe strony / Ryzyki

| Ryzyko | Poziom | Mitygacja |
|--------|--------|-----------|
| Problem kurczaka i jajka (brak kierowców ↔ brak reklamodawców) | WYSOKI | Zbierz 50 kierowców na waitliście PRZED rozmową B2B |
| Cash flow — koszt oklejenia płatny z góry | WYSOKI | Model: reklamodawca płaci za oklejenie bezpośrednio; kredyt kupiecki od Wodka |
| Brak PM/ownership operacyjnego | WYSOKI | Decyzja dot. Justyny musi zapaść — bez tego harmonogram jest fikcją |
| Kwestie prawne (OCAC, ZUS, RODO GPS) | WYSOKI | Weryfikacja prawnika do końca Fazy 1 |
| Edukacja rynku (polscy reklamodawcy nie znają modelu) | ŚREDNI | Case study Piotr Gilarski + content TikTok/YouTube |
| Marża przy przestojach pojazdów | ŚREDNI | Model finansowy z 70% uptime jako scenariusz pesymistyczny |

### Wskaźnik realizowalności (Raport Strategiczny, maj 2026)

| Wymiar | Ocena (/ 10) |
|--------|-------------|
| Rynek i popyt | 7/10 |
| Zasoby finansowe | 4/10 |
| Zasoby ludzkie | 5/10 |
| Technologia i operacje | 6/10 |
| Czas i harmonogram | 5/10 |
| **ŁĄCZNIE** | **27/50 = 54%** |

> Interpretacja: Solidne fundamenty koncepcyjne, ale brak ownership + nierozwiązany problem cash flow + kwestie prawne blokują start. Po podjęciu 3 kluczowych decyzji wskaźnik wzrośnie do ~70%.

---

## 13. KONKURENCJA I BENCHMARKI

| Platforma | Rynek | Skala | Wypłata kierowcy | Status |
|-----------|-------|-------|-----------------|--------|
| Carvertise | USA | 300 000 kierowców | 100–1 000 USD/mies. | Aktywny, skaluje |
| Wrapify | USA | 6 000 kierowców (2015), 9 mln USD funding | 400–500 USD avg. | Aktywny |
| **AdRide.pl** | **PL** | **0 (pre-MVP)** | **1 500 zł/mies.** | **Pre-walidacja** |

**Lokalna konkurencja w Polsce:** brak bezpośredniego odpowiednika (model praktycznie nieobecny).

---

## 14. STRATEGIA CONTENT & MARKETING

### Kanały akwizycji kierowców

- Facebook Ads (target: Warszawa, 22–45 lat, zainteresowania: motoryzacja, Bolt, Uber, oszczędzanie)
- Grupy FB: kierowcy Bolt/Uber, motoryzacja Warszawa, gig-economy
- Telegram: grupy Bolt Drivers Warsaw, Uber PL
- Organic social: TikTok/Reels seria „Zarabiaj na aucie"

### Kanały akwizycji reklamodawców (B2B)

- Cold email (Apollo.io + Instantly.ai) — 30 firm w Fazie 1, wzrost w Fazie 2
- LinkedIn (profil firmowy + outreach do Marketing Managerów)
- Case study Piotra Gilarskiego — PDF + landing page + social proof

### Content plan (kluczowe formaty)

| Format | Temat | Platforma |
|--------|-------|-----------|
| TikTok/Reels 30–60s | „Ile możesz zarobić na swoim aucie?" | TikTok, Instagram |
| TikTok/Reels 30–60s | „Jak działa AdRide? — 3 kroki" | TikTok, Instagram |
| TikTok/Reels 30–60s | Timelapse oklejania auta u Wodka | TikTok, Instagram |
| Wywiad wideo | Piotr Gilarski — case study, ile zarobił | YouTube, LinkedIn |
| LinkedIn post | Start pilotażu — ogłoszenie z zdjęciami | LinkedIn |
| PDF one-pager | Propozycja pilotażu dla reklamodawcy | Cold email, spotkania |
| Case study PDF | Piotr Gilarski — wyniki pierwszego miesiąca | Sprzedaż B2B |

---

## 15. OTWARTE PYTANIA / DECYZJE DO PODJĘCIA

1. **Finansowanie:** Skąd pochodzi 175 000–205 000 zł na start? (własne oszczędności / pożyczka / inwestor)
2. **Model płatności za oklejenie:** Kto ponosi koszt w fazie pilotażowej?
3. **Ownership operacyjny:** Czy Justyna oficjalnie przejmuje operacyjne prowadzenie projektu?
4. **Kontrakt minimalny z kierowcą:** Jaki minimalny czas trwania i kara za wcześniejsze zerwanie?
5. **GPS i RODO:** Czy platforma wymaga instalacji lokalizatora? Kto płaci, kto zarządza danymi?
6. **Strategia wyjścia z kosztów oklejenia:** Model „reklamodawca płaci za oklejenie z góry" vs model kredytu kupieckiego od Wodka
7. **Ekspansja vs głębokość:** Priorytet — rentowność w Warszawie czy szybka ekspansja na Kraków/Wrocław?

---

## 16. AKTUALNE TO-DO (wg faz i priorytetów)

### 🔴 KRYTYCZNE — blokują dalsze działania

- [ ] Potwierdzić ownership operacyjny (Justyna jako PM)
- [ ] Zbudować model unit economics (Google Sheets, scenariusze 10/50/100 aut)
- [ ] Zweryfikować prawnie: umowy, PIT, ZUS, RODO GPS, OCAC
- [ ] Podpisać umowę ramową z Wodkiem (cennik foliowania)
- [ ] Uruchomić formularz rejestracji kierowców (waitlist) na stronie
- [ ] Wysłać propozycję pilotażu do Sebastiana i Piotra Gilarskiego
- [ ] Zaktualizować stronę adride.pl (hero photo, copy, CTA)
- [ ] Skonfigurować GA4 + piksel FB na stronie

### 🟡 WYSOKIE — do wykonania w tym tygodniu/fazie

- [ ] Przygotować deck biznesowy v1.0 (12–15 slajdów)
- [ ] Uruchomić FB Ads (1 000–2 000 zł, akwizycja kierowców)
- [ ] Opublikować posty w grupach FB (kierowcy Bolt/Uber, motoryzacja)
- [ ] Nagrać 3 filmiki z Piotrem Gilarskim (case study)
- [ ] Wysłać cold mail do 30 firm (batch 1: 15 firm, batch 2: 15 firm)
- [ ] Skonfigurować Apollo.io do prospectingu B2B
- [ ] Zidentyfikować 2 rezerwowych wykonawców foliowania (backup dla Wodka)
- [ ] Ustalić pakiety ofertowe dla reklamodawców (3 tiery: Starter/Growth/Scale)

### 🟢 ŚREDNIE — nie blokują, ale ważne

- [ ] Stworzyć Google Business Profile dla AdRide.pl
- [ ] Skonfigurować Calendly (automatyczne umawianie spotkań)
- [ ] Opisać pełny workflow onboardingu B2C i B2B (krok po kroku)
- [ ] Policzyć CPM — jak mierzyć liczbę osób, które zobaczyły reklamę na aucie
- [ ] Przygotować szablon raportu miesięcznego dla reklamodawcy (PDF/Canva)

---

*Plik wygenerowany: 27 maja 2026 | Na podstawie: AdRide Raport Strategiczny v1.0, AdRide Project Tracker, Regulaminy i umowy platformy, Persony kierowcy i reklamodawcy, Plan treści (REELS, LI, cold mail), Specyfikacja aplikacji*
