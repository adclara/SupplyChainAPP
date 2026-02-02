/**
 * Button Component
 * @description Modern button component with variants, sizes, and loading states
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className,
  disabled,
  ...props
}: ButtonProps): React.JSX.Element {
  const baseStyles = cn(
    'inline-flex items-center justify-center gap-2',
    'font-medium rounded-lg transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'min-h-[40px]'
  );

  const variantStyles = {
    primary: cn(
      'bg-blue-600 text-white',
      'hover:bg-blue-700 active:bg-blue-800',
      'focus:ring-blue-500',
      'shadow-sm hover:shadow-md'
    ),
    secondary: cn(
      'bg-white text-slate-700',
      'border border-slate-300',
      'hover:bg-slate-50 hover:border-slate-400',
      'active:bg-slate-100',
      'focus:ring-slate-400'
    ),
    danger: cn(
      'bg-red-600 text-white',
      'hover:bg-red-700 active:bg-red-800',
      'focus:ring-red-500',
      'shadow-sm hover:shadow-md'
    ),
    success: cn(
      'bg-emerald-600 text-white',
      'hover:bg-emerald-700 active:bg-emerald-800',
      'focus:ring-emerald-500',
      'shadow-sm hover:shadow-md'
    ),
    ghost: cn(
      'bg-transparent text-slate-600',
      'hover:bg-slate-100 hover:text-slate-900',
      'active:bg-slate-200',
      'focus:ring-slate-400'
    ),
    outline: cn(
      'bg-transparent text-blue-600 border-2 border-blue-500',
      'hover:bg-blue-50 active:bg-blue-100',
      'focus:ring-blue-500'
    ),
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm h-8',
    md: 'px-4 py-2 text-sm h-10',
    lg: 'px-6 py-2.5 text-base h-12',
  };

  return (
    <button
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size={size} />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

function LoadingSpinner({ size = 'md' }: LoadingSpinnerProps): React.JSX.Element {
  const sizeStyles = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <svg
      className={cn('animate-spin', sizeStyles[size])}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export default Button;
