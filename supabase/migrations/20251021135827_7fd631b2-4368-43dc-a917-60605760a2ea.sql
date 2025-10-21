-- Create a SECURITY DEFINER function to create bidirectional friendships (bypasses RLS)
CREATE OR REPLACE FUNCTION public.create_friendship(p_user1_id uuid, p_user2_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert bidirectional friendships
  INSERT INTO public.friendships (user_id, friend_id)
  VALUES (p_user1_id, p_user2_id)
  ON CONFLICT DO NOTHING;
  
  INSERT INTO public.friendships (user_id, friend_id)
  VALUES (p_user2_id, p_user1_id)
  ON CONFLICT DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_friendship(uuid, uuid) TO authenticated;