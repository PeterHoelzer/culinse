-- ── Datenbank-Härtung (25.11.2026, Sicherheitsprüfung) ───────────────────────
-- Schließt drei Lücken, die sich nur in der Datenbank schließen lassen, und
-- gibt am Ende einen Bericht aus, mit dem sich der Rest beurteilen lässt.
--
-- Einspielen auf dem Server, vom Mac aus im Projektordner (ZIEL siehe deploy/LIESMICH.md):
--   ssh culinse 'set -a; . /root/umzug/ziel.env; set +a; psql "$ZIEL" -v ON_ERROR_STOP=1 --single-transaction -f -' < supabase/security_hardening_2026_11.sql
-- Läuft in einem Stück oder gar nicht und darf wiederholt werden. Die Ausgabe
-- am Ende (ab "Bericht") bitte aufheben; sie enthält keine Geheimnisse.
--
-- Rückweg:
--   1) supabase/security_hardening.sql noch einmal einspielen (alte Fassung der
--      beiden Funktionen),
--   2) grant select on public.affiliate_clicks_daily to anon, authenticated;
--   3) update storage.buckets set allowed_mime_types = null where id = 'recipe-media';

-- ── 1) Die beiden Schutz-Trigger wirken lassen ───────────────────────────────
-- supabase/security_hardening.sql legt zwei Funktionen als "security definer"
-- an und lässt darin durch, wer als service_role, postgres oder supabase_admin
-- arbeitet. In einer "security definer"-Funktion ist current_user aber der
-- Eigentümer der Funktion (postgres), nicht der Aufrufer. Die Bedingung war
-- deshalb immer wahr, beide Trigger haben nie etwas verhindert:
--   · Ein angemeldeter Nutzer konnte sich selbst is_pro setzen oder eine fremde
--     stripe_customer_id eintragen (und damit über /api/stripe/portal das
--     Abrechnungsportal eines fremden Kunden öffnen).
--   · Ein importiertes Rezept (fremde Texte und Fotos) ließ sich an der Website
--     vorbei öffentlich schalten.
-- Mit "security invoker" ist current_user die Rolle des Aufrufers:
-- authenticated/anon über die öffentliche Schnittstelle, service_role für den
-- Server, postgres/supabase_admin für Arbeiten direkt an der Datenbank.

create or replace function public.protect_profile_billing_columns()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
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

create or replace function public.block_public_imported_recipes()
returns trigger
language plpgsql
security invoker
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

-- ── 2) Klickzahlen der Partnerlinks nicht mehr für jeden lesbar ──────────────
-- Die Ansicht affiliate_clicks_daily läuft mit den Rechten ihres Eigentümers und
-- umgeht damit den Zugriffsschutz der Tabelle. Am 25.11.2026 von außen geprüft:
-- Jeder Besucher konnte sie lesen (312 Zeilen). Der Server liest mit
-- service_role und behält den Zugriff.

revoke all on public.affiliate_clicks_daily from anon, authenticated;

-- ── 3) Öffentliche Ablage: nur bekannte Dateiarten ───────────────────────────
-- In recipe-media liegen Rezeptbilder, Videos und die geteilten Wochenpläne
-- (shares/<id>.json). Ohne Liste nimmt die Ablage jede Dateiart an; ein
-- angemeldeter Nutzer konnte eine HTML- oder SVG-Datei hochladen, die dann unter
-- daten.culinse.com öffentlich abrufbar war (Phishing-Seite, Skript auf einer
-- Unteradresse von culinse.com). Bestehende Dateien bleiben unberührt.

update storage.buckets
set allowed_mime_types = array[
  'image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif',
  'video/mp4', 'video/webm', 'video/quicktime',
  'application/json'
]
where id = 'recipe-media';

-- ── Probe: Greift der Schutz der Abrechnungsspalten jetzt? ───────────────────
-- Versucht als gewöhnlicher angemeldeter Nutzer, im eigenen Profil is_pro zu
-- ändern. Der Versuch wird in jedem Fall zurückgerollt; es ändert sich nichts.

do $$
declare
  uid uuid;
  n integer;
  ergebnis text;
begin
  select id into uid from public.profiles limit 1;
  if uid is null then
    raise notice 'Probe Abrechnungsspalten: übersprungen (kein Profil vorhanden)';
    return;
  end if;
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', uid::text, true);
    set local role authenticated;
    update public.profiles set is_pro = not coalesce(is_pro, false) where id = uid;
    get diagnostics n = row_count;
    if n = 0 then
      raise exception 'PROBE_KEINE_ZEILE';
    end if;
    raise exception 'PROBE_NICHT_VERHINDERT';
  exception when others then
    if sqlerrm = 'PROBE_NICHT_VERHINDERT' then
      ergebnis := 'FEHLER: Die Änderung ging durch. Bitte Bescheid sagen.';
    elsif sqlerrm = 'PROBE_KEINE_ZEILE' then
      ergebnis := 'in Ordnung: Nutzer dürfen ihr Profil auf diesem Weg gar nicht ändern.';
    elsif sqlerrm like 'billing columns%' then
      ergebnis := 'in Ordnung: Der Trigger hat die Änderung verhindert.';
    else
      ergebnis := 'unklar, Meldung der Datenbank: ' || sqlerrm;
    end if;
  end;
  raise notice 'Probe Abrechnungsspalten: %', ergebnis;
end;
$$;

-- ── Bericht ──────────────────────────────────────────────────────────────────
-- Liest nur. Zeigt, was nicht im Projekt steht und nur hier zu sehen ist.

select 'Bericht 1: Schutz-Funktionen (definer muss f sein)' as abschnitt;
select proname as funktion, prosecdef as definer, pg_get_userbyid(proowner) as eigentuemer
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in ('protect_profile_billing_columns', 'block_public_imported_recipes', 'handle_new_user', 'page_view_stats')
order by 1;

select 'Bericht 2: Tabellen und Zugriffsschutz (rls muss t sein)' as abschnitt;
select c.relname as tabelle, c.relrowsecurity as rls,
       (select count(*) from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname) as regeln
from pg_class c
where c.relnamespace = 'public'::regnamespace and c.relkind = 'r'
order by 1;

select 'Bericht 3: Zugriffsregeln der Tabellen, die nicht im Projekt stehen' as abschnitt;
select schemaname || '.' || tablename as tabelle, policyname as regel, cmd as befehl, roles as rollen,
       qual as bedingung, with_check as pruefung
from pg_policies
where (schemaname = 'public' and tablename in ('profiles', 'user_recipes', 'collections', 'collection_recipes', 'saved_recipes', 'user_preferences', 'newsletter_subscribers'))
   or (schemaname = 'storage' and tablename = 'objects')
order by 1, 3, 2;

select 'Bericht 4: Ablagen' as abschnitt;
select id, public as oeffentlich, file_size_limit as groessengrenze, allowed_mime_types as dateiarten
from storage.buckets
order by 1;

select 'Bericht 5: Was Besucher (anon) und angemeldete Nutzer an Ansichten lesen dürfen' as abschnitt;
select table_name as ansicht, grantee as rolle, privilege_type as recht
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
  and table_name in (select viewname from pg_views where schemaname = 'public')
order by 1, 2, 3;
