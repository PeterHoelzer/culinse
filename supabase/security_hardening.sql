-- ── Security Hardening ────────────────────────────────────────────────────────
-- Im Supabase SQL Editor ausführen. Schließt eine Lücke, die sich NICHT im
-- App-Code schließen lässt, weil Clients mit dem Anon-Key direkt per
-- supabase-js auf die Tabellen schreiben können (die API-Routen sind dann
-- umgangen; nur RLS/Trigger greifen noch):
--
--  1) profiles: Der Schutz der Billing-Spalten (is_pro, pro_expires_at,
--     stripe_customer_id, stripe_subscription_id) stand bis 27.11.2026 hier.
--     Seit es kein Pro und kein Stripe mehr gibt, löscht
--     supabase/pro_spalten_entfernen.sql die Spalten samt Trigger und Funktion.
--     Der Trigger darf nicht wieder angelegt werden: Ohne die Spalten bräche er
--     jede Änderung an einem Profil mit einer Fehlermeldung ab.
--
--  2) user_recipes: importierte Rezepte (source_type = 'imported', fremde
--     Fotos/Texte!) dürfen auf DB-Ebene nie öffentlich werden — die API prüft
--     das bereits, aber ein direkter supabase-js-Write würde vorbeigehen.
--
-- Der Trigger lässt service_role/postgres durch (Admin-Client, Rezept-Agent),
-- blockiert aber die Rollen authenticated/anon.

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
