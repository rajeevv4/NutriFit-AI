/**
 * Calculate personalized step goal based on historical data
 */
export function calculatePersonalStepsGoal(historicalData: any[], profile: any): number {
  if (historicalData.length === 0) {
    return profile?.fitness_goals?.includes('weight_loss') ? 10000 : 8000;
  }

  const avgSteps = historicalData.reduce((sum, d) => sum + (d.steps || 0), 0) / historicalData.length;
  
  // Set goal slightly above average to encourage growth
  const goal = Math.round(avgSteps * 1.1);
  
  // Ensure reasonable bounds
  return Math.max(5000, Math.min(15000, goal));
}

/**
 * Calculate daily calorie target based on profile
 */
export function calculateCalorieTarget(
  weight: number | null,
  height: number | null,
  age: number | null,
  fitnessGoals: string | null
): number {
  // Default target
  let baseCalories = 2000;

  // Adjust based on goals
  if (fitnessGoals?.includes('weight_loss')) {
    baseCalories = 1600;
  } else if (fitnessGoals?.includes('muscle_gain')) {
    baseCalories = 2400;
  } else if (fitnessGoals?.includes('maintain')) {
    baseCalories = 2000;
  }

  // Simple adjustment for weight (if available)
  if (weight && weight > 80) {
    baseCalories += 200;
  } else if (weight && weight < 60) {
    baseCalories -= 200;
  }

  return baseCalories;
}

/**
 * Calculate daily water target (in glasses)
 */
export function calculateWaterTarget(weight: number | null): number {
  if (!weight) return 8; // Default 8 glasses

  // Rough formula: weight in kg / 10
  const glasses = Math.round(weight / 10);
  
  // Ensure reasonable bounds (6-12 glasses)
  return Math.max(6, Math.min(12, glasses));
}

/**
 * Calculate progress percentage towards goal
 */
export function calculateProgressPercentage(
  current: number,
  goal: number,
  baseline = 0
): number {
  if (goal === baseline) return 100;
  
  const progress = ((current - baseline) / (goal - baseline)) * 100;
  return Math.max(0, Math.min(100, Math.round(progress)));
}

/**
 * Compare current period with previous period
 */
export function compareWithPreviousPeriod(
  currentData: any[],
  previousData: any[],
  metric: string
): { change: number; trend: 'up' | 'down' | 'stable' } {
  if (currentData.length === 0 || previousData.length === 0) {
    return { change: 0, trend: 'stable' };
  }

  const currentAvg = currentData.reduce((sum, d) => sum + (d[metric] || 0), 0) / currentData.length;
  const previousAvg = previousData.reduce((sum, d) => sum + (d[metric] || 0), 0) / previousData.length;

  const change = ((currentAvg - previousAvg) / previousAvg) * 100;

  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (change > 5) trend = 'up';
  else if (change < -5) trend = 'down';

  return { change: Math.round(change), trend };
}

/**
 * Adjust goals based on progress
 */
export function adjustGoalsBasedOnProgress(
  currentData: any[],
  historicalData: any[],
  currentGoal: number,
  metric: string
): number {
  const recentAvg = currentData.reduce((sum, d) => sum + (d[metric] || 0), 0) / (currentData.length || 1);

  // If consistently exceeding goal by 20%+, increase goal
  if (recentAvg >= currentGoal * 1.2) {
    return Math.round(currentGoal * 1.1);
  }

  // If consistently below 70% of goal, decrease goal to be more achievable
  if (recentAvg <= currentGoal * 0.7) {
    return Math.round(currentGoal * 0.9);
  }

  return currentGoal;
}
