-- Ajoute des crédits IA à un compte après un achat Stripe confirmé.
-- Réservée au rôle service_role (appelée uniquement depuis le webhook serveur,
-- jamais depuis le navigateur) : pas de grant vers "authenticated" ou "anon",
-- sinon n'importe qui pourrait s'auto-créditer via le client Supabase.
create or replace function public.add_ai_credits(p_user_id uuid, p_amount integer)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if p_amount <= 0 then
    return;
  end if;

  update public.profiles
  set credits_ia = credits_ia + p_amount
  where id = p_user_id;
end;
$$;

revoke all on function public.add_ai_credits(uuid, integer) from public;
revoke all on function public.add_ai_credits(uuid, integer) from anon;
revoke all on function public.add_ai_credits(uuid, integer) from authenticated;
grant execute on function public.add_ai_credits(uuid, integer) to service_role;
