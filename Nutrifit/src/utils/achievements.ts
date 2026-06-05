import { differenceInDays } from 'date-fns';
import type { LucideIcon } from 'lucide-react';
import { Trophy, Flame, Heart, Droplets, TrendingUp, Award, Target } from 'lucide-react';

export type AchievementType = 'streak' | 'milestone' | 'health' | 'mood' | 'sustainability';
export type BadgeLevel = 'gold' | 'silver' | 'bronze';

export interface Achievement {
  id: string;
  type: AchievementType;
  title: string;
  description: string;
  date: Date;
  metric: string;
  value: number;
  icon: LucideIcon;
  badge: BadgeLevel;
}

/**
 * Detect consecutive days meeting step goal
 */
export function detectStepStreaks(fitnessData: any[], stepGoal = 8000): Achievement[] {
  const achievements: Achievement[] = [];
  const sortedData = [...fitnessData].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let currentStreak = 0;
  let longestStreak = 0;
  let streakStartDate = new Date();

  sortedData.forEach((day, index) => {
    if (day.steps >= stepGoal) {
      if (currentStreak === 0) {
        streakStartDate = new Date(day.date);
      }
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  });

  if (longestStreak >= 3) {
    achievements.push({
      id: `streak-steps-${longestStreak}`,
      type: 'streak',
      title: `${longestStreak}-Day Step Streak`,
      description: `Hit your step goal ${longestStreak} days in a row!`,
      date: streakStartDate,
      metric: 'steps',
      value: longestStreak,
      icon: Flame,
      badge: longestStreak >= 7 ? 'gold' : longestStreak >= 5 ? 'silver' : 'bronze'
    });
  }

  return achievements;
}

/**
 * Detect step count milestones
 */
export function detectStepMilestones(fitnessData: any[]): Achievement[] {
  const achievements: Achievement[] = [];
  const maxSteps = Math.max(...fitnessData.map(d => d.steps || 0));

  if (maxSteps >= 10000) {
    const milestone = fitnessData.find(d => d.steps >= 10000);
    achievements.push({
      id: 'milestone-10k-steps',
      type: 'milestone',
      title: 'Personal Best: 10K Steps',
      description: `Crushed ${maxSteps.toLocaleString()} steps in a single day!`,
      date: new Date(milestone?.date || new Date()),
      metric: 'steps',
      value: maxSteps,
      icon: Trophy,
      badge: maxSteps >= 15000 ? 'gold' : 'silver'
    });
  }

  return achievements;
}

/**
 * Detect healthy meal choices
 */
export function detectHealthyChoices(meals: any[], preferences: string[]): Achievement[] {
  const achievements: Achievement[] = [];
  
  const recentMeals = meals.filter(m => {
    const daysDiff = differenceInDays(new Date(), new Date(m.consumed_at));
    return daysDiff <= 7;
  });

  const alignedMeals = recentMeals.filter(meal => {
    const isBalanced = (meal.total_protein || 0) >= 20 && (meal.total_calories || 0) <= 700;
    return isBalanced;
  });

  if (alignedMeals.length >= 5) {
    achievements.push({
      id: 'health-balanced-week',
      type: 'health',
      title: 'Balanced Diet Champion',
      description: `Made ${alignedMeals.length} healthy meal choices this week!`,
      date: new Date(),
      metric: 'meals',
      value: alignedMeals.length,
      icon: Heart,
      badge: alignedMeals.length >= 10 ? 'gold' : 'silver'
    });
  }

  return achievements;
}

/**
 * Detect mood consistency
 */
export function detectMoodPeaks(moodLogs: any[]): Achievement[] {
  const achievements: Achievement[] = [];
  
  const recentMoods = moodLogs.filter(m => {
    const daysDiff = differenceInDays(new Date(), new Date(m.date));
    return daysDiff <= 7;
  });

  const highMoodDays = recentMoods.filter(m => m.mood >= 4);

  if (highMoodDays.length >= 5) {
    const avgMood = highMoodDays.reduce((sum, m) => sum + m.mood, 0) / highMoodDays.length;
    achievements.push({
      id: 'mood-peak-week',
      type: 'mood',
      title: 'Mood Master',
      description: `Maintained great mood for ${highMoodDays.length} days!`,
      date: new Date(),
      metric: 'mood',
      value: avgMood,
      icon: Award,
      badge: avgMood >= 4.5 ? 'gold' : 'silver'
    });
  }

  return achievements;
}

/**
 * Detect sustainability improvements
 */
export function detectSustainabilityBoosts(meals: any[], profile: any): Achievement[] {
  const achievements: Achievement[] = [];
  
  const preferences = profile?.dietary_preferences || [];
  const sustainableMeals = meals.filter(meal => {
    const isVeg = preferences.includes('vegetarian') || preferences.includes('vegan');
    const isLowCal = (meal.total_calories || 0) <= 600;
    return isVeg || isLowCal;
  });

  const percentage = (sustainableMeals.length / meals.length) * 100;

  if (percentage >= 70) {
    achievements.push({
      id: 'sustainability-hero',
      type: 'sustainability',
      title: 'Sustainability Hero',
      description: `${Math.round(percentage)}% of your meals were sustainable!`,
      date: new Date(),
      metric: 'sustainability',
      value: percentage,
      icon: TrendingUp,
      badge: percentage >= 90 ? 'gold' : 'silver'
    });
  }

  return achievements;
}

/**
 * Get all achievements from various data sources
 */
export function getAllAchievements(
  fitnessData: any[],
  meals: any[],
  moodLogs: any[],
  profile: any
): Achievement[] {
  const allAchievements: Achievement[] = [
    ...detectStepStreaks(fitnessData),
    ...detectStepMilestones(fitnessData),
    ...detectHealthyChoices(meals, profile?.dietary_preferences || []),
    ...detectMoodPeaks(moodLogs),
    ...detectSustainabilityBoosts(meals, profile)
  ];

  // Sort by date (most recent first) and badge level
  return allAchievements.sort((a, b) => {
    const badgeWeight = { gold: 3, silver: 2, bronze: 1 };
    if (badgeWeight[a.badge] !== badgeWeight[b.badge]) {
      return badgeWeight[b.badge] - badgeWeight[a.badge];
    }
    return b.date.getTime() - a.date.getTime();
  }).slice(0, 5); // Return top 5
}
