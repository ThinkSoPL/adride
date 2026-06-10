# AdRide — Macierz testów RLS

Legenda: ✅ dozwolone | ❌ zablokowane | ⚠️ częściowe (własne wiersze / ograniczone kolumny)

## Skróty ról

| Symbol | Opis |
|--------|------|
| `anon` | Niezalogowany użytkownik |
| `driver_self` | Kierowca — własne zasoby |
| `driver_other` | Kierowca — zasoby innego kierowcy |
| `adv_own` | Reklamodawca — własna kampania / własne dane |
| `adv_other` | Reklamodawca — kampania innego reklamodawcy |
| `admin` | Administrator systemu |
| `service` | `service_role` — backend (BYPASSRLS) |

---

## profiles

| Operacja | anon | driver_self | driver_other | adv_own | adv_other | admin | service |
|----------|------|-------------|--------------|---------|-----------|-------|---------|
| SELECT   | ❌   | ✅          | ❌           | ✅      | ❌        | ✅    | ✅      |
| INSERT   | ❌   | ❌ (trigger)| ❌           | ❌      | ❌        | ✅    | ✅      |
| UPDATE   | ❌   | ⚠️ (bez zmiany role) | ❌  | ⚠️      | ❌        | ✅    | ✅      |
| DELETE   | ❌   | ❌          | ❌           | ❌      | ❌        | ✅    | ✅      |

**Uwaga:** Zmiana kolumny `role` wymaga uprawnień admina. Zwykły użytkownik nie może sam siebie awansować.

---

## drivers

| Operacja | anon | driver_self | driver_other | adv_own¹ | adv_other | admin | service |
|----------|------|-------------|--------------|----------|-----------|-------|---------|
| SELECT   | ❌   | ✅          | ❌           | ⚠️ (bez notes) | ❌   | ✅    | ✅      |
| INSERT   | ❌   | ✅          | ❌           | ❌       | ❌        | ✅    | ✅      |
| UPDATE   | ❌   | ⚠️ (bez status/notes/stripe) | ❌ | ❌ | ❌    | ✅    | ✅      |
| DELETE   | ❌   | ❌          | ❌           | ❌       | ❌        | ✅    | ✅      |

¹ Reklamodawca widzi kierowców przypisanych do jego kampanii (przez `campaign_vehicles → vehicles → driver_id`).  
**Kolumna `notes`:** Ukryta przez widok `v_drivers_public` dla nie-adminów.

---

## advertisers

| Operacja | anon | driver | adv_self | adv_other | admin | service |
|----------|------|--------|----------|-----------|-------|---------|
| SELECT   | ❌   | ❌     | ✅       | ❌        | ✅    | ✅      |
| INSERT   | ❌   | ❌     | ✅       | ❌        | ✅    | ✅      |
| UPDATE   | ❌   | ❌     | ✅       | ❌        | ✅    | ✅      |
| DELETE   | ❌   | ❌     | ❌       | ❌        | ✅    | ✅      |

---

## vehicles

| Operacja | anon | driver_self | driver_other | adv_own¹ | adv_other | admin | service |
|----------|------|-------------|--------------|----------|-----------|-------|---------|
| SELECT   | ❌   | ✅          | ❌           | ⚠️ (własna kampania) | ❌ | ✅  | ✅      |
| INSERT   | ❌   | ✅          | ❌           | ❌       | ❌        | ✅    | ✅      |
| UPDATE   | ❌   | ✅          | ❌           | ❌       | ❌        | ✅    | ✅      |
| DELETE   | ❌   | ⚠️ (status=available) | ❌ | ❌   | ❌        | ✅    | ✅      |

¹ Reklamodawca widzi pojazdy przypisane do jego kampanii.

---

## campaigns

| Operacja | anon | driver¹ | adv_own | adv_other | admin | service |
|----------|------|---------|---------|-----------|-------|---------|
| SELECT   | ❌   | ⚠️ (własna kampania) | ✅ | ❌ | ✅  | ✅      |
| INSERT   | ❌   | ❌      | ✅ (jako siebie) | ❌ | ✅   | ✅      |
| UPDATE   | ❌   | ❌      | ⚠️ (nie active/completed) | ❌ | ✅ | ✅   |
| DELETE   | ❌   | ❌      | ❌      | ❌        | ✅    | ✅      |

¹ Kierowca widzi kampanie, w których jego pojazd jest aktywnie przypisany.

---

## campaign_vehicles

| Operacja | anon | driver¹ | adv_own² | adv_other | admin | service |
|----------|------|---------|----------|-----------|-------|---------|
| SELECT   | ❌   | ⚠️ (własny pojazd) | ⚠️ (własna kampania) | ❌ | ✅ | ✅ |
| INSERT   | ❌   | ❌      | ❌       | ❌        | ✅    | ✅      |
| UPDATE   | ❌   | ❌      | ❌       | ❌        | ✅    | ✅      |
| DELETE   | ❌   | ❌      | ❌       | ❌        | ✅    | ✅      |

¹ Kierowca widzi przypisania swojego pojazdu.  
² Reklamodawca widzi przypisania pojazdów w swoich kampaniach.

---

## gps_sessions

| Operacja | anon | driver_self | driver_other | adv_own¹ | adv_other | admin | service |
|----------|------|-------------|--------------|----------|-----------|-------|---------|
| SELECT   | ❌   | ✅          | ❌           | ⚠️ (własna kampania) | ❌ | ✅ | ✅    |
| INSERT   | ❌   | ✅          | ❌           | ❌       | ❌        | ✅    | ✅      |
| UPDATE   | ❌   | ⚠️ (własne, nie zmienia driver_id/vehicle_id) | ❌ | ❌ | ❌ | ✅ | ✅ |
| DELETE   | ❌   | ❌          | ❌           | ❌       | ❌        | ✅    | ✅      |

¹ Reklamodawca widzi sesje przypisane do jego kampanii (`campaign_id IS NOT NULL`).

---

## gps_points

| Operacja | anon | driver_self | driver_other | adv_own¹ | adv_other | admin | service |
|----------|------|-------------|--------------|----------|-----------|-------|---------|
| SELECT   | ❌   | ✅          | ❌           | ⚠️ (własna kampania) | ❌ | ✅ | ✅    |
| INSERT   | ❌   | ✅          | ❌           | ❌       | ❌        | ✅    | ✅      |
| UPDATE   | ❌   | ❌ (immutable) | ❌        | ❌       | ❌        | ❌    | ✅      |
| DELETE   | ❌   | ❌          | ❌           | ❌       | ❌        | ✅    | ✅      |

¹ Reklamodawca widzi punkty GPS z denormalizowanym `campaign_id` odpowiadającym jego kampanii.  
**Ważne:** Denormalizacja `driver_id` i `campaign_id` eliminuje JOIN w politykach RLS — kluczowe dla wydajności przy 30M wierszy/miesiąc.

---

## payouts

| Operacja | anon | driver_self | driver_other | advertiser | admin | service |
|----------|------|-------------|--------------|------------|-------|---------|
| SELECT   | ❌   | ✅          | ❌           | ❌         | ✅    | ✅      |
| INSERT   | ❌   | ❌          | ❌           | ❌         | ❌    | ✅      |
| UPDATE   | ❌   | ❌          | ❌           | ❌         | ❌    | ✅      |
| DELETE   | ❌   | ❌          | ❌           | ❌         | ✅    | ✅      |

**Insert/Update:** Wyłącznie `service_role` (Stripe webhook handler). Policy `payouts_no_insert` blokuje bezpośredni INSERT od `authenticated`.

---

## stripe_events

| Operacja | anon | driver | advertiser | admin | service |
|----------|------|--------|------------|-------|---------|
| SELECT   | ❌   | ❌     | ❌         | ❌    | ✅      |
| INSERT   | ❌   | ❌     | ❌         | ❌    | ✅      |
| UPDATE   | ❌   | ❌     | ❌         | ❌    | ✅      |
| DELETE   | ❌   | ❌     | ❌         | ❌    | ✅      |

**Uwaga:** Policy `stripe_events_no_access` zwraca `USING (false)` dla wszystkich. Dostęp wyłącznie przez `service_role` (BYPASSRLS).

---

## audit_log

| Operacja | anon | driver | advertiser | admin | service |
|----------|------|--------|------------|-------|---------|
| SELECT   | ❌   | ❌     | ❌         | ✅    | ✅      |
| INSERT   | ❌   | ❌     | ❌         | ❌    | ✅ (+ triggery SECURITY DEFINER) |
| UPDATE   | ❌   | ❌     | ❌         | ❌    | ❌      |
| DELETE   | ❌   | ❌     | ❌         | ❌    | ❌      |

**Immutable audit trail:** UPDATE i DELETE zablokowane nawet dla `service_role` przez polityki (FORCE RLS + `USING (false)`).

---

## warsaw_districts (tabela referencyjna)

| Operacja | anon | authenticated | admin | service |
|----------|------|---------------|-------|---------|
| SELECT   | ❌   | ✅            | ✅    | ✅      |
| INSERT   | ❌   | ❌            | ✅    | ✅      |
| UPDATE   | ❌   | ❌            | ✅    | ✅      |
| DELETE   | ❌   | ❌            | ✅    | ✅      |

---

## Wzorce testów (pgTAP / pytest)

```sql
-- Test: kierowca A nie widzi sesji kierowcy B
SET LOCAL role TO authenticated;
SET LOCAL "request.jwt.claims" TO '{"sub": "<driver_A_uuid>"}';
SELECT count(*) = 0
FROM gps_sessions
WHERE driver_id = '<driver_B_uuid>';

-- Test: anon nie widzi żadnych profili
SET LOCAL role TO anon;
SELECT count(*) = 0 FROM profiles;

-- Test: reklamodawca widzi tylko własne kampanie
SET LOCAL "request.jwt.claims" TO '{"sub": "<advertiser_uuid>"}';
SELECT bool_and(advertiser_id = '<advertiser_uuid>')
FROM campaigns;
```

```python
# pytest + supabase-py
def test_driver_cannot_see_other_driver_sessions(supabase_driver_a, driver_b_id):
    result = supabase_driver_a.table("gps_sessions").select("*").eq("driver_id", driver_b_id).execute()
    assert len(result.data) == 0

def test_anon_cannot_read_profiles(supabase_anon):
    result = supabase_anon.table("profiles").select("*").execute()
    assert result.data == [] or "error" in str(result)
```
