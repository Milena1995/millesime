-- Migration : ajoute le champ "quantité en stock" aux bouteilles déjà enregistrées.
-- À exécuter une fois dans le SQL Editor du projet Supabase (base déjà en prod, schema.sql seul
-- ne suffit pas puisque la table "bottles" existe déjà).

alter table bottles
  add column if not exists quantite integer not null default 1 check (quantite >= 1);
