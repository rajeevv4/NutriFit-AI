import { useState, useEffect } from 'react';
import { useAnalyticsData } from './useAnalyticsData';
import { useProfile } from './useProfile';
import { getTopInsights, type Insight } from '@/utils/insightGenerator';

export function useInsights(limit = 3) {
  const { fitnessData, mealsData, moodData, loading: dataLoading } = useAnalyticsData('month');
  const { profile, loading: profileLoading } = useProfile();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (dataLoading || profileLoading) {
      setLoading(true);
      return;
    }

    const generated = getTopInsights(fitnessData, mealsData, moodData, profile, limit);
    setInsights(generated);
    setLoading(false);
  }, [fitnessData, mealsData, moodData, profile, dataLoading, profileLoading, limit]);

  return { insights, loading };
}
