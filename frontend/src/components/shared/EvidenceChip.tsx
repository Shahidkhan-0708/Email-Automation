import React from 'react';

interface EvidenceChipProps {
  id: string;
  className?: string;
}

export const EvidenceChip: React.FC<EvidenceChipProps> = ({ id, className }) => {
  return (
    <span
      className={`font-mono text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200/70 inline-flex items-center gap-1 font-medium ${className || ''}`}
    >
      <span>🔗</span>
      {id}
    </span>
  );
};
