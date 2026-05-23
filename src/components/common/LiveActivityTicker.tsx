import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, TrendingUp, UserPlus, CreditCard, CheckCircle, Wallet } from 'lucide-react';
import { supabase } from '@/db/supabase';
import type { LiveActivity, ActivityType } from '@/types/types';

const ACTIVITY_ICONS: Record<ActivityType, React.ElementType> = {
  registration: UserPlus,
  withdrawal: Wallet,
  task_completion: CheckCircle,
  earning: TrendingUp,
  package_activation: CreditCard,
  manual: Activity,
};

const ACTIVITY_COLORS: Record<ActivityType, string> = {
  registration: 'text-blue-500',
  withdrawal: 'text-orange-500',
  task_completion: 'text-green-500',
  earning: 'text-emerald-500',
  package_activation: 'text-purple-500',
  manual: 'text-gray-500',
};

interface LiveActivityTickerProps {
  compact?: boolean;
}

export const LiveActivityTicker: React.FC<LiveActivityTickerProps> = ({ compact = false }) => {
  const [activities, setActivities] = useState<LiveActivity[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const channelIdRef = useRef(`live-activity-ticker-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    // Initial fetch
    supabase
      .from('live_activity')
      .select('*')
      .eq('is_visible', true)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setActivities(data as LiveActivity[]);
      });

    // Use a unique channel name per mount to avoid reusing an already-subscribed channel
    const channelName = channelIdRef.current;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_activity' }, (payload) => {
        const newActivity = payload.new as LiveActivity;
        if (newActivity.is_visible) {
          setActivities(prev => [newActivity, ...prev.slice(0, 19)]);
          setCurrentIndex(0);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (activities.length === 0) return;
    intervalRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % activities.length);
    }, 3500);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [activities.length]);

  if (activities.length === 0) return null;

  const current = activities[currentIndex];
  const Icon = ACTIVITY_ICONS[current?.type ?? 'manual'];
  const iconColor = ACTIVITY_COLORS[current?.type ?? 'manual'];

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm overflow-hidden">
        <span className="flex items-center gap-1 shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="text-xs font-medium text-green-600 dark:text-green-400 shrink-0">LIVE</span>
        </span>
        <AnimatePresence mode="wait">
          <motion.span
            key={current?.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="text-muted-foreground truncate"
          >
            {current?.message}
          </motion.span>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
        </span>
        <span className="text-sm font-semibold">Live Activity</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current?.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.35 }}
          className="flex items-center gap-3"
        >
          <div className={`w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0`}>
            <Icon className={`h-4.5 w-4.5 ${iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{current?.message}</p>
            <p className="text-xs text-muted-foreground">
              {current?.location && `${current.location} · `}
              {new Date(current?.created_at ?? '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          {current?.amount && (
            <span className="text-sm font-semibold text-green-600 dark:text-green-400 shrink-0">
              +KES {current.amount.toLocaleString()}
            </span>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-1 mt-3">
        {activities.slice(0, 6).map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-1 rounded-full transition-all ${i === currentIndex ? 'bg-primary w-4' : 'bg-muted w-1.5'}`}
          />
        ))}
      </div>
    </div>
  );
};
