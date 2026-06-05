import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function OAuth2Callback() {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        if (error) {
          throw new Error(error);
        }

        if (!code) {
          throw new Error('No authorization code received');
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('Not authenticated');
        }

        // Call the callback edge function to exchange code for tokens
        const { data, error: callbackError } = await supabase.functions.invoke('google-fit-callback', {
          body: { code },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (callbackError) throw callbackError;

        toast({
          title: "Success!",
          description: "Google Fit connected successfully",
        });

        navigate('/');
      } catch (error) {
        console.error('OAuth callback error:', error);
        toast({
          title: "Connection failed",
          description: error.message || "Failed to connect Google Fit",
          variant: "destructive",
        });
        navigate('/');
      }
    };

    handleCallback();
  }, [navigate, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Connecting to Google Fit...</p>
      </div>
    </div>
  );
}