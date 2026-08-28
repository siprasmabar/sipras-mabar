import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  let sizeClasses = 'px-3.5 py-2 text-sm gap-2';
  if (size === 'sm') sizeClasses = 'px-2.5 py-1.5 text-xs gap-1.5';
  if (size === 'lg') sizeClasses = 'px-5 py-2.5 text-base gap-2.5';

  let variantClasses = '';
  switch (variant) {
    case 'primary':
      variantClasses = 'bg-teal-700 hover:bg-teal-800 text-white shadow-sm focus:ring-teal-500 active:bg-teal-900';
      break;
    case 'secondary':
      variantClasses = 'bg-slate-800 hover:bg-slate-900 text-white shadow-sm focus:ring-slate-500';
      break;
    case 'outline':
      variantClasses = 'border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-sm focus:ring-teal-500';
      break;
    case 'danger':
      variantClasses = 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm focus:ring-rose-500';
      break;
    case 'success':
      variantClasses = 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm focus:ring-emerald-500';
      break;
    case 'ghost':
      variantClasses = 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-400';
      break;
  }

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : (
        Icon && iconPosition === 'left' && <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      )}
      {children}
      {!isLoading && Icon && iconPosition === 'right' && <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />}
    </button>
  );
};
