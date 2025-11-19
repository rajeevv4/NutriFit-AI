import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import type { Achievement } from '@/utils/achievements';
import { cn } from '@/lib/utils';

interface AchievementCardProps {
  achievement: Achievement;
}

const BADGE_STYLES = {
  gold: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-500',
  silver: 'border-slate-400/50 bg-slate-400/10 text-slate-400',
  bronze: 'border-orange-600/50 bg-orange-600/10 text-orange-600'
};

export function AchievementCard({ achievement }: AchievementCardProps) {
  const Icon = achievement.icon;

  return (
    <Card className="bg-card border-border shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] animate-fade-in">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className={cn(
            "p-3 rounded-xl border-2",
            BADGE_STYLES[achievement.badge]
          )}>
            <Icon className="h-6 w-6" />
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-base leading-tight">
                {achievement.title}
              </h3>
              <Badge 
                variant="outline" 
                className={cn("text-xs capitalize", BADGE_STYLES[achievement.badge])}
              >
                {achievement.badge}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              {achievement.description}
            </p>

            <p className="text-xs text-muted-foreground">
              {format(achievement.date, 'MMM d, yyyy')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
