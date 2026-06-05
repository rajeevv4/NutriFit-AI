import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { Insight } from '@/utils/insightGenerator';
import { cn } from '@/lib/utils';

interface InsightCardProps {
  insight: Insight;
}

export function InsightCard({ insight }: InsightCardProps) {
  const Icon = insight.icon;
  const TrendIcon = insight.trend === 'up' ? TrendingUp : insight.trend === 'down' ? TrendingDown : Minus;

  return (
    <Card className="bg-card border-border shadow-lg hover:shadow-xl transition-all hover:scale-[1.01]">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
            <Icon className="h-5 w-5 text-primary" />
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base">
                {insight.title}
              </h3>
              <TrendIcon className={cn(
                "h-4 w-4",
                insight.trend === 'up' && "text-primary",
                insight.trend === 'down' && "text-destructive",
                insight.trend === 'stable' && "text-muted-foreground"
              )} />
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              {insight.description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
