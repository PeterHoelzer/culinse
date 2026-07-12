-- ── Security Hardening ────────────────────────────────────────────────────────
-- Im Supabase SQL Editor ausführen. Schließt zwei Lücken, die sich NICHT im
-- App-Code schließen lassen, weil Clients mit dem Anon-Key direkt per
-- supabase-js auf die Tabellen schreiben können (die API-Routen sind dann
-- umgangen; nur RLS/Trigger greifen noch):
--
--  1) profiles: Billing-Spalten (is_pro, pro_expires_at, stripe_customer_id,
--     stripe_subscription_id) dürfen nur noch vom Server (service_role /
--     Stripe-Webhook) geändert werden. Ohne diesen Schutz könnte sich jeder
--     Nutzer per Browser-Konsole `is_pro = true` setzen (Gratis-Pro) oder eine
--     fremde stripe_customer_id eintragen und darüber via /api/stripe/portal
--     das Billing-Portal eines fremden Kunden öffnen.
--
--  2) user_recipes: importierte Rezepte (source_type = 'imported', fremde
--     Fotos/Texte!) dürfen auf DB-Ebene nie öffentlich werden — die API prüft
--     das bereits, aber ein direkter supabase-js-Write würde vorbeigehen.
--
-- Beide Trigger lassen service_role/postgres durch (Webhook, Admin-Client,
-- Rezept-Agent), blockieren aber die Rollen authenticated/anon.

-- ── 1) profiles: Billing-Spalten sperren ─────────────────────────────────────

create or replace function public.protect_profile_billing_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- PostgREST führt Queries als 'authenticated'/'anon' aus; der Service-Key
  -- läuft als 'service_role'. Serverseitige Writes passieren ungehindert.
  if current_user in ('service_role', 'postgres', 'supabase_admin') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if coalesce(new.is_pro, false)
       or new.pro_expires_at is not null
       or new.stripe_customer_id is not null
       or new.stripe_subscription_id is not null then
      raise exception 'billing columns can only be set by the server';
    end if;
  elsif tg_op = 'UPDATE' then
    if new.is_pro is distinct from old.is_pro
       or new.pro_expires_at is distinct from old.pro_expires_at
       or new.stripe_customer_id is distinct from old.stripe_customer_id
       or new.stripe_subscription_id is distinct from old.stripe_subscription_id then
      raise exception 'billing columns can only be changed by the server';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_billing on public.profiles;
create trigger protect_profile_billing
  before insert or update on public.profiles
  for each row execute function public.protect_profile_billing_columns();

-- ── 2) user_recipes: importierte Rezepte nie öffentlich ──────────────────────

create or replace function public.block_public_imported_recipes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_user in ('service_role', 'postgres', 'supabase_admin') then
    return new;
  end if;

  if coalesce(new.is_public, false) and new.source_type = 'imported' then
    raise exception 'imported recipes cannot be made public';
  end if;

  return new;
end;
$$;

drop trigger if exists block_public_imported on public.user_recipes;
create trigger block_public_imported
  before insert or update on public.user_recipes
  for each row execute function public.block_public_imported_recipes();
