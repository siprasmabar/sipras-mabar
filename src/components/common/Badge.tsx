import React from 'react';
import { PhysicalCondition } from '../../types';
import { getConditionColor } from '../../lib/calculations';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'condition';
  condition?: PhysicalCondition;
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  condition,
  className = '',
  size = 'md'
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  if (condition) {
    const styling = getConditionColor(condition);
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border ${styling.badgeClass} ${sizeClasses} ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: styling.hex }} />
        {children || condition}
      </span>
    );
  }

  let colorClasses = 'bg-slate-100 text-slate-800 border-slate-200';
  if (variant === 'success') {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (variant === 'warning') {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (variant === 'danger') {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (variant === 'info') {
    colorClasses = 'bg-sky-50 text-sky-700 border-sky-200';
  } else if (variant === 'purple') {
    colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200';
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-medium ${colorClasses} ${sizeClasses} ${className}`}>
      {children}
    </span>
  );
};
