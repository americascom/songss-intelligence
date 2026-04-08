-- ============================================================
-- SONGSS Intelligence — Schema Inicial
-- Americascom, Inc. © 2026
-- ============================================================

-- Roles necessários para o Supabase funcionar
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticator') THEN
    CREATE ROLE authenticator NOINHERIT LOGIN PASSWORD 'supabase_password';
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
    CREATE ROLE supabase_auth_admin NOINHERIT LOGIN PASSWORD 'supabase_password';
  END IF;
END
$$;

GRANT anon TO authenticator;
GRANT authenticated TO authenticator;
GRANT service_role TO authenticator;

-- ============================================================
-- TABELA: intelligence_reports
-- ============================================================
CREATE TABLE IF NOT EXISTS public.intelligence_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    user_id UUID,
    plan_tier TEXT NOT NULL DEFAULT 'indie',
    search_query TEXT,
    asset_name TEXT,
    asset_type TEXT CHECK (asset_type IN ('artist', 'track', 'album')),
    spotify_data JSONB DEFAULT '{}'::jsonb,
    youtube_data JSONB DEFAULT '{}'::jsonb,
    deezer_data JSONB DEFAULT '{}'::jsonb,
    tiktok_data JSONB DEFAULT '{}'::jsonb,
    apple_shazam_data JSONB DEFAULT '{}'::jsonb,
    other_dsps_data JSONB DEFAULT '{}'::jsonb,
    ai_insights JSONB DEFAULT '{}'::jsonb,
    chart_urls JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.intelligence_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_asset_name ON public.intelligence_reports(asset_name);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.intelligence_reports(created_at DESC);

ALTER TABLE public.intelligence_reports ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TABELA: artists
-- ============================================================
CREATE TABLE IF NOT EXISTS public.artists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    name TEXT NOT NULL,
    spotify_id TEXT,
    youtube_channel_id TEXT,
    deezer_id TEXT,
    tiktok_username TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================
-- TABELA: users (clientes do SaaS)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    email TEXT UNIQUE NOT NULL,
    plan_tier TEXT DEFAULT 'indie',
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TABELA: plan_configs
-- ============================================================
CREATE TABLE IF NOT EXISTS public.plan_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plan_name TEXT UNIQUE NOT NULL,
    price_usd NUMERIC(10,2),
    ai_model TEXT,
    chart_tier TEXT,
    sources TEXT[],
    features JSONB DEFAULT '{}'::jsonb
);

INSERT INTO public.plan_configs (plan_name, price_usd, ai_model, chart_tier, sources, features)
VALUES
  ('Indie_Artist',  9.90,  'claude-haiku-4-5-20251001', 'basic',       ARRAY['spotify','youtube','deezer'], '{"curator_pitch": true}'::jsonb),
  ('Indie_Growth',  29.00, 'claude-haiku-4-5-20251001', 'standard',    ARRAY['spotify','youtube','deezer','lastfm','soundcloud','tiktok'], '{"curator_pitch": true, "trend_indicators": true}'::jsonb),
  ('Pro_Team',      99.00, 'claude-haiku-4-5-20251001', 'advanced',    ARRAY['spotify','youtube','deezer','lastfm','soundcloud','tiktok','shazam','musicbrainz','genius'], '{"curator_pitch": true, "trend_indicators": true, "predictive_insights": true}'::jsonb),
  ('Enterprise',   199.00, 'claude-opus-4-5',           'premium',     ARRAY['spotify','youtube','deezer','lastfm','soundcloud','tiktok','shazam','musicbrainz','genius','jamendo','perplexity'], '{"curator_pitch": true, "trend_indicators": true, "predictive_insights": true, "bi_reporting": true, "roi_projections": true}'::jsonb),
  ('Opus_Maximus',  0.00,  'claude-opus-4-5',           'opus_maximus', ARRAY['spotify','youtube','deezer','lastfm','soundcloud','tiktok','shazam','musicbrainz','genius','jamendo','perplexity','custom'], '{"all_features": true, "strategic_advisory": true}'::jsonb)
ON CONFLICT (plan_name) DO NOTHING;

-- ============================================================
-- GRANTS para anon e authenticated
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON public.plan_configs TO anon, authenticated;
GRANT ALL ON public.intelligence_reports TO authenticated, service_role;
GRANT ALL ON public.artists TO authenticated, service_role;
GRANT ALL ON public.users TO service_role;
GRANT SELECT ON public.users TO authenticated;
