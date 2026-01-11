-- Add user_id column to metrics_global
ALTER TABLE public.metrics_global 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view metrics" ON public.metrics_global;

-- Create row-owner policies for metrics_global
CREATE POLICY "Users can view their own metrics"
ON public.metrics_global
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own metrics"
ON public.metrics_global
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own metrics"
ON public.metrics_global
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own metrics"
ON public.metrics_global
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Allow admins to view all metrics
CREATE POLICY "Admins can view all metrics"
ON public.metrics_global
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));