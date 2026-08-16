import React from 'react';
import { Progress } from '@/components/ui/progress';

interface ConfidenceBarProps {
  value: number;
  showLabel?: boolean;
  className?: string;
}

export const ConfidenceBar: React.FC<ConfidenceBarProps> = ({ value, showLabel = false, className }) => {
  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <div className="w-24">
        <Progress value={value} className="h-1.5" />
      </div>
      {showLabel && <span className="text-xs font-semibold text-muted-foreground">{value}%</span>}
    </div>
  );
};
