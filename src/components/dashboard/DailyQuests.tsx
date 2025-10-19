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

    const questsChannel = supabase
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
          autoCompleteQuests();
        }
      )
      .subscribe();

    const autoChannel = supabase
      .channel("quests_auto")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `user_id=eq.${userId}` },
        () => autoCompleteQuests()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pomodoro_sessions", filter: `user_id=eq.${userId}` },
        () => autoCompleteQuests()
      )
      .subscribe();

    // Initial auto check
    autoCompleteQuests();

    return () => {
      supabase.removeChannel(questsChannel);
      supabase.removeChannel(autoChannel);
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

  const autoCompleteQuests = async () => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    const todayStr = now.toISOString().split("T")[0];

    const { data: todayQuests } = await supabase
      .from("daily_quests")
      .select("*")
      .eq("user_id", userId)
      .eq("quest_date", todayStr);

    if (!todayQuests || todayQuests.length === 0) return;

    const { data: completedTasks } = await supabase
      .from("tasks")
      .select("id")
      .eq("user_id", userId)
      .eq("completed", true)
      .gte("completed_at", start.toISOString())
      .lte("completed_at", end.toISOString());

    const taskCount = completedTasks?.length || 0;

    const { data: completedSessions } = await supabase
      .from("pomodoro_sessions")
      .select("id")
      .eq("user_id", userId)
      .eq("completed", true)
      .gte("ended_at", start.toISOString())
      .lte("ended_at", end.toISOString());

    const sessionCount = completedSessions?.length || 0;

    const { data: stats } = await supabase
      .from("user_stats")
      .select("last_activity_date")
      .eq("user_id", userId)
      .maybeSingle();

    const streakActive = stats?.last_activity_date === todayStr || taskCount > 0 || sessionCount > 0;

    const updates: Promise<any>[] = [];
    for (const q of todayQuests) {
      if (q.completed) continue;
      if (q.title.includes("Complete 3 Tasks") && taskCount >= 3) {
        updates.push(handleCompleteQuest(q.id, q.xp_reward, q.gem_reward));
      } else if (q.title.includes("Focus for 50 Minutes") && sessionCount >= 2) {
        updates.push(handleCompleteQuest(q.id, q.xp_reward, q.gem_reward));
      } else if (q.title.includes("Maintain Your Streak") && streakActive) {
        updates.push(handleCompleteQuest(q.id, q.xp_reward, q.gem_reward));
      }
    }

    if (updates.length) {
      await Promise.all(updates);
    }
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
                disabled
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
