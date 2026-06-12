# OCENA SKUTKÓW DLA OCHRONY DANYCH (DPIA)

## SYSTEM ŚLEDZENIA GPS POJAZDÓW KIEROWCÓW — PLATFORMA ADRIDE.PL

**Dokument:** Data Protection Impact Assessment (DPIA) zgodnie z art. 35 RODO  
**Wersja:** 1.0  
**Data sporządzenia:** 7 maja 2026 r.  
**Przygotowany przez:** Malik sp. z o.o. (Administrator danych)  
**Status:** Do zatwierdzenia przed uruchomieniem systemu GPS

---

## SEKCJA 1 — INFORMACJE OGÓLNE I PODSTAWA PRZEPROWADZENIA DPIA

### 1.1. Podmiot sporządzający

| | |
|---|---|
| **Administrator** | Malik sp. z o.o. |
| **Adres** | ul. Jana Piekałkiewicza 7/50, 00-710 Warszawa |
| **NIP** | 517 038 26 87 |
| **Kontakt RODO** | rodo@adride.pl |
| **IOD** | Nie wyznaczono |
| **Osoba odpowiedzialna za DPIA** | ________________________ |
| **Data przeglądu** | ________________________ (nie rzadziej niż co 12 miesięcy) |

### 1.2. Podstawa obowiązku przeprowadzenia DPIA

Ocena skutków jest obowiązkowa na podstawie **art. 35 ust. 1 i ust. 3 RODO**, ponieważ planowane przetwarzanie danych GPS spełnia co najmniej dwie z przesłanek wysoko ryzykownego przetwarzania:

| Przesłanka z art. 35 ust. 3 RODO / Wytyczne WP29 | Spełniona? | Uzasadnienie |
|---|---|---|
| Systematyczne monitorowanie publicznie dostępnych obszarów na dużą skalę | ✅ TAK | Tracking GPS pojazdów poruszających się po drogach publicznych |
| Przetwarzanie danych lokalizacyjnych na dużą skalę | ✅ TAK | Dane GPS wszystkich aktywnych Kierowców (potencjalnie setki pojazdów) |
| Innowacyjne zastosowanie nowej technologii | ⚠️ CZĘŚCIOWO | GPS jako podstawa modelu rozliczeniowego — niestandaryzowane zastosowanie |
| Profilowanie osób fizycznych | ⚠️ CZĘŚCIOWO | Analiza tras jazdy może pośrednio ujawniać wzorce zachowań |

### 1.3. Opis projektu / systemu

System GPS AdRide.pl składa się z:
- **aplikacji mobilnej** zainstalowanej na smartfonie Kierowcy (AdRide GPS),
- **serwerów** przetwarzających dane lokalizacyjne,
- **algorytmu rozliczeniowego** klasyfikującego przejazdy na miejskie (≤50 km/h) i pozamiejskie (>50 km/h),
- **panelu raportowego** dostępnego dla Operatora i Reklamodawcy.

---

## SEKCJA 2 — OPIS PLANOWANEGO PRZETWARZANIA

### 2.1. Charakter, zakres, kontekst i cel przetwarzania

| Parametr | Opis |
|---|---|
| **Charakter** | Ciągłe, systematyczne zbieranie danych lokalizacyjnych pojazdów w czasie rzeczywistym |
| **Zakres danych** | Współrzędne GPS, znacznik czasu, prędkość, kierunek jazdy, przebieg; co 30 sekund podczas jazdy |
| **Kontekst** | Kierowcy-osoby fizyczne, dobrowolnie uczestniczące w Kampaniach reklamowych |
| **Cel przetwarzania** | (1) Weryfikacja ekspozycji reklamy; (2) Obliczenie wynagrodzenia; (3) Raportowanie dla Reklamodawcy; (4) Obrona przed roszczeniami |
| **Podstawa prawna** | Art. 6 ust. 1 lit. b RODO (wykonanie umowy) + art. 6 ust. 1 lit. f RODO (uzasadniony interes w zakresie raportowania i obrony roszczeń) |
| **Liczba osób** | Szacunkowo: faza pilotażowa 50–200 Kierowców; docelowo do 1 000+ Kierowców |
| **Częstotliwość** | Dane zbierane ciągle w czasie aktywnej Kampanii (od Oklejenia do Demontażu) |
| **Czas przechowywania** | 12 miesięcy od zakończenia Kampanii, następnie trwałe usunięcie lub anonimizacja |
| **Lokalizacja serwerów** | EOG (wymagane) |

### 2.2. Kategorie osób, których dane dotyczą

- **Kierowcy** — osoby fizyczne (główna kategoria, której dane bezpośrednio dotyczą),
- **osoby trzecie** (pasażerowie pojazdu) — ich lokalizacja może być pośrednio ujawniona przez śledzenie pojazdu; ich dane NIE są bezpośrednio zbierane.

### 2.3. Podmioty mające dostęp do danych GPS

| Podmiot | Zakres dostępu | Podstawa |
|---|---|---|
| Malik sp. z o.o. (Admin) | Pełny dostęp | Administrator |
| Reklamodawca | Zagregowane dane (przebieg, mapa obszarów) — bez danych identyfikacyjnych Kierowcy | Umowa Reklamodawcy |
| Dostawca aplikacji GPS | Surowe dane GPS | Umowa Powierzenia (DPA) |
| Dostawca hostingu | Dane zaszyfrowane w przechowywaniu | Umowa Powierzenia (DPA) |

---

## SEKCJA 3 — OCENA NIEZBĘDNOŚCI I PROPORCJONALNOŚCI

### 3.1. Czy cel jest uzasadniony?

**TAK.** Przetwarzanie danych GPS jest nieodzownym elementem modelu biznesowego AdRide.pl — bez weryfikacji faktycznego przebiegu nie jest możliwe obiektywne obliczenie wynagrodzenia ani udowodnienie ekspozycji reklamy Reklamodawcy. Brak GPS prowadziłby do konieczności stosowania deklaratywnych (niezweryfikowanych) danych od Kierowców, co byłoby źródłem nadużyć po obu stronach.

### 3.2. Czy zbierane są minimalne niezbędne dane (zasada minimalizacji — art. 5 ust. 1 lit. c RODO)?

| Dane | Niezbędne? | Uzasadnienie |
|---|---|---|
| Współrzędne GPS | ✅ TAK | Niezbędne do klasyfikacji trasy (miasto / poza miastem) i raportowania obszaru |
| Prędkość | ✅ TAK | Podstawa do rozróżnienia Stawki Miejskiej (≤50 km/h) i Pozamiejskiej (>50 km/h) |
| Znacznik czasu | ✅ TAK | Niezbędny do rozliczenia miesięcznego i weryfikacji ciągłości ekspozycji |
| Kierunek jazdy | ⚠️ WARUNKOWO | Pomocniczy do algorytmu klasyfikacji; można rozważyć rezygnację |
| Model urządzenia / wersja OS | ✅ TAK | Wyłącznie diagnostyczne; nie ujawniany Reklamodawcy |
| Dane biometryczne | ❌ NIE | Nie są zbierane |

**Wniosek:** Zakres zbieranych danych jest co do zasady minimalny i proporcjonalny do celu. Zaleca się rozważenie rezygnacji ze zbierania kierunku jazdy (azymutu), jeśli algorytm może działać bez tej danej.

### 3.3. Czy dane są przechowywane przez minimalny niezbędny czas?

**TAK** — 12 miesięcy po Kampanii jest uzasadnione potrzebą obrony przed roszczeniami (standardowy termin przedawnienia krótszych roszczeń) i stanowi kompromis między bezpieczeństwem prawnym a minimalizacją przechowywania.

### 3.4. Czy osoby, których dane dotyczą, zostały należycie poinformowane?

**TAK** — art. 13 RODO jest spełniony przez:
- Politykę Prywatności (§ 4 — szczegółowy opis GPS),
- Klauzulę informacyjną RODO w formularzu dla Kierowcy,
- Warunki korzystania z Aplikacji GPS (§ 7),
- Umowę z Kierowcą (§ 10).

---

## SEKCJA 4 — IDENTYFIKACJA I OCENA RYZYK

### 4.1. Matryca ryzyk

| # | Ryzyko | Prawdopo-dobieństwo | Skutki | Poziom ryzyka przed mitygacją | Środki mitygacyjne | Poziom ryzyka po mitygacji |
|---|---|---|---|---|---|---|
| R1 | **Nieautoryzowany dostęp do danych GPS** przez osoby trzecie (atak hakerski, wyciek danych) | Średnie | Wysokie (ujawnienie wzorców zachowań, adresu zamieszkania) | 🔴 WYSOKI | Szyfrowanie TLS 1.2+ w transmisji; AES-256 w przechowywaniu; uwierzytelnienie dwuskładnikowe dla administratorów; regularne testy penetracyjne | 🟡 ŚREDNI |
| R2 | **Nadmiarowe przetwarzanie** — dostęp Reklamodawcy do danych identyfikujących Kierowcę poprzez GPS | Niskie | Wysokie | 🟡 ŚREDNI | Reklamodawca otrzymuje wyłącznie zagregowane dane (mapa obszarów, łączny przebieg) bez danych osobowych Kierowcy; dane identyfikacyjne Kierowcy dostępne Reklamodawcy wyłącznie w zakresie zgłoszeń szkód | 🟢 NISKI |
| R3 | **GPS spoofing** — fałszowanie danych lokalizacyjnych przez Kierowcę | Średnie | Średnie (straty finansowe Reklamodawcy, nieskuteczność reklamy) | 🟡 ŚREDNI | Algorytm wykrywania anomalii (nierealistyczna prędkość, niemożliwe zmiany lokalizacji, brak ruchu przy zarejestrowanym przebiegu); flagi alertów do ręcznej weryfikacji | 🟢 NISKI |
| R4 | **Awaria systemu GPS** — utrata danych przez awarię serwerów | Niskie | Średnie (błędne rozliczenie wynagrodzenia) | 🟡 ŚREDNI | Codzienne kopie zapasowe zaszyfrowane; redundancja serwerów; SLA dostawcy hostingu ≥99,9% | 🟢 NISKI |
| R5 | **Ujawnienie lokalizacji miejsca zamieszkania Kierowcy** poprzez analizę wzorców jazdy | Niskie | Wysokie (naruszenie prywatności) | 🟡 ŚREDNI | Dane GPS udostępniane Reklamodawcy wyłącznie w formie map cieplnych obszarów bez punktów startowych/końcowych; brak identyfikacji punktów zatrzymania >1h | 🟡 ŚREDNI |
| R6 | **Niewłaściwe przetwarzanie przez podmiot przetwarzający** (dostawca GPS) | Niskie | Wysokie | 🟡 ŚREDNI | Umowa Powierzenia (DPA) z zakazem przetwarzania poza celem; audyt procesora; certyfikaty bezpieczeństwa ISO 27001 | 🟢 NISKI |
| R7 | **Przekazanie danych do państw trzecich** bez odpowiedniej podstawy | Niskie | Wysokie (kara UODO do 20 mln EUR / 4% obrotu) | 🔴 WYSOKI | Wymóg EOG dla serwerów GPS; SCC dla ewentualnych podmiotów spoza EOG; weryfikacja umów DPA | 🟢 NISKI |
| R8 | **Brak możliwości realizacji praw osób** (dostęp, usunięcie) z powodu złożoności systemu GPS | Niskie | Średnie | 🟡 ŚREDNI | Procedura wniosków RODO z 30-dniowym terminem; techniczna możliwość eksportu danych GPS per Kierowca; mechanizm trwałego usunięcia danych w systemie | 🟢 NISKI |

### 4.2. Ryzyko rezydualne

Po zastosowaniu środków mitygacyjnych żadne z zidentyfikowanych ryzyk nie pozostaje na poziomie WYSOKIM. Ryzyko R5 (ujawnienie miejsca zamieszkania) pozostaje na poziomie ŚREDNIM ze względu na nieodłączny charakter danych lokalizacyjnych — nie można go całkowicie wyeliminować, lecz jest akceptowalne przy zastosowaniu opisanych środków.

---

## SEKCJA 5 — ŚRODKI TECHNICZNE I ORGANIZACYJNE

### 5.1. Środki techniczne (do wdrożenia przed uruchomieniem GPS)

- [ ] Szyfrowanie danych GPS w transmisji: **TLS 1.2 lub wyższy**
- [ ] Szyfrowanie danych GPS w przechowywaniu: **AES-256**
- [ ] Uwierzytelnienie dwuskładnikowe (MFA) dla kont administracyjnych systemu GPS
- [ ] Kontrola dostępu oparta na rolach (RBAC): oddzielny dostęp dla Operatora i Reklamodawcy
- [ ] Pseudonimizacja danych GPS widocznych dla Reklamodawcy (numer kampanii zamiast danych osobowych)
- [ ] Automatyczne usuwanie danych GPS po upływie 12 miesięcy od zakończenia Kampanii
- [ ] Algorytm wykrywania anomalii GPS (spoofing detection)
- [ ] Codzienne zaszyfrowane kopie zapasowe z przechowywaniem przez 30 dni
- [ ] Rejestr dostępu do danych GPS (logi audytowe)
- [ ] Procedura odtwarzania danych po awarii (RTO ≤4h, RPO ≤24h)

### 5.2. Środki organizacyjne

- [ ] Polityka bezpieczeństwa informacji obejmująca system GPS
- [ ] Szkolenia pracowników mających dostęp do danych GPS
- [ ] Umowy Powierzenia (DPA) z dostawcą aplikacji GPS i hostingiem
- [ ] Procedura reagowania na naruszenia ochrony danych (max. 72h do zgłoszenia UODO)
- [ ] Procedura realizacji praw osób (dostęp, usunięcie, sprzeciw) — max. 30 dni
- [ ] Regularne (co 12 miesięcy) przeglądy i aktualizacje niniejszej DPIA

---

## SEKCJA 6 — KONSULTACJE Z PODMIOTAMI DANYCH

Na etapie opracowania systemu GPS przeprowadzono następujące działania informacyjne wobec Kierowców:

- [ ] Opracowanie szczegółowego § 4 Polityki Prywatności dotyczącego GPS
- [ ] Opracowanie Klauzuli informacyjnej RODO z odrębną zgodą na GPS
- [ ] Opracowanie Warunków Aplikacji GPS z przejrzystym opisem zbieranych danych
- [ ] Udostępnienie Kierowcom mechanizmu wglądu do własnych danych GPS (raport w Aplikacji)
- [ ] *(Opcjonalnie)* Przeprowadzenie pilotażu z grupą Kierowców i zebranie informacji zwrotnych

---

## SEKCJA 7 — WNIOSKI I DECYZJA

### 7.1. Ocena ogólna

Na podstawie przeprowadzonej analizy przetwarzanie danych GPS w ramach platformy AdRide.pl:
- jest **niezbędne i proporcjonalne** do realizowanego celu (obliczenie wynagrodzenia i weryfikacja ekspozycji reklamy),
- po zastosowaniu opisanych środków technicznych i organizacyjnych **nie będzie powodować wysokiego ryzyka** dla praw i wolności osób fizycznych w rozumieniu art. 35 RODO,
- spełnia wymagania zasad RODO: zgodności z prawem, rzetelności, przejrzystości, minimalizacji danych, ograniczenia celu i okresu przechowywania.

### 7.2. Warunek uruchomienia systemu GPS

System GPS AdRide.pl **może zostać uruchomiony** po spełnieniu łącznie wszystkich warunków:

1. Wdrożeniu wszystkich środków technicznych z § 5.1 (lista checkboxów powyżej),
2. Zawarciu Umów Powierzenia (DPA) z dostawcą aplikacji GPS i dostawcą hostingu,
3. Opublikowaniu zaktualizowanej Polityki Prywatności, Warunków Aplikacji GPS i Klauzuli informacyjnej RODO,
4. Przeprowadzeniu szkolenia personelu (§ 5.2).

### 7.3. Obowiązek konsultacji z UODO

**Nie zachodzi** — po zastosowaniu opisanych środków mitygacyjnych ryzyko rezydualne jest na poziomie akceptowalnym i nie spełnia przesłanek „wysokiego ryzyka" z art. 36 ust. 1 RODO wymagającego uprzednich konsultacji z organem nadzorczym.

---

## SEKCJA 8 — HISTORIA ZMIAN DPIA

| Wersja | Data | Opis zmian | Zatwierdził |
|---|---|---|---|
| 1.0 | 07.05.2026 | Wersja pierwotna | ________________________ |
| | | | |

**Następny obowiązkowy przegląd DPIA:** nie później niż **7 maja 2027 r.** lub niezwłocznie w przypadku istotnej zmiany systemu GPS, zakresu przetwarzania lub zaistnienia naruszenia ochrony danych.

---

**Zatwierdził:**

________________________  
Imię i nazwisko, funkcja  
Data: _______________  
Podpis: ________________________

---

*Malik sp. z o.o. | ul. Jana Piekałkiewicza 7/50, 00-710 Warszawa | NIP: 517 038 26 87 | Tel.: +48 888 171 830 | rodo@adride.pl*
