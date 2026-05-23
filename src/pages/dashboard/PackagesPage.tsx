import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Crown, Star } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Package } from '@/types/types';
import { PACKAGE_COLORS, PACKAGE_BADGE_COLORS } from '@/types/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const PACKAGE_ICONS = {
  starter: Zap,
  bronze: Star,
  silver: Star,
  gold: Crown,
  vip: Crown,
};

const PackagesPage: React.FC = () => {
  const { profile, isActive, refreshProfile } = useAuth();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);

  useEffect(() => {
    supabase.from('packages').select('*').eq('is_active', true).order('sort_order').then(({ data }) => {
      if (data) setPackages(data as Package[]);
      setLoading(false);
    });
  }, []);

  const handleActivate = (pkg: Package) => {
    setSelectedPackage(pkg);
    setPaymentDone(false);
    setPaymentOpen(true);
  };

  const handlePaymentComplete = async () => {
    setPaymentDone(true);
    // In production, this is triggered by Paynecta webhook via Edge Function
    // For UX, we poll or allow manual confirmation
    toast.info('Payment submitted! Verifying...');
  };

  const handleVerifyManual = async () => {
    if (!selectedPackage || !profile) return;
    toast.loading('Verifying payment...');
    const { error } = await supabase.functions.invoke('verify-payment', {
      body: { package_name: selectedPackage.name, user_id: profile.id, amount: selectedPackage.price }
    });
    toast.dismiss();
    if (error) {
      const msg = await error?.context?.text?.();
      toast.error(msg || 'Verification failed. Contact support.');
    } else {
      await refreshProfile();
      setPaymentOpen(false);
      toast.success('🎉 Account activated! Welcome to MetaPay!');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-balance mb-2">Choose Your Package</h1>
          <p className="text-muted-foreground text-pretty">Activate your account and start earning today</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-2xl bg-muted" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {packages.map((pkg, index) => {
              const Icon = PACKAGE_ICONS[pkg.name] ?? Zap;
              const isCurrentPackage = profile?.package === pkg.name;
              const isPopular = pkg.name === 'gold';

              return (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className={cn(
                    'relative bg-card border rounded-2xl overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow',
                    isCurrentPackage ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-border',
                    isPopular && !isCurrentPackage ? 'border-yellow-400' : ''
                  )}
                >
                  {isPopular && (
                    <div className="absolute top-0 left-0 right-0 text-center py-1.5 bg-yellow-400 text-yellow-900 text-xs font-bold">
                      🔥 MOST POPULAR
                    </div>
                  )}
                  {isCurrentPackage && (
                    <div className="absolute top-0 left-0 right-0 text-center py-1.5 bg-primary text-primary-foreground text-xs font-bold">
                      ✓ CURRENT PACKAGE
                    </div>
                  )}

                  {/* Package header */}
                  <div className={cn(
                    'bg-gradient-to-br p-6 text-white flex items-start justify-between',
                    PACKAGE_COLORS[pkg.name],
                    (isPopular || isCurrentPackage) ? 'mt-6' : ''
                  )}>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="h-5 w-5" />
                        <span className="text-lg font-bold capitalize">{pkg.display_name}</span>
                      </div>
                      <div className="text-3xl font-bold">KES {Number(pkg.price).toLocaleString()}</div>
                      <p className="text-white/70 text-xs mt-1">One-time activation</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs opacity-70">Est. daily</p>
                      <p className="text-lg font-bold">KES {Number(pkg.daily_earnings_estimate).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-4">
                      <Badge className={cn('text-xs', PACKAGE_BADGE_COLORS[pkg.name])}>
                        {pkg.task_limit_per_day === 999 ? 'Unlimited' : `${pkg.task_limit_per_day}`} tasks/day
                      </Badge>
                    </div>

                    <ul className="space-y-2 flex-1 mb-4">
                      {(pkg.features as string[]).map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                          <span className="text-foreground/80">{f}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className={cn(
                        'w-full h-10 font-semibold',
                        isCurrentPackage
                          ? 'bg-primary/10 text-primary border border-primary'
                          : 'gradient-bg-primary text-white border-0'
                      )}
                      disabled={isCurrentPackage}
                      onClick={() => handleActivate(pkg)}
                    >
                      {isCurrentPackage ? 'Current Package' : isActive ? 'Upgrade Package' : 'Activate Package'}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-5 pb-0">
            <DialogTitle>
              Complete Payment – {selectedPackage?.display_name} Package (KES {selectedPackage?.price?.toLocaleString()})
            </DialogTitle>
          </DialogHeader>

          {!paymentDone ? (
            <div className="flex flex-col h-full">
              <div className="px-6 py-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-300">
                Complete your payment via Paynecta below. Your account will be activated automatically after verification.
              </div>
              <div className="w-full" style={{ height: '420px' }}>
                <iframe
                  src={`https://paynecta.co.ke/pay/metapay-agencies?amount=${selectedPackage?.price}&package=${selectedPackage?.name}`}
                  className="w-full h-full border-0"
                  title="Paynecta Payment"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-top-navigation-by-user-activation"
                />
              </div>
              <div className="px-6 py-4 border-t border-border flex flex-col sm:flex-row gap-3">
                <Button variant="outline" onClick={() => setPaymentOpen(false)} className="flex-1">Cancel</Button>
                <Button className="flex-1 gradient-bg-primary text-white border-0" onClick={handlePaymentComplete}>
                  I have completed payment
                </Button>
              </div>
            </div>
          ) : (
            <div className="px-6 pb-6 text-center">
              <div className="py-6">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-bold mb-2">Payment Submitted!</h3>
                <p className="text-sm text-muted-foreground mb-6 text-pretty">
                  Your payment is being verified. Click below to complete account activation.
                </p>
                <Button className="w-full gradient-bg-primary text-white border-0 h-11" onClick={handleVerifyManual}>
                  Verify & Activate Account
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default PackagesPage;
