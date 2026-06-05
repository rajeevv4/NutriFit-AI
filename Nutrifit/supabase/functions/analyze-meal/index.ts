import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY not configured");
      throw new Error("OPENAI_API_KEY not configured");
    }

    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse multipart form data
    const formData = await req.formData();
    const photoFile = formData.get('photo') as File;
    
    if (!photoFile) {
      return new Response(JSON.stringify({ error: "No photo provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert image to base64
    const arrayBuffer = await photoFile.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const mimeType = photoFile.type || 'image/jpeg';

    console.log("Calling OpenAI Vision API...");

    // Call OpenAI GPT-4 Vision
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `You are a nutrition expert. Identify all visible food items in this image and estimate approximate nutrition per item (calories, protein g, carbs g, fat g). Return ONLY a valid JSON object with fields 'foods' (array of items) and 'total' (summary). Example response format:
{
  "foods": [{"name":"rice","calories":180,"protein":4,"carbs":40,"fat":1}],
  "total": {"calories":360,"protein":20,"carbs":60,"fat":10}
}`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "OpenAI rate limit exceeded. Please try again later." }), {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Failed to analyze image with OpenAI" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    console.log("OpenAI response received");
    
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.error("No content in OpenAI response");
      throw new Error("No analysis generated");
    }

    // Parse the JSON response from GPT
    let analysisResult;
    try {
      // Remove markdown code blocks if present
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysisResult = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", content);
      throw new Error("Invalid JSON response from OpenAI");
    }

    // Validate the structure
    if (!analysisResult.foods || !analysisResult.total) {
      console.error("Invalid analysis structure:", analysisResult);
      throw new Error("Invalid analysis structure from OpenAI");
    }

    // Store in database
    const { data: insertData, error: insertError } = await supabase
      .from('meal_analysis')
      .insert({
        user_id: user.id,
        timestamp: new Date().toISOString(),
        photo_url: null, // Could upload to storage if needed
        foods_json: analysisResult.foods,
        totals_json: analysisResult.total,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database insert error:", insertError);
      throw new Error("Failed to save analysis");
    }

    console.log("Analysis saved successfully");

    return new Response(JSON.stringify({
      foods: analysisResult.foods,
      total: analysisResult.total,
      id: insertData.id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in analyze-meal:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
