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
    const { preferences, dietaryRestrictions, ingredients } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const prompt = `Generate a healthy recipe with the following details:
${preferences ? `Preferences: ${preferences}` : ''}
${dietaryRestrictions ? `Dietary Restrictions: ${dietaryRestrictions}` : ''}
${ingredients ? `Available Ingredients: ${ingredients}` : ''}

Provide a detailed recipe with title, ingredients list, instructions, nutritional information (calories, protein, carbs, fats), prep time, and cook time.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a professional nutritionist and chef. Generate healthy, delicious recipes with accurate nutritional information." },
          { role: "user", content: prompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_recipe",
            description: "Create a detailed recipe with nutritional information",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string" },
                ingredients: { 
                  type: "array",
                  items: { type: "string" }
                },
                instructions: { 
                  type: "array",
                  items: { type: "string" }
                },
                calories: { type: "number" },
                protein: { type: "number" },
                carbs: { type: "number" },
                fats: { type: "number" },
                prep_time: { type: "number", description: "in minutes" },
                cook_time: { type: "number", description: "in minutes" }
              },
              required: ["title", "ingredients", "instructions", "calories", "protein", "carbs", "fats"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "create_recipe" } }
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
      throw new Error("Failed to generate recipe");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No recipe generated");
    }

    const recipe = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ recipe }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-recipe:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
