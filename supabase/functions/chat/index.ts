import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, type, userId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    console.log("Calling Lovable AI with", messages.length, "messages, type:", type);

    let systemPrompt = "You are a helpful productivity assistant for Prodify. Help users with task management, time management, study techniques, and motivation. Keep responses concise and actionable.";
    const body: any = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
    };

    // Handle different request types with tool calling
    if (type === "create_task") {
      body.tools = [
        {
          type: "function",
          function: {
            name: "create_task",
            description: "Extract task details from natural language input",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", description: "The task title" },
                description: { type: "string", description: "Task description or details" },
                priority: { type: "string", enum: ["low", "medium", "high"], description: "Task priority" },
                category: { type: "string", description: "Task category or project" },
                due_date: { type: "string", description: "Due date in ISO format (YYYY-MM-DDTHH:MM:SS)" },
                estimated_time: { type: "number", description: "Estimated time in minutes" }
              },
              required: ["title"],
              additionalProperties: false
            }
          }
        }
      ];
      body.tool_choice = { type: "function", function: { name: "create_task" } };
    } else if (type === "prioritize") {
      // Fetch user's tasks
      const { data: tasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .eq("completed", false)
        .order("created_at", { ascending: false });

      systemPrompt = `You are analyzing tasks for prioritization. Here are the user's current tasks: ${JSON.stringify(tasks)}. 
      
      Analyze them based on:
      - Deadlines and due dates
      - Priority levels
      - Estimated time
      - Categories
      
      Suggest the top 3 most important tasks to work on now and explain why.`;
      body.messages[0].content = systemPrompt;
    } else if (type === "decompose") {
      body.tools = [
        {
          type: "function",
          function: {
            name: "decompose_task",
            description: "Break down a large task into smaller subtasks",
            parameters: {
              type: "object",
              properties: {
                subtasks: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      priority: { type: "string", enum: ["low", "medium", "high"] },
                      estimated_time: { type: "number" }
                    },
                    required: ["title"],
                    additionalProperties: false
                  }
                },
                explanation: { type: "string", description: "Brief explanation of how the task was broken down" }
              },
              required: ["subtasks"],
              additionalProperties: false
            }
          }
        }
      ];
      body.tool_choice = { type: "function", function: { name: "decompose_task" } };
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }), 
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), 
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }), 
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    console.log("AI response received", data);

    // Handle tool calls
    if (data.choices[0].message.tool_calls) {
      const toolCall = data.choices[0].message.tool_calls[0];
      const functionName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);

      console.log("Tool call:", functionName, args);

      if (functionName === "create_task" && userId) {
        // Create the task in the database
        const { error } = await supabase.from("tasks").insert({
          user_id: userId,
          title: args.title,
          description: args.description || null,
          priority: args.priority || "medium",
          category: args.category || null,
          due_date: args.due_date || null,
          estimated_time: args.estimated_time || null,
        });

        if (error) {
          console.error("Error creating task:", error);
          return new Response(
            JSON.stringify({ error: "Failed to create task", details: error }), 
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Task created successfully!",
            task: args 
          }), 
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } else if (functionName === "decompose_task" && userId) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            subtasks: args.subtasks,
            explanation: args.explanation 
          }), 
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
