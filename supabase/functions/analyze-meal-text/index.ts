import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mealDescription } = await req.json();
    
    if (!mealDescription) {
      throw new Error("No meal description provided");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: "You are a professional nutritionist. Parse meal descriptions and provide accurate nutritional estimates."
          },
          { 
            role: "user", 
            content: `Analyze this meal description and provide nutritional information: "${mealDescription}"`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "parse_meal",
            description: "Parse meal description and provide nutritional estimates",
            parameters: {
              type: "object",
              properties: {
                meal_name: { type: "string" },
                food_items: { 
                  type: "array",
                  items: { type: "string" }
                },
                estimated_calories: { type: "number" },
                protein: { type: "number", description: "in grams" },
                carbs: { type: "number", description: "in grams" },
                fats: { type: "number", description: "in grams" },
                meal_type: { 
                  type: "string",
                  enum: ["breakfast", "lunch", "dinner", "snack"],
                  description: "best guess for meal type"
                }
              },
              required: ["meal_name", "food_items", "estimated_calories", "protein", "carbs", "fats", "meal_type"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "parse_meal" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to analyze meal");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No analysis generated");
    }

    const mealData = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ meal: mealData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-meal-text:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
