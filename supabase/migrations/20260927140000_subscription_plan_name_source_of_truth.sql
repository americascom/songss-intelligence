-- Phase 3 subscription lifecycle: plan_name source of truth switches from
-- intelligence_reports (last purchased report) to subscriptions (current
-- Stripe subscription), so a Portal-driven upgrade/downgrade actually
-- changes enforcement instead of being write-only.

CREATE OR REPLACE FUNCTION public.get_quota_status()
 RETURNS TABLE(plan_name text, used integer, monthly_limit integer, subscription_status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id   uuid := auth.uid();
  v_email     text := auth.email();
  v_owner_id  uuid;
  v_owner_email text;
  v_plan_name text;
  v_limit     integer;
  v_used      integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  v_owner_id := public.pool_owner_id(v_user_id);

  -- Plan name source of truth (2026-09-27, Phase 3): subscriptions.plan_name,
  -- the current Stripe subscription -- not the last purchased report, so a
  -- Portal-driven upgrade/downgrade actually changes what's enforced here.
  select s.plan_name into v_plan_name
  from public.subscriptions s
  where s.user_id = v_owner_id
  order by s.created_at desc
  limit 1;

  -- Fallback for subscriptions rows where user_id wasn't populated (mirrors
  -- get_subscription_status's own user_id-rollout fallback): resolve the
  -- pool owner's email via intelligence_reports, then match on that.
  if v_plan_name is null then
    select ir.customer_email into v_owner_email
    from public.intelligence_reports ir
    where ir.user_id = v_owner_id
    order by ir.created_at desc
    limit 1;

    if v_owner_email is not null then
      select s.plan_name into v_plan_name
      from public.subscriptions s
      where lower(s.customer_email) = lower(v_owner_email)
      order by s.created_at desc
      limit 1;
    end if;
  end if;

  -- Legacy fallback (pre-Phase-3 behavior): if the pool owner genuinely has
  -- no subscriptions row at all (should not happen post-2026-09-19 backfill),
  -- fall back to the last purchased report's plan_name rather than failing.
  if v_plan_name is null then
    select ir.plan_name into v_plan_name
    from public.intelligence_reports ir
    where ir.user_id = v_owner_id
    order by ir.created_at desc
    limit 1;
  end if;

  if v_plan_name is null and v_email is not null then
    select ir.plan_name into v_plan_name
    from public.intelligence_reports ir
    where ir.user_id is null
      and lower(ir.customer_email) = lower(v_email)
    order by ir.created_at desc
    limit 1;
  end if;

  if v_plan_name is null then
    raise exception 'No active plan found for this account';
  end if;

  select pl.monthly_limit into v_limit
  from public.plan_limits pl
  where lower(v_plan_name) like '%' || pl.plan_key || '%'
  order by length(pl.plan_key) desc
  limit 1;

  if v_limit is null then
    raise exception 'No quota configured for plan %', v_plan_name;
  end if;

  select count(*) into v_used
  from public.intelligence_reports ir
  where (
          ir.user_id in (select public.pool_member_ids(v_user_id))
          or (ir.user_id is null and v_email is not null and lower(ir.customer_email) = lower(v_email))
        )
    and ir.created_at >= date_trunc('month', now());

  return query select v_plan_name, v_used, v_limit, public.get_subscription_status();
end;
$function$;

CREATE OR REPLACE FUNCTION public.request_new_report(p_artist_name text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id    uuid := auth.uid();
  v_email      text := auth.email();
  v_owner_id   uuid;
  v_owner_email text;
  v_plan_name  text;
  v_limit      integer;
  v_used       integer;
  v_session_id text;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_subscription_active() then
    raise exception 'Subscription inactive -- reports are unavailable until it is reactivated';
  end if;

  -- Team quota pooling (2026-07-21): plan + quota resolve against the whole
  -- pool (pool owner + all its team members via public.teams), not just this
  -- individual user_id. New report rows still attribute to the actual
  -- requester (v_user_id/v_email) for per-person traceability -- only the
  -- quota check spans the pool. See public.pool_owner_id/pool_member_ids.
  v_owner_id := public.pool_owner_id(v_user_id);

  -- Plan name source of truth (2026-09-27, Phase 3): subscriptions.plan_name,
  -- same rationale/fallback chain as get_quota_status.
  select s.plan_name into v_plan_name
  from public.subscriptions s
  where s.user_id = v_owner_id
  order by s.created_at desc
  limit 1;

  if v_plan_name is null then
    select ir.customer_email into v_owner_email
    from public.intelligence_reports ir
    where ir.user_id = v_owner_id
    order by ir.created_at desc
    limit 1;

    if v_owner_email is not null then
      select s.plan_name into v_plan_name
      from public.subscriptions s
      where lower(s.customer_email) = lower(v_owner_email)
      order by s.created_at desc
      limit 1;
    end if;
  end if;

  if v_plan_name is null then
    select plan_name into v_plan_name
    from public.intelligence_reports
    where user_id = v_owner_id
    order by created_at desc
    limit 1;
  end if;

  if v_plan_name is null then
    raise exception 'No active plan found for this account';
  end if;

  select monthly_limit into v_limit
  from public.plan_limits
  where lower(v_plan_name) like '%' || plan_key || '%'
  order by length(plan_key) desc
  limit 1;

  if v_limit is null then
    raise exception 'No quota configured for plan %', v_plan_name;
  end if;

  select count(*) into v_used
  from public.intelligence_reports
  where user_id in (select public.pool_member_ids(v_user_id))
    and created_at >= date_trunc('month', now());

  if v_used >= v_limit then
    raise exception 'Monthly quota reached (% / %)', v_used, v_limit;
  end if;

  v_session_id := 'req_' || replace(gen_random_uuid()::text, '-', '');

  insert into public.intelligence_reports (session_id, user_id, customer_email, plan_name, artist_name)
  values (v_session_id, v_user_id, v_email, v_plan_name, p_artist_name);

  return v_session_id;
end;
$function$;
