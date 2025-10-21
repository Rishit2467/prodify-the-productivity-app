-- Create a SECURITY DEFINER function to check if a user is in a session (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_user_in_session(p_user_id uuid, p_session_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM study_session_participants
    WHERE user_id = p_user_id 
      AND session_id = p_session_id 
      AND is_active = true
  );
$$;

-- Create function to check if user is session host
CREATE OR REPLACE FUNCTION public.is_session_host(p_user_id uuid, p_session_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM study_sessions
    WHERE id = p_session_id 
      AND host_id = p_user_id
  );
$$;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view participants in their sessions" ON study_session_participants;
DROP POLICY IF EXISTS "Users can view sessions they're part of" ON study_sessions;

-- Recreate policies using security definer functions (no recursion)
CREATE POLICY "Users can view participants in their sessions"
ON study_session_participants
FOR SELECT
USING (
  public.is_session_host(auth.uid(), session_id) 
  OR public.is_user_in_session(auth.uid(), session_id)
);

CREATE POLICY "Users can view sessions they're part of"
ON study_sessions
FOR SELECT
USING (
  host_id = auth.uid() 
  OR public.is_user_in_session(auth.uid(), id)
);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_user_in_session(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_session_host(uuid, uuid) TO authenticated;