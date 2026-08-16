import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { Contact } from '@/lib/state';

interface StatusBadgeProps {
  status: Contact['status'] | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  let variant: 'default' | 'success' | 'warning' | 'destructive' | 'info' | 'ai' | 'neutral' = 'neutral';
  let icon = '';

  switch (status) {
    case 'Ready':
      variant = 'neutral';
      break;
    case 'Claimed':
      variant = 'info';
      icon = '⋯';
      break;
    case 'Sending':
      variant = 'info';
      icon = '↻';
      break;
    case 'Sent':
      variant = 'success';
      icon = '✓';
      break;
    case 'Delivered':
      variant = 'success';
      icon = '✓✓';
      break;
    case 'Bounced':
    case 'Error':
    case 'Rejected':
      variant = 'destructive';
      icon = '✕';
      break;
    case 'Replied':
      variant = 'ai';
      icon = '✨';
      break;
    case 'Follow-up 1':
    case 'Follow-up 2':
    case 'Edited':
      variant = 'warning';
      icon = '↻';
      break;
    case 'Pending Review':
      variant = 'info';
      icon = '⋯';
      break;
    case 'Approved':
      variant = 'success';
      icon = '✓';
      break;
    default:
      variant = 'neutral';
  }

  return (
    <Badge variant={variant} className={className}>
      {icon && <span className="mr-0.5">{icon}</span>}
      {status}
    </Badge>
  );
};
