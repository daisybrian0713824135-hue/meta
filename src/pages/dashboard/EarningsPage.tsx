import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { StatCard } from '@/components/common/StatCard';
import { LockedSection } from '@/components/common/LockedSection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { Earning } from '@/types/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const EarningsPage: React.FC = () => {
  const { profile, isActive } = useAuth();
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<{ day: string; amount: number }[]>([]);

  useEffect(() => {
    if (isActive) loadEarnings();
    else setLoading(false);
  }, [isActive]);

  const loadEarnings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('earnings')
      .select('*')
      .order('earned_at', { ascending: false })
      .limit(50);
    if (data) {
      setEarnings(data as Earning[]);
      // Build 7-day chart
      const now = new Date();
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
        const dayStr = d.toLocaleDateString('en', { weekday: 'short' });
        const dStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
        const dEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).toISOString();
        const amt = (data as Earning[])
          .filter(e => e.earned_at >= dStart && e.earned_at < dEnd)
          .reduce((s, e) => s + Number(e.amount), 0);
        return { day: dayStr, amount: amt };
      });
      setChartData(days);
    }
    setLoading(false);
  };

  const totalEarnings = earnings.reduce((s, e) => s + Number(e.amount), 0);
  const taskEarnings = earnings.filter(e => e.source === 'task').reduce((s, e) => s + Number(e.amount), 0);
  const referralEarnings = earnings.filter(e => e.source === 'referral').reduce((s, e) => s + Number(e.amount), 0);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-xl md:text-2xl font-bold mb-6 text-balance">Earnings</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard title="Total Earnings" value={`KES ${(profile?.total_earnings ?? 0).toLocaleString()}`} icon={DollarSign} iconBg="bg-green-100 dark:bg-green-900/30" iconColor="text-green-600 dark:text-green-400" loading={loading} index={0} />
          <StatCard title="Task Earnings" value={`KES ${taskEarnings.toLocaleString()}`} icon={TrendingUp} iconBg="bg-blue-100 dark:bg-blue-900/30" iconColor="text-blue-600 dark:text-blue-400" loading={loading} index={1} />
          <StatCard title="Referral Earnings" value={`KES ${(profile?.referral_earnings ?? 0).toLocaleString()}`} icon={Calendar} iconBg="bg-purple-100 dark:bg-purple-900/30" iconColor="text-purple-600 dark:text-purple-400" loading={loading} index={2} />
        </div>

        {/* Earnings Chart */}
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-base font-semibold">7-Day Earnings</CardTitle></CardHeader>
          <CardContent>
            {!isActive ? (
              <LockedSection message="Activate your account to view earnings data" />
            ) : loading ? (
              <Skeleton className="h-48 w-full rounded-xl bg-muted" />
            ) : (
              <div className="w-full min-w-0 overflow-hidden h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                      formatter={(v: number) => [`KES ${v}`, 'Earned']}
                    />
                    <Line type="monotone" dataKey="amount" stroke="hsl(262,83%,58%)" strokeWidth={2.5} dot={{ fill: 'hsl(262,83%,58%)', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Earnings History */}
        <Card>
          <CardHeader><CardTitle className="text-base font-semibold">Earnings History</CardTitle></CardHeader>
          <CardContent>
            {!isActive ? (
              <LockedSection message="Activate your account to see earnings history" />
            ) : loading ? (
              <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg bg-muted" />)}</div>
            ) : earnings.length === 0 ? (
              <div className="text-center py-10">
                <TrendingUp className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No earnings yet. Complete tasks to start earning!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-max">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">Date</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">Source</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">Description</th>
                      <th className="text-right py-2.5 px-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earnings.map(e => (
                      <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="py-2.5 px-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(e.earned_at).toLocaleDateString()}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <Badge className={`text-xs capitalize ${e.source === 'referral' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                            {e.source}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-sm text-foreground/80 whitespace-nowrap">{e.description || '—'}</td>
                        <td className="py-2.5 px-3 text-right text-sm font-semibold text-green-600 dark:text-green-400 whitespace-nowrap">+KES {Number(e.amount).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default EarningsPage;
