import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Trophy, Target, Sparkles } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <nav className="flex justify-between items-center mb-16">
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Prodify
          </h1>
          <Button onClick={() => navigate("/auth")}>Get Started</Button>
        </nav>

        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20 mb-4">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Gamified Productivity
            </span>
          </div>

          <h2 className="text-6xl md:text-7xl font-bold leading-tight">
            Turn Your Tasks Into
            <span className="block bg-gradient-primary bg-clip-text text-transparent">
              An Epic Quest
            </span>
          </h2>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Level up your productivity with Prodify. Earn XP, complete daily quests, 
            build focus streaks, and watch your productivity soar through gamification.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" onClick={() => navigate("/auth")} className="text-lg">
              Start Your Journey
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
              View Demo
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-24 max-w-5xl mx-auto">
          <div className="p-6 rounded-xl bg-card border border-primary/20 hover:shadow-glow transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Pomodoro Timer</h3>
            <p className="text-muted-foreground">
              Stay focused with built-in Pomodoro sessions. Track your focus time and 
              earn rewards for every completed session.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-card border border-accent/20 hover:shadow-accent-glow transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
              <Trophy className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-xl font-bold mb-2">Level System</h3>
            <p className="text-muted-foreground">
              Earn XP and level up your avatar. Unlock achievements and collect Focus Gems 
              as you complete tasks and maintain streaks.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-card border border-success/20 hover:shadow-glow transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center mb-4">
              <Target className="h-6 w-6 text-success" />
            </div>
            <h3 className="text-xl font-bold mb-2">Daily Quests</h3>
            <p className="text-muted-foreground">
              Complete daily challenges and project quests. Build habits through 
              engaging gamification mechanics.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 text-center space-y-6 p-12 rounded-2xl bg-gradient-card border border-primary/20">
          <h3 className="text-3xl font-bold">Ready to Level Up?</h3>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Join thousands of users who have transformed their productivity into an exciting adventure.
          </p>
          <Button size="lg" onClick={() => navigate("/auth")} className="text-lg">
            Get Started Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
