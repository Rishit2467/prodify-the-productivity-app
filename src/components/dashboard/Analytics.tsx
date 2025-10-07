import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Session {
  started_at: string;
  duration: number;
  completed: boolean;
}

const Analytics = ({ userId }: { userId: string }) => {
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    fetchSessions();

    const channel = supabase
      .channel("sessions_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pomodoro_sessions",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchSessions = async () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await supabase
      .from("pomodoro_sessions")
      .select("started_at, duration, completed")
      .eq("user_id", userId)
      .gte("started_at", sevenDaysAgo.toISOString())
      .order("started_at", { ascending: true });

    if (error) {
      console.error("Error fetching sessions:", error);
      return;
    }

    // Group by day
    const sessionsByDay: { [key: string]: number } = {};
    data?.forEach((session: Session) => {
      const day = new Date(session.started_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      sessionsByDay[day] = (sessionsByDay[day] || 0) + (session.completed ? session.duration : 0);
    });

    const formattedData = Object.entries(sessionsByDay).map(([day, minutes]) => ({
      day,
      minutes,
    }));

    setChartData(formattedData);
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle>Focus Time (Last 7 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="day"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              label={{ value: "Minutes", angle: -90, position: "insideLeft" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
            />
            <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default Analytics;
