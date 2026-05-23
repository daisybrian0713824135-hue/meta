import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { supabase } from '@/db/supabase';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import type { AdminSettings as AdminSettingsType } from '@/types/types';
import { toast } from 'sonner';

type SettingsMap = Record<string, string | boolean | number>;

const SETTING_FIELDS: { key: string; label: string; type: 'text' | 'email' | 'textarea' | 'toggle' | 'number'; description?: string }[] = [
  { key: 'site_name', label: 'Site Name', type: 'text', description: 'Display name of the platform' },
  { key: 'support_email', label: 'Support Email', type: 'email', description: 'Email for user support inquiries' },
  { key: 'min_withdrawal', label: 'Minimum Withdrawal (KES)', type: 'number', description: 'Minimum amount users can withdraw' },
  { key: 'referral_commission_rate', label: 'Referral Commission (%)', type: 'number', description: 'Percentage of earnings paid as referral commission' },
  { key: 'max_premium_referrals', label: 'Max Premium Referrals', type: 'number', description: 'Maximum premium referrals per user' },
  { key: 'maintenance_mode', label: 'Maintenance Mode', type: 'toggle', description: 'Disable user access for maintenance' },
  { key: 'registration_enabled', label: 'Registration Enabled', type: 'toggle', description: 'Allow new user registrations' },
  { key: 'terms_url', label: 'Terms & Conditions URL', type: 'text' },
  { key: 'privacy_url', label: 'Privacy Policy URL', type: 'text' },
  { key: 'meta_title', label: 'SEO Meta Title', type: 'text', description: 'Browser tab and search engine title' },
  { key: 'meta_description', label: 'SEO Meta Description', type: 'textarea', description: 'Search engine description (150 chars)' },
];

const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsMap>({
    site_name: 'MetaPay',
    support_email: 'support@metapay.co.ke',
    min_withdrawal: 500,
    referral_commission_rate: 10,
    max_premium_referrals: 3,
    maintenance_mode: false,
    registration_enabled: true,
    terms_url: '/terms',
    privacy_url: '/privacy',
    meta_title: 'MetaPay - Earn Real Money Online',
    meta_description: "Kenya's #1 earning platform. Complete tasks, earn KES, withdraw via M-Pesa.",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    setLoading(true);
    const { data } = await supabase.from('admin_settings').select('*');
    if (data && data.length > 0) {
      const map: SettingsMap = {};
      (data as AdminSettingsType[]).forEach(s => { map[s.key] = s.value as string | boolean | number; });
      setSettings(prev => ({ ...prev, ...map }));
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const upserts = Object.entries(settings).map(([key, value]) => ({ key, value, updated_at: new Date().toISOString() }));
    const { error } = await supabase.from('admin_settings').upsert(upserts, { onConflict: 'key' });
    if (error) toast.error('Failed to save settings');
    else toast.success('Settings saved!');
    setSaving(false);
  };

  const updateSetting = (key: string, value: string | boolean | number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-balance">Site Settings</h1>
          <Button className="gradient-bg-primary text-white border-0" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-1.5" />{saving ? 'Saving...' : 'Save All'}
          </Button>
        </div>

        <div className="space-y-5">
          {['General', 'Financials', 'Access', 'SEO'].map((section, si) => {
            const sectionFields = SETTING_FIELDS.slice(
              si === 0 ? 0 : si === 1 ? 2 : si === 2 ? 5 : 9,
              si === 0 ? 2 : si === 1 ? 5 : si === 2 ? 9 : SETTING_FIELDS.length
            );
            return (
              <Card key={section}>
                <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">{section} Settings</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {loading ? (
                    Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl bg-muted" />)
                  ) : sectionFields.map(field => (
                    <div key={field.key}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <label className="text-sm font-medium block mb-0.5">{field.label}</label>
                          {field.description && <p className="text-xs text-muted-foreground mb-1.5">{field.description}</p>}
                          {field.type === 'toggle' ? null : field.type === 'textarea' ? (
                            <Textarea
                              className="px-3 min-h-16 text-sm"
                              value={String(settings[field.key] ?? '')}
                              onChange={e => updateSetting(field.key, e.target.value)}
                            />
                          ) : (
                            <Input
                              type={field.type}
                              className="px-3 h-9 text-sm"
                              value={String(settings[field.key] ?? '')}
                              onChange={e => updateSetting(field.key, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                            />
                          )}
                        </div>
                        {field.type === 'toggle' && (
                          <div className="flex items-center gap-2 mt-5 shrink-0">
                            <Switch
                              checked={Boolean(settings[field.key])}
                              onCheckedChange={v => updateSetting(field.key, v)}
                            />
                            <span className="text-xs text-muted-foreground">{Boolean(settings[field.key]) ? 'On' : 'Off'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
