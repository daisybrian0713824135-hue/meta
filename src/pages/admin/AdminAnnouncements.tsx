import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Pin, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/db/supabase';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import type { Announcement, LiveActivity } from '@/types/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const announcementSchema = z.object({
  title: z.string().min(3),
  content: z.string().min(5),
  type: z.string(),
  priority: z.coerce.number().min(0).max(10),
  is_pinned: z.boolean(),
  is_published: z.boolean(),
});

const activitySchema = z.object({
  type: z.string(),
  message: z.string().min(5),
  user_display_name: z.string().optional(),
  amount: z.coerce.number().optional(),
  location: z.string().optional(),
});

type AnnouncementForm = z.infer<typeof announcementSchema>;
type ActivityForm = z.infer<typeof activitySchema>;

const AdminAnnouncements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [activities, setActivities] = useState<LiveActivity[]>([]);
  const [loadingA, setLoadingA] = useState(true);
  const [loadingL, setLoadingL] = useState(true);
  const [aDialog, setADialog] = useState(false);
  const [lDialog, setLDialog] = useState(false);
  const [editA, setEditA] = useState<Announcement | null>(null);
  const [saving, setSaving] = useState(false);

  const aForm = useForm<AnnouncementForm>({
    resolver: zodResolver(announcementSchema),
    defaultValues: { title: '', content: '', type: 'info', priority: 1, is_pinned: false, is_published: true },
  });

  const lForm = useForm<ActivityForm>({
    resolver: zodResolver(activitySchema),
    defaultValues: { type: 'earning', message: '', user_display_name: '', amount: 0, location: '' },
  });

  useEffect(() => { loadAnnouncements(); loadActivities(); }, []);

  const loadAnnouncements = async () => {
    setLoadingA(true);
    const { data } = await supabase.from('announcements').select('*').order('priority', { ascending: false });
    if (data) setAnnouncements(data as Announcement[]);
    setLoadingA(false);
  };

  const loadActivities = async () => {
    setLoadingL(true);
    const { data } = await supabase.from('live_activity').select('*').order('created_at', { ascending: false }).limit(20);
    if (data) setActivities(data as LiveActivity[]);
    setLoadingL(false);
  };

  const openNewAnnouncement = () => { setEditA(null); aForm.reset(); setADialog(true); };
  const openEditAnnouncement = (a: Announcement) => {
    setEditA(a);
    aForm.reset({ title: a.title, content: a.content, type: a.type, priority: a.priority, is_pinned: a.is_pinned, is_published: a.is_published });
    setADialog(true);
  };

  const onSubmitAnnouncement = async (data: AnnouncementForm) => {
    setSaving(true);
    if (editA) {
      const { error } = await supabase.from('announcements').update(data).eq('id', editA.id);
      if (error) toast.error('Failed to update');
      else { toast.success('Announcement updated'); setADialog(false); loadAnnouncements(); }
    } else {
      const { error } = await supabase.from('announcements').insert(data);
      if (error) toast.error('Failed to create');
      else { toast.success('Announcement created!'); setADialog(false); loadAnnouncements(); }
    }
    setSaving(false);
  };

  const togglePublish = async (a: Announcement) => {
    await supabase.from('announcements').update({ is_published: !a.is_published }).eq('id', a.id);
    loadAnnouncements();
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm('Delete announcement?')) return;
    await supabase.from('announcements').delete().eq('id', id);
    toast.success('Deleted'); loadAnnouncements();
  };

  const onSubmitActivity = async (data: ActivityForm) => {
    setSaving(true);
    const msg = data.message || `${data.user_display_name}${data.amount ? ` earned KES ${Number(data.amount).toLocaleString()}` : ''}${data.location ? ` from ${data.location}` : ''}`;
    const { error } = await supabase.from('live_activity').insert({
      type: data.type,
      message: msg,
      user_display_name: data.user_display_name || null,
      amount: data.amount || null,
      location: data.location || null,
      is_real: false,
    });
    if (error) toast.error('Failed to create activity');
    else { toast.success('Activity created!'); setLDialog(false); lForm.reset(); loadActivities(); }
    setSaving(false);
  };

  const TYPE_BADGE = {
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    promo: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Announcements */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Announcements</h1>
            <Button className="gradient-bg-primary text-white border-0" onClick={openNewAnnouncement}>
              <Plus className="h-4 w-4 mr-1" />New Announcement
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-max">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {['Title', 'Type', 'Priority', 'Pinned', 'Published', 'Actions'].map(h => (
                        <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loadingA ? Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i}><td colSpan={6} className="py-3 px-4"><Skeleton className="h-10 w-full bg-muted rounded" /></td></tr>
                    )) : announcements.map(a => (
                      <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                        <td className="py-3 px-4 whitespace-nowrap max-w-xs truncate text-sm font-medium">{a.title}</td>
                        <td className="py-3 px-4 whitespace-nowrap"><Badge className={cn('text-xs capitalize', TYPE_BADGE[a.type as keyof typeof TYPE_BADGE] || TYPE_BADGE.info)}>{a.type}</Badge></td>
                        <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">{a.priority}</td>
                        <td className="py-3 px-4 whitespace-nowrap">{a.is_pinned ? <Pin className="h-4 w-4 text-yellow-500" /> : '—'}</td>
                        <td className="py-3 px-4 whitespace-nowrap"><Switch checked={a.is_published} onCheckedChange={() => togglePublish(a)} /></td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditAnnouncement(a)}><Edit2 className="h-3.5 w-3.5" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteAnnouncement(a.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Activity Manager */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Live Activity Manager</h2>
            <Button className="gradient-bg-primary text-white border-0" onClick={() => setLDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />Create Activity
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-max">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {['Message', 'Type', 'Amount', 'Location', 'Time'].map(h => (
                        <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loadingL ? Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i}><td colSpan={5} className="py-3 px-4"><Skeleton className="h-10 w-full bg-muted rounded" /></td></tr>
                    )) : activities.map(a => (
                      <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                        <td className="py-3 px-4 text-sm max-w-xs truncate whitespace-nowrap">{a.message}</td>
                        <td className="py-3 px-4 whitespace-nowrap"><Badge className="text-xs capitalize bg-muted text-muted-foreground">{a.type}</Badge></td>
                        <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{a.amount ? `KES ${Number(a.amount).toLocaleString()}` : '—'}</td>
                        <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{a.location || '—'}</td>
                        <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{new Date(a.created_at).toLocaleTimeString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Announcement Dialog */}
      <Dialog open={aDialog} onOpenChange={setADialog}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editA ? 'Edit Announcement' : 'New Announcement'}</DialogTitle></DialogHeader>
          <Form {...aForm}>
            <form onSubmit={aForm.handleSubmit(onSubmitAnnouncement)} className="space-y-4">
              <FormField control={aForm.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>Title</FormLabel><FormControl><Input className="px-3 h-9" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={aForm.control} name="content" render={({ field }) => (
                <FormItem><FormLabel>Content</FormLabel><FormControl><Textarea className="px-3 min-h-20" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={aForm.control} name="type" render={({ field }) => (
                  <FormItem><FormLabel>Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger className="h-9"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {['info', 'success', 'warning', 'error', 'promo'].map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={aForm.control} name="priority" render={({ field }) => (
                  <FormItem><FormLabel>Priority (0–10)</FormLabel><FormControl><Input type="number" min={0} max={10} className="px-3 h-9" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="flex gap-6">
                <FormField control={aForm.control} name="is_pinned" render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <FormLabel className="!mt-0">Pin Announcement</FormLabel>
                  </FormItem>
                )} />
                <FormField control={aForm.control} name="is_published" render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <FormLabel className="!mt-0">Published</FormLabel>
                  </FormItem>
                )} />
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setADialog(false)}>Cancel</Button>
                <Button type="submit" className="flex-1 gradient-bg-primary text-white border-0" disabled={saving}>
                  {saving ? 'Saving...' : editA ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Create Activity Dialog */}
      <Dialog open={lDialog} onOpenChange={setLDialog}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader><DialogTitle>Create Live Activity</DialogTitle></DialogHeader>
          <Form {...lForm}>
            <form onSubmit={lForm.handleSubmit(onSubmitActivity)} className="space-y-4">
              <FormField control={lForm.control} name="type" render={({ field }) => (
                <FormItem><FormLabel>Activity Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger className="h-9"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {['earning', 'withdrawal', 'registration', 'task_completion', 'package_activation'].map(t => <SelectItem key={t} value={t} className="capitalize">{t.replace('_', ' ')}</SelectItem>)}
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <FormField control={lForm.control} name="message" render={({ field }) => (
                <FormItem><FormLabel>Custom Message (overrides auto-generated)</FormLabel><FormControl><Input className="px-3 h-9" placeholder='e.g. "Sarah earned KES 500 from surveys"' {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={lForm.control} name="user_display_name" render={({ field }) => (
                  <FormItem><FormLabel>Display Name</FormLabel><FormControl><Input className="px-3 h-9" placeholder="John K." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={lForm.control} name="location" render={({ field }) => (
                  <FormItem><FormLabel>Location</FormLabel><FormControl><Input className="px-3 h-9" placeholder="Nairobi" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={lForm.control} name="amount" render={({ field }) => (
                <FormItem><FormLabel>Amount (KES)</FormLabel><FormControl><Input type="number" className="px-3 h-9" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setLDialog(false)}>Cancel</Button>
                <Button type="submit" className="flex-1 gradient-bg-primary text-white border-0" disabled={saving}>{saving ? 'Creating...' : 'Create'}</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminAnnouncements;
