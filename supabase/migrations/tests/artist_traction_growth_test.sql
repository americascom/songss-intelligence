-- Acceptance tests for artist_metric_snapshots / get_current_traction /
-- get_observed_growth (spec section H). Transactional -- run the whole file
-- inside BEGIN/ROLLBACK so nothing persists in the live DB:
--
--   docker exec -i supabase-db psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
--     -c "BEGIN;" -f artist_traction_growth_test.sql -c "ROLLBACK;"
--
-- Each scenario RAISEs an EXCEPTION on failure (aborts the whole script) and
-- a NOTICE "PASS: ..." on success, so a clean run prints 6 PASS lines and
-- nothing else.

do $$
declare
  v_session_1 text := 'test_session_new_artist_' || gen_random_uuid();
  v_session_2 text := 'test_session_30d_' || gen_random_uuid();
  v_session_3 text := 'test_session_7d_' || gen_random_uuid();
  v_session_4 text := 'test_session_missing_source_' || gen_random_uuid();
  v_session_5 text := 'test_session_anomaly_' || gen_random_uuid();
  v_report_id uuid;
  v_result jsonb;
  v_artist_key text;
  v_snap_count int;
begin

  -- ==========================================================================
  -- Scenario 1: new artist, first report -- Current Traction available,
  -- snapshot inserted via trigger, Observed Growth is collecting_history.
  -- ==========================================================================
  insert into intelligence_reports (session_id, artist_name, plan_name, customer_email, spotify_data)
  values (v_session_1, 'Test Artist One', 'Enterprise', 'test@example.com',
          '{"followers": 10000, "monthly_listeners": 5000, "artist_uri": "https://open.spotify.com/artist/test_artist_one_id"}'::jsonb)
  returning id into v_report_id;

  v_result := get_current_traction(v_session_1);
  if v_result->>'status' != 'available' then
    raise exception 'Scenario 1 FAILED: expected current_traction status=available, got %', v_result->>'status';
  end if;
  if (v_result->>'current_traction_score') is null then
    raise exception 'Scenario 1 FAILED: current_traction_score is null despite a usable Spotify signal';
  end if;

  select count(*) into v_snap_count from artist_metric_snapshots where report_id = v_report_id;
  if v_snap_count = 0 then
    raise exception 'Scenario 1 FAILED: no snapshots inserted for the first report';
  end if;

  v_result := get_observed_growth(v_session_1, 'spotify_monthly_listeners');
  if v_result->>'status' != 'collecting_history' then
    raise exception 'Scenario 1 FAILED: expected observed_growth status=collecting_history on first report, got %', v_result->>'status';
  end if;

  if v_result->'value' is not null and (v_result->>'value') != 'null' then
    raise exception 'Scenario 1 FAILED: observed_growth.value should be null before any history exists';
  end if;

  raise notice 'PASS: Scenario 1 (new artist, first report)';

  -- ==========================================================================
  -- Scenario 2: two snapshots exactly 30 days apart -- real growth computed.
  -- ==========================================================================
  v_artist_key := 'name:test artist two';
  insert into intelligence_reports (session_id, artist_name, plan_name, customer_email)
  values (v_session_2, 'Test Artist Two', 'Enterprise', 'test@example.com')
  returning id into v_report_id;

  insert into artist_metric_snapshots (artist_key, artist_name, source, metric_name, metric_value, is_cumulative, captured_at)
  values (v_artist_key, 'Test Artist Two', 'spotify', 'spotify_monthly_listeners', 10000, true, now() - interval '30 days');
  insert into artist_metric_snapshots (artist_key, artist_name, source, metric_name, metric_value, is_cumulative, captured_at)
  values (v_artist_key, 'Test Artist Two', 'spotify', 'spotify_monthly_listeners', 11280, true, now());

  v_result := get_observed_growth(v_session_2, 'spotify_monthly_listeners');
  if v_result->>'status' != 'observed' then
    raise exception 'Scenario 2 FAILED: expected status=observed for 30-day-apart snapshots, got %', v_result->>'status';
  end if;
  if (v_result->>'value')::numeric != 12.8 then
    raise exception 'Scenario 2 FAILED: expected growth 12.8%%, got %', v_result->>'value';
  end if;
  if (v_result->>'baseline_value')::numeric != 10000 or (v_result->>'current_value')::numeric != 11280 then
    raise exception 'Scenario 2 FAILED: baseline/current values do not match input snapshots';
  end if;
  if v_result->>'baseline_snapshot_id' is null or v_result->>'current_snapshot_id' is null then
    raise exception 'Scenario 2 FAILED: missing baseline/current snapshot ids';
  end if;

  raise notice 'PASS: Scenario 2 (30-day-apart observed growth = %)', v_result->>'value';

  -- ==========================================================================
  -- Scenario 3: two snapshots only 7 days apart -- must NOT be labeled a
  -- 30-day observed result.
  -- ==========================================================================
  v_artist_key := 'name:test artist three';
  insert into intelligence_reports (session_id, artist_name, plan_name, customer_email)
  values (v_session_3, 'Test Artist Three', 'Enterprise', 'test@example.com')
  returning id into v_report_id;

  insert into artist_metric_snapshots (artist_key, artist_name, source, metric_name, metric_value, is_cumulative, captured_at)
  values (v_artist_key, 'Test Artist Three', 'spotify', 'spotify_monthly_listeners', 10000, true, now() - interval '7 days');
  insert into artist_metric_snapshots (artist_key, artist_name, source, metric_name, metric_value, is_cumulative, captured_at)
  values (v_artist_key, 'Test Artist Three', 'spotify', 'spotify_monthly_listeners', 10500, true, now());

  v_result := get_observed_growth(v_session_3, 'spotify_monthly_listeners');
  if v_result->>'status' = 'observed' then
    raise exception 'Scenario 3 FAILED: 7-day-apart snapshots must not produce an observed 30-day result, got status=observed value=%', v_result->>'value';
  end if;
  if v_result->>'status' != 'insufficient_comparable_history' then
    raise exception 'Scenario 3 FAILED: expected status=insufficient_comparable_history, got %', v_result->>'status';
  end if;

  raise notice 'PASS: Scenario 3 (7-day-apart snapshots correctly rejected)';

  -- ==========================================================================
  -- Scenario 4: missing source -- score computed from present sources only,
  -- weights re-normalized, missing source listed transparently.
  -- ==========================================================================
  insert into intelligence_reports (session_id, artist_name, plan_name, customer_email, spotify_data, youtube_data)
  values (v_session_4, 'Test Artist Four', 'Enterprise', 'test@example.com',
          '{"followers": 50000, "monthly_listeners": 20000}'::jsonb,
          '{"subscribers": 8000, "total_views": "500000"}'::jsonb)
  returning id into v_report_id;
  -- deliberately no tiktok_data / instagram_data

  v_result := get_current_traction(v_session_4);
  if v_result->>'status' != 'available' then
    raise exception 'Scenario 4 FAILED: expected status=available with 2 of 4 sources present, got %', v_result->>'status';
  end if;
  if jsonb_array_length(v_result->'missing_sources') != 3 then
    raise exception 'Scenario 4 FAILED: expected 3 missing signals (tiktok_followers, tiktok_engagement_rate, instagram_followers), got %', v_result->'missing_sources';
  end if;
  if not (v_result->'missing_sources' ? 'tiktok_followers') then
    raise exception 'Scenario 4 FAILED: tiktok_followers should be listed as missing';
  end if;
  if (v_result->>'current_traction_score')::int <= 0 then
    raise exception 'Scenario 4 FAILED: score should be computed from the 2 present sources, not zeroed out';
  end if;

  raise notice 'PASS: Scenario 4 (missing sources re-normalized, score=%)', v_result->>'current_traction_score';

  -- ==========================================================================
  -- Scenario 5: anomalous cumulative-metric drop -- flagged, not silently
  -- trusted as real.
  -- ==========================================================================
  v_artist_key := 'name:test artist five';
  insert into intelligence_reports (session_id, artist_name, plan_name, customer_email)
  values (v_session_5, 'Test Artist Five', 'Enterprise', 'test@example.com')
  returning id into v_report_id;

  insert into artist_metric_snapshots (artist_key, artist_name, source, metric_name, metric_value, is_cumulative, captured_at)
  values (v_artist_key, 'Test Artist Five', 'spotify', 'spotify_followers', 100000, true, now() - interval '30 days');
  insert into artist_metric_snapshots (artist_key, artist_name, source, metric_name, metric_value, is_cumulative, captured_at)
  values (v_artist_key, 'Test Artist Five', 'spotify', 'spotify_followers', 20000, true, now());

  v_result := get_observed_growth(v_session_5, 'spotify_followers');
  if v_result->>'status' != 'observed' then
    raise exception 'Scenario 5 FAILED: a real (if anomalous) delta should still return status=observed, got %', v_result->>'status';
  end if;
  if (v_result->>'data_quality_flag')::boolean != true then
    raise exception 'Scenario 5 FAILED: an 80%% cumulative-metric drop should set data_quality_flag=true';
  end if;
  if v_result->>'confidence' != 'low' then
    raise exception 'Scenario 5 FAILED: confidence should downgrade to low when data_quality_flag is set, got %', v_result->>'confidence';
  end if;

  raise notice 'PASS: Scenario 5 (anomalous drop flagged, not silently trusted)';

  -- ==========================================================================
  -- Scenario 6: report refresh -- retains history, no duplicate on same-day
  -- re-run (idempotency; live-verified earlier against the real Billie
  -- Eilish row, re-asserted here synthetically).
  -- ==========================================================================
  update intelligence_reports set spotify_data = spotify_data where session_id = v_session_1;
  update intelligence_reports set spotify_data = spotify_data where session_id = v_session_1;

  select count(*) into v_snap_count
  from artist_metric_snapshots
  where artist_key = (select resolve_artist_key(artist_name, spotify_data) from intelligence_reports where session_id = v_session_1)
    and metric_name = 'spotify_monthly_listeners';

  if v_snap_count != 1 then
    raise exception 'Scenario 6 FAILED: expected exactly 1 snapshot after 3 same-day writes (idempotent), got %', v_snap_count;
  end if;

  raise notice 'PASS: Scenario 6 (report refresh is idempotent, history retained)';

  raise notice '=== ALL 6 SCENARIOS PASSED ===';
end $$;
