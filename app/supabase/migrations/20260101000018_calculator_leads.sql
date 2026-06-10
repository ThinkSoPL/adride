create table if not exists public.calculator_leads (
  id                  uuid        primary key default gen_random_uuid(),
  created_at          timestamptz not null    default now(),
  email               text        not null,
  company             text,
  phone               text,
  district_id         text        not null,
  num_vehicles        integer     not null    check (num_vehicles between 1 and 200),
  km_daily            integer     not null    check (km_daily between 1 and 1000),
  months              integer     not null    check (months between 1 and 24),
  budget_monthly_pln  integer,
  impressions_total   bigint      not null
);

alter table public.calculator_leads enable row level security;

-- Public lead capture form — no auth required to submit
create policy "anon_insert_leads" on public.calculator_leads
  for insert to anon with check (true);
