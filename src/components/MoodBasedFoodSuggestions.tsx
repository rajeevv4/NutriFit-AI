import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';

interface FoodSuggestion {
  title: string;
  description: string;
  tags: string[];
  confidence: number;
}

export const MoodBasedFoodSuggestions = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<FoodSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [avgMood, setAvgMood] = useState<number | null>(null);
  const [recentMeals, setRecentMeals] = useState<string[]>([]);

  useEffect(() => {
    fetchAverageMood();
    fetchRecentMeals();
  }, [user]);

  const fetchAverageMood = async () => {
    if (!user) return;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await supabase
      .from('mood_logs')
      .select('mood')
      .eq('user_id', user.id)
      .gte('date', sevenDaysAgo.toISOString().split('T')[0]);

    if (error) {
      console.error('Error fetching mood:', error);
      return;
    }

    if (data && data.length > 0) {
      const avg = data.reduce((sum, log) => sum + log.mood, 0) / data.length;
      setAvgMood(Math.round(avg * 2) / 2); // Round to nearest 0.5
    }
  };

  const fetchRecentMeals = async () => {
    if (!user) return;

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const { data, error } = await supabase
      .from('meals')
      .select('meal_name')
      .eq('user_id', user.id)
      .gte('consumed_at', threeDaysAgo.toISOString())
      .order('consumed_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching recent meals:', error);
      return;
    }

    if (data) {
      setRecentMeals(data.map(m => m.meal_name));
    }
  };

  const generateSuggestions = async () => {
    if (!user || avgMood === null) {
      toast({
        variant: 'destructive',
        title: 'Unable to generate suggestions',
        description: 'Please log your mood first to get personalized food suggestions.',
      });
      return;
    }

    setLoading(true);
    setSuggestions([]); // Clear previous suggestions
    
    try {
      const { data, error } = await supabase.functions.invoke('suggest-mood-foods', {
        body: {
          moodScore: avgMood,
          dietaryPreferences: profile?.dietary_preferences || [],
          avoidFoods: [], // Can be enhanced later
          recentMeals: recentMeals,
        },
      });

      if (error) throw error;

      if (data.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      console.error('Error generating suggestions:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to generate suggestions',
        description: error.message || 'Unable to load AI suggestions right now. Please try again later.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Food Suggestions Based on Your Mood
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {avgMood !== null && (
          <p className="text-sm text-muted-foreground">
            Your average mood this week: <span className="font-semibold text-foreground">{avgMood}/5</span>
          </p>
        )}
        
        <Button 
          onClick={generateSuggestions} 
          disabled={loading || avgMood === null}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Getting AI suggestions…
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Get Food Suggestions
            </>
          )}
        </Button>

        {suggestions.length > 0 && (
          <div className="mt-4 space-y-3">
            {suggestions.map((suggestion, index) => (
              <div 
                key={index}
                className="p-4 bg-background rounded-lg border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-semibold text-foreground">🍽️ {suggestion.title}</h4>
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(suggestion.confidence * 100)}%
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {suggestion.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {suggestion.tags.map((tag, tagIndex) => (
                    <Badge key={tagIndex} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {avgMood === null && (
          <p className="text-xs text-muted-foreground text-center">
            Log your mood on the Mood page to get personalized suggestions
          </p>
        )}
      </CardContent>
    </Card>
  );
};
