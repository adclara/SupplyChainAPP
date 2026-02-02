/**
 * Card Component
 * @description Modern card container with consistent light theme styling
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Card variant */
  variant?: 'default' | 'elevated' | 'flat' | 'interactive';
  /** Add padding */
  padded?: boolean;
  /** Add hover effect */
  hoverable?: boolean;
}

/**
 * Card container component with modern light theme styling
 */
export function Card({
  children,
  variant = 'default',
  padded = true,
  hoverable = false,
  className,
  ...props
}: CardProps): React.JSX.Element {
  const baseStyles = 'rounded-xl border bg-white transition-all duration-200';

  const variantStyles = {
    default: cn(
      'border-slate-200 shadow-sm',
      hoverable && 'hover:shadow-md hover:border-slate-300'
    ),
    elevated: cn(
      'border-slate-200 shadow-md',
      hoverable && 'hover:shadow-lg hover:border-slate-300'
    ),
    flat: cn(
      'border-slate-200 shadow-none',
      hoverable && 'hover:border-slate-300 bg-slate-50/50'
    ),
    interactive: cn(
      'border-slate-200 shadow-sm cursor-pointer',
      'hover:shadow-md hover:border-blue-300 hover:ring-1 hover:ring-blue-200',
      'active:scale-[0.995]'
    ),
  };

  return (
    <div
      className={cn(
        baseStyles,
        variantStyles[variant],
        padded && 'p-5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Card Header component
 */
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Title text */
  title?: string;
  /** Subtitle text */
  subtitle?: string;
  /** Action element (button, icon, etc.) */
  action?: React.ReactNode;
}

export function CardHeader({
  title,
  subtitle,
  action,
  children,
  className,
  ...props
}: CardHeaderProps): React.JSX.Element {
  return (
    <div
      className={cn('flex items-start justify-between gap-4', className)}
      {...props}
    >
      <div className="flex-1 min-w-0">
        {title && (
          <h3 className="text-base font-semibold text-slate-900 truncate">
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
        )}
        {children}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

/**
 * Card Content component
 */
export function CardContent({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return (
    <div className={cn('mt-4', className)} {...props}>
      {children}
    </div>
  );
}

/**
 * Card Footer component
 */
export function CardFooter({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return (
    <div
      className={cn(
        'mt-4 pt-4 border-t border-slate-100 flex items-center gap-3',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
