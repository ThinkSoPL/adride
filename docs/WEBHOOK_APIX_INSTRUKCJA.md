# Webhook apix-drive — instrukcja integracji formularzy AdRide

**URL webhooka:** `https://a1.apix-drive.com/web-hooks/15083/4pnjdpx6`
**Tryb:** `no-cors` (fire-and-forget — przeglądarka nie odczytuje odpowiedzi)
**Data wdrożenia:** 2026-06-11

---

## Co jest już podpięte

| Formularz | Strona | `form_type` | Plik |
|---|---|---|---|
| Lead kierowcy (landing) | adride.pl/kierowca.html | `lead_kierowca` | `js/form.js` |
| Lead reklamodawcy (landing) | adride.pl/reklamodawca.html | `lead_reklamodawca` | `js/form.js` |
| Lead z kalkulatora | app.adride.pl/kalkulator | `lead_kalkulator` | `src/features/impressions-calculator/ImpressionsForm.tsx` |
| Rejestracja konta | app.adride.pl/register | `register` | `app/(auth)/register/page.tsx` |
| Onboarding kierowcy | app.adride.pl/onboarding/driver | `onboarding_driver` | `app/onboarding/driver/page.tsx` |
| Onboarding reklamodawcy | app.adride.pl/onboarding/advertiser | `onboarding_advertiser` | `app/onboarding/advertiser/page.tsx` |

Wspólna logika trackingu w aplikacji: `app/src/lib/tracking/webhook.ts` (funkcja `sendToWebhook`).
Na landing pages (statyczny HTML): `js/form.js` (funkcja `sendToApixWebhook`).

**Pole `form_type` w payloadzie mówi, z którego formularza przyszły dane** — w apix-drive
ustaw routing/dopasowanie odpowiedzi po tym polu.

## Jak rozpoznać formularz w apix-drive

W panelu apix-drive (Webhooks source) każdy request ma w body pole `form_type`.
Filtruj/mapuj po nim:

- `lead_kierowca` → pola: `email`, `phone`, `company`, `city`, `car`, `year`, `km`
- `lead_reklamodawca` → pola: `email`, `phone`, `company`, `city`/`district`, `budget`, `months`, `vehicles`
- `lead_kalkulator` → pola: `email`, `company`, `phone`, `dzielnice`, `pojazdy`, `km_dziennie`, `miesiace`, `wyswietlenia`, `pakiet`
- `register` → pola: `name`, `email`, `phone`, `rola` (driver/advertiser)
- `onboarding_driver` → pola: `miasto`, `marka`, `model`, `rok`, `silnik`, `przebieg_mc`
- `onboarding_advertiser` → pola: `name` (firma), `industry`, `nip`, `miasto`

## Parametry śledzenia (wysyłane ZAWSZE, każdy formularz)

| Kategoria | Parametry |
|---|---|
| Formularz | `form_type` + pola formularza (patrz wyżej) |
| UTM | `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` (parsowane z URL, np. `?utm_source=facebook&utm_medium=cpc`) |
| Strona | `referrer`, `page_url`, `url_strony` |
| Timing | `page_load_time` (ms), `czas_na_stronie` (s), `form_fill_time` / `czas_wypelnienia_formularza` (s, od pierwszego inputu) |
| Scroll | `scroll_depth`, `pozycja_scrolla` (% max przewinięcia, 0–100) |
| Urządzenie | `device_type` (mobile/desktop), `czy_mobile` (bool), `screen_resolution` / `rozdzielczosc`, `pixel_ratio` |
| Przeglądarka | `user_agent`, `przegladarka` (Chrome/Safari/…), `system` (Windows/iOS/…), `jezyk` |
| Czas | `timestamp` (ISO 8601), `godzina_wyslania` (HH:MM:SS pl-PL), `strefa_czasowa` (IANA, np. Europe/Warsaw) |

## Jak podpiąć NOWY formularz

### W aplikacji Next.js (app.adride.pl)

```tsx
import { sendToWebhook } from '@/lib/tracking/webhook'

// po udanym submit:
sendToWebhook('nazwa_formularza', { pole1: wartosc1, pole2: wartosc2 }, formStartedAt)
```

`formStartedAt` (opcjonalny) = `Date.now()` z momentu pierwszego wpisu w formularz —
służy do policzenia `form_fill_time`.

### Na statycznej stronie HTML (adride.pl)

1. Upewnij się, że strona ładuje `<script src="js/form.js"></script>`.
2. Dodaj na końcu `js/form.js`:
   ```js
   setupForm('id-formularza', 'id-elementu-sukcesu', 'moj_form_type')
   ```

## Ważne właściwości trybu no-cors

- Odpowiedź webhooka jest **opaque** — JS nie wie, czy apix przyjął dane.
  Weryfikuj odbiór w panelu apix-drive (lista ostatnich requestów).
- Wysyłka jest **fire-and-forget** i objęta `try/catch` — awaria webhooka
  **nigdy nie blokuje** zapisu leada do bazy ani flow użytkownika.
- `keepalive: true` — request doleci nawet, gdy strona zaraz po submit przechodzi dalej.

## Deploy

- **Landing (adride.pl):** wgraj przez FTP zaktualizowane pliki: `js/form.js`, `index.html`.
- **App (app.adride.pl):** standardowy deploy z gałęzi `master` (git pull → build → pm2 restart).
