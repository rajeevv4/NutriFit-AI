import { useState, useEffect } from 'react';
import { useAnalyticsData } from './useAnalyticsData';
import { useProfile } from './useProfile';
import { getAllAchievements, type Achievement } from '@/utils/achievements';

export function useAchievements() {
  const { fitnessData, mealsData, moodData, loading: dataLoading } = useAnalyticsData('month');
  const { profile, loading: profileLoading } = useProfile();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (dataLoading || profileLoading) {
      setLoading(true);
      return;
    }

    const detected = getAllAchievements(fitnessData, mealsData, moodData, profile);
    setAchievements(detected);
    setLoading(false);
  }, [fitnessData, mealsData, moodData, profile, dataLoading, profileLoading]);

  return { achievements, loading };
}
