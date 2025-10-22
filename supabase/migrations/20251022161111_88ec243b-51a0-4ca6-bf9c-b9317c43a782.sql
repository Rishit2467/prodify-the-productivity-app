-- Drop the restrictive policy that only allows users to see their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create a new policy that allows users to see profiles of their friends
CREATE POLICY "Users can view their own and friends' profiles" ON public.profiles
FOR SELECT USING (
  auth.uid() = id 
  OR EXISTS (
    SELECT 1 FROM public.friendships
    WHERE (friendships.user_id = auth.uid() AND friendships.friend_id = profiles.id)
       OR (friendships.friend_id = auth.uid() AND friendships.user_id = profiles.id)
  )
);