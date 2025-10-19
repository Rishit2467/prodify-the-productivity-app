import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { User, Loader2 } from "lucide-react";

interface ProfileSettingsProps {
  userId: string;
}

const ProfileSettings = ({ userId }: ProfileSettingsProps) => {
  const [username, setUsername] = useState("");
  const [currentUsername, setCurrentUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    setFetching(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } else if (data) {
      setCurrentUsername(data.username || "");
      setUsername(data.username || "");
    }
    setFetching(false);
  };

  const handleUpdateUsername = async () => {
    if (!username.trim()) {
      toast.error("Username cannot be empty");
      return;
    }

    if (username.trim().length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }

    if (username.trim().length > 20) {
      toast.error("Username must be less than 20 characters");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      toast.error("Username can only contain letters, numbers, and underscores");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ username: username.trim() })
        .eq("id", userId);

      if (error) {
        if (error.code === "23505") {
          toast.error("Username already taken");
        } else {
          toast.error("Failed to update username");
          console.error(error);
        }
      } else {
        toast.success("Username updated successfully!");
        setCurrentUsername(username.trim());
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      <div className="flex items-center gap-2 pb-4 border-b border-border">
        <User className="h-5 w-5" />
        <h2 className="text-xl font-bold">Profile Settings</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Username</CardTitle>
          <CardDescription>
            Your username is how other users can find and add you as a friend
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentUsername && (
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">Current username</p>
              <p className="font-medium">{currentUsername}</p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="username">New Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="your_username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              minLength={3}
              maxLength={20}
            />
            <p className="text-xs text-muted-foreground">
              3-20 characters, letters, numbers, and underscores only
            </p>
          </div>

          <Button 
            onClick={handleUpdateUsername} 
            disabled={loading || username.trim() === currentUsername}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Username"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSettings;
