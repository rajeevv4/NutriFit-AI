import { format, startOfDay, startOfWeek, startOfMonth, startOfYear, eachDayOfInterval, eachHourOfInterval, eachWeekOfInterval, eachMonthOfInterval, subDays, subMonths, subYears } from 'date-fns';

export type Timeframe = 'day' | 'week' | 'month' | 'year';

export interface DataPoint {
  date: Date;
  value: number;
}

export interface AggregatedData {
  date: string;
  value: number;
  label: string;
}

/**
 * Get date range based on timeframe
 */
export function getDateRange(timeframe: Timeframe): { start: Date; end: Date } {
  const end = new Date();
  let start: Date;

  switch (timeframe) {
    case 'day':
      start = startOfDay(end);
      break;
    case 'week':
      start = subDays(end, 7);
      break;
    case 'month':
      start = subDays(end, 30);
      break;
    case 'year':
      start = subMonths(end, 12);
      break;
  }

  return { start, end };
}

/**
 * Aggregate data by hour (for day view)
 */
export function aggregateByHour(data: DataPoint[], startDate: Date, endDate: Date): AggregatedData[] {
  const hours = eachHourOfInterval({ start: startDate, end: endDate });
  
  return hours.map(hour => {
    const hourData = data.filter(d => {
      const dataHour = startOfDay(d.date).getTime() === startOfDay(hour).getTime() && 
                       d.date.getHours() === hour.getHours();
      return dataHour;
    });

    const value = hourData.reduce((sum, d) => sum + d.value, 0);
    
    return {
      date: hour.toISOString(),
      value,
      label: format(hour, 'ha')
    };
  });
}

/**
 * Aggregate data by day (for week/month view)
 */
export function aggregateByDay(data: DataPoint[], startDate: Date, endDate: Date): AggregatedData[] {
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  
  return days.map(day => {
    const dayData = data.filter(d => 
      startOfDay(d.date).getTime() === startOfDay(day).getTime()
    );

    const value = dayData.reduce((sum, d) => sum + d.value, 0);
    
    return {
      date: day.toISOString(),
      value,
      label: format(day, 'MMM d')
    };
  });
}

/**
 * Aggregate data by week (for month view alternative)
 */
export function aggregateByWeek(data: DataPoint[], startDate: Date, endDate: Date): AggregatedData[] {
  const weeks = eachWeekOfInterval({ start: startDate, end: endDate });
  
  return weeks.map(week => {
    const weekStart = startOfWeek(week);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const weekData = data.filter(d => {
      const dataDate = d.date.getTime();
      return dataDate >= weekStart.getTime() && dataDate < weekEnd.getTime();
    });

    const value = weekData.reduce((sum, d) => sum + d.value, 0) / (weekData.length || 1);
    
    return {
      date: week.toISOString(),
      value,
      label: format(week, 'MMM d')
    };
  });
}

/**
 * Aggregate data by month (for year view)
 */
export function aggregateByMonth(data: DataPoint[], startDate: Date, endDate: Date): AggregatedData[] {
  const months = eachMonthOfInterval({ start: startDate, end: endDate });
  
  return months.map(month => {
    const monthStart = startOfMonth(month);
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    const monthData = data.filter(d => {
      const dataDate = d.date.getTime();
      return dataDate >= monthStart.getTime() && dataDate < monthEnd.getTime();
    });

    const value = monthData.reduce((sum, d) => sum + d.value, 0);
    
    return {
      date: month.toISOString(),
      value,
      label: format(month, 'MMM')
    };
  });
}

/**
 * Fill missing data points with zeros for consistent charts
 */
export function fillMissingDataPoints(data: AggregatedData[], expectedLength: number): AggregatedData[] {
  if (data.length >= expectedLength) return data;
  
  const filled = [...data];
  while (filled.length < expectedLength) {
    filled.push({
      date: new Date().toISOString(),
      value: 0,
      label: ''
    });
  }
  
  return filled;
}
