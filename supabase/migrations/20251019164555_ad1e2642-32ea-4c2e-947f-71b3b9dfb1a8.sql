-- Create a SECURITY DEFINER function to fetch user id by username (case-insensitive)
CREATE OR REPLACE FUNCTION public.get_user_id_by_username(p_username text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id
  FROM public.profiles
  WHERE lower(username) = lower(p_username)
  LIMIT 1;
$$;

-- Optional: search function for future use (prefix/contains search)
CREATE OR REPLACE FUNCTION public.search_users(p_query text)
RETURNS TABLE (id uuid, username text, avatar_url text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id, username, avatar_url
  FROM public.profiles
  WHERE username ILIKE '%' || p_query || '%'
  ORDER BY username
  LIMIT 20;
$$;

-- Ensure authenticated users can call these functions
GRANT EXECUTE ON FUNCTION public.get_user_id_by_username(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_users(text) TO authenticated;