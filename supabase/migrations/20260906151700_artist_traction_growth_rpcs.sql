-- C. CURRENT TRACTION + D. OBSERVED GROWTH
--
-- Both exposed as SECURITY DEFINER RPCs keyed by session_id, mirroring the
-- existing get_report_by_session() trust model (session_id acts as the
-- bearer credential -- same EXECUTE grants to anon/authenticated).

create or replace function public.safe_numeric(p_text text)
returns numeric
language sql
immutable
as $$
  select case when p_text ~ '^[0-9]+(\.[0-9]+)?$' then p_text::numeric else null end;
$$;

-- Log10 curve mapping a raw follower/subscriber/view count to a 0-100
-- sub-score: 100 (very early artist) -> 0, 100,000,000 (global superstar)
-- -> 100. This is a Songss-internal scaling choice for the Current Traction
-- composite, not derived from or claiming to be any external benchmark.
create or replace function public.traction_log_subscore(p_value numeric)
returns numeric
language sql
immutable
as $$
  select case
    when p_value is null or p_value <= 0 then null
    else greatest(0, least(100, round(((log(10, p_value) - 2) / 6.0) * 100)))
  end;
$$;

-- Reuses the same 0-20%-engagement-rate -> 0-100 convention already
-- established for social_engagement_index elsewhere in this codebase.
create or replace function public.traction_rate_subscore(p_value numeric)
returns numeric
language sql
immutable
as $$
  select case
    when p_value is null or p_value < 0 then null
    else least(100, round(p_value * 100.0 / 20.0))
  end;
$$;

create or replace function public.get_current_traction(p_session_id text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  r public.intelligence_reports%rowtype;

  v_spotify_followers   numeric;
  v_spotify_listeners   numeric;
  v_youtube_subs        numeric;
  v_youtube_views       numeric;
  v_tiktok_followers    numeric;
  v_tiktok_engagement   numeric;
  v_instagram_followers numeric;

  v_signals_used jsonb := '[]'::jsonb;
  v_missing      jsonb := '[]'::jsonb;
  v_total_weight numeric := 0;
  v_weighted_sum numeric := 0;
  v_present_count int := 0;
  v_sources_resolved int := 0;
  v_score int;

  v_traction_level text;
  v_artist_stage    text := 'unknown';
  v_discovery       text := 'unavailable';
  v_cross_platform  text := 'unavailable';
  v_viral           text := 'unavailable';
  v_confidence      text;
begin
  select * into r from public.intelligence_reports where session_id = p_session_id limit 1;
  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  v_spotify_followers   := public.safe_numeric(r.spotify_data->>'followers');
  v_spotify_listeners   := public.safe_numeric(r.spotify_data->>'monthly_listeners');
  v_youtube_subs        := public.safe_numeric(r.youtube_data->>'subscribers');
  v_youtube_views       := public.safe_numeric(r.youtube_data->>'total_views');
  v_tiktok_followers    := public.safe_numeric(r.tiktok_data->>'followers');
  v_tiktok_engagement   := public.safe_numeric(r.tiktok_data->>'engagement_rate');
  v_instagram_followers := public.safe_numeric(r.instagram_data->>'followers');

  -- Weighted signals (sum to 100 when all 7 are present). Weights re-normalize
  -- automatically because v_score divides by v_total_weight (sum of weights
  -- actually used), not a fixed 100 -- a missing source shrinks the
  -- denominator along with the numerator instead of dragging the score down.
  if v_spotify_listeners is not null then
    v_weighted_sum := v_weighted_sum + 25 * public.traction_log_subscore(v_spotify_listeners);
    v_total_weight := v_total_weight + 25; v_present_count := v_present_count + 1;
    v_signals_used := v_signals_used || jsonb_build_object('signal','spotify_monthly_listeners','source','spotify','weight',25,'raw_value',v_spotify_listeners,'sub_score',public.traction_log_subscore(v_spotify_listeners));
  else
    v_missing := v_missing || to_jsonb('spotify_monthly_listeners'::text);
  end if;

  if v_spotify_followers is not null then
    v_weighted_sum := v_weighted_sum + 20 * public.traction_log_subscore(v_spotify_followers);
    v_total_weight := v_total_weight + 20; v_present_count := v_present_count + 1;
    v_signals_used := v_signals_used || jsonb_build_object('signal','spotify_followers','source','spotify','weight',20,'raw_value',v_spotify_followers,'sub_score',public.traction_log_subscore(v_spotify_followers));
  else
    v_missing := v_missing || to_jsonb('spotify_followers'::text);
  end if;

  if v_youtube_subs is not null then
    v_weighted_sum := v_weighted_sum + 15 * public.traction_log_subscore(v_youtube_subs);
    v_total_weight := v_total_weight + 15; v_present_count := v_present_count + 1;
    v_signals_used := v_signals_used || jsonb_build_object('signal','youtube_subscribers','source','youtube','weight',15,'raw_value',v_youtube_subs,'sub_score',public.traction_log_subscore(v_youtube_subs));
  else
    v_missing := v_missing || to_jsonb('youtube_subscribers'::text);
  end if;

  if v_youtube_views is not null then
    v_weighted_sum := v_weighted_sum + 10 * public.traction_log_subscore(v_youtube_views);
    v_total_weight := v_total_weight + 10; v_present_count := v_present_count + 1;
    v_signals_used := v_signals_used || jsonb_build_object('signal','youtube_channel_views','source','youtube','weight',10,'raw_value',v_youtube_views,'sub_score',public.traction_log_subscore(v_youtube_views));
  else
    v_missing := v_missing || to_jsonb('youtube_channel_views'::text);
  end if;

  if v_tiktok_followers is not null then
    v_weighted_sum := v_weighted_sum + 10 * public.traction_log_subscore(v_tiktok_followers);
    v_total_weight := v_total_weight + 10; v_present_count := v_present_count + 1;
    v_signals_used := v_signals_used || jsonb_build_object('signal','tiktok_followers','source','tiktok','weight',10,'raw_value',v_tiktok_followers,'sub_score',public.traction_log_subscore(v_tiktok_followers));
  else
    v_missing := v_missing || to_jsonb('tiktok_followers'::text);
  end if;

  if v_tiktok_engagement is not null then
    v_weighted_sum := v_weighted_sum + 10 * public.traction_rate_subscore(v_tiktok_engagement);
    v_total_weight := v_total_weight + 10; v_present_count := v_present_count + 1;
    v_signals_used := v_signals_used || jsonb_build_object('signal','tiktok_engagement_rate','source','tiktok','weight',10,'raw_value',v_tiktok_engagement,'sub_score',public.traction_rate_subscore(v_tiktok_engagement));
  else
    v_missing := v_missing || to_jsonb('tiktok_engagement_rate'::text);
  end if;

  if v_instagram_followers is not null then
    v_weighted_sum := v_weighted_sum + 10 * public.traction_log_subscore(v_instagram_followers);
    v_total_weight := v_total_weight + 10; v_present_count := v_present_count + 1;
    v_signals_used := v_signals_used || jsonb_build_object('signal','instagram_followers','source','instagram','weight',10,'raw_value',v_instagram_followers,'sub_score',public.traction_log_subscore(v_instagram_followers));
  else
    v_missing := v_missing || to_jsonb('instagram_followers'::text);
  end if;

  if v_total_weight = 0 then
    return jsonb_build_object(
      'assessment_type', 'current_snapshot',
      'status', 'unavailable',
      'current_traction_score', null,
      'signals_used', v_signals_used,
      'missing_sources', v_missing,
      'confidence', 'unavailable',
      'generated_at', now()
    );
  end if;

  v_score := round(v_weighted_sum / v_total_weight);

  v_sources_resolved :=
    (case when v_spotify_followers is not null or v_spotify_listeners is not null then 1 else 0 end) +
    (case when v_youtube_subs is not null or v_youtube_views is not null then 1 else 0 end) +
    (case when v_tiktok_followers is not null or v_tiktok_engagement is not null then 1 else 0 end) +
    (case when v_instagram_followers is not null then 1 else 0 end);

  v_traction_level := case
    when v_score < 20 then 'low' when v_score < 40 then 'emerging'
    when v_score < 60 then 'developing' when v_score < 80 then 'strong'
    else 'high'
  end;

  -- career_stages bands per benchmark_version 2025-2026 config (monthly_listeners_range)
  v_artist_stage := case
    when v_spotify_listeners is null or v_spotify_listeners < 500 then 'unknown'
    when v_spotify_listeners < 5000 then 'early'
    when v_spotify_listeners < 50000 then 'building'
    else 'established'
  end;

  v_discovery := case
    when v_spotify_listeners is null then 'unavailable'
    when public.traction_log_subscore(v_spotify_listeners) < 34 then 'low'
    when public.traction_log_subscore(v_spotify_listeners) < 67 then 'moderate'
    else 'high'
  end;

  v_cross_platform := case
    when v_sources_resolved = 0 then 'unavailable'
    when v_sources_resolved = 1 then 'limited'
    when v_sources_resolved = 2 then 'developing'
    else 'strong'
  end;

  v_viral := case
    when v_tiktok_engagement is null then 'unavailable'
    when public.traction_rate_subscore(v_tiktok_engagement) < 34 then 'low'
    when public.traction_rate_subscore(v_tiktok_engagement) < 67 then 'moderate'
    else 'high'
  end;

  v_confidence := case
    when v_present_count <= 2 then 'low'
    when v_present_count <= 4 then 'medium'
    else 'high'
  end;

  return jsonb_build_object(
    'assessment_type', 'current_snapshot',
    'status', 'available',
    'current_traction_score', v_score,
    'traction_level', v_traction_level,
    'artist_stage', v_artist_stage,
    'discovery_signal', v_discovery,
    'cross_platform_presence', v_cross_platform,
    'viral_momentum_signal', v_viral,
    'signals_used', v_signals_used,
    'missing_sources', v_missing,
    'confidence', v_confidence,
    'generated_at', now()
  );
end;
$$;

create or replace function public.get_observed_growth(p_session_id text, p_metric_name text default 'spotify_monthly_listeners')
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  r public.intelligence_reports%rowtype;
  v_artist_key text;
  v_current record;
  v_baseline record;
  v_available_count int;
  v_growth numeric;
  v_period_days int;
  v_status text;
  v_message text;
  v_data_quality_flag boolean := false;
  v_confidence text;
  v_benchmark jsonb;
  v_market_context jsonb;
  v_category text;
begin
  if p_metric_name not in ('spotify_followers','spotify_monthly_listeners','youtube_subscribers','youtube_channel_views','tiktok_followers','instagram_followers') then
    return jsonb_build_object(
      'metric', p_metric_name || '_growth_30d',
      'status', 'unsupported_metric',
      'assessment_type', 'observed_growth',
      'message', 'This metric is not a cumulative running total (e.g. rates/ratios like tiktok_engagement_rate are excluded from Observed Growth by design) or is not a recognized metric name.'
    );
  end if;

  select * into r from public.intelligence_reports where session_id = p_session_id limit 1;
  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  v_artist_key := public.resolve_artist_key(r.artist_name, r.spotify_data);

  select count(*) into v_available_count
  from public.artist_metric_snapshots
  where artist_key = v_artist_key and metric_name = p_metric_name;

  -- Macro market context is static narrative, safe to attach regardless of
  -- this artist's own eligibility -- it never touches the growth number.
  v_market_context := jsonb_build_object(
    'benchmark_type', 'market_context',
    'benchmark_id', 'ifpi_gmr_2026_latam_2025',
    'benchmarks_used', jsonb_build_array('ifpi_gmr_2026_latam_17.1%'),
    'source', 'IFPI Global Music Report 2026',
    'region_growth_percent', 17.1,
    'global_growth_percent', 6.4,
    'applicability', 'recorded_music_revenue_market_level',
    'not_artist_growth', true,
    'note', 'Macro recorded-music-revenue context only -- not a comparison to this artist''s audience growth.'
  );

  select id, metric_value, captured_at into v_current
  from public.artist_metric_snapshots
  where artist_key = v_artist_key and metric_name = p_metric_name
  order by captured_at desc
  limit 1;

  if not found then
    return jsonb_build_object(
      'metric', p_metric_name || '_growth_30d', 'value', null, 'unit', 'percent',
      'status', 'collecting_history', 'assessment_type', 'observed_growth',
      'minimum_required_snapshots', 2, 'available_snapshots', 0, 'target_period_days', 30,
      'message', 'Growth tracking is being established. A 30-day observed comparison will be available after two comparable snapshots are collected.',
      'confidence', 'unavailable', 'market_context', v_market_context
    );
  end if;

  select id, metric_value, captured_at into v_baseline
  from public.artist_metric_snapshots
  where artist_key = v_artist_key and metric_name = p_metric_name
    and id <> v_current.id
    and captured_at <= v_current.captured_at - interval '28 days'
    and captured_at >= v_current.captured_at - interval '35 days'
  order by abs(extract(epoch from (captured_at - (v_current.captured_at - interval '30 days'))))
  limit 1;

  if not found then
    if v_available_count < 2 then
      v_status := 'collecting_history';
      v_message := 'Growth tracking is being established. A 30-day observed comparison will be available after a new comparable snapshot is collected.';
    else
      v_status := 'insufficient_comparable_history';
      v_message := 'Snapshots exist but none fall within the 28-35 day window required for a reliable 30-day growth reading.';
    end if;
    return jsonb_build_object(
      'metric', p_metric_name || '_growth_30d', 'value', null, 'unit', 'percent',
      'status', v_status, 'assessment_type', 'observed_growth',
      'minimum_required_snapshots', 2, 'available_snapshots', v_available_count, 'target_period_days', 30,
      'message', v_message, 'confidence', 'unavailable', 'market_context', v_market_context
    );
  end if;

  if v_baseline.metric_value <= 0 then
    return jsonb_build_object(
      'metric', p_metric_name || '_growth_30d', 'value', null, 'unit', 'percent',
      'status', 'collecting_history', 'assessment_type', 'observed_growth',
      'minimum_required_snapshots', 2, 'available_snapshots', v_available_count, 'target_period_days', 30,
      'message', 'Baseline value was zero -- a growth percentage cannot be computed from a zero starting point.',
      'confidence', 'unavailable', 'market_context', v_market_context
    );
  end if;

  v_period_days := round(extract(epoch from (v_current.captured_at - v_baseline.captured_at)) / 86400.0);
  v_growth := round(((v_current.metric_value - v_baseline.metric_value) / v_baseline.metric_value) * 100, 1);

  -- A >50% drop in a cumulative metric is treated as suspicious (API glitch,
  -- artist misresolution, etc.) -- flagged, never silently discarded.
  if v_current.metric_value < v_baseline.metric_value * 0.5 then
    v_data_quality_flag := true;
  end if;

  v_confidence := case when v_data_quality_flag then 'low' when v_available_count >= 3 then 'high' else 'medium' end;

  if v_growth < 0 then
    v_benchmark := null;
  else
    v_category := case
      when v_growth < 5 then 'estavel'
      when v_growth < 15 then 'saudavel'
      when v_growth < 30 then 'forte'
      else 'breakout'
    end;
    v_benchmark := jsonb_build_object(
      'benchmark_type', 'benchmark_comparison',
      'benchmark_id', 'industry_growth_ranges_2025_2026',
      'benchmarks_used', jsonb_build_array('industry_growth_ranges_2025_2026'),
      'source', 'Orphiq - Streaming Benchmarks 2026; Push Music - Healthy Growth Benchmarks 2026',
      'category', v_category,
      'not_artist_growth', false,
      'applicability', 'monthly_audience_growth_rate_reference',
      'note', 'Classifies this artist''s own real observed growth against documented industry growth-rate bands -- not a market-revenue comparison.'
    );
  end if;

  return jsonb_build_object(
    'metric', p_metric_name || '_growth_30d',
    'value', v_growth,
    'unit', 'percent',
    'status', 'observed',
    'assessment_type', 'observed_growth',
    'period_days', v_period_days,
    'baseline_value', v_baseline.metric_value,
    'current_value', v_current.metric_value,
    'captured_from', v_baseline.captured_at,
    'captured_to', v_current.captured_at,
    'baseline_snapshot_id', v_baseline.id,
    'current_snapshot_id', v_current.id,
    'data_quality_flag', v_data_quality_flag,
    'confidence', v_confidence,
    'benchmark_comparison', v_benchmark,
    'market_context', v_market_context
  );
end;
$$;

grant execute on function public.get_current_traction(text) to anon, authenticated;
grant execute on function public.get_observed_growth(text, text) to anon, authenticated;

notify pgrst, 'reload schema';
