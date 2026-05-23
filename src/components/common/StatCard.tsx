import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  gradient?: string;
  iconBg?: string;
  iconColor?: string;
  trend?: number;
  loading?: boolean;
  index?: number;
}

export const StatCard: React.FC<StatCardProps> = ({
  title, value, subtitle, icon: Icon, gradient, iconBg, iconColor, trend, loading, index = 0
}) => {
  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-start justify-between mb-4">
          <Skeleton className="h-10 w-10 rounded-xl bg-muted" />
          <Skeleton className="h-5 w-16 rounded bg-muted" />
        </div>
        <Skeleton className="h-7 w-24 mb-1 bg-muted" />
        <Skeleton className="h-4 w-32 bg-muted" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      className={cn('relative bg-card border border-border rounded-2xl p-5 overflow-hidden hover:shadow-md transition-shadow h-full', gradient)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconBg || 'bg-primary/10')}>
          <Icon className={cn('h-5 w-5', iconColor || 'text-primary')} />
        </div>
        {trend !== undefined && (
          <span className={cn(
            'text-xs font-medium px-2 py-0.5 rounded-full',
            trend >= 0 ? 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30' : 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30'
          )}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground text-balance">{value}</p>
      <p className="text-sm font-medium text-foreground/80 mt-0.5 text-balance">{title}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-0.5 text-pretty">{subtitle}</p>}
    </motion.div>
  );
};
