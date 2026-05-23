import React, { useEffect, useState } from 'react';
import { Share2 } from 'lucide-react';
import { supabase } from '@/db/supabase';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/common/StatCard';
import type { Referral } from '@/types/types';
import { PACKAGE_BADGE_COLORS } from '@/types/types';
import { cn } from '@/lib/utils';

const AdminReferrals: React.FC = () => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReferrals();
  }, []);

  const loadReferrals = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('referrals')
      .select('*, referrer:profiles!referrals_referrer_id_fkey(username, full_name), referred_profile:profiles!referrals_referred_id_fkey(username, full_name, status, package)')
      .order('created_at', { ascending: false })
      .limit(100);
    if (data) setReferrals(data as Referral[]);
    setLoading(false);
  };

  const totalReferrals = referrals.length;
  const activeReferrals = referrals.filter(r => r.referred_profile?.status === 'active').length;
  const totalCommission = referrals.reduce((s, r) => s + Number(r.total_commission_earned), 0);

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-xl md:text-2xl font-bold mb-6">Referral Management</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard title="Total Referrals" value={totalReferrals} icon={Share2} iconBg="bg-blue-100 dark:bg-blue-900/30" iconColor="text-blue-600 dark:text-blue-400" loading={loading} index={0} />
          <StatCard title="Active Referrals" value={activeReferrals} icon={Share2} iconBg="bg-green-100 dark:bg-green-900/30" iconColor="text-green-600 dark:text-green-400" loading={loading} index={1} />
          <StatCard title="Total Commission Paid" value={`KES ${totalCommission.toLocaleString()}`} icon={Share2} iconBg="bg-purple-100 dark:bg-purple-900/30" iconColor="text-purple-600 dark:text-purple-400" loading={loading} index={2} />
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">All Referrals</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {['Referrer', 'Referred User', 'Status', 'Package', 'Commission', 'Premium', 'Date'].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}><td colSpan={7} className="py-3 px-4"><Skeleton className="h-10 w-full bg-muted rounded" /></td></tr>
                  )) : referrals.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-10 text-sm text-muted-foreground">No referrals found</td></tr>
                  ) : referrals.map(r => (
                    <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <p className="text-sm font-medium">{(r as Referral & { referrer?: { username?: string } }).referrer?.username}</p>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <p className="text-sm">{r.referred_profile?.full_name || r.referred_profile?.username}</p>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge className={cn('text-xs capitalize', r.referred_profile?.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground')}>
                          {r.referred_profile?.status ?? 'inactive'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {r.referred_profile?.package
                          ? <Badge className={cn('text-xs capitalize', PACKAGE_BADGE_COLORS[r.referred_profile.package])}>{r.referred_profile.package}</Badge>
                          : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-green-600 dark:text-green-400 whitespace-nowrap">KES {Number(r.total_commission_earned).toLocaleString()}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge className={r.is_premium ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-xs' : 'bg-muted text-muted-foreground text-xs'}>
                          {r.is_premium ? 'Premium' : 'Standard'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{new Date(r.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminReferrals;
