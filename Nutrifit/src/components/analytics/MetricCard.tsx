import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface MetricCardProps {
  title: string;
  value: number;
  goal: number;
  unit: string;
  icon: LucideIcon;
  trend?: number;
  color: string;
  loading?: boolean;
}

export function MetricCard({ title, value, goal, unit, icon: Icon, trend, color, loading }: MetricCardProps) {
  const percentage = goal > 0 ? Math.round((value / goal) * 100) : 0;
  const isAboveGoal = percentage >= 100;

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <Skeleton className="h-6 w-24 mb-4" />
          <Skeleton className="h-10 w-32 mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border shadow-lg hover:shadow-xl transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>

        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{value.toLocaleString()}</span>
            <span className="text-sm text-muted-foreground">{unit}</span>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Goal: {goal.toLocaleString()} {unit}</span>
              <span className={cn(
                "font-semibold",
                isAboveGoal ? "text-primary" : "text-muted-foreground"
              )}>
                {percentage}%
              </span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.min(percentage, 100)}%`,
                  backgroundColor: color
                }}
              />
            </div>
          </div>

          {/* Trend indicator */}
          {trend !== undefined && (
            <div className="flex items-center gap-1 text-xs">
              {trend > 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-primary" />
                  <span className="text-primary font-medium">+{trend}%</span>
                </>
              ) : trend < 0 ? (
                <>
                  <TrendingDown className="h-3 w-3 text-destructive" />
                  <span className="text-destructive font-medium">{trend}%</span>
                </>
              ) : (
                <>
                  <Minus className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground font-medium">0%</span>
                </>
              )}
              <span className="text-muted-foreground">vs last period</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
