-- ============================================================
-- TrainSmart — tabel voor de gedeelde werkruimte (Supabase)
-- Plak dit één keer in Supabase → SQL Editor → New query → Run.
-- ============================================================

-- Eén rij met alle oefeningen, de planning en het archief erin.
create table if not exists public.werkruimte (
  id         text primary key,
  inhoud     jsonb not null default '{}'::jsonb,
  bijgewerkt timestamptz not null default now()
);

-- De browser (de publieke sleutel) mag deze tabel lezen en bijwerken.
alter table public.werkruimte enable row level security;

drop policy if exists "trainsmart lezen"   on public.werkruimte;
drop policy if exists "trainsmart aanmaken" on public.werkruimte;
drop policy if exists "trainsmart wijzigen" on public.werkruimte;

create policy "trainsmart lezen"     on public.werkruimte for select using (true);
create policy "trainsmart aanmaken"  on public.werkruimte for insert with check (true);
create policy "trainsmart wijzigen"  on public.werkruimte for update using (true) with check (true);

grant select, insert, update on public.werkruimte to anon, authenticated;
