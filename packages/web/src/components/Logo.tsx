import { MessageCircle } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showIcon = true, className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showIcon && (
        <MessageCircle className={`${iconSizes[size]} text-green-600`} />
      )}
      <span className={`font-bold ${sizeClasses[size]}`}>
        <span className="text-green-600">WA</span>
        <span className="text-black">geni</span>
      </span>
    </div>
  );
}

