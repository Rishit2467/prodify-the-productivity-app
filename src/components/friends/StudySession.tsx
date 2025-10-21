import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Video, MessageSquare, LogOut, Send, Users } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Message {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  profiles?: { username: string };
}

interface Participant {
  id: string;
  user_id: string;
  is_active: boolean;
  profiles?: { username: string };
}

interface Friend {
  id: string;
  username: string;
}

interface StudySessionProps {
  userId: string;
}

const StudySession = ({ userId }: StudySessionProps) => {
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [sessionName, setSessionName] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<string>("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkActiveSession();
    fetchFriends();
  }, [userId]);

  useEffect(() => {
    if (activeSession) {
      fetchMessages();
      fetchParticipants();

      // Subscribe to real-time messages
      const messagesChannel = supabase
        .channel(`session-messages-${activeSession}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'study_session_messages',
          filter: `session_id=eq.${activeSession}`
        }, (payload) => {
          fetchMessages();
        })
        .subscribe();

      // Subscribe to participant changes
      const participantsChannel = supabase
        .channel(`session-participants-${activeSession}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'study_session_participants',
          filter: `session_id=eq.${activeSession}`
        }, () => {
          fetchParticipants();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(messagesChannel);
        supabase.removeChannel(participantsChannel);
      };
    }
  }, [activeSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchFriends = async () => {
    const { data: friendships } = await supabase
      .from('friendships')
      .select('friend_id')
      .eq('user_id', userId);

    if (!friendships || friendships.length === 0) {
      setFriends([]);
      return;
    }

    const friendIds = friendships.map(f => f.friend_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', friendIds);

    setFriends(profiles || []);
  };

  const checkActiveSession = async () => {
    const { data } = await supabase
      .from('study_session_participants')
      .select('session_id, study_sessions(is_active)')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (data && data.study_sessions?.is_active) {
      setActiveSession(data.session_id);
    }
  };

  const createSession = async () => {
    if (!sessionName.trim()) {
      toast.error("Please enter a session name");
      return;
    }

    const { data: session, error: sessionError } = await supabase
      .from('study_sessions')
      .insert({
        host_id: userId,
        name: sessionName,
        is_active: true
      })
      .select()
      .single();

    if (sessionError || !session) {
      toast.error("Failed to create session");
      return;
    }

    const { error: participantError } = await supabase
      .from('study_session_participants')
      .insert({
        session_id: session.id,
        user_id: userId,
        is_active: true
      });

    if (participantError) {
      toast.error("Failed to join session");
      return;
    }

    // Invite friend if selected
    if (selectedFriend) {
      await inviteFriendToSession(session.id, selectedFriend);
    }

    setActiveSession(session.id);
    setSessionName("");
    setSelectedFriend("");
    setShowCreateDialog(false);
    toast.success("Study session created!");
  };

  const inviteFriendToSession = async (sessionId: string, friendId: string) => {
    const { error } = await supabase
      .from('study_session_participants')
      .insert({
        session_id: sessionId,
        user_id: friendId,
        is_active: true
      });

    if (!error) {
      toast.success("Friend invited to session!");
    }
  };

  const leaveSession = async () => {
    if (!activeSession) return;

    const { error } = await supabase
      .from('study_session_participants')
      .update({ is_active: false, left_at: new Date().toISOString() })
      .eq('session_id', activeSession)
      .eq('user_id', userId);

    if (error) {
      toast.error("Failed to leave session");
    } else {
      setActiveSession(null);
      setMessages([]);
      setParticipants([]);
      toast.success("Left study session");
    }
  };

  const fetchMessages = async () => {
    if (!activeSession) return;

    const { data: messages } = await supabase
      .from('study_session_messages')
      .select('*')
      .eq('session_id', activeSession)
      .order('created_at', { ascending: true });

    if (messages && messages.length > 0) {
      const userIds = [...new Set(messages.map(m => m.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds);

      const messagesWithProfiles = messages.map(msg => ({
        ...msg,
        profiles: profiles?.find(p => p.id === msg.user_id)
      }));
      setMessages(messagesWithProfiles as Message[]);
    } else {
      setMessages([]);
    }
  };

  const fetchParticipants = async () => {
    if (!activeSession) return;

    const { data: participants } = await supabase
      .from('study_session_participants')
      .select('*')
      .eq('session_id', activeSession)
      .eq('is_active', true);

    if (participants && participants.length > 0) {
      const userIds = participants.map(p => p.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds);

      const participantsWithProfiles = participants.map(part => ({
        ...part,
        profiles: profiles?.find(p => p.id === part.user_id)
      }));
      setParticipants(participantsWithProfiles as Participant[]);
    } else {
      setParticipants([]);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeSession) return;

    const { error } = await supabase
      .from('study_session_messages')
      .insert({
        session_id: activeSession,
        user_id: userId,
        message: newMessage
      });

    if (error) {
      toast.error("Failed to send message");
    } else {
      setNewMessage("");
    }
  };

  if (!activeSession) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Video className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-bold mb-2">Study with Friends</h3>
        <p className="text-muted-foreground mb-6">
          Create a study session and invite friends to focus together
        </p>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>Start Study Session</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Study Session</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Session Name</label>
                <Input
                  placeholder="e.g., Math Study Group"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                />
              </div>
              
              {friends.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Invite Friend (Optional)</label>
                  <Select value={selectedFriend} onValueChange={setSelectedFriend}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a friend" />
                    </SelectTrigger>
                    <SelectContent>
                      {friends.map((friend) => (
                        <SelectItem key={friend.id} value={friend.id}>
                          {friend.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <Button onClick={createSession} className="w-full">
                Create Session
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Study Session</h2>
          <div className="flex items-center gap-2 mt-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {participants.length} {participants.length === 1 ? 'participant' : 'participants'}
            </span>
          </div>
        </div>
        <Button variant="destructive" size="sm" onClick={leaveSession}>
          <LogOut className="h-4 w-4 mr-2" />
          Leave
        </Button>
      </div>

      <div className="p-4 border-b border-border">
        <div className="flex flex-wrap gap-2">
          {participants.map((participant) => (
            <Badge key={participant.id} variant="secondary">
              {participant.profiles?.username}
            </Badge>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.user_id === userId ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.user_id === userId
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {message.user_id !== userId && (
                  <p className="text-xs font-semibold mb-1 opacity-70">
                    {message.profiles?.username}
                  </p>
                )}
                <p className="text-sm">{message.message}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          />
          <Button onClick={sendMessage} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StudySession;
