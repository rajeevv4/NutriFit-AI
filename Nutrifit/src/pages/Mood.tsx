import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ProgressBar';
import { supabase } from '@/integrations/supabase/client';
import { 
  Heart, 
  Moon, 
  Zap, 
  Brain,
  TrendingUp,
  Calendar,
  Target
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Mood = () => {
  const { toast } = useToast();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [selectedEnergy, setSelectedEnergy] = useState<number | null>(null);
  const [selectedStress, setSelectedStress] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [weeklyAverage, setWeeklyAverage] = useState(4.2);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch weekly average mood
  useEffect(() => {
    const fetchWeeklyAverage = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data, error } = await supabase
          .from('mood_logs')
          .select('mood')
          .eq('user_id', session.user.id)
          .gte('date', sevenDaysAgo.toISOString().split('T')[0]);

        if (data && !error && data.length > 0) {
          const avgMood = data.reduce((sum, entry) => sum + entry.mood, 0) / data.length;
          setWeeklyAverage(Math.round(avgMood * 10) / 10);
        }
      } catch (error) {
        console.error('Error fetching weekly average:', error);
      }
    };

    fetchWeeklyAverage();
  }, []);

  const moods = [
    { emoji: '😢', label: 'Sad', value: 1 },
    { emoji: '😕', label: 'Down', value: 2 },
    { emoji: '😐', label: 'Okay', value: 3 },
    { emoji: '😊', label: 'Good', value: 4 },
    { emoji: '😄', label: 'Great', value: 5 },
  ];

  const energyLevels = [
    { emoji: '🔋', label: 'Drained', value: 1 },
    { emoji: '🔋', label: 'Low', value: 2 },
    { emoji: '🔋', label: 'Okay', value: 3 },
    { emoji: '⚡', label: 'Good', value: 4 },
    { emoji: '⚡', label: 'Energized', value: 5 },
  ];

  const stressLevels = [
    { emoji: '😌', label: 'Calm', value: 1 },
    { emoji: '😐', label: 'Mild', value: 2 },
    { emoji: '😬', label: 'Moderate', value: 3 },
    { emoji: '😰', label: 'High', value: 4 },
    { emoji: '🤯', label: 'Overwhelmed', value: 5 },
  ];

  const handleSave = async () => {
    if (!selectedMood || !selectedEnergy || !selectedStress) {
      toast({
        title: "Please complete all fields",
        description: "Rate your mood, energy, and stress levels to continue.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to save your mood entry.",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('mood_logs')
        .insert({
          user_id: session.user.id,
          mood: selectedMood,
          energy_level: selectedEnergy,
          stress_level: selectedStress,
          notes: note || null,
          date: new Date().toISOString().split('T')[0]
        });

      if (error) throw error;

      toast({
        title: "Mood logged successfully!",
        description: "Your entry has been saved and will help improve your personalized insights.",
      });

      // Reset form
      setSelectedMood(null);
      setSelectedEnergy(null);
      setSelectedStress(null);
      setNote('');

      // Refresh weekly average
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data } = await supabase
        .from('mood_logs')
        .select('mood')
        .eq('user_id', session.user.id)
        .gte('date', sevenDaysAgo.toISOString().split('T')[0]);

      if (data && data.length > 0) {
        const avgMood = data.reduce((sum, entry) => sum + entry.mood, 0) / data.length;
        setWeeklyAverage(Math.round(avgMood * 10) / 10);
      }
    } catch (error) {
      console.error('Error saving mood:', error);
      toast({
        title: "Error saving mood",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sleepAverage = 7.5;

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold gradient-text">Mood & Health Tracker</h1>
        <p className="text-muted-foreground">
          Track your daily wellness and get personalized insights
        </p>
      </header>

      {/* Today's Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Heart className="mr-2 h-5 w-5" />
            How are you feeling today?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mood Selection */}
          <div>
            <h4 className="font-medium mb-3">Mood</h4>
            <div className="flex gap-3 flex-wrap">
              {moods.map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => setSelectedMood(mood.value)}
                  className={`mood-emoji ${selectedMood === mood.value ? 'selected' : ''}`}
                  title={mood.label}
                >
                  {mood.emoji}
                </button>
              ))}
            </div>
            {selectedMood && (
              <p className="text-sm text-muted-foreground mt-2">
                Feeling {moods.find(m => m.value === selectedMood)?.label.toLowerCase()}
              </p>
            )}
          </div>

          {/* Energy Level */}
          <div>
            <h4 className="font-medium mb-3">Energy Level</h4>
            <div className="flex gap-3 flex-wrap">
              {energyLevels.map((energy) => (
                <button
                  key={energy.value}
                  onClick={() => setSelectedEnergy(energy.value)}
                  className={`mood-emoji ${selectedEnergy === energy.value ? 'selected' : ''}`}
                  title={energy.label}
                >
                  {energy.emoji}
                </button>
              ))}
            </div>
            {selectedEnergy && (
              <p className="text-sm text-muted-foreground mt-2">
                Energy: {energyLevels.find(e => e.value === selectedEnergy)?.label.toLowerCase()}
              </p>
            )}
          </div>

          {/* Stress Level */}
          <div>
            <h4 className="font-medium mb-3">Stress Level</h4>
            <div className="flex gap-3 flex-wrap">
              {stressLevels.map((stress) => (
                <button
                  key={stress.value}
                  onClick={() => setSelectedStress(stress.value)}
                  className={`mood-emoji ${selectedStress === stress.value ? 'selected' : ''}`}
                  title={stress.label}
                >
                  {stress.emoji}
                </button>
              ))}
            </div>
            {selectedStress && (
              <p className="text-sm text-muted-foreground mt-2">
                Stress: {stressLevels.find(s => s.value === selectedStress)?.label.toLowerCase()}
              </p>
            )}
          </div>

          {/* Optional Note */}
          <div>
            <h4 className="font-medium mb-3">Notes (Optional)</h4>
            <Textarea
              placeholder="How was your day? Any specific events or thoughts you'd like to record?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <Button onClick={handleSave} className="w-full" disabled={isLoading}>
            {isLoading ? 'Saving...' : "Save Today's Entry"}
          </Button>
        </CardContent>
      </Card>

      {/* Health Insights */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <TrendingUp className="mr-2 h-5 w-5" />
              Weekly Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Average Mood</span>
                <span className="font-medium">{weeklyAverage}/5</span>
              </div>
              <ProgressBar value={weeklyAverage} max={5} size="sm" />
            </div>
            
            <div className="space-y-2">
              <Badge variant="secondary" className="text-xs">
                Weekly Average: {weeklyAverage}/5
              </Badge>
            </div>

            <div className="text-sm text-muted-foreground">
              Your mood has been consistently improving. Keep up the great work!
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Moon className="mr-2 h-5 w-5" />
              Sleep & Recovery
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Average Sleep</span>
                <span className="font-medium">{sleepAverage}h</span>
              </div>
              <ProgressBar value={sleepAverage} max={9} size="sm" />
            </div>
            
            <div className="text-sm text-muted-foreground">
              You're getting good sleep! Aim for 7-9 hours for optimal recovery.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Health Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="mr-2 h-5 w-5" />
            Personalized Health Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start space-x-3 p-4 bg-primary-light rounded-lg">
              <Target className="h-5 w-5 text-primary mt-1" />
              <div>
                <h4 className="font-medium text-primary">Mood Boost</h4>
                <p className="text-sm text-primary/80 mt-1">
                  Your energy dips around 2 PM. Try a 10-minute walk or healthy snack.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 bg-secondary-light rounded-lg">
              <Zap className="h-5 w-5 text-secondary mt-1" />
              <div>
                <h4 className="font-medium text-secondary">Stress Management</h4>
                <p className="text-sm text-secondary/80 mt-1">
                  Consider meditation before bed - your evening mood scores are lower.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Mood;