DELETE FROM public.metrics_global WHERE user_id IS NULL;
ALTER TABLE public.metrics_global ALTER COLUMN user_id SET NOT NULL;