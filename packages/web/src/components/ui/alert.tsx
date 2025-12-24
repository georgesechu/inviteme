import * as React from 'react';
import { cn } from '../../lib/utils';

type Variant = 'info' | 'success' | 'error';

const variantClasses: Record<Variant, string> = {
  info: 'bg-green-50 text-green-900 border-green-200',
  success: 'bg-green-50 text-green-900 border-green-200',
  error: 'bg-red-50 text-red-900 border-red-200',
};

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
}

export function Alert({ className, variant = 'info', ...props }: AlertProps) {
  return (
    <div
      className={cn(
        'rounded-md border px-3 py-2 text-sm',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}

