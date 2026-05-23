import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Users, Link as LinkIcon, CheckCircle, Share2 } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { StatCard } from '@/components/common/StatCard';
import { LockedSection } from '@/components/common/LockedSection';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import type { Referral } from '@/types/types';
import { PACKAGE_BADGE_COLORS } from '@/types/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const ReferralsPage: React.FC = () => {
  const { profile, isActive } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  const referralLink = `${window.location.origin}/register?ref=${profile?.referral_code}`;
  const premiumRemaining = 3 - (profile?.premium_referrals_used ?? 0);

  useEffect(() => {
    loadReferrals();
  }, []);

  const loadReferrals = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('referrals')
      .select('*, referred_profile:profiles!referrals_referred_id_fkey(username,full_name,status,package,created_at)')
      .order('created_at', { ascending: false });
    if (data) setReferrals(data as Referral[]);
    setLoading(false);
  };

  const copyToClipboard = async (text: string, type: 'code' | 'link') => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success(type === 'code' ? 'Referral code copied!' : 'Referral link copied!');
    setTimeout(() => setCopied(null), 2000);
  };

  const totalReferrals = referrals.length;
  const activeReferrals = referrals.filter(r => r.referred_profile?.status === 'active').length;
  const totalCommission = referrals.reduce((s, r) => s + Number(r.total_commission_earned), 0);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-xl md:text-2xl font-bold mb-6 text-balance">Referral Program</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard title="Total Referrals" value={totalReferrals} icon={Users} iconBg="bg-blue-100 dark:bg-blue-900/30" iconColor="text-blue-600 dark:text-blue-400" loading={loading} index={0} />
          <StatCard title="Active Referrals" value={activeReferrals} icon={CheckCircle} iconBg="bg-green-100 dark:bg-green-900/30" iconColor="text-green-600 dark:text-green-400" loading={loading} index={1} />
          <StatCard title="Commission Earned" value={`KES ${totalCommission.toLocaleString()}`} icon={Share2} iconBg="bg-purple-100 dark:bg-purple-900/30" iconColor="text-purple-600 dark:text-purple-400" loading={loading} index={2} />
        </div>

        {/* Referral Code & Link */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Your Referral Code</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Input
                  value={profile?.referral_code ?? ''}
                  readOnly
                  className="font-mono text-lg tracking-widest font-bold text-primary px-3 h-11 bg-muted border-0"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 shrink-0"
                  onClick={() => copyToClipboard(profile?.referral_code ?? '', 'code')}
                >
                  {copied === 'code' ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Share this code with friends to earn 10% commission</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Referral Link</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Input value={referralLink} readOnly className="text-xs px-3 h-11 bg-muted border-0 truncate" />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 shrink-0"
                  onClick={() => copyToClipboard(referralLink, 'link')}
                >
                  {copied === 'link' ? <CheckCircle className="h-4 w-4 text-green-500" /> : <LinkIcon className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Share this link directly. New users get pre-filled referral code.</p>
            </CardContent>
          </Card>
        </div>

        {/* Premium Referrals Status */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4 mb-6"
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm font-semibold text-purple-800 dark:text-purple-300">Premium Referral Status</p>
              <p className="text-xs text-purple-700/80 dark:text-purple-400/80 text-pretty">
                You can earn from up to 3 premium referrals (activated accounts). You have {premiumRemaining} remaining.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-8 h-8 rounded-full border-2 flex items-center justify-center',
                    i < (profile?.premium_referrals_used ?? 0)
                      ? 'bg-purple-600 border-purple-600 text-white'
                      : 'border-purple-300 dark:border-purple-600'
                  )}
                >
                  {i < (profile?.premium_referrals_used ?? 0) && <CheckCircle className="h-4 w-4" />}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Referrals List */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Your Referrals</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg bg-muted" />)}</div>
            ) : referrals.length === 0 ? (
              <div className="text-center py-10">
                <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium mb-1">No referrals yet</p>
                <p className="text-xs text-muted-foreground text-pretty">Share your referral code to start earning commissions</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-max">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">User</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">Status</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">Package</th>
                      <th className="text-right py-2.5 px-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">Commission</th>
                      <th className="text-right py-2.5 px-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map(r => (
                      <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-medium">{r.referred_profile?.full_name || r.referred_profile?.username}</p>
                            <p className="text-xs text-muted-foreground">@{r.referred_profile?.username}</p>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <Badge className={cn('text-xs capitalize', r.referred_profile?.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground')}>
                            {r.referred_profile?.status}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {r.referred_profile?.package ? (
                            <Badge className={cn('text-xs capitalize', PACKAGE_BADGE_COLORS[r.referred_profile.package])}>
                              {r.referred_profile.package}
                            </Badge>
                          ) : <span className="text-xs text-muted-foreground">—</span>}
                        </td>
                        <td className="py-2.5 px-3 text-right text-sm font-semibold text-green-600 dark:text-green-400 whitespace-nowrap">
                          KES {Number(r.total_commission_earned).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(r.created_at).toLocaleDateString()}
                        </td>
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

export default ReferralsPage;
