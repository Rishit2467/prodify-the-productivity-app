-- Create a SECURITY DEFINER function to fetch limited profile info by ids (bypass RLS safely)
CREATE OR REPLACE FUNCTION public.get_profiles_by_ids(p_ids uuid[])
RETURNS TABLE (id uuid, username text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, username, avatar_url
  FROM public.profiles
  WHERE id = ANY(p_ids);
$$;

GRANT EXECUTE ON FUNCTION public.get_profiles_by_ids(uuid[]) TO authenticated;