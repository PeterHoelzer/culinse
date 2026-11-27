-- ── Pro- und Stripe-Spalten aus den Profilen entfernen (27.11.2026) ──────────
-- Seit 25.11.2026 gibt es auf culinse.com kein Pro mehr, seit 27.11.2026 auch
-- keine Stripe-Anbindung. Die Website liest und schreibt diese vier Spalten der
-- Tabelle public.profiles nicht mehr:
--   · is_pro                  (war jemand Pro-Mitglied)
--   · pro_expires_at          (bis wann)
--   · stripe_customer_id      (Kundennummer bei Stripe)
--   · stripe_subscription_id  (Abo-Nummer bei Stripe)
-- Diese Datei löscht die vier Spalten und den Schutz, der nur für sie da war
-- (Trigger protect_profile_billing, Funktion protect_profile_billing_columns).
-- Sonst wird nichts angefasst; Konten, Rezepte und Sammlungen bleiben, wie sie sind.
--
-- REIHENFOLGE: Erst muss die Website ohne Stripe live sein (Push auf main,
-- Einspielen abwarten), DANACH diese Datei. Die alte Fassung der Website hat
-- die Spalten noch benutzt.
--
-- Einspielen auf dem Server, vom Mac aus im Projektordner (ZIEL siehe deploy/LIESMICH.md):
--   ssh culinse 'set -a; . /root/umzug/ziel.env; set +a; psql "$ZIEL" -v ON_ERROR_STOP=1 --single-transaction -f -' < supabase/pro_spalten_entfernen.sql
-- Läuft in einem Stück oder gar nicht und darf wiederholt werden.
--
-- Die Datei prüft zuerst und bricht ab, ohne etwas zu löschen, wenn
--   · bei einem Konto doch eine Stripe-Kundennummer oder Abo-Nummer steht,
--   · eine andere Funktion der Datenbank die Spalten noch benutzt,
--   · sich ein Profil nach dem Entfernen nicht mehr ändern ließe.
-- Bewusst ohne CASCADE: Hängt wider Erwarten noch eine Ansicht oder eine
-- Zugriffsregel an einer Spalte, bricht der Lauf mit einer Fehlermeldung ab.
--
-- Wer die alten Werte aufheben will, zieht vorher eine Kopie auf den Mac
-- (legt eine CSV-Datei auf den Schreibtisch):
--   ssh culinse 'set -a; . /root/umzug/ziel.env; set +a; psql "$ZIEL" -c "\copy (select id, is_pro, pro_expires_at, stripe_customer_id, stripe_subscription_id from public.profiles order by id) to stdout with csv header"' > ~/Desktop/profile_pro_spalten_sicherung.csv
--
-- Rückweg (legt die Spalten leer wieder an; die Datentypen sind die üblichen,
-- die ursprüngliche Anlage der Tabelle steht nicht im Projekt):
--   alter table public.profiles
--     add column if not exists is_pro boolean default false,
--     add column if not exists pro_expires_at timestamptz,
--     add column if not exists stripe_customer_id text,
--     add column if not exists stripe_subscription_id text;
-- Die alten Werte kommen nur aus der Kopie oben oder aus der täglichen
-- Sicherung zurück.

-- ── 0) Vorprüfung: bricht ab, bevor etwas gelöscht wird ──────────────────────

do $$
declare
  n bigint;
  treffer text;
begin
  if to_regclass('public.profiles') is null then
    raise exception 'Die Tabelle public.profiles gibt es hier nicht. Falsche Datenbank? Es wurde nichts geändert.';
  end if;

  -- a) Steht doch bei jemandem eine Stripe-Nummer?
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'profiles'
               and column_name = 'stripe_customer_id') then
    execute 'select count(*) from public.profiles where stripe_customer_id is not null' into n;
    if n > 0 then
      raise exception 'Bei % Konto/Konten steht eine Stripe-Kundennummer. Bitte erst klären, ob dort ein Abo läuft. Es wurde nichts geändert.', n;
    end if;
  end if;

  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'profiles'
               and column_name = 'stripe_subscription_id') then
    execute 'select count(*) from public.profiles where stripe_subscription_id is not null' into n;
    if n > 0 then
      raise exception 'Bei % Konto/Konten steht eine Stripe-Abo-Nummer. Bitte erst klären, ob dort ein Abo läuft. Es wurde nichts geändert.', n;
    end if;
  end if;

  -- Nur zur Kenntnis: Wie viele Konten waren als Pro markiert?
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'profiles'
               and column_name = 'is_pro') then
    execute 'select count(*) from public.profiles where coalesce(is_pro, false)' into n;
    raise notice 'Zur Kenntnis: % Konto/Konten waren als Pro markiert (ohne Stripe-Nummer, also von Hand gesetzt). Die Markierung hat keine Wirkung mehr.', n;
  end if;

  -- b) Benutzt eine andere Funktion der Datenbank die Spalten noch?
  --    Postgres merkt sich das bei Funktionen nicht selbst; eine vergessene
  --    Funktion würde erst später im Betrieb mit einer Fehlermeldung auffallen.
  select string_agg(ns.nspname || '.' || p.proname, ', ' order by ns.nspname, p.proname)
    into treffer
  from pg_proc p
  join pg_namespace ns on ns.oid = p.pronamespace
  where ns.nspname not in ('pg_catalog', 'information_schema')
    and ns.nspname not like 'pg\_%'
    and not (ns.nspname = 'public' and p.proname = 'protect_profile_billing_columns')
    and p.prosrc ~* '\m(is_pro|pro_expires_at|stripe_customer_id|stripe_subscription_id)\M';

  if treffer is not null then
    raise exception 'Diese Funktion(en) benutzen die Spalten noch: %. Bitte Bescheid sagen. Es wurde nichts geändert.', treffer;
  end if;
end;
$$;

-- ── 1) Schutz entfernen, der nur für diese Spalten da war ────────────────────

drop trigger  if exists protect_profile_billing on public.profiles;
drop function if exists public.protect_profile_billing_columns();

-- ── 2) Die vier Spalten entfernen ────────────────────────────────────────────

alter table public.profiles
  drop column if exists is_pro,
  drop column if exists pro_expires_at,
  drop column if exists stripe_customer_id,
  drop column if exists stripe_subscription_id;

-- ── 3) Probe: Lässt sich ein Profil noch ändern? ─────────────────────────────
-- Ändert ein Profil zum Schein (gleicher Wert) und rollt den Versuch in jedem
-- Fall zurück. Schlägt er fehl, hängt noch etwas an den gelöschten Spalten:
-- Dann bricht der ganze Lauf ab, und auch die Spalten bleiben erhalten.

do $$
declare
  uid text;
begin
  select id::text into uid from public.profiles limit 1;
  if uid is null then
    raise notice 'Probe Profil ändern: übersprungen (kein Profil vorhanden)';
    return;
  end if;
  begin
    update public.profiles set id = id where id::text = uid;
    raise exception 'PROBE_ZURUECK';
  exception when others then
    if sqlerrm <> 'PROBE_ZURUECK' then
      raise exception 'Ein Profil ließe sich nach dem Entfernen nicht mehr ändern (%). Bitte Bescheid sagen. Es wurde nichts geändert.', sqlerrm;
    end if;
  end;
  raise notice 'Probe Profil ändern: in Ordnung.';
end;
$$;

-- Die Schnittstelle der Datenbank soll die Tabelle neu einlesen.
notify pgrst, 'reload schema';

-- ── Bericht ──────────────────────────────────────────────────────────────────
-- Alle sechs Zeilen müssen "entfernt" zeigen.
select 'Spalte ' || s.name as objekt,
       case when exists (select 1 from information_schema.columns c
                         where c.table_schema = 'public' and c.table_name = 'profiles'
                           and c.column_name = s.name)
            then 'NOCH DA' else 'entfernt' end as stand
from (values ('is_pro'), ('pro_expires_at'), ('stripe_customer_id'), ('stripe_subscription_id')) as s(name)
union all
select 'Trigger protect_profile_billing',
       case when exists (select 1 from pg_trigger t
                         where t.tgrelid = 'public.profiles'::regclass
                           and t.tgname = 'protect_profile_billing')
            then 'NOCH DA' else 'entfernt' end
union all
select 'Funktion protect_profile_billing_columns',
       case when to_regproc('public.protect_profile_billing_columns') is null
            then 'entfernt' else 'NOCH DA' end;

-- Zur Kontrolle: die Spalten, die das Profil jetzt noch hat.
select column_name as spalte, data_type as art
from information_schema.columns
where table_schema = 'public' and table_name = 'profiles'
order by ordinal_position;
