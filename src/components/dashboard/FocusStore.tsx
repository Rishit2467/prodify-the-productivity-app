import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Gem, Flame, Target, Zap, Heart, Star, Trophy, Crown } from "lucide-react";

interface FocusIcon {
  id: string;
  name: string;
  price: number;
  icon: React.ReactNode;
  description: string;
}

interface UserStats {
  gems: number;
  purchased_icons?: string[];
}

interface FocusStoreProps {
  userId: string;
}

const availableIcons: FocusIcon[] = [
  { id: "flame", name: "Flame Focus", price: 50, icon: <Flame className="h-8 w-8" />, description: "Burn through tasks with fiery determination" },
  { id: "target", name: "Bullseye", price: 75, icon: <Target className="h-8 w-8" />, description: "Hit your goals with precision" },
  { id: "zap", name: "Lightning", price: 100, icon: <Zap className="h-8 w-8" />, description: "Electrify your productivity" },
  { id: "heart", name: "Passion", price: 80, icon: <Heart className="h-8 w-8" />, description: "Work with love and dedication" },
  { id: "star", name: "Superstar", price: 120, icon: <Star className="h-8 w-8" />, description: "Shine bright in all your tasks" },
  { id: "trophy", name: "Champion", price: 150, icon: <Trophy className="h-8 w-8" />, description: "Achieve victory in every challenge" },
  { id: "crown", name: "Royalty", price: 200, icon: <Crown className="h-8 w-8" />, description: "Rule your productivity kingdom" },
];

const FocusStore = ({ userId }: FocusStoreProps) => {
  const [userStats, setUserStats] = useState<UserStats>({ gems: 0, purchased_icons: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserStats();
  }, [userId]);

  const fetchUserStats = async () => {
    const { data, error } = await supabase
      .from('user_stats')
      .select('gems, purchased_icons')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user stats:', error);
      toast.error("Failed to load your gems");
    } else {
      setUserStats(data || { gems: 0, purchased_icons: [] });
    }
    setLoading(false);
  };

  const purchaseIcon = async (icon: FocusIcon) => {
    if (userStats.gems < icon.price) {
      toast.error("Not enough gems!");
      return;
    }

    if (userStats.purchased_icons?.includes(icon.id)) {
      toast.error("You already own this icon!");
      return;
    }

    const newPurchasedIcons = [...(userStats.purchased_icons || []), icon.id];
    const newGems = userStats.gems - icon.price;

    const { error } = await supabase
      .from('user_stats')
      .update({
        gems: newGems,
        purchased_icons: newPurchasedIcons
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error purchasing icon:', error);
      toast.error("Failed to purchase icon");
    } else {
      setUserStats({ gems: newGems, purchased_icons: newPurchasedIcons });
      toast.success(`Successfully purchased ${icon.name}!`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-muted-foreground">Loading store...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold">Focus Store</h2>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-full border border-accent/20">
            <Gem className="h-4 w-4 text-accent" />
            <span className="font-bold text-accent">{userStats.gems}</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Customize your focus experience with special icons
        </p>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="grid gap-4">
          {availableIcons.map((icon) => {
            const isPurchased = userStats.purchased_icons?.includes(icon.id);
            const canAfford = userStats.gems >= icon.price;

            return (
              <Card key={icon.id} className="relative overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isPurchased ? 'bg-primary/20 text-primary' : 'bg-muted'}`}>
                        {icon.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{icon.name}</CardTitle>
                        <CardDescription className="mt-1">{icon.description}</CardDescription>
                      </div>
                    </div>
                    {isPurchased && (
                      <Badge variant="secondary" className="bg-success/20 text-success border-success/30">
                        Owned
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Gem className="h-4 w-4 text-accent" />
                      <span className="font-bold text-accent">{icon.price}</span>
                    </div>
                    {!isPurchased && (
                      <Button
                        size="sm"
                        onClick={() => purchaseIcon(icon)}
                        disabled={!canAfford}
                        className={!canAfford ? "opacity-50" : ""}
                      >
                        {canAfford ? "Purchase" : "Not Enough Gems"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default FocusStore;
