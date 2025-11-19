import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, Utensils, Heart, Droplets } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { aggregateByDay, aggregateByHour, aggregateByMonth, type Timeframe } from '@/utils/dataAggregation';
import { calculateYAxisDomain, formatTooltipValue } from '@/utils/chartScaling';
import type { DataPoint } from '@/utils/dataAggregation';

interface DynamicTrendChartProps {
  title: string;
  metric: 'steps' | 'calories' | 'mood' | 'water';
  timeframe: Timeframe;
  data: DataPoint[];
  loading?: boolean;
}

const METRIC_CONFIG: Record<string, { icon: LucideIcon; color: string; label: string }> = {
  steps: { icon: Activity, color: '#10b981', label: 'Steps' },
  calories: { icon: Utensils, color: '#f59e0b', label: 'Calories' },
  mood: { icon: Heart, color: '#ec4899', label: 'Mood' },
  water: { icon: Droplets, color: '#3b82f6', label: 'Water' }
};

export function DynamicTrendChart({ title, metric, timeframe, data, loading }: DynamicTrendChartProps) {
  const config = METRIC_CONFIG[metric];
  const Icon = config.icon;

  const chartData = useMemo(() => {
    if (data.length === 0) return [];

    const start = new Date(Math.min(...data.map(d => d.date.getTime())));
    const end = new Date(Math.max(...data.map(d => d.date.getTime())));

    let aggregated;
    if (timeframe === 'day') {
      aggregated = aggregateByHour(data, start, end);
    } else if (timeframe === 'year') {
      aggregated = aggregateByMonth(data, start, end);
    } else {
      aggregated = aggregateByDay(data, start, end);
    }

    return aggregated;
  }, [data, timeframe]);

  const yDomain = useMemo(() => {
    const values = chartData.map(d => d.value);
    return calculateYAxisDomain(values);
  }, [chartData]);

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center gap-2">
          <Icon className="h-5 w-5" style={{ color: config.color }} />
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            No data available for this period
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border shadow-lg">
      <CardHeader className="flex flex-row items-center gap-2 pb-4">
        <Icon className="h-5 w-5" style={{ color: config.color }} />
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id={`gradient-${metric}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={config.color} stopOpacity={0.8} />
                <stop offset="95%" stopColor={config.color} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="label" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              domain={[yDomain.min, yDomain.max]}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))'
              }}
              formatter={(value: number) => formatTooltipValue(value, metric)}
              labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={config.color}
              strokeWidth={2.5}
              fill={`url(#gradient-${metric})`}
              dot={{ fill: config.color, r: 3 }}
              activeDot={{ r: 5, fill: config.color }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
