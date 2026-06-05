import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(req.headers.get('Authorization')?.replace('Bearer ', '') ?? '');
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log('Fetching refresh token for user:', user.id);
    // Get stored refresh token
    const { data: tokenData, error: tokenError } = await supabase.from('google_fit_tokens').select('refresh_token').eq('user_id', user.id).single();
    if (tokenError || !tokenData) {
      console.error('Token fetch error:', tokenError);
      return new Response(JSON.stringify({
        error: 'Google Fit not connected'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    
    if (!clientId || !clientSecret) {
      return new Response(JSON.stringify({
        error: 'Google OAuth credentials not configured'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    
    console.log('Refreshing access token...');
    // Refresh the access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: tokenData.refresh_token,
        grant_type: 'refresh_token'
      })
    });
    const newTokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      console.error('Token refresh failed:', newTokenData);
      return new Response(JSON.stringify({
        error: 'Failed to refresh token',
        details: newTokenData
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log('Token refreshed, updating database...');
    // Calculate new token expiry
    const tokenExpiry = new Date(Date.now() + newTokenData.expires_in * 1000).toISOString();
    // Update tokens in database
    const { error: updateError } = await supabase.from('google_fit_tokens').update({
      access_token: newTokenData.access_token,
      token_expiry: tokenExpiry
    }).eq('user_id', user.id);
    if (updateError) {
      console.error('Database update error:', updateError);
      return new Response(JSON.stringify({
        error: 'Failed to update tokens',
        details: updateError
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log('Token refresh successful');
    return new Response(JSON.stringify({
      success: true,
      access_token: newTokenData.access_token
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in google-fit-refresh-token:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
