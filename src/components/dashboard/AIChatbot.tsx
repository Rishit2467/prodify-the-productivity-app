import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Plus, ListChecks, Workflow, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface Subtask {
  title: string;
  description?: string;
  priority: string;
  estimated_time?: number;
}

const AIChatbot = ({ userId }: { userId: string }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"chat" | "create_task" | "prioritize" | "decompose">("chat");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: { 
          messages: [...messages, userMessage],
          type: mode,
          userId 
        },
      });

      if (error) {
        console.error("Chat error:", error);
        if (error.message?.includes("429")) {
          toast.error("Rate limit exceeded. Please try again later.");
        } else if (error.message?.includes("402")) {
          toast.error("AI service requires payment. Please contact support.");
        } else {
          toast.error("Failed to get response from AI assistant");
        }
        return;
      }

      // Handle task creation response
      if (data.success && mode === "create_task") {
        toast.success(data.message);
        const assistantMessage: Message = {
          role: "assistant",
          content: `✅ Task created: **${data.task.title}**\n${data.task.description ? `\nDescription: ${data.task.description}` : ""}\nPriority: ${data.task.priority || "medium"}${data.task.due_date ? `\nDue: ${new Date(data.task.due_date).toLocaleString()}` : ""}`,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setMode("chat");
      } 
      // Handle task decomposition response
      else if (data.success && mode === "decompose") {
        const subtasksList = data.subtasks.map((st: Subtask, i: number) => 
          `${i + 1}. **${st.title}**${st.description ? `\n   ${st.description}` : ""}${st.estimated_time ? `\n   ⏱️ ${st.estimated_time} mins` : ""}`
        ).join("\n\n");
        
        const assistantMessage: Message = {
          role: "assistant",
          content: `🔨 Task Breakdown:\n\n${subtasksList}\n\n${data.explanation || ""}`,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        
        // Offer to create these subtasks
        const offerMessage: Message = {
          role: "system",
          content: "Would you like me to add these as separate tasks? (Reply 'yes' to create them)",
        };
        setMessages((prev) => [...prev, offerMessage]);
        setMode("chat");
      }
      // Handle regular chat response
      else if (data.choices) {
        const assistantMessage: Message = {
          role: "assistant",
          content: data.choices[0].message.content,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: "create_task" | "prioritize" | "decompose") => {
    setMode(action);
    let systemMessage = "";
    
    if (action === "create_task") {
      systemMessage = "📝 Tell me what task you'd like to add. You can include details like due date, priority, and category.";
    } else if (action === "prioritize") {
      systemMessage = "🎯 Let me analyze your tasks and suggest what you should work on next...";
      // Auto-send for prioritization
      setTimeout(() => {
        handleSend();
      }, 100);
    } else if (action === "decompose") {
      systemMessage = "🔨 Tell me about the large task you want to break down into smaller steps.";
    }
    
    if (systemMessage) {
      setMessages((prev) => [...prev, { role: "system", content: systemMessage }]);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">AI Task Assistant</h2>
          </div>
          {mode !== "chat" && (
            <Badge variant="secondary">{mode.replace("_", " ")}</Badge>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {messages.length === 0 && (
        <div className="p-4 space-y-2 border-b border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction("create_task")}
            className="w-full flex items-center gap-2 justify-start"
          >
            <Plus className="h-4 w-4" />
            Create Task
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction("prioritize")}
            className="w-full flex items-center gap-2 justify-start"
          >
            <ListChecks className="h-4 w-4" />
            What's Next?
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction("decompose")}
            className="w-full flex items-center gap-2 justify-start"
          >
            <Workflow className="h-4 w-4" />
            Break Down Task
          </Button>
        </div>
      )}

      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="mb-4">Hi! I'm your AI task assistant.</p>
              <p className="text-sm">I can help you:</p>
              <ul className="text-sm mt-2 space-y-1">
                <li>📝 Create tasks from natural language</li>
                <li>🎯 Prioritize what to work on next</li>
                <li>🔨 Break down complex tasks</li>
              </ul>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {(message.role === "assistant" || message.role === "system") && (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`rounded-lg px-4 py-2 max-w-[80%] ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : message.role === "system"
                      ? "bg-accent/50"
                      : "bg-secondary"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === "user" && (
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-primary animate-pulse" />
              </div>
              <div className="rounded-lg px-4 py-2 bg-secondary">
                <p className="text-sm flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Thinking...
                </p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-border space-y-2">
        {mode !== "chat" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMode("chat")}
            className="text-xs"
          >
            Cancel {mode.replace("_", " ")}
          </Button>
        )}
        <div className="flex gap-2">
          <Input
            placeholder={
              mode === "create_task"
                ? "Describe your task..."
                : mode === "decompose"
                ? "Describe the task to break down..."
                : "Ask me anything..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={isLoading}
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()} size="icon">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIChatbot;
