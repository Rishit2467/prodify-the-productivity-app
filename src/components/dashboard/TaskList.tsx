import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: string;
}

const TaskList = ({ userId }: { userId: string }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  useEffect(() => {
    fetchTasks();

    const channel = supabase
      .channel("tasks_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tasks:", error);
      return;
    }

    setTasks(data || []);
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;

    const { error } = await supabase.from("tasks").insert({
      user_id: userId,
      title: newTaskTitle,
      priority: "medium",
    });

    if (error) {
      toast.error("Failed to add task");
      return;
    }

    setNewTaskTitle("");
    toast.success("Task added!");
  };

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    const { error } = await supabase
      .from("tasks")
      .update({
        completed: !completed,
        completed_at: !completed ? new Date().toISOString() : null,
      })
      .eq("id", taskId);

    if (error) {
      toast.error("Failed to update task");
      return;
    }

    if (!completed) {
      // Award XP for completing task
      const { data: currentStats } = await supabase
        .from("user_stats")
        .select("xp, gems, level, total_tasks_completed")
        .eq("user_id", userId)
        .single();

      if (currentStats) {
        const newXp = currentStats.xp + 10;
        const newLevel = Math.floor(newXp / 100) + 1;

        await supabase
          .from("user_stats")
          .update({
            xp: newXp,
            level: newLevel,
            gems: currentStats.gems + 2,
            total_tasks_completed: currentStats.total_tasks_completed + 1,
          })
          .eq("user_id", userId);

        toast.success("Task completed! +10 XP, +2 Gems");
      }
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);

    if (error) {
      toast.error("Failed to delete task");
      return;
    }

    toast.success("Task deleted");
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle>Tasks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Add a new task..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
          />
          <Button onClick={handleAddTask}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {tasks.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No tasks yet. Add one to get started!
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => handleToggleTask(task.id, task.completed)}
                />
                <span
                  className={`flex-1 ${
                    task.completed ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {task.title}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteTask(task.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskList;
