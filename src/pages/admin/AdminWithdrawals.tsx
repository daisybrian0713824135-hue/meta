import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/db/supabase';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import type { Withdrawal, ActivationLog, Transaction } from '@/types/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const AdminWithdrawals: React.FC = () => {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [activationLogs, setActivationLogs] = useState<ActivationLog[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectDialog, setRejectDialog] = useState<Withdrawal | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [wRes, aRes, tRes] = await Promise.all([
      supabase.from('withdrawals').select('*,profiles!withdrawals_user_id_fkey(username,full_name,phone)').order('created_at', { ascending: false }).limit(100),
      supabase.from('activation_logs').select('*,profiles!activation_logs_user_id_fkey(username,full_name,email)').order('activated_at', { ascending: false }).limit(50),
      supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(100),
    ]);
    if (wRes.data) setWithdrawals(wRes.data as Withdrawal[]);
    if (aRes.data) setActivationLogs(aRes.data as ActivationLog[]);
    if (tRes.data) setTransactions(tRes.data as Transaction[]);
    setLoading(false);
  };

  const handleApprove = async (w: Withdrawal) => {
    setProcessing(w.id);
    const { error } = await supabase.from('withdrawals').update({ status: 'approved', processed_at: new Date().toISOString() }).eq('id', w.id);
    if (error) toast.error('Failed to approve');
    else { toast.success(`Approved KES ${Number(w.amount).toLocaleString()} withdrawal`); loadData(); }
    setProcessing(null);
  };

  const handleReject = async () => {
    if (!rejectDialog) return;
    setProcessing(rejectDialog.id);
    const { error } = await supabase.from('withdrawals').update({ status: 'rejected', admin_notes: rejectNote, processed_at: new Date().toISOString() }).eq('id', rejectDialog.id);
    if (error) toast.error('Failed to reject');
    else {
      toast.success('Withdrawal rejected');
      setRejectDialog(null);
      setRejectNote('');
      loadData();
    }
    setProcessing(null);
  };

  const STATUS_BADGE = {
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-xl md:text-2xl font-bold mb-6 text-balance">Payment Management</h1>

        <Tabs defaultValue="withdrawals">
          <TabsList className="mb-5">
            <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
            <TabsTrigger value="activations">Activation Logs</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="withdrawals">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">
                  Withdrawal Requests ({withdrawals.filter(w => w.status === 'pending').length} pending)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        {['User', 'Phone', 'Amount', 'Method', 'Status', 'Date', 'Actions'].map(h => (
                          <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i}><td colSpan={7} className="py-3 px-4"><Skeleton className="h-10 w-full bg-muted rounded" /></td></tr>
                      )) : withdrawals.map(w => (
                        <tr key={w.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                          <td className="py-3 px-4 whitespace-nowrap">
                            <p className="text-sm font-medium">{(w as Withdrawal & { profiles?: { full_name?: string; username?: string } }).profiles?.full_name || (w as Withdrawal & { profiles?: { username?: string } }).profiles?.username}</p>
                          </td>
                          <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{w.phone_number}</td>
                          <td className="py-3 px-4 text-sm font-bold text-foreground whitespace-nowrap">KES {Number(w.amount).toLocaleString()}</td>
                          <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap capitalize">{w.method}</td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <Badge className={cn('text-xs capitalize', STATUS_BADGE[w.status])}>{w.status}</Badge>
                          </td>
                          <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{new Date(w.created_at).toLocaleDateString()}</td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {w.status === 'pending' && (
                              <div className="flex items-center gap-1">
                                <Button size="sm" className="h-7 px-2 bg-green-600 hover:bg-green-700 text-white border-0 text-xs" onClick={() => handleApprove(w)} disabled={processing === w.id}>
                                  <CheckCircle className="h-3.5 w-3.5 mr-1" />Approve
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 px-2 text-xs border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => setRejectDialog(w)}>
                                  <XCircle className="h-3.5 w-3.5 mr-1" />Reject
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activations">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        {['User', 'Package', 'Amount', 'Reference', 'Date'].map(h => (
                          <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i}><td colSpan={5} className="py-3 px-4"><Skeleton className="h-10 w-full bg-muted rounded" /></td></tr>
                      )) : activationLogs.map(a => (
                        <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                          <td className="py-3 px-4 whitespace-nowrap">
                            <p className="text-sm font-medium">{(a as ActivationLog & { profiles?: { username?: string } }).profiles?.username}</p>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <Badge className="text-xs capitalize bg-primary/10 text-primary">{a.package}</Badge>
                          </td>
                          <td className="py-3 px-4 text-sm font-bold text-green-600 dark:text-green-400 whitespace-nowrap">KES {Number(a.amount_paid).toLocaleString()}</td>
                          <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap font-mono">{a.paynecta_transaction_id || a.payment_reference || '—'}</td>
                          <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{new Date(a.activated_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        {['Type', 'Amount', 'Status', 'Reference', 'Date'].map(h => (
                          <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i}><td colSpan={5} className="py-3 px-4"><Skeleton className="h-10 w-full bg-muted rounded" /></td></tr>
                      )) : transactions.map(t => (
                        <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                          <td className="py-3 px-4 whitespace-nowrap">
                            <Badge className="text-xs capitalize bg-muted text-muted-foreground">{t.type.replace('_', ' ')}</Badge>
                          </td>
                          <td className="py-3 px-4 text-sm font-bold whitespace-nowrap">KES {Number(t.amount).toLocaleString()}</td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <Badge className={cn('text-xs capitalize', t.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground')}>{t.status}</Badge>
                          </td>
                          <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap font-mono">{t.reference_id || t.paynecta_transaction_id || '—'}</td>
                          <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{new Date(t.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Reject Dialog */}
        <Dialog open={!!rejectDialog} onOpenChange={() => setRejectDialog(null)}>
          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
            <DialogHeader><DialogTitle>Reject Withdrawal</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Rejecting KES {Number(rejectDialog?.amount).toLocaleString()} for {(rejectDialog as Withdrawal & { profiles?: { full_name?: string } })?.profiles?.full_name}</p>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Rejection Reason</label>
                <Textarea placeholder="Enter reason for rejection..." className="px-3 min-h-20" value={rejectNote} onChange={e => setRejectNote(e.target.value)} />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setRejectDialog(null)}>Cancel</Button>
                <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0" onClick={handleReject} disabled={!!processing}>
                  {processing ? 'Rejecting...' : 'Confirm Reject'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminWithdrawals;
