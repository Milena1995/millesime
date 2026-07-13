-- Millésime — schéma Supabase
-- À exécuter une fois dans le SQL Editor du projet Supabase (Auth > Providers > Email doit
-- avoir "Confirm email" activé pour le lien magique, voir web/README.md).

create type wine_type as enum ('Rouge', 'Blanc', 'Rosé', 'Mousseux', 'Autre');

create table bottles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nom text not null,
  type_vin wine_type not null default 'Autre',
  region text not null default '',
  millesime text not null default '',
  cepage text not null default '',
  prix numeric(10, 2),
  note smallint not null default 0 check (note between 0 and 5),
  notes text,
  quantite integer not null default 1 check (quantite >= 1),
  accords_mets_vins text[] not null default '{}',
  image_url text not null,
  created_at timestamptz not null default now()
);

create index bottles_user_id_idx on bottles (user_id);
create index bottles_type_vin_idx on bottles (type_vin);
create index bottles_millesime_idx on bottles (millesime);
create index bottles_note_idx on bottles (note);

-- Row Level Security : chaque utilisatrice ne voit/modifie que ses propres bouteilles.
alter table bottles enable row level security;

create policy "Lecture de ses propres bouteilles"
  on bottles for select
  using (auth.uid() = user_id);

create policy "Création de ses propres bouteilles"
  on bottles for insert
  with check (auth.uid() = user_id);

create policy "Modification de ses propres bouteilles"
  on bottles for update
  using (auth.uid() = user_id);

create policy "Suppression de ses propres bouteilles"
  on bottles for delete
  using (auth.uid() = user_id);

-- Storage : bucket public en lecture pour les images générées (pas de photo originale stockée).
insert into storage.buckets (id, name, public)
values ('bottle-images', 'bottle-images', true)
on conflict (id) do nothing;

create policy "Lecture publique des images de bouteilles"
  on storage.objects for select
  using (bucket_id = 'bottle-images');

create policy "Upload de ses propres images"
  on storage.objects for insert
  with check (bucket_id = 'bottle-images' and auth.role() = 'authenticated');

create policy "Suppression de ses propres images"
  on storage.objects for delete
  using (bucket_id = 'bottle-images' and auth.role() = 'authenticated');

-- Crédits IA : voir supabase/migrations/0002_credits_ia.sql pour le détail (table
-- profiles, trigger de création automatique, fonctions consume/refund_ai_credit).
-- Pour une installation neuve, exécute aussi ce fichier de migration après ce schéma.
