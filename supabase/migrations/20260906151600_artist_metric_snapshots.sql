-- Artist performance model: real snapshot history + honest current-traction /
-- observed-growth classification. Replaces the fabricated 18%/yr NPV growth
-- assumption with (1) a Current Traction score computed from whatever real
-- per-report signals are actually present today, and (2) an Observed Growth
-- calculation that only ever fires once two real snapshots ~30 days apart
-- exist for the same artist/source/metric -- until then it honestly reports
-- "collecting_history", never a fabricated or estimated percentage.
--
-- Deviates from the original spec in two disclosed ways:
--   1. No `artists` table exists in this schema. `artist_key` is a stable
--      text identity substitute ('spotify:<id>' when Spotify resolved for
--      the report, else 'name:<normalized artist_name>') rather than a UUID
--      FK. Revisit if/when real artist-identity resolution is built.
--   2. Only 4 of the sources this pipeline touches persist structured
--      per-report data today: Spotify (followers, monthly_listeners),
--      YouTube (subscribers, total_views), TikTok (followers,
--      engagement_rate), Instagram (followers). Last.fm/MusicBrainz/Deezer/
--      SoundCloud/Shazam/Genius are fetched but only feed the LLM's prose,
--      never saved as numbers; Boomplay/Audiomack aren't in this pipeline at
--      all. The controlled vocabulary below only covers what's real.

-- ============================================================================
-- A. ARTIST SNAPSHOTS
-- ============================================================================

create table if not exists public.artist_metric_snapshots (
  id                uuid primary key default gen_random_uuid(),

  artist_key        text not null,
  artist_name       text not null,

  source            text not null,
  source_artist_id  text,

  metric_name       text not null,
  metric_value      numeric not null,
  -- Non-cumulative metrics (e.g. an engagement RATE) are captured for
  -- Current Traction but must never be run through Observed Growth's
  -- delta-over-time formula -- a rate isn't a running total.
  is_cumulative     boolean not null default true,

  captured_at       timestamptz not null default now(),
  -- One snapshot per (artist, source, metric) per UTC day -- this IS the
  -- idempotency guarantee for report re-runs within the same collection
  -- window, enforced by the unique constraint below rather than app logic.
  captured_date     date generated always as ((captured_at at time zone 'utc')::date) stored,

  report_id         uuid references public.intelligence_reports(id) on delete set null,
  raw_payload       jsonb,

  data_status       text not null default 'observed',
  created_at        timestamptz not null default now(),

  constraint artist_metric_snapshots_metric_value_check check (metric_value >= 0),
  constraint artist_metric_snapshots_source_check check (
    source in ('spotify', 'youtube', 'tiktok', 'instagram')
  ),
  constraint artist_metric_snapshots_metric_name_check check (
    metric_name in (
      'spotify_followers', 'spotify_monthly_listeners',
      'youtube_subscribers', 'youtube_channel_views',
      'tiktok_followers', 'tiktok_engagement_rate',
      'instagram_followers'
    )
  ),
  constraint artist_metric_snapshots_data_status_check check (
    data_status in ('observed', 'anomalous')
  ),

  unique (artist_key, source, metric_name, captured_date)
);

create index if not exists idx_artist_metric_snapshots_lookup
  on public.artist_metric_snapshots (artist_key, source, metric_name, captured_at desc);

create index if not exists idx_artist_metric_snapshots_artist_date
  on public.artist_metric_snapshots (artist_key, captured_at desc);

alter table public.artist_metric_snapshots enable row level security;

-- Deny-all for anon/authenticated, same pattern as processed_sessions/teams --
-- access is only ever through the SECURITY DEFINER RPCs below, never a direct
-- table read (Golden Rule 8: never USING(true) on artist-performance data).
create policy "service_role_all" on public.artist_metric_snapshots
  for all to service_role using (true) with check (true);

comment on table public.artist_metric_snapshots is
  'Immutable per-source, per-metric historical observations, one row per (artist_key, source, metric_name, UTC day). Never overwritten. Powers get_observed_growth().';

-- ============================================================================
-- Shared identity helper (used by both the capture trigger and the RPCs
-- below, so the artist_key derivation can never drift between write and read)
-- ============================================================================

create or replace function public.resolve_artist_key(p_artist_name text, p_spotify_data jsonb)
returns text
language sql
immutable
set search_path to 'public'
as $$
  select case
    when nullif(regexp_replace(coalesce(p_spotify_data->>'artist_uri', ''), '^.*/', ''), '') is not null
      then 'spotify:' || regexp_replace(p_spotify_data->>'artist_uri', '^.*/', '')
    else 'name:' || lower(btrim(coalesce(p_artist_name, '')))
  end;
$$;

-- ============================================================================
-- B. SNAPSHOT COLLECTION (trigger-based -- fires on the exact same
-- insert/update n8n's existing "Insert Intelligence Report" / "Save to
-- Supabase" nodes already perform. Zero n8n workflow changes, so this
-- doesn't touch Golden Rule 1.)
-- ============================================================================

create or replace function public.capture_one_metric(
  p_artist_key text, p_artist_name text, p_source text, p_source_artist_id text,
  p_metric_name text, p_raw_value text, p_is_cumulative boolean,
  p_report_id uuid, p_raw_payload jsonb
) returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if p_raw_value is null or p_raw_value !~ '^[0-9]+(\.[0-9]+)?$' then
    return;
  end if;

  insert into public.artist_metric_snapshots
    (artist_key, artist_name, source, source_artist_id, metric_name, metric_value, is_cumulative, report_id, raw_payload)
  values
    (p_artist_key, p_artist_name, p_source, p_source_artist_id, p_metric_name, p_raw_value::numeric, p_is_cumulative, p_report_id, p_raw_payload)
  on conflict (artist_key, source, metric_name, captured_date) do nothing;
end;
$$;

create or replace function public.capture_artist_metric_snapshots()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_artist_key text;
  v_spotify_id text;
begin
  if NEW.artist_name is null or btrim(NEW.artist_name) = '' then
    return NEW;
  end if;

  v_spotify_id := nullif(regexp_replace(coalesce(NEW.spotify_data->>'artist_uri', ''), '^.*/', ''), '');
  v_artist_key := public.resolve_artist_key(NEW.artist_name, NEW.spotify_data);

  if NEW.spotify_data is not null then
    perform public.capture_one_metric(v_artist_key, NEW.artist_name, 'spotify', v_spotify_id,
      'spotify_followers', NEW.spotify_data->>'followers', true, NEW.id, NEW.spotify_data);
    perform public.capture_one_metric(v_artist_key, NEW.artist_name, 'spotify', v_spotify_id,
      'spotify_monthly_listeners', NEW.spotify_data->>'monthly_listeners', true, NEW.id, NEW.spotify_data);
  end if;

  if NEW.youtube_data is not null then
    perform public.capture_one_metric(v_artist_key, NEW.artist_name, 'youtube', null,
      'youtube_subscribers', NEW.youtube_data->>'subscribers', true, NEW.id, NEW.youtube_data);
    perform public.capture_one_metric(v_artist_key, NEW.artist_name, 'youtube', null,
      'youtube_channel_views', NEW.youtube_data->>'total_views', true, NEW.id, NEW.youtube_data);
  end if;

  if NEW.tiktok_data is not null then
    perform public.capture_one_metric(v_artist_key, NEW.artist_name, 'tiktok', null,
      'tiktok_followers', NEW.tiktok_data->>'followers', true, NEW.id, NEW.tiktok_data);
    -- engagement_rate is a ratio, not a running total -- is_cumulative=false
    -- keeps it out of Observed Growth's delta-over-time eligibility entirely.
    perform public.capture_one_metric(v_artist_key, NEW.artist_name, 'tiktok', null,
      'tiktok_engagement_rate', NEW.tiktok_data->>'engagement_rate', false, NEW.id, NEW.tiktok_data);
  end if;

  if NEW.instagram_data is not null then
    perform public.capture_one_metric(v_artist_key, NEW.artist_name, 'instagram', null,
      'instagram_followers', NEW.instagram_data->>'followers', true, NEW.id, NEW.instagram_data);
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_capture_artist_metric_snapshots on public.intelligence_reports;
create trigger trg_capture_artist_metric_snapshots
  after insert or update of spotify_data, youtube_data, tiktok_data, instagram_data
  on public.intelligence_reports
  for each row
  execute function public.capture_artist_metric_snapshots();

grant execute on function public.resolve_artist_key(text, jsonb) to anon, authenticated;
