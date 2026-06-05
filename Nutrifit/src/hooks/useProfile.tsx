import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Profile {
  id: string;
  full_name: string | null;
  age: number | null;
  height: number | null;
  weight: number | null;
  fitness_goals: string | null;
  dietary_preferences: string[] | null;
  created_at?: string;
  updated_at?: string;
}

export const useProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      setProfile(data);
    } catch (err: any) {
      setError(err.message);
      toast({
        variant: 'destructive',
        title: 'Error fetching profile',
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: 'No user logged in' };

    try {
      const { data, error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (updateError) throw updateError;

      setProfile(data);
      toast({
        title: 'Profile updated!',
        description: 'Your profile has been saved successfully.',
      });

      return { error: null, data };
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error updating profile',
        description: err.message,
      });
      return { error: err.message };
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    refetchProfile: fetchProfile,
  };
};
