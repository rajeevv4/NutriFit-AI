import { differenceInDays, format } from 'date-fns';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, Activity, Heart, Utensils, Lightbulb, Calendar } from 'lucide-react';

export interface Insight {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  metric: string;
  trend: 'up' | 'down' | 'stable';
}

/**
 * Analyze calorie consistency
 */
export function analyzeCalorieConsistency(meals: any[], profile: any): Insight | null {
  if (meals.length < 7) return null;

  const dailyCalories = new Map<string, number>();
  meals.forEach(meal => {
    const date = new Date(meal.consumed_at).toDateString();
    const current = dailyCalories.get(date) || 0;
    dailyCalories.set(date, current + (meal.total_calories || 0));
  });

  const calories = Array.from(dailyCalories.values());
  const avgCalories = calories.reduce((sum, c) => sum + c, 0) / calories.length;
  const variance = calories.reduce((sum, c) => sum + Math.pow(c - avgCalories, 2), 0) / calories.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev < avgCalories * 0.15) {
    return {
      id: 'calorie-consistency',
      title: 'Consistent Calorie Intake',
      description: `You're maintaining steady calories around ${Math.round(avgCalories)} per day. This consistency supports your goals!`,
      icon: TrendingUp,
      metric: 'calories',
      trend: 'stable'
    };
  }

  return null;
}

/**
 * Analyze mood patterns with meals
 */
export function analyzeMoodPatterns(moodLogs: any[], meals: any[]): Insight | null {
  if (moodLogs.length < 5 || meals.length < 5) return null;

  // Find correlation between meal timing and mood
  const mealMoodPairs = moodLogs.map(mood => {
    const moodDate = new Date(mood.date);
    const sameDayMeals = meals.filter(meal => {
      const mealDate = new Date(meal.consumed_at);
      return mealDate.toDateString() === moodDate.toDateString();
    });

    return {
      mood: mood.mood,
      mealCount: sameDayMeals.length,
      avgCalories: sameDayMeals.reduce((sum, m) => sum + (m.total_calories || 0), 0) / (sameDayMeals.length || 1)
    };
  });

  const highMoodDays = mealMoodPairs.filter(p => p.mood >= 4);
  const avgMealsOnHighMoodDays = highMoodDays.reduce((sum, p) => sum + p.mealCount, 0) / (highMoodDays.length || 1);

  if (avgMealsOnHighMoodDays >= 3) {
    return {
      id: 'mood-meal-pattern',
      title: 'Regular Meals Boost Mood',
      description: `Your mood averages ${highMoodDays[0]?.mood.toFixed(1) || '4.0'}/5 on days with 3+ meals. Consistency matters!`,
      icon: Heart,
      metric: 'mood',
      trend: 'up'
    };
  }

  return null;
}

/**
 * Analyze step habits by day of week
 */
export function analyzeStepHabits(fitnessData: any[]): Insight | null {
  if (fitnessData.length < 7) return null;

  const daySteps = new Map<number, number[]>();
  fitnessData.forEach(day => {
    const date = new Date(day.date);
    const dayOfWeek = date.getDay();
    const steps = daySteps.get(dayOfWeek) || [];
    steps.push(day.steps || 0);
    daySteps.set(dayOfWeek, steps);
  });

  const avgByDay = Array.from(daySteps.entries()).map(([day, steps]) => ({
    day,
    avg: steps.reduce((sum, s) => sum + s, 0) / steps.length
  }));

  avgByDay.sort((a, b) => b.avg - a.avg);
  const bestDay = avgByDay[0];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  if (bestDay && bestDay.avg > 0) {
    return {
      id: 'step-habit-day',
      title: `Most Active on ${dayNames[bestDay.day]}s`,
      description: `You average ${Math.round(bestDay.avg).toLocaleString()} steps on ${dayNames[bestDay.day]}s. Keep that momentum!`,
      icon: Activity,
      metric: 'steps',
      trend: 'up'
    };
  }

  return null;
}

/**
 * Analyze diet adherence
 */
export function analyzeDietAdherence(meals: any[], preferences: string[]): Insight | null {
  if (meals.length < 5 || preferences.length === 0) return null;

  const recentMeals = meals.filter(m => {
    const daysDiff = differenceInDays(new Date(), new Date(m.consumed_at));
    return daysDiff <= 14;
  });

  const adherentMeals = recentMeals.filter(meal => {
    const isBalanced = (meal.total_protein || 0) >= 15;
    return isBalanced;
  });

  const adherenceRate = (adherentMeals.length / recentMeals.length) * 100;

  if (adherenceRate >= 70) {
    return {
      id: 'diet-adherence',
      title: 'Strong Diet Adherence',
      description: `${Math.round(adherenceRate)}% of your recent meals align with your goals. Excellent consistency!`,
      icon: Utensils,
      metric: 'diet',
      trend: 'up'
    };
  }

  return null;
}

/**
 * Analyze sustainability impact
 */
export function analyzeSustainabilityImpact(meals: any[], profile: any): Insight | null {
  if (meals.length < 7) return null;

  const preferences = profile?.dietary_preferences || [];
  const isPlantBased = preferences.includes('vegetarian') || preferences.includes('vegan');

  if (isPlantBased) {
    const recentMeals = meals.filter(m => {
      const daysDiff = differenceInDays(new Date(), new Date(m.consumed_at));
      return daysDiff <= 14;
    });

    return {
      id: 'sustainability-impact',
      title: 'Eco-Conscious Choices',
      description: `Your plant-based diet has reduced your carbon footprint significantly. Keep making a difference!`,
      icon: Lightbulb,
      metric: 'sustainability',
      trend: 'up'
    };
  }

  return null;
}

/**
 * Generate weekly progress insight
 */
export function generateWeeklyProgress(fitnessData: any[]): Insight | null {
  const weekData = fitnessData.filter(d => {
    const daysDiff = differenceInDays(new Date(), new Date(d.date));
    return daysDiff <= 7;
  });

  const prevWeekData = fitnessData.filter(d => {
    const daysDiff = differenceInDays(new Date(), new Date(d.date));
    return daysDiff > 7 && daysDiff <= 14;
  });

  if (weekData.length < 3 || prevWeekData.length < 3) return null;

  const thisWeekAvg = weekData.reduce((sum, d) => sum + (d.steps || 0), 0) / weekData.length;
  const lastWeekAvg = prevWeekData.reduce((sum, d) => sum + (d.steps || 0), 0) / prevWeekData.length;

  const change = ((thisWeekAvg - lastWeekAvg) / lastWeekAvg) * 100;

  if (Math.abs(change) >= 10) {
    return {
      id: 'weekly-progress',
      title: change > 0 ? 'Week-Over-Week Growth' : 'Activity Dip This Week',
      description: change > 0 
        ? `Your activity increased ${Math.round(change)}% compared to last week. Great progress!`
        : `Activity dropped ${Math.round(Math.abs(change))}% this week. Let's get back on track!`,
      icon: Calendar,
      metric: 'steps',
      trend: change > 0 ? 'up' : 'down'
    };
  }

  return null;
}

/**
 * Get top personalized insights
 */
export function getTopInsights(
  fitnessData: any[],
  meals: any[],
  moodLogs: any[],
  profile: any,
  limit = 3
): Insight[] {
  const insights = [
    analyzeCalorieConsistency(meals, profile),
    analyzeMoodPatterns(moodLogs, meals),
    analyzeStepHabits(fitnessData),
    analyzeDietAdherence(meals, profile?.dietary_preferences || []),
    analyzeSustainabilityImpact(meals, profile),
    generateWeeklyProgress(fitnessData)
  ].filter((insight): insight is Insight => insight !== null);

  return insights.slice(0, limit);
}
