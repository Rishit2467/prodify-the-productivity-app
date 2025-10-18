-- Create friendships table to store friend connections
CREATE TABLE public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

-- Create friend_requests table
CREATE TABLE public.friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(sender_id, receiver_id),
  CHECK (sender_id != receiver_id)
);

-- Create study_sessions table
CREATE TABLE public.study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create study_session_participants table
CREATE TABLE public.study_session_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.study_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  left_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(session_id, user_id)
);

-- Create study_session_messages table
CREATE TABLE public.study_session_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.study_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_session_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for friendships
CREATE POLICY "Users can view their own friendships"
  ON public.friendships FOR SELECT
  USING (user_id = auth.uid() OR friend_id = auth.uid());

CREATE POLICY "Users can create friendships"
  ON public.friendships FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own friendships"
  ON public.friendships FOR DELETE
  USING (user_id = auth.uid() OR friend_id = auth.uid());

-- RLS Policies for friend_requests
CREATE POLICY "Users can view their sent or received requests"
  ON public.friend_requests FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send friend requests"
  ON public.friend_requests FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update requests they received"
  ON public.friend_requests FOR UPDATE
  USING (receiver_id = auth.uid());

CREATE POLICY "Users can delete requests they sent"
  ON public.friend_requests FOR DELETE
  USING (sender_id = auth.uid());

-- RLS Policies for study_sessions
CREATE POLICY "Users can view sessions they're part of"
  ON public.study_sessions FOR SELECT
  USING (
    host_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.study_session_participants 
      WHERE session_id = id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create study sessions"
  ON public.study_sessions FOR INSERT
  WITH CHECK (host_id = auth.uid());

CREATE POLICY "Hosts can update their sessions"
  ON public.study_sessions FOR UPDATE
  USING (host_id = auth.uid());

-- RLS Policies for study_session_participants
CREATE POLICY "Users can view participants in their sessions"
  ON public.study_session_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.study_sessions 
      WHERE id = session_id AND (
        host_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.study_session_participants p2
          WHERE p2.session_id = id AND p2.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can join study sessions"
  ON public.study_session_participants FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their participation"
  ON public.study_session_participants FOR UPDATE
  USING (user_id = auth.uid());

-- RLS Policies for study_session_messages
CREATE POLICY "Users can view messages in their sessions"
  ON public.study_session_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.study_session_participants 
      WHERE session_id = study_session_messages.session_id 
      AND user_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "Users can send messages in their sessions"
  ON public.study_session_messages FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.study_session_participants 
      WHERE session_id = study_session_messages.session_id 
      AND user_id = auth.uid()
      AND is_active = true
    )
  );

-- Enable realtime for study session messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_session_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_session_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_requests;

-- Trigger to update updated_at
CREATE TRIGGER update_friend_requests_updated_at
  BEFORE UPDATE ON public.friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();