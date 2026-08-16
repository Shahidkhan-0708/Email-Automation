import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: 'positive' | 'negative' | 'neutral';
  className?: string;
  valueColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  trend = 'neutral',
  className,
  valueColor
}) => {
  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardContent className="p-5 flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span
          className="text-2xl font-bold tracking-tight text-foreground"
          style={valueColor ? { color: valueColor } : undefined}
        >
          {value}
        </span>
        {subtext && (
          <span
            className={cn(
              'text-xs flex items-center gap-1 mt-0.5',
              trend === 'positive' && 'text-emerald-600 font-medium',
              trend === 'negative' && 'text-red-600 font-medium',
              trend === 'neutral' && 'text-muted-foreground'
            )}
          >
            {subtext}
          </span>
        )}
      </CardContent>
    </Card>
  );
};
