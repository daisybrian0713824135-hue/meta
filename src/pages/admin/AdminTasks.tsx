import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, Save } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import type { Task } from '@/types/types';
import { TASK_CATEGORY_LABELS, DIFFICULTY_COLORS } from '@/types/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const taskSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  category: z.string(),
  reward: z.coerce.number().min(1),
  difficulty: z.string(),
  estimated_time_minutes: z.coerce.number().min(1),
  instructions: z.string().optional(),
  external_url: z.string().optional(),
  daily_limit: z.coerce.number().min(1),
  required_packages: z.array(z.string()),
});

type TaskForm = z.infer<typeof taskSchema>;

const ALL_PACKAGES = ['starter', 'bronze', 'silver', 'gold', 'vip'];

const AdminTasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<TaskForm>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '', description: '', category: 'surveys', reward: 50,
      difficulty: 'easy', estimated_time_minutes: 5, instructions: '',
      external_url: '', daily_limit: 10, required_packages: ['starter', 'bronze', 'silver', 'gold', 'vip'],
    },
  });

  useEffect(() => { loadTasks(); }, []);

  const loadTasks = async () => {
    setLoading(true);
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (data) setTasks(data as Task[]);
    setLoading(false);
  };

  const openCreateDialog = () => {
    setEditTask(null);
    form.reset();
    setDialogOpen(true);
  };

  const openEditDialog = (task: Task) => {
    setEditTask(task);
    form.reset({
      title: task.title, description: task.description ?? '',
      category: task.category, reward: task.reward,
      difficulty: task.difficulty, estimated_time_minutes: task.estimated_time_minutes,
      instructions: task.instructions ?? '', external_url: task.external_url ?? '',
      daily_limit: task.daily_limit, required_packages: task.required_packages,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: TaskForm) => {
    setSaving(true);
    if (editTask) {
      const { error } = await supabase.from('tasks').update(data).eq('id', editTask.id);
      if (error) toast.error('Failed to update task');
      else { toast.success('Task updated!'); setDialogOpen(false); loadTasks(); }
    } else {
      const { error } = await supabase.from('tasks').insert({ ...data, is_active: true, total_completions: 0 });
      if (error) toast.error('Failed to create task');
      else { toast.success('Task created!'); setDialogOpen(false); loadTasks(); }
    }
    setSaving(false);
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Delete this task?')) return;
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) toast.error('Failed to delete task');
    else { toast.success('Task deleted'); loadTasks(); }
  };

  const toggleActive = async (task: Task) => {
    const { error } = await supabase.from('tasks').update({ is_active: !task.is_active }).eq('id', task.id);
    if (!error) loadTasks();
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-balance">Task Management</h1>
          <Button className="gradient-bg-primary text-white border-0" onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-1" /> New Task
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {['Title', 'Category', 'Reward', 'Difficulty', 'Time', 'Completions', 'Active', 'Actions'].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}><td colSpan={8} className="py-3 px-4"><Skeleton className="h-10 w-full bg-muted rounded" /></td></tr>
                    ))
                  ) : tasks.map(t => (
                    <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <p className="text-sm font-medium max-w-[200px] truncate">{t.title}</p>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge className="text-xs bg-muted text-muted-foreground">{TASK_CATEGORY_LABELS[t.category]}</Badge>
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-green-600 dark:text-green-400 whitespace-nowrap">KES {t.reward}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge className={cn('text-xs capitalize', DIFFICULTY_COLORS[t.difficulty])}>{t.difficulty}</Badge>
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{t.estimated_time_minutes}m</td>
                      <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{t.total_completions}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Switch checked={t.is_active} onCheckedChange={() => toggleActive(t)} />
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditDialog(t)}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(t.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[90dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>Title</FormLabel><FormControl><Input className="px-3 h-9" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea className="px-3 min-h-16" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem><FormLabel>Category</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger className="h-9"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {Object.entries(TASK_CATEGORY_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                        </SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="difficulty" render={({ field }) => (
                    <FormItem><FormLabel>Difficulty</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger className="h-9"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="reward" render={({ field }) => (
                    <FormItem><FormLabel>Reward (KES)</FormLabel><FormControl><Input type="number" className="px-3 h-9" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="estimated_time_minutes" render={({ field }) => (
                    <FormItem><FormLabel>Time (minutes)</FormLabel><FormControl><Input type="number" className="px-3 h-9" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="instructions" render={({ field }) => (
                  <FormItem><FormLabel>Instructions</FormLabel><FormControl><Textarea className="px-3 min-h-16" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="external_url" render={({ field }) => (
                  <FormItem><FormLabel>External URL (optional)</FormLabel><FormControl><Input className="px-3 h-9" placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div>
                  <p className="text-sm font-medium mb-2">Required Packages</p>
                  <div className="flex flex-wrap gap-2">
                    {ALL_PACKAGES.map(pkg => {
                      const selected = (form.watch('required_packages') || []).includes(pkg);
                      return (
                        <button
                          key={pkg}
                          type="button"
                          className={cn('px-3 py-1 rounded-lg text-xs font-medium border transition-colors capitalize', selected ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary')}
                          onClick={() => {
                            const current = form.getValues('required_packages') || [];
                            form.setValue('required_packages', selected ? current.filter(p => p !== pkg) : [...current, pkg]);
                          }}
                        >{pkg}</button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}><X className="h-4 w-4 mr-1" />Cancel</Button>
                  <Button type="submit" className="flex-1 gradient-bg-primary text-white border-0" disabled={saving}>
                    <Save className="h-4 w-4 mr-1" />{saving ? 'Saving...' : editTask ? 'Update Task' : 'Create Task'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminTasks;
