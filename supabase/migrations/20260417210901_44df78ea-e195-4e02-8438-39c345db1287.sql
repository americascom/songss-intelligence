-- Harden user_roles policies: defense-in-depth against admin self-grant.
-- Drop existing admin INSERT/UPDATE policies and recreate with stricter WITH CHECK.

DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;

-- INSERT: caller must be admin AND cannot grant 'admin' role to themselves.
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  AND NOT (role = 'admin'::public.app_role AND user_id = auth.uid())
);

-- UPDATE: caller must be admin AND cannot promote themselves to 'admin'.
CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  AND NOT (role = 'admin'::public.app_role AND user_id = auth.uid())
);