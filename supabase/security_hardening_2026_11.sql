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
--      Funktion für importierte Rezepte),
--   2) grant select on public.affiliate_clicks_daily to anon, authenticated;
--      (nur solange es die Ansicht noch gibt, siehe Abschnitt 2)
--   3) update storage.buckets set allowed_mime_types = null where id = 'recipe-media';

-- ── 1) Den Schutz-Trigger für importierte Rezepte wirken lassen ──────────────
-- supabase/security_hardening.sql legte die Funktion als "security definer" an
-- und ließ darin durch, wer als service_role, postgres oder supabase_admin
-- arbeitet. In einer "security definer"-Funktion ist current_user aber der
-- Eigentümer der Funktion (postgres), nicht der Aufrufer. Die Bedingung war
-- deshalb immer wahr, der Trigger hat nie etwas verhindert: Ein importiertes
-- Rezept (fremde Texte und Fotos) ließ sich an der Website vorbei öffentlich
-- schalten.
-- Mit "security invoker" ist current_user die Rolle des Aufrufers:
-- authenticated/anon über die öffentliche Schnittstelle, service_role für den
-- Server, postgres/supabase_admin für Arbeiten direkt an der Datenbank.
--
-- Bis 27.11.2026 stand hier auch der Schutz der Abrechnungsspalten im Profil
-- (Funktion protect_profile_billing_columns, Trigger protect_profile_billing).
-- Seit es kein Pro und kein Stripe mehr gibt, braucht die Website die Spalten
-- is_pro, pro_expires_at, stripe_customer_id und stripe_subscription_id nicht
-- mehr; supabase/pro_spalten_entfernen.sql löscht sie samt Trigger und
-- Funktion. Der Trigger darf hier NICHT wieder angelegt werden: Ohne die
-- Spalten bräche er jede Änderung an einem Profil mit einer Fehlermeldung ab.

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

-- Seit 27.11.2026 kann die Ansicht fehlen (supabase/affiliate_clicks_entfernen.sql
-- löscht sie samt Tabelle). Dann gibt es hier nichts zu tun, und der Lauf soll
-- daran nicht scheitern.

do $$
begin
  if to_regclass('public.affiliate_clicks_daily') is not null then
    revoke all on public.affiliate_clicks_daily from anon, authenticated;
  end if;
end $$;

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

-- ── Bericht ──────────────────────────────────────────────────────────────────
-- Liest nur. Zeigt, was nicht im Projekt steht und nur hier zu sehen ist.

select 'Bericht 1: Schutz-Funktionen (definer muss f sein)' as abschnitt;
select proname as funktion, prosecdef as definer, pg_get_userbyid(proowner) as eigentuemer
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in ('block_public_imported_recipes', 'handle_new_user', 'page_view_stats')
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
