-- ============================================================
-- TrainSmart — one workspace per trainer (Supabase)
-- Paste this once into Supabase → SQL Editor → New query → Run.
-- ============================================================

-- One row per trainer, holding all exercises, the schedule and the archive.
create table if not exists public.werkruimte (
  id         text primary key,
  inhoud     jsonb not null default '{}'::jsonb,
  bijgewerkt timestamptz not null default now()
);

-- Only the owner may read and write: the row id is the user id (auth.uid()).
alter table public.werkruimte enable row level security;

-- The old policies let anyone with the public key in. Replace them.
drop policy if exists "trainsmart lezen"     on public.werkruimte;
drop policy if exists "trainsmart aanmaken"  on public.werkruimte;
drop policy if exists "trainsmart wijzigen"  on public.werkruimte;
drop policy if exists "eigen werkruimte lezen"    on public.werkruimte;
drop policy if exists "eigen werkruimte aanmaken" on public.werkruimte;
drop policy if exists "eigen werkruimte wijzigen" on public.werkruimte;

create policy "eigen werkruimte lezen" on public.werkruimte
  for select to authenticated
  using (auth.uid()::text = id);

create policy "eigen werkruimte aanmaken" on public.werkruimte
  for insert to authenticated
  with check (auth.uid()::text = id);

create policy "eigen werkruimte wijzigen" on public.werkruimte
  for update to authenticated
  using (auth.uid()::text = id)
  with check (auth.uid()::text = id);

-- Signed-in users write through the app; anonymous visitors get nothing.
grant select, insert, update on public.werkruimte to authenticated;
revoke all on public.werkruimte from anon;

-- Note: the row with id 'gedeeld' from before the login still exists, but it
-- is no longer readable. Every trainer now writes into their own row.
