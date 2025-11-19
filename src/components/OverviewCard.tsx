import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface OverviewCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  children?: React.ReactNode;
}

export const OverviewCard: React.FC<OverviewCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className = '',
  children,
}) => {
  return (
    <Card className={`wellness-card ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold gradient-text">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {trend && (
          <div className={`flex items-center text-xs mt-2 ${
            trend.isPositive ? 'text-success' : 'text-destructive'
          }`}>
            <span>{trend.isPositive ? '↗' : '↘'}</span>
            <span className="ml-1">{Math.abs(trend.value)}% from yesterday</span>
          </div>
        )}
        {children && (
          <div className="mt-3">
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
};