import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FoodSuggestion {
  title: string;
  description: string;
  tags: string[];
  confidence: number;
}

function validateSuggestion(item: any): item is FoodSuggestion {
  return (
    typeof item === 'object' &&
    typeof item.title === 'string' && item.title.length > 0 &&
    typeof item.description === 'string' && item.description.length > 0 && item.description.length <= 200 &&
    Array.isArray(item.tags) && item.tags.length > 0 && item.tags.every((t: any) => typeof t === 'string') &&
    typeof item.confidence === 'number' && item.confidence >= 0 && item.confidence <= 1
  );
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { moodScore, dietaryPreferences, avoidFoods, recentMeals } = await req.json();
    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');

    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY not configured');
    }

    // Build dietary restrictions string
    const preferences = dietaryPreferences?.length 
      ? dietaryPreferences.join(', ') 
      : 'no specific restrictions';
    
    const avoidFoodsStr = avoidFoods?.length
      ? avoidFoods.join(', ')
      : 'none';
    
    const recentMealsStr = recentMeals?.length
      ? recentMeals.join(', ')
      : 'none';

    // System message (model instructions)
    const systemPrompt = `You are NutriFit AI — a concise, friendly food-suggestion assistant. 
Always respond with a JSON array only (no extra explanation, no markdown, no commentary). 
Return 3 or 4 suggestion objects. Each object must have exactly these fields:
- "title": string (short dish name)
- "description": string (one friendly sentence, ≤ 20 words, why it suits mood+preferences)
- "tags": array of short strings (e.g., ["vegetarian", "Indian", "fiber"])
- "confidence": number between 0.0 and 1.0 (how well it matches preferences)

Respect diet restrictions and avoid foods in avoidFoods. Use culturally-appropriate dishes if culture is specified. Keep descriptions concise and helpful.`;

    // User message with filled placeholders
    const userPrompt = `Generate 3–4 healthy food suggestions based on this user profile. 
Return ONLY a JSON array.

User profile:
- MoodAvg: ${moodScore}
- Preferences: ${preferences}
- AvoidFoods: ${avoidFoodsStr}
- RecentMeals: ${recentMealsStr}

Requirements:
1) Provide 3 or 4 suggestions only.
2) Each suggestion object: { "title": "...", "description": "...", "tags": [...], "confidence": 0.0 }
3) Description: one sentence (≤20 words) explaining why it's suitable for MoodAvg + Preferences.
4) Tags must include diet type (veg/nonveg), culture if applicable, and one nutrient/mood tag (e.g., "tryptophan","fiber").
5) Confidence: 0.0–1.0 numeric (how well it matches).
6) Do NOT output anything besides the JSON array.

Example (exact format expected):
[
  { "title": "Lemon Rice", "description": "Light, comforting and easy to digest — calming for mild stress.", "tags":["vegetarian","South Indian","low-fat"], "confidence": 0.88 },
  { "title": "Oats Upma", "description": "High-fiber, stabilizes energy and mood after low meals.", "tags":["vegetarian","Indian","fiber"], "confidence": 0.82 }
]`;

    console.log('Calling Groq API with mood:', moodScore, 'preferences:', preferences);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Groq API error:', response.status, errorData);
      
      if (response.status === 401) {
        throw new Error('Groq API key is invalid');
      } else if (response.status === 429) {
        throw new Error('Groq rate limit exceeded. Please try again later.');
      }
      
      throw new Error('Failed to generate suggestions');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log('Groq response:', content);

    // Parse and validate JSON response
    let suggestions: FoodSuggestion[];
    try {
      // Extract JSON from response (in case model adds extra text)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!Array.isArray(parsed)) {
        throw new Error('Response is not an array');
      }
      
      if (parsed.length < 3 || parsed.length > 4) {
        console.warn('Expected 3-4 suggestions, got:', parsed.length);
      }
      
      // Validate each suggestion
      const validSuggestions = parsed.filter(validateSuggestion);
      
      if (validSuggestions.length === 0) {
        throw new Error('No valid suggestions in response');
      }
      
      // Sort by confidence (highest first)
      suggestions = validSuggestions.sort((a, b) => b.confidence - a.confidence);
      
      console.log('Validated suggestions:', suggestions.length);
      
    } catch (parseError) {
      console.error('Failed to parse Groq response:', parseError);
      throw new Error('Unable to load AI suggestions right now. Please try again later.');
    }

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in suggest-mood-foods:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unable to load AI suggestions right now. Please try again later.'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
