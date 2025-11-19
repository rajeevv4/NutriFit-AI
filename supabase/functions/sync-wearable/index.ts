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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { deviceName } = await req.json();

    // Simulate syncing data from wearable device
    const steps = Math.floor(Math.random() * 5000) + 5000;
    // Calculate distance: average step length is 0.762 meters
    const distance = (steps * 0.000762).toFixed(2); // km
    
    const syncedData = {
      user_id: user.id,
      device_name: deviceName || "Unknown Device",
      steps: steps,
      heart_rate: Math.floor(Math.random() * 40) + 60,
      calories_burned: Math.floor(Math.random() * 500) + 300,
      sleep_hours: Math.floor(Math.random() * 3) + 6,
      distance: parseFloat(distance),
      synced_at: new Date().toISOString()
    };

    const { data, error } = await supabaseClient
      .from('wearable_data')
      .insert([syncedData])
      .select()
      .single();

    if (error) {
      console.error("Error inserting wearable data:", error);
      throw new Error("Failed to sync wearable data");
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in sync-wearable:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
