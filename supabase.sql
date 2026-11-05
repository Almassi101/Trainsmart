-- ============================================================
-- TrainSmart — table for the shared workspace (Supabase)
-- Paste this once into Supabase → SQL Editor → New query → Run.
-- ============================================================

-- One row holding all exercises, the schedule and the archive.
create table if not exists public.werkruimte (
  id         text primary key,
  inhoud     jsonb not null default '{}'::jsonb,
  bijgewerkt timestamptz not null default now()
);

-- The browser (the public key) may read and update this table.
alter table public.werkruimte enable row level security;

drop policy if exists "trainsmart lezen"   on public.werkruimte;
drop policy if exists "trainsmart aanmaken" on public.werkruimte;
drop policy if exists "trainsmart wijzigen" on public.werkruimte;

create policy "trainsmart lezen"     on public.werkruimte for select using (true);
create policy "trainsmart aanmaken"  on public.werkruimte for insert with check (true);
create policy "trainsmart wijzigen"  on public.werkruimte for update using (true) with check (true);

grant select, insert, update on public.werkruimte to anon, authenticated;
