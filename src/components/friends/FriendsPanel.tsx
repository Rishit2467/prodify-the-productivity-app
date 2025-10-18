import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Users, UserPlus, Check, X, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface Friend {
  id: string;
  username: string;
  avatar_url?: string;
}

interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  sender?: { username: string };
  receiver?: { username: string };
}

interface FriendsPanelProps {
  userId: string;
}

const FriendsPanel = ({ userId }: FriendsPanelProps) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFriends();
    fetchFriendRequests();
    
    // Subscribe to real-time friend request updates
    const channel = supabase
      .channel('friend-requests')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'friend_requests'
      }, () => {
        fetchFriendRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchFriends = async () => {
    const { data: friendships, error } = await supabase
      .from('friendships')
      .select('friend_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching friends:', error);
      return;
    }

    if (!friendships || friendships.length === 0) {
      setFriends([]);
      return;
    }

    const friendIds = friendships.map(f => f.friend_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', friendIds);

    setFriends(profiles || []);
  };

  const fetchFriendRequests = async () => {
    // Received requests
    const { data: received } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('receiver_id', userId)
      .eq('status', 'pending');

    // Sent requests
    const { data: sent } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('sender_id', userId)
      .eq('status', 'pending');

    // Fetch sender profiles for received requests
    if (received && received.length > 0) {
      const senderIds = received.map(r => r.sender_id);
      const { data: senderProfiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', senderIds);

      const receivedWithProfiles = received.map(req => ({
        ...req,
        sender: senderProfiles?.find(p => p.id === req.sender_id)
      }));
      setFriendRequests(receivedWithProfiles as FriendRequest[]);
    } else {
      setFriendRequests([]);
    }

    // Fetch receiver profiles for sent requests
    if (sent && sent.length > 0) {
      const receiverIds = sent.map(r => r.receiver_id);
      const { data: receiverProfiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', receiverIds);

      const sentWithProfiles = sent.map(req => ({
        ...req,
        receiver: receiverProfiles?.find(p => p.id === req.receiver_id)
      }));
      setSentRequests(sentWithProfiles as FriendRequest[]);
    } else {
      setSentRequests([]);
    }
  };

  const sendFriendRequest = async () => {
    if (!username.trim()) return;
    
    setLoading(true);
    try {
      // Find user by username
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.trim())
        .single();

      if (profileError || !profile) {
        toast.error("User not found");
        return;
      }

      if (profile.id === userId) {
        toast.error("You cannot add yourself as a friend");
        return;
      }

      // Send friend request
      const { error } = await supabase
        .from('friend_requests')
        .insert({
          sender_id: userId,
          receiver_id: profile.id,
          status: 'pending'
        });

      if (error) {
        if (error.code === '23505') {
          toast.error("Friend request already sent");
        } else {
          toast.error("Failed to send friend request");
        }
      } else {
        toast.success(`Friend request sent to ${username}`);
        setUsername("");
        fetchFriendRequests();
      }
    } finally {
      setLoading(false);
    }
  };

  const acceptFriendRequest = async (requestId: string, senderId: string) => {
    setLoading(true);
    try {
      // Update request status
      const { error: updateError } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Create bidirectional friendships
      const { error: friendship1Error } = await supabase
        .from('friendships')
        .insert({ user_id: userId, friend_id: senderId });

      const { error: friendship2Error } = await supabase
        .from('friendships')
        .insert({ user_id: senderId, friend_id: userId });

      if (friendship1Error || friendship2Error) throw friendship1Error || friendship2Error;

      toast.success("Friend request accepted!");
      fetchFriends();
      fetchFriendRequests();
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast.error("Failed to accept friend request");
    } finally {
      setLoading(false);
    }
  };

  const rejectFriendRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);

    if (error) {
      toast.error("Failed to reject request");
    } else {
      toast.success("Friend request rejected");
      fetchFriendRequests();
    }
  };

  const removeFriend = async (friendId: string) => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`);

    if (error) {
      toast.error("Failed to remove friend");
    } else {
      toast.success("Friend removed");
      fetchFriends();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Friends
        </h2>
      </div>

      <div className="p-4 border-b border-border">
        <div className="flex gap-2">
          <Input
            placeholder="Enter username..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendFriendRequest()}
          />
          <Button onClick={sendFriendRequest} disabled={loading} size="icon">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="friends" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4">
          <TabsTrigger value="friends">
            Friends ({friends.length})
          </TabsTrigger>
          <TabsTrigger value="requests">
            Requests
            {friendRequests.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {friendRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent">
            Sent ({sentRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="flex-1 mt-0">
          <ScrollArea className="h-full p-4">
            {friends.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No friends yet. Add some friends to study together!
              </p>
            ) : (
              <div className="space-y-2">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-card border border-border"
                  >
                    <span className="font-medium">{friend.username}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFriend(friend.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="requests" className="flex-1 mt-0">
          <ScrollArea className="h-full p-4">
            {friendRequests.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No pending requests
              </p>
            ) : (
              <div className="space-y-2">
                {friendRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-card border border-border"
                  >
                    <span className="font-medium">{request.sender?.username}</span>
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => acceptFriendRequest(request.id, request.sender_id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => rejectFriendRequest(request.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="sent" className="flex-1 mt-0">
          <ScrollArea className="h-full p-4">
            {sentRequests.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No sent requests
              </p>
            ) : (
              <div className="space-y-2">
                {sentRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-card border border-border"
                  >
                    <span className="font-medium">{request.receiver?.username}</span>
                    <Badge variant="secondary">Pending</Badge>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FriendsPanel;
