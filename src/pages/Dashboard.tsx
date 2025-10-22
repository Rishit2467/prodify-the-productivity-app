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
import FriendsPanel from "@/components/friends/FriendsPanel";
import StudySession from "@/components/friends/StudySession";
import ProfileSettings from "@/components/dashboard/ProfileSettings";
import FocusStore from "@/components/dashboard/FocusStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    <div className="min-h-screen bg-background flex flex-col">
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

      {/* Main Layout with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-6 space-y-6">
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
          </div>
        </main>

        {/* Right Sidebar with Tabs */}
        <aside className="w-96 border-l border-border bg-card/30 backdrop-blur flex flex-col">
          <Tabs defaultValue="ai" className="flex-1 flex flex-col">
            <TabsList className="m-4 grid grid-cols-5">
              <TabsTrigger value="ai">AI</TabsTrigger>
              <TabsTrigger value="friends">Friends</TabsTrigger>
              <TabsTrigger value="study">Study</TabsTrigger>
              <TabsTrigger value="store">Store</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
            </TabsList>
            
            <TabsContent value="ai" className="flex-1 mt-0 overflow-hidden">
              <AIChatbot userId={user?.id || ""} />
            </TabsContent>
            
            <TabsContent value="friends" className="flex-1 mt-0 overflow-hidden">
              <FriendsPanel userId={user?.id || ""} />
            </TabsContent>
            
            <TabsContent value="study" className="flex-1 mt-0 overflow-hidden">
              <StudySession userId={user?.id || ""} />
            </TabsContent>

            <TabsContent value="store" className="flex-1 mt-0 overflow-hidden">
              <FocusStore userId={user?.id || ""} />
            </TabsContent>
            
            <TabsContent value="profile" className="flex-1 mt-0 overflow-hidden">
              <ProfileSettings userId={user?.id || ""} />
            </TabsContent>
          </Tabs>
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
