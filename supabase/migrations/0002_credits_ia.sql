-- Système de crédits IA : chaque nouvelle utilisatrice reçoit 5 crédits gratuits pour
-- essayer l'ajout de bouteilles assisté par IA (analyse d'étiquette + photo générée +
-- accords mets-vins). Une fois épuisés, il faudra en acheter (fonctionnalité à venir)
-- ou utiliser le mode manuel, gratuit et illimité.
--
-- À exécuter une fois dans le SQL Editor du projet Supabase.

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  credits_ia integer not null default 5 check (credits_ia >= 0),
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

drop policy if exists "Lecture de son propre profil" on profiles;
create policy "Lecture de son propre profil"
  on profiles for select
  using (auth.uid() = id);

-- Volontairement pas de policy insert/update ouverte : la consommation/le remboursement
-- de crédits passe uniquement par les fonctions ci-dessous (security definer), pour
-- éviter qu'une utilisatrice ne s'auto-crédite en modifiant sa ligne directement.

-- Crée automatiquement une ligne de profil (5 crédits) à chaque inscription.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill pour les comptes déjà existants (ex: ton propre compte).
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

-- Consomme 1 crédit IA de façon atomique (évite les conditions de course). Renvoie
-- true si le crédit a bien été débité, false si le solde était déjà à 0.
create or replace function public.consume_ai_credit(p_user_id uuid)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  v_updated int;
begin
  update public.profiles
  set credits_ia = credits_ia - 1
  where id = p_user_id and credits_ia > 0;
  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

-- Rembourse 1 crédit (utilisé si le traitement IA échoue après consommation, pour ne
-- pas pénaliser l'utilisatrice pour une erreur technique).
create or replace function public.refund_ai_credit(p_user_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles set credits_ia = credits_ia + 1 where id = p_user_id;
end;
$$;

grant execute on function public.consume_ai_credit(uuid) to authenticated;
grant execute on function public.refund_ai_credit(uuid) to authenticated;

-- Ton compte perso : crédits IA illimités en pratique.
update public.profiles p
set credits_ia = 999999
from auth.users u
where p.id = u.id and u.email = 'mariemilenalaipoon1995@gmail.com';
