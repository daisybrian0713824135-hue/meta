import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Phone, Shield, Package, Calendar, Save } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PACKAGE_BADGE_COLORS, PACKAGE_COLORS } from '@/types/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Full name required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(9, 'Valid phone required'),
});

const pwSchema = z.object({
  new_password: z.string().min(8, 'At least 8 characters'),
  confirm: z.string(),
}).refine(d => d.new_password === d.confirm, { message: 'Passwords must match', path: ['confirm'] });

type ProfileForm = z.infer<typeof profileSchema>;
type PwForm = z.infer<typeof pwSchema>;

const AccountPage: React.FC = () => {
  const { profile, refreshProfile } = useAuth();
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: profile?.full_name ?? '', email: profile?.email ?? '', phone: profile?.phone ?? '' },
  });

  useEffect(() => {
    if (profile) {
      profileForm.reset({ full_name: profile.full_name ?? '', email: profile.email ?? '', phone: profile.phone ?? '' });
    }
  }, [profile]);

  const pwForm = useForm<PwForm>({
    resolver: zodResolver(pwSchema),
    defaultValues: { new_password: '', confirm: '' },
  });

  const onSaveProfile = async (data: ProfileForm) => {
    if (!profile) return;
    setSavingProfile(true);
    const { error } = await supabase.from('profiles').update({ full_name: data.full_name, email: data.email, phone: data.phone }).eq('id', profile.id);
    if (error) toast.error('Failed to update profile');
    else { await refreshProfile(); toast.success('Profile updated!'); }
    setSavingProfile(false);
  };

  const onChangePw = async (data: PwForm) => {
    setSavingPw(true);
    const { error } = await supabase.auth.updateUser({ password: data.new_password });
    if (error) toast.error('Failed to change password');
    else { pwForm.reset(); toast.success('Password changed!'); }
    setSavingPw(false);
  };

  if (!profile) return null;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-xl md:text-2xl font-bold mb-6 text-balance">My Account</h1>

        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="gradient-bg-primary text-white text-xl font-bold">
                  {(profile.full_name || profile.username).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold">{profile.full_name || profile.username}</h2>
                  {profile.package && (
                    <Badge className={cn('text-xs capitalize', PACKAGE_BADGE_COLORS[profile.package])}>
                      {profile.package}
                    </Badge>
                  )}
                  <Badge className={cn('text-xs capitalize', profile.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground')}>
                    {profile.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Member since {new Date(profile.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Earnings', value: `KES ${Number(profile.total_earnings).toLocaleString()}`, icon: Package },
                { label: 'Completed Tasks', value: profile.completed_tasks, icon: Shield },
                { label: 'Referrals', value: profile.premium_referrals_used, icon: User },
                { label: 'Balance', value: `KES ${Number(profile.withdrawal_balance).toLocaleString()}`, icon: Calendar },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="text-center p-3 bg-muted/50 rounded-xl">
                  <Icon className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-lg font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            {/* Package Info */}
            {profile.package && (
              <div className={cn('mt-4 rounded-xl p-4 bg-gradient-to-r text-white', PACKAGE_COLORS[profile.package])}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-xs opacity-70">Active Package</p>
                    <p className="text-lg font-bold capitalize">{profile.package} Package</p>
                  </div>
                  {profile.package_expires_at && (
                    <div className="text-right">
                      <p className="text-xs opacity-70">Expires</p>
                      <p className="text-sm font-semibold">{new Date(profile.package_expires_at).toLocaleDateString()}</p>
                    </div>
                  )}
                  {profile.package_activated_at && (
                    <div className="text-right">
                      <p className="text-xs opacity-70">Activated</p>
                      <p className="text-sm font-semibold">{new Date(profile.package_activated_at).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Profile */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-primary" /> Edit Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
                <FormField control={profileForm.control} name="full_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl><Input placeholder="John Doe" className="px-3 h-10" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={profileForm.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" placeholder="john@example.com" className="px-3 h-10" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={profileForm.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl><Input placeholder="0712345678" className="px-3 h-10" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="gradient-bg-primary text-white border-0 h-10" disabled={savingProfile}>
                  {savingProfile ? 'Saving...' : <><Save className="h-4 w-4 mr-1.5" />Save Changes</>}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" /> Change Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...pwForm}>
              <form onSubmit={pwForm.handleSubmit(onChangePw)} className="space-y-4">
                <FormField control={pwForm.control} name="new_password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl><Input type="password" placeholder="••••••••" className="px-3 h-10" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={pwForm.control} name="confirm" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl><Input type="password" placeholder="••••••••" className="px-3 h-10" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" variant="outline" className="h-10" disabled={savingPw}>
                  {savingPw ? 'Changing...' : 'Change Password'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AccountPage;
