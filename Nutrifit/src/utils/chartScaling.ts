import { format } from 'date-fns';
import type { Timeframe } from './dataAggregation';

export interface ChartDomain {
  min: number;
  max: number;
}

/**
 * Calculate optimal Y-axis domain with padding
 */
export function calculateYAxisDomain(data: number[], paddingPercent = 0.1): ChartDomain {
  if (data.length === 0) return { min: 0, max: 100 };

  const max = Math.max(...data);
  const min = Math.min(...data);
  
  const range = max - min;
  const padding = range * paddingPercent;
  
  return {
    min: Math.max(0, Math.floor(min - padding)),
    max: Math.ceil(max + padding)
  };
}

/**
 * Format X-axis label based on timeframe
 */
export function formatXAxisLabel(date: string, timeframe: Timeframe): string {
  const d = new Date(date);
  
  switch (timeframe) {
    case 'day':
      return format(d, 'ha'); // 12am, 1pm, etc.
    case 'week':
      return format(d, 'EEE'); // Mon, Tue, etc.
    case 'month':
      return format(d, 'MMM d'); // Jan 1, Jan 2, etc.
    case 'year':
      return format(d, 'MMM'); // Jan, Feb, etc.
  }
}

/**
 * Generate optimal chart ticks for Y-axis
 */
export function generateChartTicks(min: number, max: number, steps = 5): number[] {
  const range = max - min;
  const stepSize = range / steps;
  
  const ticks: number[] = [];
  for (let i = 0; i <= steps; i++) {
    ticks.push(Math.round(min + (stepSize * i)));
  }
  
  return ticks;
}

/**
 * Get optimal chart height based on data points
 */
export function getOptimalChartHeight(dataPoints: number): number {
  if (dataPoints <= 7) return 250;
  if (dataPoints <= 30) return 300;
  return 350;
}

/**
 * Format tooltip value with metric suffix
 */
export function formatTooltipValue(value: number, metric: string): string {
  switch (metric) {
    case 'steps':
      return `${value.toLocaleString()} steps`;
    case 'calories':
      return `${Math.round(value)} cal`;
    case 'mood':
      return `${value.toFixed(1)}/5`;
    case 'water':
      return `${value} glasses`;
    case 'sustainability':
      return `${Math.round(value)}%`;
    default:
      return value.toString();
  }
}
