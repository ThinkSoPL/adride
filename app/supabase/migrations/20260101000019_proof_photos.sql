create table if not exists public.proof_photos (
  id              uuid        primary key default gen_random_uuid(),
  created_at      timestamptz not null    default now(),
  driver_id       uuid        not null,
  campaign_id     uuid        not null    references public.campaigns(id) on delete cascade,
  storage_path    text        not null    check (storage_path ~ '^proofs/'),
  latitude        numeric(10,8),
  longitude       numeric(11,8),
  accuracy_meters numeric(7,2),
  photo_timestamp timestamptz not null,
  unique(driver_id, campaign_id, photo_timestamp)
);

create index idx_proof_photos_driver_campaign on proof_photos(driver_id, campaign_id);
create index idx_proof_photos_timestamp on proof_photos(photo_timestamp desc);

alter table public.proof_photos enable row level security;

create policy "driver_view_own_proofs" on public.proof_photos
  for select to authenticated using (auth.uid() = driver_id);

create policy "driver_insert_own_proofs" on public.proof_photos
  for insert to authenticated with check (auth.uid() = driver_id);

-- Create private storage bucket for proof photos
insert into storage.buckets (id, name, public)
  values ('proofs', 'proofs', false)
  on conflict (id) do nothing;

-- Storage RLS: drivers can upload to their own driver_id folder
-- Path format: proofs/{campaign_id}/{driver_id}/{timestamp}.jpg
-- Position 2 of folder array is the driver_id
create policy "driver_upload_own_proofs" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'proofs'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "driver_read_own_proofs" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'proofs'
    and (storage.foldername(name))[2] = auth.uid()::text
  );
