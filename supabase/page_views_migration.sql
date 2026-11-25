-- ── Besucherzählung (25.11.2026) ─────────────────────────────────────────────
-- Eine Zeile je Seitenaufruf, geschrieben von /api/besuch (Service-Rolle).
-- Gezählt wird ohne Cookies und ohne Speichern der IP-Adresse:
--   · `visitor` ist ein gekürzter Hash aus IP, Browserkennung und einem
--     Zufallswert, der jeden Tag neu gewürfelt wird (Tabelle page_view_salts).
--     Der Zufallswert des Vortags wird gelöscht; ältere Hashes lassen sich
--     danach niemandem mehr zuordnen und nicht über Tage hinweg verbinden.
--   · Vom Verweis wird nur der Rechnername gespeichert, nie die ganze Adresse.
-- Auswertung: Funktion page_view_stats (unten), gelesen von /api/admin/besucher.
--
-- Einspielen auf dem Server, vom Mac aus im Projektordner (ZIEL siehe deploy/LIESMICH.md):
--   ssh culinse 'set -a; . /root/umzug/ziel.env; set +a; psql "$ZIEL" -v ON_ERROR_STOP=1 --single-transaction -f -' < supabase/page_views_migration.sql
-- Läuft in einem Stück oder gar nicht und darf wiederholt werden.
-- Rückweg: drop function page_view_stats(integer); drop table page_views, page_view_salts;

create table if not exists public.page_views (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  day         date not null,          -- Kalendertag in deutscher Zeit
  path        text not null,          -- Adresse ohne Parameter, z. B. /de/recipe/…
  locale      text,                   -- Sprache aus der Adresse (de, en, …)
  kind        text not null,          -- Seitenart: home | recipe | topic | browse | blog | …
  channel     text not null,          -- Herkunft: direct | search | social | ai | mail | website | campaign
  ref_host    text,                   -- verweisende Website, nur der Rechnername
  utm_source  text,                   -- Wert von ?utm_source=, falls gesetzt
  country     text,                   -- Ländercode von Cloudflare (CF-IPCountry)
  device      text not null,          -- mobile | tablet | desktop
  browser     text,
  os          text,
  visitor     text not null,          -- Tages-Hash, siehe oben
  is_entry    boolean not null default false,  -- erste Seite eines Besuchs
  logged_in   boolean not null default false
);

create index if not exists page_views_day_idx     on public.page_views (day);
create index if not exists page_views_created_idx on public.page_views (created_at);

create table if not exists public.page_view_salts (
  day   date primary key,
  salt  text not null
);

-- Zeilenschutz an und keine Regeln: Besucher und angemeldete Konten können
-- weder lesen noch schreiben. Nur die Service-Rolle kommt an die Tabellen.
alter table public.page_views      enable row level security;
alter table public.page_view_salts enable row level security;
revoke all on public.page_views, public.page_view_salts from anon, authenticated;

-- ── Auswertung ───────────────────────────────────────────────────────────────
-- Liefert alles fürs Dashboard in einem Stück. p_days = Länge des Zeitraums in
-- Tagen, der heutige Tag zählt mit (1 = nur heute). Tage in deutscher Zeit.
-- „Besucher“ eines Zeitraums ist die Summe der Tageswerte: wer an zwei Tagen
-- kommt, zählt zweimal (der Hash wechselt täglich, das ist Absicht).
create or replace function public.page_view_stats(p_days integer default 30)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with g as (
    select (now() at time zone 'Europe/Berlin')::date as heute,
           greatest(1, least(coalesce(p_days, 30), 400)) as n
  ),
  z as (
    select v.* from page_views v, g
    where v.day > g.heute - g.n and v.day <= g.heute
  ),
  davor as (
    select v.day, v.visitor from page_views v, g
    where v.day > g.heute - 2 * g.n and v.day <= g.heute - g.n
  ),
  tage as (
    select g.heute - i as day from g, generate_series(0, g.n - 1) as i
  ),
  pro_tag as (
    select tage.day, count(z.id) as views, count(distinct z.visitor) as visitors
    from tage left join z on z.day = tage.day
    group by tage.day
  ),
  stunden as (
    select extract(hour from z.created_at at time zone 'Europe/Berlin')::int as hour,
           count(*) as views,
           count(distinct z.day::text || z.visitor) as visitors
    from z group by 1
  )
  select jsonb_build_object(
    'days',  (select n from g),
    'today', (select heute from g),
    'since', (select min(day) from page_views),
    'live',  (select count(distinct visitor) from page_views
              where created_at > now() - interval '5 minutes'),
    'totals', jsonb_build_object(
      'views',    (select count(*) from z),
      'visitors', (select count(distinct day::text || visitor) from z),
      'loggedIn', (select count(distinct day::text || visitor) from z where logged_in)
    ),
    'previous', jsonb_build_object(
      'views',    (select count(*) from davor),
      'visitors', (select count(distinct day::text || visitor) from davor)
    ),
    'todayTotals', (
      select jsonb_build_object('views', count(*), 'visitors', count(distinct visitor))
      from page_views, g where day = g.heute
    ),
    'yesterdayTotals', (
      select jsonb_build_object('views', count(*), 'visitors', count(distinct visitor))
      from page_views, g where day = g.heute - 1
    ),
    'byDay', (
      select coalesce(jsonb_agg(jsonb_build_object('day', day, 'views', views, 'visitors', visitors) order by day), '[]'::jsonb)
      from pro_tag
    ),
    'byHour', (
      select coalesce(jsonb_agg(jsonb_build_object('hour', hour, 'views', views, 'visitors', visitors) order by hour), '[]'::jsonb)
      from stunden
    ),
    'pages', coalesce((
      select jsonb_agg(to_jsonb(x)) from (
        select path as name, max(kind) as kind, count(*) as views,
               count(distinct day::text || visitor) as visitors
        from z group by path order by count(*) desc, path limit 30
      ) x), '[]'::jsonb),
    'entries', coalesce((
      select jsonb_agg(to_jsonb(x)) from (
        select path as name, max(kind) as kind, count(*) as views,
               count(distinct day::text || visitor) as visitors
        from z where is_entry group by path order by count(*) desc, path limit 15
      ) x), '[]'::jsonb),
    'channels', coalesce((
      select jsonb_agg(to_jsonb(x)) from (
        select channel as name, count(*) as views, count(distinct day::text || visitor) as visitors
        from z group by channel order by count(distinct day::text || visitor) desc, channel
      ) x), '[]'::jsonb),
    'referrers', coalesce((
      select jsonb_agg(to_jsonb(x)) from (
        select ref_host as name, max(channel) as kind, count(*) as views,
               count(distinct day::text || visitor) as visitors
        from z where ref_host is not null
        group by ref_host order by count(distinct day::text || visitor) desc, ref_host limit 20
      ) x), '[]'::jsonb),
    'campaigns', coalesce((
      select jsonb_agg(to_jsonb(x)) from (
        select utm_source as name, count(*) as views, count(distinct day::text || visitor) as visitors
        from z where utm_source is not null
        group by utm_source order by count(distinct day::text || visitor) desc, utm_source limit 15
      ) x), '[]'::jsonb),
    'countries', coalesce((
      select jsonb_agg(to_jsonb(x)) from (
        select coalesce(country, '??') as name, count(*) as views,
               count(distinct day::text || visitor) as visitors
        from z group by 1 order by count(distinct day::text || visitor) desc, 1 limit 15
      ) x), '[]'::jsonb),
    'locales', coalesce((
      select jsonb_agg(to_jsonb(x)) from (
        select coalesce(locale, '??') as name, count(*) as views,
               count(distinct day::text || visitor) as visitors
        from z group by 1 order by count(distinct day::text || visitor) desc, 1
      ) x), '[]'::jsonb),
    'kinds', coalesce((
      select jsonb_agg(to_jsonb(x)) from (
        select kind as name, count(*) as views, count(distinct day::text || visitor) as visitors
        from z group by kind order by count(*) desc, kind
      ) x), '[]'::jsonb),
    'devices', coalesce((
      select jsonb_agg(to_jsonb(x)) from (
        select device as name, count(*) as views, count(distinct day::text || visitor) as visitors
        from z group by device order by count(distinct day::text || visitor) desc, device
      ) x), '[]'::jsonb),
    'browsers', coalesce((
      select jsonb_agg(to_jsonb(x)) from (
        select coalesce(browser, 'Sonstige') as name, count(*) as views,
               count(distinct day::text || visitor) as visitors
        from z group by 1 order by count(distinct day::text || visitor) desc, 1 limit 10
      ) x), '[]'::jsonb),
    'systems', coalesce((
      select jsonb_agg(to_jsonb(x)) from (
        select coalesce(os, 'Sonstige') as name, count(*) as views,
               count(distinct day::text || visitor) as visitors
        from z group by 1 order by count(distinct day::text || visitor) desc, 1 limit 10
      ) x), '[]'::jsonb)
  );
$$;

-- Neue Funktionen darf in Supabase sonst jeder aufrufen. Der Zeilenschutz würde
-- zwar nur Nullen liefern, die Funktion bleibt trotzdem der Service-Rolle vorbehalten.
revoke all on function public.page_view_stats(integer) from public, anon, authenticated;
grant execute on function public.page_view_stats(integer) to service_role;

-- Schnittstelle (PostgREST) soll Tabelle und Funktion sofort kennen.
notify pgrst, 'reload schema';
