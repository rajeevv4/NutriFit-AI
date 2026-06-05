import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    // Get the app origin from the Referer or Origin header
    const referer = req.headers.get('Referer') || req.headers.get('Origin');
    const appOrigin = referer ? new URL(referer).origin : 'https://6815b4a4-21b4-4f07-b92d-065d0bc80e19.lovableproject.com';
    const redirectUri = `${appOrigin}/oauth2callback`;
    console.log('App origin:', appOrigin);
    console.log('Redirect URI:', redirectUri);
    if (!clientId) {
      console.error('GOOGLE_CLIENT_ID not configured in Supabase secrets');
      return new Response(JSON.stringify({
        error: 'Google Client ID not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Supabase Edge Function secrets.'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log('Client ID found, generating auth URL...');
    const scopes = [
      'https://www.googleapis.com/auth/fitness.activity.read',
      'https://www.googleapis.com/auth/fitness.body.read',
      'https://www.googleapis.com/auth/fitness.nutrition.read',
      'https://www.googleapis.com/auth/fitness.heart_rate.read',
      'https://www.googleapis.com/auth/fitness.sleep.read'
    ];
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + `client_id=${clientId}&` + `redirect_uri=${encodeURIComponent(redirectUri)}&` + `response_type=code&` + `scope=${encodeURIComponent(scopes.join(' '))}&` + `access_type=offline&` + `prompt=consent`;
    console.log('Auth URL generated successfully');
    return new Response(JSON.stringify({
      authUrl
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error generating auth URL:', error);
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
