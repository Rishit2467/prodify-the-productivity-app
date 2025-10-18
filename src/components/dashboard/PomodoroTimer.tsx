import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Play, Pause, RotateCcw, Coffee } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PomodoroTimer = ({ userId }: { userId: string }) => {
  const [focusTime, setFocusTime] = useState(25);
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive && (minutes > 0 || seconds > 0)) {
      intervalRef.current = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            handleTimerComplete();
          } else {
            setMinutes(minutes - 1);
            setSeconds(59);
          }
        } else {
          setSeconds(seconds - 1);
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, minutes, seconds]);

  const handleTimerComplete = async () => {
    setIsActive(false);
    
    if (!isBreak && sessionId) {
      // Complete pomodoro session
      const { error } = await supabase
        .from("pomodoro_sessions")
        .update({
          completed: true,
          ended_at: new Date().toISOString(),
        })
        .eq("id", sessionId);

      if (!error) {
        // Award XP and gems
        const { data: currentStats } = await supabase
          .from("user_stats")
          .select("xp, gems, level, total_focus_time, current_streak, last_activity_date")
          .eq("user_id", userId)
          .single();

        if (currentStats) {
          const newXp = currentStats.xp + 25;
          const newLevel = Math.floor(newXp / 100) + 1;
          const today = new Date().toISOString().split('T')[0];
          const lastActivity = currentStats.last_activity_date;
          
          let newStreak = currentStats.current_streak;
          if (lastActivity !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            
            if (lastActivity === yesterdayStr) {
              newStreak += 1;
            } else {
              newStreak = 1;
            }
          }

          await supabase
            .from("user_stats")
            .update({
              xp: newXp,
              level: newLevel,
              gems: currentStats.gems + 5,
              total_focus_time: currentStats.total_focus_time + focusTime,
              current_streak: newStreak,
              last_activity_date: today,
            })
            .eq("user_id", userId);
        }

        toast.success("Pomodoro complete! +25 XP, +5 Gems");
      }
    }

    // Switch between work and break
    if (isBreak) {
      setMinutes(focusTime);
      setIsBreak(false);
      toast.success("Break over! Ready for another session?");
    } else {
      setMinutes(5);
      setIsBreak(true);
      toast.success("Time for a break!");
    }
    setSeconds(0);
  };

  const handleStart = async () => {
    if (!isActive && !isBreak) {
      // Create new pomodoro session
      const { data, error } = await supabase
        .from("pomodoro_sessions")
        .insert({
          user_id: userId,
          duration: focusTime,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        toast.error("Failed to start session");
        return;
      }

      setSessionId(data.id);
    }
    setIsActive(true);
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleReset = () => {
    setIsActive(false);
    setMinutes(isBreak ? 5 : focusTime);
    setSeconds(0);
  };

  const progress = isBreak 
    ? ((5 - minutes) * 60 + (60 - seconds)) / 300 * 100
    : ((focusTime - minutes) * 60 + (60 - seconds)) / (focusTime * 60) * 100;

  return (
    <Card className="border-primary/20 shadow-glow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isBreak ? (
            <>
              <Coffee className="h-5 w-5 text-success" />
              Break Time
            </>
          ) : (
            <>
              <Play className="h-5 w-5 text-primary" />
              Focus Session
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isActive && !isBreak && (
          <div className="space-y-2">
            <Label htmlFor="focus-time">Focus Time: {focusTime} minutes</Label>
            <Slider
              id="focus-time"
              min={5}
              max={60}
              step={5}
              value={[focusTime]}
              onValueChange={(value) => {
                setFocusTime(value[0]);
                setMinutes(value[0]);
              }}
            />
          </div>
        )}
        
        <div className="relative">
          <svg className="w-full h-64" viewBox="0 0 200 200">
            {/* Background circle */}
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="8"
            />
            {/* Progress circle */}
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke={isBreak ? "hsl(var(--success))" : "hsl(var(--primary))"}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 80}`}
              strokeDashoffset={`${2 * Math.PI * 80 * (1 - progress / 100)}`}
              transform="rotate(-90 100 100)"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl font-bold">
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                {isBreak ? "Break" : "Focus"}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-center">
          {!isActive ? (
            <Button onClick={handleStart} className="px-8">
              <Play className="h-4 w-4 mr-2" />
              Start
            </Button>
          ) : (
            <Button onClick={handlePause} variant="secondary" className="px-8">
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
          )}
          <Button onClick={handleReset} variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PomodoroTimer;
