import React, { useState, useEffect } from 'react';
import { OverviewCard } from '@/components/OverviewCard';
import { ProgressBar } from '@/components/ProgressBar';
import { WearableSync } from '@/components/WearableSync';
import { NutriFitLogo } from '@/components/NutriFitLogo';
import { MoodBasedFoodSuggestions } from '@/components/MoodBasedFoodSuggestions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Utensils, 
  Activity, 
  Heart, 
  Droplets, 
  Target, 
  TrendingUp,
  Camera,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import wellnessHero from '@/assets/wellness-hero.jpg';
import healthyMeal from '@/assets/healthy-meal.jpg';

const Dashboard = () => {
  const { profile, loading: profileLoading } = useProfile();
  const { toast } = useToast();
  const currentHour = new Date().getHours();
  const [fitnessData, setFitnessData] = useState<any>(null);
  const [waterLogs, setWaterLogs] = useState<any[]>([]);
  const [todayMeals, setTodayMeals] = useState<any[]>([]);
  
  const getGreeting = () => {
    if (currentHour < 12) return 'Good Morning';
    if (currentHour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const userName = profile?.full_name || 'User';

  // Fetch fitness data from wearable devices
  useEffect(() => {
    const fetchFitnessData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
          .from('fitness_data')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('date', today)
          .single();

        if (data && !error) {
          setFitnessData(data);
        }
      } catch (error) {
        console.error('Error fetching fitness data:', error);
      }
    };

    fetchFitnessData();
    
    // Refresh every 10 seconds
    const interval = setInterval(fetchFitnessData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch water logs for today
  useEffect(() => {
    const fetchWaterLogs = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
          .from('water_logs')
          .select('*')
          .eq('user_id', session.user.id)
          .gte('timestamp', `${today}T00:00:00`)
          .lte('timestamp', `${today}T23:59:59`)
          .order('timestamp', { ascending: false });

        if (data && !error) {
          setWaterLogs(data);
        }
      } catch (error) {
        console.error('Error fetching water logs:', error);
      }
    };

    fetchWaterLogs();
  }, []);

  // Fetch today's meals
  useEffect(() => {
    const fetchTodayMeals = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
          .from('meals')
          .select('*')
          .eq('user_id', session.user.id)
          .gte('consumed_at', `${today}T00:00:00`)
          .lte('consumed_at', `${today}T23:59:59`)
          .order('consumed_at', { ascending: false });

        if (data && !error) {
          setTodayMeals(data);
        }
      } catch (error) {
        console.error('Error fetching today\'s meals:', error);
      }
    };

    fetchTodayMeals();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchTodayMeals, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalGlasses = waterLogs.reduce((sum, log) => sum + log.glasses_logged, 0);
  const waterGoal = 8;

  const todayCalories = todayMeals.reduce((sum, meal) => sum + (meal.total_calories || 0), 0);
  const calorieGoal = profile?.weight ? Math.round(profile.weight * 2.2 * 15) : 2000;

  // Calculate time since last water log
  const getTimeSinceLastWaterLog = () => {
    if (waterLogs.length === 0) return null;
    const lastLog = new Date(waterLogs[0].timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastLog.getTime()) / (1000 * 60));
    return diffMinutes;
  };

  const minutesSinceWater = getTimeSinceLastWaterLog();
  const showWaterReminder = minutesSinceWater !== null && minutesSinceWater > 60;

  // Log water intake
  const handleLogWater = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to track water intake",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('water_logs')
        .insert({
          user_id: session.user.id,
          glasses_logged: 1,
          timestamp: new Date().toISOString()
        });

      if (error) throw error;

      // Refresh water logs
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('water_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('timestamp', `${today}T00:00:00`)
        .lte('timestamp', `${today}T23:59:59`)
        .order('timestamp', { ascending: false });

      if (data) {
        setWaterLogs(data);
      }

      toast({
        title: "Water logged! 💧",
        description: "Great job staying hydrated!",
      });
    } catch (error) {
      console.error('Error logging water:', error);
      toast({
        title: "Error",
        description: "Failed to log water intake",
        variant: "destructive"
      });
    }
  };

  // Data from wearable devices and user logs
  const mockData = {
    calories: { consumed: fitnessData?.calories || 1450, target: 2000 },
    steps: { current: fitnessData?.steps || 8547, target: 10000 },
    water: { current: totalGlasses, target: 8 },
    mood: 4, // 1-5 scale
    workouts: 2,
    streak: 7
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting Header with Hero Image */}
      <header className="space-y-6">
        <div className="relative overflow-hidden rounded-card bg-gradient-primary p-8 text-primary-foreground">
          <div className="absolute inset-0 opacity-20">
            <img 
              src={wellnessHero} 
              alt="NutriFit wellness lifestyle" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <h1 className="text-3xl font-bold text-white">
                  {getGreeting()}, {profileLoading ? '...' : userName} 👋
                </h1>
              </div>
              <p className="text-white/90">
                Here's your NutriFit wellness overview for today
              </p>
            </div>
            <div className="hidden md:block">
              <NutriFitLogo size="lg" showText={false} className="text-white/80" />
            </div>
          </div>
        </div>
      </header>

      {/* Hydration Reminder Banner - Dynamic */}
      {showWaterReminder && (
        <Card className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Droplets className="h-5 w-5 text-blue-400 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">Hydration Reminder</h3>
                <p className="text-sm text-muted-foreground">
                  You haven't logged water in {minutesSinceWater} minutes. Stay hydrated!
                </p>
              </div>
              <Button variant="outline" size="sm" className="border-blue-500/30" onClick={handleLogWater}>
                Log Water
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <OverviewCard
          title="Calories Today"
          value={mockData.calories.consumed}
          subtitle={`${mockData.calories.target - mockData.calories.consumed} remaining`}
          icon={Utensils}
        >
          <ProgressBar 
            value={mockData.calories.consumed} 
            max={mockData.calories.target}
            size="sm"
          />
        </OverviewCard>

        <OverviewCard
          title="Steps"
          value={mockData.steps.current.toLocaleString()}
          subtitle={`${mockData.steps.target - mockData.steps.current} to go`}
          icon={Activity}
        >
          <ProgressBar 
            value={mockData.steps.current} 
            max={mockData.steps.target}
            size="sm"
          />
        </OverviewCard>

        <OverviewCard
          title="Mood Score"
          value={`${mockData.mood}/5`}
          subtitle="Feeling good today"
          icon={Heart}
        >
          <div className="flex space-x-1 mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <div
                key={star}
                className={`w-3 h-3 rounded-full ${
                  star <= mockData.mood ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </OverviewCard>

        <OverviewCard
          title="Water Intake"
          value={`${mockData.water.current}/${mockData.water.target}`}
          subtitle="glasses"
          icon={Droplets}
        >
          <ProgressBar 
            value={mockData.water.current} 
            max={mockData.water.target}
            size="sm"
          />
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-2" 
            onClick={handleLogWater}
          >
            <Droplets className="h-4 w-4 mr-2" />
            Log Water
          </Button>
        </OverviewCard>
      </div>

      {/* Activity Summary & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Today's Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {todayMeals.length > 0 ? (
              <>
                {todayMeals.map((meal) => (
                  <div key={meal.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {meal.photo_url ? (
                        <img 
                          src={meal.photo_url} 
                          alt={meal.meal_name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <Utensils className="w-5 h-5 text-primary" />
                      )}
                      <div>
                        <span className="text-sm font-medium">{meal.meal_type || 'Meal'}: {meal.meal_name}</span>
                        <p className="text-xs text-muted-foreground">
                          {new Date(meal.consumed_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">{meal.total_calories} cal</Badge>
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-sm">No meals logged yet today</p>
              </div>
            )}

            <Link to="/meals">
              <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
                <Plus className="mr-2 h-4 w-4" />
                Log your next meal
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Streak & Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="mr-2 h-5 w-5" />
              Your Streak
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text">{mockData.streak}</div>
              <p className="text-sm text-muted-foreground">days strong!</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Weekly Goal</span>
                <span className="font-medium">5/7 days</span>
              </div>
              <ProgressBar value={5} max={7} size="sm" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Food Suggestions Based on Mood */}
      <MoodBasedFoodSuggestions />

      {/* Wearable Integration Section */}
      <WearableSync />
    </div>
  );
};

export default Dashboard;