
-- Admin SELECT policy for user_roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin INSERT policy for user_roles
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin UPDATE policy for user_roles
CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin DELETE policy for user_roles
CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
