import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    // 🔑 Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser(req.headers.get("Authorization")?.replace("Bearer ", "") ?? "");
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({
        error: "Unauthorized"
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    console.log("Fetching tokens for user:", user.id);
    // 🔄 Get token
    const { data: tokenData, error: tokenError } = await supabase.from("google_fit_tokens").select("*").eq("user_id", user.id).single();
    if (tokenError || !tokenData) {
      console.error("Token fetch error:", tokenError);
      return new Response(JSON.stringify({
        error: "Google Fit not connected"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // 🔁 Refresh if expired
    const tokenExpiry = new Date(tokenData.token_expiry);
    const now = new Date();
    let accessToken = tokenData.access_token;
    if (now >= tokenExpiry) {
      console.log("Access token expired — refreshing...");
      const refreshResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/google-fit-refresh-token`, {
        method: "POST",
        headers: {
          Authorization: req.headers.get("Authorization") ?? "",
          "Content-Type": "application/json"
        }
      });
      if (!refreshResponse.ok) {
        return new Response(JSON.stringify({
          error: "Failed to refresh token"
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      }
      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;
    }
    // 🕒 Time window: last 24 hours
    const endTime = Date.now();
    const startTime = endTime - 12 * 60 * 60 * 1000;
    console.log("Fetching fitness data from Google Fit...");
    async function fetchAggregate(dataTypeName: string): Promise<any> {
      const res = await fetch("https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          aggregateBy: [
            {
              dataTypeName
            }
          ],
          bucketByTime: {
            durationMillis: endTime - startTime
          },
          startTimeMillis: startTime,
          endTimeMillis: endTime
        })
      });
      const json = await res.json();
      console.log(`📡 [${dataTypeName}] Response:`, JSON.stringify(json).slice(0, 300));
      return json;
    }
    // 🚀 Fetch all metrics together
    const [stepsData, heartRateData, caloriesData, distanceData, activeMinutesData] = await Promise.all([
      fetchAggregate("com.google.step_count.delta"),
      fetchAggregate("com.google.heart_rate.bpm"),
      fetchAggregate("com.google.calories.expended"),
      fetchAggregate("com.google.distance.delta"),
      fetchAggregate("com.google.active_minutes")
    ]);
    // 🔍 Parse helpers
    function getTotalValue(data: any, field = "intVal"): number {
      if (!data?.bucket?.length) return 0;
      return data.bucket.flatMap((b: any)=>b.dataset.flatMap((d: any)=>d.point)).reduce((sum: number, p: any)=>{
        const v = p.value?.[0];
        return sum + (v?.[field] ?? v?.fpVal ?? 0);
      }, 0);
    }
    const steps = getTotalValue(stepsData);
    const heartRatePoints = heartRateData?.bucket?.flatMap((b: any)=>b.dataset.flatMap((d: any)=>d.point.map((p: any)=>p.value?.[0]?.fpVal ?? 0))) ?? [];
    const heartRate = heartRatePoints.length > 0 ? Math.round(heartRatePoints.reduce((a: number, b: number)=>a + b, 0) / heartRatePoints.length) : 0;
    const calories = Math.round(getTotalValue(caloriesData, "fpVal"));
    const distance = getTotalValue(distanceData, "fpVal");
    const activeMinutes = getTotalValue(activeMinutesData);
    // 💾 Store in Supabase
    const { error: dbError } = await supabase.from("fitness_data").upsert({
      user_id: user.id,
      date: new Date().toISOString().split("T")[0],
      steps,
      heart_rate: heartRate,
      calories,
      distance: distance / 1000,
      active_minutes: activeMinutes,
      updated_at: new Date().toISOString()
    }, {
      onConflict: "user_id,date"
    });
    if (dbError) {
      console.error("Database error:", dbError);
      return new Response(JSON.stringify({
        error: "Failed to store fitness data",
        details: dbError
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    console.log("✅ Fitness data synced successfully");
    console.log("➡️ Steps:", steps, "HR:", heartRate, "Cal:", calories, "Dist(km):", distance / 1000);
    return new Response(JSON.stringify({
      success: true,
      data: {
        steps,
        heart_rate: heartRate,
        calories,
        distance: distance / 1000,
        active_minutes: activeMinutes
      }
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("❌ Error in google-fit-sync:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
