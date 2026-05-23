import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, UserCheck, UserX, CreditCard, Wallet, TrendingUp, Package, Activity } from 'lucide-react';
import { supabase } from '@/db/supabase';
import AdminLayout from '@/components/layouts/AdminLayout';
import { StatCard } from '@/components/common/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalRevenue: number;
  totalTransactions: number;
  pendingWithdrawals: number;
  pendingPayments: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [revenueChart, setRevenueChart] = useState<{ day: string; revenue: number }[]>([]);
  const [userChart, setUserChart] = useState<{ day: string; users: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    const [usersRes, activeRes, inactiveRes, transactionsRes, withdrawalsRes, activationRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'inactive'),
      supabase.from('transactions').select('amount,type,created_at'),
      supabase.from('withdrawals').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('activation_logs').select('amount_paid,activated_at'),
    ]);

    const transactions = transactionsRes.data ?? [];
    const activations = activationRes.data ?? [];
    const totalRevenue = activations.reduce((s, a) => s + Number(a.amount_paid), 0);

    // Build 7-day chart
    const now = new Date();
    const revChart = [];
    const usrChart = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const day = d.toLocaleDateString('en', { weekday: 'short' });
      const dStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
      const dEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).toISOString();
      const rev = activations.filter(a => a.activated_at >= dStart && a.activated_at < dEnd).reduce((s, a) => s + Number(a.amount_paid), 0);
      revChart.push({ day, revenue: rev });
      usrChart.push({ day, users: 0 });
    }

    setStats({
      totalUsers: usersRes.count ?? 0,
      activeUsers: activeRes.count ?? 0,
      inactiveUsers: inactiveRes.count ?? 0,
      totalRevenue,
      totalTransactions: transactions.length,
      pendingWithdrawals: withdrawalsRes.count ?? 0,
      pendingPayments: 0,
    });
    setRevenueChart(revChart);
    setUserChart(usrChart);
    setLoading(false);
  };

  const statCards = [
    { title: 'Total Users', value: stats?.totalUsers ?? 0, icon: Users, iconBg: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600 dark:text-blue-400' },
    { title: 'Active Users', value: stats?.activeUsers ?? 0, icon: UserCheck, iconBg: 'bg-green-100 dark:bg-green-900/30', iconColor: 'text-green-600 dark:text-green-400' },
    { title: 'Inactive Users', value: stats?.inactiveUsers ?? 0, icon: UserX, iconBg: 'bg-orange-100 dark:bg-orange-900/30', iconColor: 'text-orange-600 dark:text-orange-400' },
    { title: 'Total Revenue', value: `KES ${(stats?.totalRevenue ?? 0).toLocaleString()}`, icon: TrendingUp, iconBg: 'bg-purple-100 dark:bg-purple-900/30', iconColor: 'text-purple-600 dark:text-purple-400' },
    { title: 'Transactions', value: stats?.totalTransactions ?? 0, icon: CreditCard, iconBg: 'bg-primary/10', iconColor: 'text-primary' },
    { title: 'Pending Withdrawals', value: stats?.pendingWithdrawals ?? 0, icon: Wallet, iconBg: 'bg-red-100 dark:bg-red-900/30', iconColor: 'text-red-600 dark:text-red-400' },
  ];

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-xl md:text-2xl font-bold mb-6 text-balance">Admin Dashboard</h1>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {statCards.map((card, i) => (
            <StatCard key={card.title} {...card} loading={loading} index={i} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base font-semibold">Revenue (7 Days)</CardTitle></CardHeader>
            <CardContent>
              <div className="w-full min-w-0 overflow-hidden h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`KES ${v}`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="hsl(262,83%,58%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base font-semibold">User Growth (7 Days)</CardTitle></CardHeader>
            <CardContent>
              <div className="w-full min-w-0 overflow-hidden h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={userChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                    <Line type="monotone" dataKey="users" stroke="hsl(199,89%,48%)" strokeWidth={2.5} dot={{ fill: 'hsl(199,89%,48%)', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
