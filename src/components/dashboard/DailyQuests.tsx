import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Quest {
  id: string;
  title: string;
  description: string;
  xp_reward: number;
  gem_reward: number;
  completed: boolean;
}

const DailyQuests = ({ userId }: { userId: string }) => {
  const [quests, setQuests] = useState<Quest[]>([]);

  useEffect(() => {
    initializeDailyQuests();

    const channel = supabase
      .channel("quests_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "daily_quests",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchQuests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const initializeDailyQuests = async () => {
    const today = new Date().toISOString().split("T")[0];

    // Check if quests exist for today
    const { data: existing } = await supabase
      .from("daily_quests")
      .select("*")
      .eq("user_id", userId)
      .eq("quest_date", today);

    if (!existing || existing.length === 0) {
      // Create new daily quests
      const defaultQuests = [
        {
          user_id: userId,
          title: "Complete 3 Tasks",
          description: "Finish at least 3 tasks from your list",
          xp_reward: 15,
          gem_reward: 10,
          quest_date: today,
        },
        {
          user_id: userId,
          title: "Focus for 50 Minutes",
          description: "Complete 2 Pomodoro sessions",
          xp_reward: 20,
          gem_reward: 15,
          quest_date: today,
        },
        {
          user_id: userId,
          title: "Maintain Your Streak",
          description: "Log in and complete at least one activity",
          xp_reward: 10,
          gem_reward: 5,
          quest_date: today,
        },
      ];

      await supabase.from("daily_quests").insert(defaultQuests);
    }

    fetchQuests();
  };

  const fetchQuests = async () => {
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("daily_quests")
      .select("*")
      .eq("user_id", userId)
      .eq("quest_date", today)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching quests:", error);
      return;
    }

    setQuests(data || []);
  };

  const handleCompleteQuest = async (questId: string, xpReward: number, gemReward: number) => {
    const { error } = await supabase
      .from("daily_quests")
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq("id", questId);

    if (error) {
      toast.error("Failed to complete quest");
      return;
    }

    // Award XP and gems
    const { data: currentStats } = await supabase
      .from("user_stats")
      .select("xp, gems, level")
      .eq("user_id", userId)
      .single();

    if (currentStats) {
      const newXp = currentStats.xp + xpReward;
      const newLevel = Math.floor(newXp / 100) + 1;

      await supabase
        .from("user_stats")
        .update({
          xp: newXp,
          level: newLevel,
          gems: currentStats.gems + gemReward,
        })
        .eq("user_id", userId);

      toast.success(`Quest completed! +${xpReward} XP, +${gemReward} Gems`);
    }
  };

  return (
    <Card className="border-accent/20 shadow-accent-glow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          Daily Quests
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {quests.map((quest) => (
          <div
            key={quest.id}
            className="p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
          >
            <div className="flex items-start gap-3">
              <Checkbox
                checked={quest.completed}
                onCheckedChange={() =>
                  !quest.completed && handleCompleteQuest(quest.id, quest.xp_reward, quest.gem_reward)
                }
                disabled={quest.completed}
              />
              <div className="flex-1">
                <div
                  className={`font-medium ${
                    quest.completed ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {quest.title}
                </div>
                <div className="text-sm text-muted-foreground">{quest.description}</div>
                <div className="flex gap-3 mt-2 text-sm">
                  <span className="text-primary">+{quest.xp_reward} XP</span>
                  <span className="text-accent">+{quest.gem_reward} Gems</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default DailyQuests;
