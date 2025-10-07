import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Zap, Target, Flame } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface UserStats {
  xp: number;
  level: number;
  gems: number;
  current_streak: number;
  total_focus_time: number;
  total_tasks_completed: number;
}

const StatsOverview = ({ userId }: { userId: string }) => {
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      const { data, error } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        console.error("Error fetching stats:", error);
        return;
      }

      setStats(data);
    };

    fetchStats();

    const channel = supabase
      .channel("stats_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_stats",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (!stats) return null;

  const xpForNextLevel = stats.level * 100;
  const xpProgress = (stats.xp % 100) / xpForNextLevel * 100;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="border-primary/20 bg-gradient-card shadow-glow">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-3xl font-bold text-primary">
                Level {stats.level}
              </div>
              <div className="text-sm text-muted-foreground">
                {stats.xp % 100}/{xpForNextLevel} XP
              </div>
            </div>
            <Trophy className="h-10 w-10 text-primary" />
          </div>
          <Progress value={xpProgress} className="h-2" />
        </CardContent>
      </Card>

      <Card className="border-accent/20 bg-gradient-card">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-accent">{stats.gems}</div>
              <div className="text-sm text-muted-foreground">Focus Gems</div>
            </div>
            <Zap className="h-10 w-10 text-accent" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-success/20 bg-gradient-card">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-success">
                {stats.total_tasks_completed}
              </div>
              <div className="text-sm text-muted-foreground">Tasks Done</div>
            </div>
            <Target className="h-10 w-10 text-success" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-warning/20 bg-gradient-card">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-warning">
                {stats.current_streak}🔥
              </div>
              <div className="text-sm text-muted-foreground">Day Streak</div>
            </div>
            <Flame className="h-10 w-10 text-warning" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsOverview;
