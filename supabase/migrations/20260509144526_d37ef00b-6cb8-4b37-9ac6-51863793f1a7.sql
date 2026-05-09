CREATE TABLE public.intelligence_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL UNIQUE,
  email text NOT NULL,
  artist_name text,
  report_markdown text NOT NULL DEFAULT '',
  charts_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_intelligence_reports_session ON public.intelligence_reports(session_id);
CREATE INDEX idx_intelligence_reports_email ON public.intelligence_reports(lower(email));

ALTER TABLE public.intelligence_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reports matching their email"
ON public.intelligence_reports FOR SELECT
TO authenticated
USING (lower(email) = lower((auth.jwt() ->> 'email')));

CREATE POLICY "Admins can view all reports"
ON public.intelligence_reports FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can insert reports"
ON public.intelligence_reports FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update reports"
ON public.intelligence_reports FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete reports"
ON public.intelligence_reports FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER update_intelligence_reports_updated_at
BEFORE UPDATE ON public.intelligence_reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();