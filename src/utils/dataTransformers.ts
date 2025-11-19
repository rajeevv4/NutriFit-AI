import type { DataPoint } from './dataAggregation';

/**
 * Transform fitness data to chart format
 */
export function transformFitnessToChart(
  rawData: any[],
  metric: 'steps' | 'calories' | 'distance' | 'active_minutes' | 'heart_rate'
): DataPoint[] {
  return rawData.map(row => ({
    date: new Date(row.date),
    value: row[metric] || 0
  })).filter(d => d.value > 0);
}

/**
 * Transform meals to daily calorie totals
 */
export function transformMealsToCalories(mealsData: any[]): DataPoint[] {
  const dailyCalories = new Map<string, number>();
  
  mealsData.forEach(meal => {
    const date = new Date(meal.consumed_at).toDateString();
    const current = dailyCalories.get(date) || 0;
    dailyCalories.set(date, current + (meal.total_calories || 0));
  });
  
  return Array.from(dailyCalories.entries()).map(([dateStr, value]) => ({
    date: new Date(dateStr),
    value
  }));
}

/**
 * Transform mood logs to daily average scores
 */
export function transformMoodToScore(moodLogs: any[]): DataPoint[] {
  const dailyMoods = new Map<string, number[]>();
  
  moodLogs.forEach(log => {
    const date = new Date(log.date).toDateString();
    const moods = dailyMoods.get(date) || [];
    moods.push(log.mood);
    dailyMoods.set(date, moods);
  });
  
  return Array.from(dailyMoods.entries()).map(([dateStr, moods]) => ({
    date: new Date(dateStr),
    value: moods.reduce((sum, m) => sum + m, 0) / moods.length
  }));
}

/**
 * Transform water logs to daily glass count
 */
export function transformWaterToGlasses(waterLogs: any[]): DataPoint[] {
  const dailyWater = new Map<string, number>();
  
  waterLogs.forEach(log => {
    const date = new Date(log.timestamp).toDateString();
    const current = dailyWater.get(date) || 0;
    dailyWater.set(date, current + log.glasses_logged);
  });
  
  return Array.from(dailyWater.entries()).map(([dateStr, value]) => ({
    date: new Date(dateStr),
    value
  }));
}

/**
 * Calculate daily sustainability score based on meal choices
 */
export function calculateDailySustainability(meals: any[], profile: any): DataPoint[] {
  const dailyScores = new Map<string, number[]>();
  
  meals.forEach(meal => {
    const date = new Date(meal.consumed_at).toDateString();
    const scores = dailyScores.get(date) || [];
    
    // Calculate sustainability score (0-100)
    let score = 50; // baseline
    
    // Check if meal aligns with dietary preferences
    const foodItems = Array.isArray(meal.food_items) ? meal.food_items : [];
    const preferences = profile?.dietary_preferences || [];
    
    if (preferences.includes('vegetarian') || preferences.includes('vegan')) {
      score += 20;
    }
    
    if (preferences.includes('vegan')) {
      score += 10;
    }
    
    // Lower score for high calorie meals
    if (meal.total_calories > 800) {
      score -= 10;
    }
    
    // Higher score for balanced macros
    const protein = meal.total_protein || 0;
    const carbs = meal.total_carbs || 0;
    if (protein > 20 && carbs < 50) {
      score += 10;
    }
    
    scores.push(Math.min(100, Math.max(0, score)));
    dailyScores.set(date, scores);
  });
  
  return Array.from(dailyScores.entries()).map(([dateStr, scores]) => ({
    date: new Date(dateStr),
    value: scores.reduce((sum, s) => sum + s, 0) / scores.length
  }));
}

/**
 * Apply dietary filters to meals
 */
export function applyDietaryFilters(meals: any[], preferences: string[]): any[] {
  if (!preferences || preferences.length === 0) return meals;
  
  return meals.filter(meal => {
    const foodItems = Array.isArray(meal.food_items) ? meal.food_items : [];
    
    // Simple filtering logic - in production, this would be more sophisticated
    if (preferences.includes('vegan')) {
      // Check if meal contains dairy or eggs (simplified)
      const containsDairy = JSON.stringify(foodItems).toLowerCase().includes('dairy');
      if (containsDairy) return false;
    }
    
    return true;
  });
}
