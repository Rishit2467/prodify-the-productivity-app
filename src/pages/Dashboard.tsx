import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import StatsOverview from "@/components/dashboard/StatsOverview";
import PomodoroTimer from "@/components/dashboard/PomodoroTimer";
import TaskList from "@/components/dashboard/TaskList";
import Analytics from "@/components/dashboard/Analytics";
import DailyQuests from "@/components/dashboard/DailyQuests";
import AIChatbot from "@/components/dashboard/AIChatbot";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);
      setLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Prodify
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Overview */}
        <StatsOverview userId={user?.id || ""} />

        {/* Pomodoro Timer & Daily Quests */}
        <div className="grid lg:grid-cols-2 gap-6">
          <PomodoroTimer userId={user?.id || ""} />
          <DailyQuests userId={user?.id || ""} />
        </div>

        {/* Task List & Analytics */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TaskList userId={user?.id || ""} />
          </div>
          <div>
            <Analytics userId={user?.id || ""} />
          </div>
        </div>

        {/* AI Chatbot */}
        <div className="max-w-4xl mx-auto">
          <AIChatbot />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
