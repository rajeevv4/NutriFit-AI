import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getDateRange, type Timeframe } from '@/utils/dataAggregation';
import { 
  transformFitnessToChart, 
  transformMealsToCalories, 
  transformMoodToScore,
  transformWaterToGlasses,
  calculateDailySustainability
} from '@/utils/dataTransformers';
import type { DataPoint } from '@/utils/dataAggregation';

export function useAnalyticsData(timeframe: Timeframe) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [fitnessData, setFitnessData] = useState<any[]>([]);
  const [mealsData, setMealsData] = useState<any[]>([]);
  const [moodData, setMoodData] = useState<any[]>([]);
  const [waterData, setWaterData] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      const { start, end } = getDateRange(timeframe);

      try {
        // Fetch fitness data
        const { data: fitness } = await supabase
          .from('fitness_data')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', start.toISOString().split('T')[0])
          .lte('date', end.toISOString().split('T')[0])
          .order('date', { ascending: true });

        // Fetch meals data
        const { data: meals } = await supabase
          .from('meals')
          .select('*')
          .eq('user_id', user.id)
          .gte('consumed_at', start.toISOString())
          .lte('consumed_at', end.toISOString())
          .order('consumed_at', { ascending: true });

        // Fetch mood data
        const { data: mood } = await supabase
          .from('mood_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', start.toISOString().split('T')[0])
          .lte('date', end.toISOString().split('T')[0])
          .order('date', { ascending: true });

        // Fetch water data
        const { data: water } = await supabase
          .from('water_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('timestamp', start.toISOString())
          .lte('timestamp', end.toISOString())
          .order('timestamp', { ascending: true });

        setFitnessData(fitness || []);
        setMealsData(meals || []);
        setMoodData(mood || []);
        setWaterData(water || []);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, timeframe]);

  return {
    loading,
    fitnessData,
    mealsData,
    moodData,
    waterData
  };
}

export function useChartData(timeframe: Timeframe, metric: string) {
  const { fitnessData, mealsData, moodData, waterData, loading } = useAnalyticsData(timeframe);
  const [chartData, setChartData] = useState<DataPoint[]>([]);

  useEffect(() => {
    let data: DataPoint[] = [];

    switch (metric) {
      case 'steps':
        data = transformFitnessToChart(fitnessData, 'steps');
        break;
      case 'calories':
        data = transformMealsToCalories(mealsData);
        break;
      case 'mood':
        data = transformMoodToScore(moodData);
        break;
      case 'water':
        data = transformWaterToGlasses(waterData);
        break;
    }

    setChartData(data);
  }, [fitnessData, mealsData, moodData, waterData, metric]);

  return { chartData, loading };
}
