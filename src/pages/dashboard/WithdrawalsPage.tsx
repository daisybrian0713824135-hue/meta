import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Wallet, Clock, CheckCircle, XCircle, ArrowDownLeft } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { LockedSection } from '@/components/common/LockedSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import type { Withdrawal } from '@/types/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const schema = z.object({
  phone: z.string().min(9, 'Valid M-Pesa number required'),
  amount: z.coerce.number().min(500, 'Minimum withdrawal is KES 500'),
});

type FormData = z.infer<typeof schema>;

const WithdrawalsPage: React.FC = () => {
  const { profile, isActive, refreshProfile } = useAuth();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { phone: profile?.phone ?? '', amount: 500 },
  });

  useEffect(() => {
    loadWithdrawals();
  }, []);

  const loadWithdrawals = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('withdrawals')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setWithdrawals(data as Withdrawal[]);
    setLoading(false);
  };

  const onSubmit = async (data: FormData) => {
    if (!profile) return;
    if (!isActive) { toast.error('Activate your account to withdraw'); return; }
    if (Number(profile.withdrawal_balance) < data.amount) {
      toast.error(`Insufficient balance. Your balance: KES ${Number(profile.withdrawal_balance).toLocaleString()}`);
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('withdrawals').insert({
      user_id: profile.id,
      amount: data.amount,
      method: 'mpesa',
      phone_number: data.phone,
      status: 'pending',
    });

    if (error) {
      toast.error('Failed to submit withdrawal. Please try again.');
    } else {
      toast.success('Withdrawal request submitted! Processing within 24 hours.');
      form.reset({ phone: data.phone, amount: 500 });
      loadWithdrawals();
      refreshProfile();
    }
    setSubmitting(false);
  };

  const STATUS_CONFIG = {
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock },
    approved: { label: 'Approved', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
    rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
  };

  const pendingAmount = withdrawals.filter(w => w.status === 'pending').reduce((s, w) => s + Number(w.amount), 0);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-xl md:text-2xl font-bold mb-6 text-balance">Withdrawals</h1>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { title: 'Available Balance', value: `KES ${Number(profile?.withdrawal_balance ?? 0).toLocaleString()}`, color: 'text-green-600 dark:text-green-400' },
            { title: 'Pending Withdrawals', value: `KES ${pendingAmount.toLocaleString()}`, color: 'text-yellow-600 dark:text-yellow-400' },
            { title: 'Minimum Withdrawal', value: 'KES 500', color: 'text-blue-600 dark:text-blue-400' },
          ].map(({ title, value, color }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-card border border-border rounded-2xl p-5 h-full"
            >
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className={cn('text-2xl font-bold mt-1', color)}>{value}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Withdrawal Form */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ArrowDownLeft className="h-4 w-4 text-primary" />
                Request Withdrawal
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isActive ? (
                <LockedSection message="Activate your account to withdraw earnings" />
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                      <p className="text-xs text-green-700 dark:text-green-400 font-medium">Via M-Pesa</p>
                      <p className="text-xs text-green-600/80 dark:text-green-400/80 mt-0.5">Funds sent directly to your M-Pesa number</p>
                    </div>

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>M-Pesa Phone Number</FormLabel>
                          <FormControl><Input placeholder="0712345678" className="px-3 h-11" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount (KES)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={500}
                              max={Number(profile?.withdrawal_balance ?? 0)}
                              placeholder="500"
                              className="px-3 h-11"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-2">
                      {[500, 1000, 2000, 5000].map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => form.setValue('amount', amt)}
                          className="flex-1 py-1.5 text-xs rounded-lg border border-border hover:border-primary hover:text-primary transition-colors font-medium"
                        >
                          {amt.toLocaleString()}
                        </button>
                      ))}
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-11 gradient-bg-primary text-white border-0"
                      disabled={submitting || Number(profile?.withdrawal_balance ?? 0) < 500}
                    >
                      {submitting ? (
                        <span className="flex items-center gap-2">
                          <div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          Submitting...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Wallet className="h-4 w-4" />
                          Request Withdrawal
                        </span>
                      )}
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>

          {/* Withdrawal History */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Withdrawal History</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg bg-muted" />)}</div>
              ) : withdrawals.length === 0 ? (
                <div className="text-center py-8">
                  <Wallet className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No withdrawal history</p>
                </div>
              ) : (
                <div className="space-y-3 overflow-y-auto max-h-96">
                  {withdrawals.map(w => {
                    const cfg = STATUS_CONFIG[w.status];
                    const StatusIcon = cfg.icon;
                    return (
                      <div key={w.id} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/30">
                        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', cfg.color.split(' ').slice(0, 2).join(' '))}>
                          <StatusIcon className="h-4.5 w-4.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{w.phone_number}</p>
                          <p className="text-xs text-muted-foreground">{new Date(w.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold">KES {Number(w.amount).toLocaleString()}</p>
                          <Badge className={cn('text-xs mt-0.5', cfg.color)}>{cfg.label}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default WithdrawalsPage;
