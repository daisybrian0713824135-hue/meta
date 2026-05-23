import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, TrendingUp, CheckSquare, Package, Star, Calendar,
  Users, Wallet, ArrowRight, Gift, Trophy
} from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { StatCard } from '@/components/common/StatCard';
import { LiveActivityTicker } from '@/components/common/LiveActivityTicker';
import { LockedSection } from '@/components/common/LockedSection';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import type { Announcement, Transaction, TaskCompletion } from '@/types/types';
import { PACKAGE_BADGE_COLORS, PACKAGE_COLORS } from '@/types/types';
import { cn } from '@/lib/utils';

interface DashboardStats {
  todayEarnings: number;
  weekEarnings: number;
  monthEarnings: number;
  earningsChart: { day: string; amount: number }[];
  taskChart: { day: string; count: number }[];
}

const DashboardHome: React.FC = () => {
  const { profile, isActive, refreshProfile } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [recentTasks, setRecentTasks] = useState<TaskCompletion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshProfile();
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [earningsRes, announcementsRes, transactionsRes, taskRes] = await Promise.all([
        supabase.from('earnings').select('amount,earned_at').order('earned_at', { ascending: false }),
        supabase.from('announcements').select('*').eq('is_published', true).order('priority', { ascending: false }).limit(5),
        supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('task_completions').select('*,tasks(title,category,reward)').order('completed_at', { ascending: false }).limit(5),
      ]);

      const earnings = earningsRes.data ?? [];

      const todayEarnings = earnings
        .filter(e => e.earned_at >= todayStart)
        .reduce((s, e) => s + Number(e.amount), 0);
      const weekEarnings = earnings
        .filter(e => e.earned_at >= weekStart)
        .reduce((s, e) => s + Number(e.amount), 0);
      const monthEarnings = earnings
        .filter(e => e.earned_at >= monthStart)
        .reduce((s, e) => s + Number(e.amount), 0);

      // Build chart data for last 7 days
      const chartData: { day: string; amount: number }[] = [];
      const taskData: { day: string; count: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStr = d.toLocaleDateString('en', { weekday: 'short' });
        const dayStart2 = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
        const dayEnd2 = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).toISOString();
        const dayEarnings = earnings
          .filter(e => e.earned_at >= dayStart2 && e.earned_at < dayEnd2)
          .reduce((s, e) => s + Number(e.amount), 0);
        chartData.push({ day: dayStr, amount: dayEarnings });
        taskData.push({ day: dayStr, count: 0 });
      }

      setStats({ todayEarnings, weekEarnings, monthEarnings, earningsChart: chartData, taskChart: taskData });
      setAnnouncements((announcementsRes.data ?? []) as Announcement[]);
      setRecentTransactions((transactionsRes.data ?? []) as Transaction[]);
      setRecentTasks((taskRes.data ?? []) as TaskCompletion[]);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Current Balance', value: `KES ${(profile?.withdrawal_balance ?? 0).toLocaleString()}`,
      icon: Wallet, iconBg: 'bg-primary/10', iconColor: 'text-primary'
    },
    {
      title: "Today's Earnings", value: `KES ${(stats?.todayEarnings ?? 0).toLocaleString()}`,
      icon: DollarSign, iconBg: 'bg-green-100 dark:bg-green-900/30', iconColor: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Weekly Earnings', value: `KES ${(stats?.weekEarnings ?? 0).toLocaleString()}`,
      icon: TrendingUp, iconBg: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Monthly Earnings', value: `KES ${(stats?.monthEarnings ?? 0).toLocaleString()}`,
      icon: Calendar, iconBg: 'bg-purple-100 dark:bg-purple-900/30', iconColor: 'text-purple-600 dark:text-purple-400'
    },
    {
      title: 'Referral Earnings', value: `KES ${(profile?.referral_earnings ?? 0).toLocaleString()}`,
      icon: Users, iconBg: 'bg-orange-100 dark:bg-orange-900/30', iconColor: 'text-orange-600 dark:text-orange-400'
    },
    {
      title: 'Completed Tasks', value: profile?.completed_tasks ?? 0,
      icon: CheckSquare, iconBg: 'bg-teal-100 dark:bg-teal-900/30', iconColor: 'text-teal-600 dark:text-teal-400'
    },
  ];

  return (
    <DashboardLayout>
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="gradient-bg-primary rounded-2xl p-6 text-white mb-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-white/5 translate-y-1/2 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-balance">
              Welcome back, {profile?.full_name?.split(' ')[0] || profile?.username}! 👋
            </h1>
            <p className="text-white/80 text-sm mt-1 text-pretty">
              {isActive
                ? 'Your account is active. Start completing tasks to earn more!'
                : 'Activate your account to start earning money today.'}
            </p>
          </div>
          {!isActive && (
            <Link to="/dashboard/packages" className="inline-flex items-center justify-center rounded-md text-sm font-semibold px-4 py-2 bg-white text-primary hover:bg-white/90 shrink-0 transition-colors">
              Activate Now
            </Link>
          )}
          {isActive && profile?.package && (
            <div className="shrink-0 bg-white/20 rounded-xl px-4 py-2 text-center">
              <p className="text-xs text-white/70">Active Package</p>
              <p className="text-lg font-bold capitalize">{profile.package}</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Inactive banner */}
      {!isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6 flex items-start gap-3"
        >
          <Package className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Account Not Activated</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 text-pretty">
              Purchase a package to unlock tasks, earnings, and withdrawals. Packages start from KES 500.
            </p>
          </div>
          <Link to="/dashboard/packages" className="inline-flex items-center justify-center rounded-md text-xs font-medium px-3 h-8 shrink-0 bg-amber-600 hover:bg-amber-700 text-white transition-colors">
            View Packages
          </Link>
        </motion.div>
      )}

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {statCards.map((card, i) => (
          <StatCard key={card.title} {...card} loading={loading} index={i} />
        ))}
      </div>

      {/* Live Activity Ticker */}
      <div className="mb-6">
        <LiveActivityTicker />
      </div>

      {/* Charts & Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Earnings Chart */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Earnings Chart (7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-48 w-full rounded-xl bg-muted" />
              ) : isActive ? (
                <div className="w-full min-w-0 overflow-hidden h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats?.earningsChart ?? []}>
                      <defs>
                        <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(262,83%,58%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(262,83%,58%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                        formatter={(v: number) => [`KES ${v}`, 'Earnings']}
                      />
                      <Area type="monotone" dataKey="amount" stroke="hsl(262,83%,58%)" fill="url(#earningsGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <LockedSection message="Activate your account to see earnings data" />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Announcements */}
        <div>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Announcements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg bg-muted" />)
              ) : announcements.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No announcements</p>
              ) : (
                announcements.map(a => (
                  <div key={a.id} className="p-3 rounded-xl bg-muted/50 border border-border">
                    <div className="flex items-start gap-2">
                      {a.is_pinned && <Star className="h-3.5 w-3.5 text-yellow-500 shrink-0 mt-0.5" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{a.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 text-pretty">{a.content}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Task Chart + Daily Reward + Package Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {/* Task Graph */}
        <div>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Tasks (7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-36 w-full rounded-xl bg-muted" />
              ) : isActive ? (
                <div className="w-full min-w-0 overflow-hidden h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.taskChart ?? []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                        formatter={(v: number) => [v, 'Tasks']}
                      />
                      <Bar dataKey="count" fill="hsl(199,89%,48%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <LockedSection message="Activate to see your task data" className="h-36" />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Daily Reward */}
        <div>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Gift className="h-4 w-4 text-primary" />
                Daily Reward
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isActive ? (
                <div className="text-center py-3">
                  <div className="w-16 h-16 gradient-bg-primary rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <Gift className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-primary mb-1">KES 10</p>
                  <p className="text-xs text-muted-foreground mb-4">Daily check-in reward</p>
                  <Link to="/dashboard/tasks" className="w-full inline-flex items-center justify-center rounded-md text-xs font-medium px-3 h-8 gradient-bg-primary text-white transition-colors">
                    Claim Today
                  </Link>
                </div>
              ) : (
                <LockedSection message="Activate to claim daily rewards" className="h-36" />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Active Package */}
        <div>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                Active Package
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile?.package ? (
                <div>
                  <div className={cn('w-full rounded-xl p-4 bg-gradient-to-br text-white mb-3', PACKAGE_COLORS[profile.package])}>
                    <p className="text-xs opacity-80">Your Package</p>
                    <p className="text-xl font-bold capitalize">{profile.package}</p>
                    {profile.package_expires_at && (
                      <p className="text-xs opacity-70 mt-1">
                        Expires: {new Date(profile.package_expires_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Link to="/dashboard/packages" className="w-full inline-flex items-center justify-center rounded-md border border-input text-xs font-medium px-3 h-8 bg-background hover:bg-accent hover:text-accent-foreground transition-colors">
                    Upgrade Package
                  </Link>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Package className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium mb-3">No Active Package</p>
                  <Link to="/dashboard/packages" className="inline-flex items-center justify-center rounded-md text-xs font-medium px-3 h-8 gradient-bg-primary text-white transition-colors">
                    Choose Package
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
            <Link to="/dashboard/earnings" className="inline-flex items-center text-xs font-medium px-2 h-8 text-primary hover:bg-accent rounded-md transition-colors">
              View All <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg bg-muted" />)}
              </div>
            ) : recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No transactions yet</p>
            ) : (
              <div className="space-y-2">
                {recentTransactions.map(tx => (
                  <div key={tx.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                      tx.type === 'payment' ? 'bg-blue-100 dark:bg-blue-900/30' :
                        tx.type === 'withdrawal' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'
                    )}>
                      <DollarSign className={cn('h-4 w-4', tx.type === 'withdrawal' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400')} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate capitalize">{tx.type.replace('_', ' ')}</p>
                      <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={cn('text-sm font-semibold shrink-0', tx.type === 'withdrawal' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400')}>
                      {tx.type === 'withdrawal' ? '-' : '+'}KES {Number(tx.amount).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Top Earners
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { rank: 1, name: 'Sarah M.', amount: 12400, badge: 'gold' },
                { rank: 2, name: 'Kevin O.', amount: 9850, badge: 'silver' },
                { rank: 3, name: 'Grace A.', amount: 7200, badge: 'bronze' },
                { rank: 4, name: 'John K.', amount: 5600, badge: null },
                { rank: 5, name: 'Lucy W.', amount: 4100, badge: null },
              ].map(({ rank, name, amount, badge }) => (
                <div key={rank} className="flex items-center gap-3 py-1.5">
                  <span className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0',
                    rank === 1 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      rank === 2 ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' :
                        rank === 3 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                          'bg-muted text-muted-foreground'
                  )}>#{rank}</span>
                  <span className="flex-1 text-sm font-medium">{name}</span>
                  {badge && (
                    <Badge className={cn('text-xs capitalize', PACKAGE_BADGE_COLORS[badge as keyof typeof PACKAGE_BADGE_COLORS])}>{badge}</Badge>
                  )}
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400 shrink-0">KES {amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Categories Quick Access */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Task Categories</CardTitle>
          <Link to="/dashboard/tasks" className="inline-flex items-center text-xs font-medium px-2 h-8 text-primary hover:bg-accent rounded-md transition-colors">
            All Tasks <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Surveys', icon: '📋', count: 4, color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' },
              { label: 'Watching Ads', icon: '📺', count: 3, color: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' },
              { label: 'App Testing', icon: '📱', count: 2, color: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' },
              { label: 'Data Tasks', icon: '🔍', count: 2, color: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' },
            ].map(({ label, icon, count, color }) => (
              <Link key={label} to="/dashboard/tasks">
                <div className={cn('border rounded-xl p-3 text-center hover:shadow-sm transition-shadow cursor-pointer', color)}>
                  <div className="text-2xl mb-1">{icon}</div>
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-xs text-muted-foreground">{isActive ? `${count} tasks` : 'Locked'}</p>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default DashboardHome;
