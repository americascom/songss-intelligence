ALTER TABLE public.intelligence_reports
  ADD COLUMN IF NOT EXISTS plan_name TEXT,
  ADD COLUMN IF NOT EXISTS customer_email TEXT,
  ADD COLUMN IF NOT EXISTS report_html TEXT,
  ADD COLUMN IF NOT EXISTS digital_score NUMERIC,
  ADD COLUMN IF NOT EXISTS geo_hotspots JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS revenue_economics JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS engagement_metrics JSONB DEFAULT '{}'::jsonb;

CREATE POLICY "Public can view reports by session_id"
  ON public.intelligence_reports
  FOR SELECT
  TO anon, authenticated
  USING (true);
