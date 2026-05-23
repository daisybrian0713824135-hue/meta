import React from 'react';
import { cn } from '@/lib/utils';
import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LockedSectionProps {
  title?: string;
  message?: string;
  className?: string;
  children?: React.ReactNode;
}

export const LockedSection: React.FC<LockedSectionProps> = ({
  title = 'Feature Locked',
  message = 'Activate your account to unlock earning',
  className,
  children
}) => {
  return (
    <div className={cn('relative rounded-2xl overflow-hidden', className)}>
      {/* Blurred background content */}
      {children && (
        <div className="blur-sm pointer-events-none select-none opacity-50">
          {children}
        </div>
      )}
      {/* Lock overlay */}
      <div className={cn(
        'absolute inset-0 flex flex-col items-center justify-center z-10 bg-background/70 backdrop-blur-sm',
        !children && 'relative flex flex-col items-center justify-center py-12 border border-dashed border-border rounded-2xl'
      )}>
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <p className="text-sm font-semibold text-foreground text-center mb-1">{title}</p>
        <p className="text-xs text-muted-foreground text-center mb-4 max-w-[200px] text-pretty">{message}</p>
        <Link
          to="/dashboard/packages"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 px-3 gradient-bg-primary text-white transition-colors"
        >
          Activate Account
        </Link>
      </div>
    </div>
  );
};
