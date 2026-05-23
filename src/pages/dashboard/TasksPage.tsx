import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Zap, Lock, CheckCircle, Filter } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Task, TaskCategory } from '@/types/types';
import { TASK_CATEGORY_LABELS, DIFFICULTY_COLORS } from '@/types/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const CATEGORY_EMOJIS: Record<TaskCategory, string> = {
  surveys: '📋',
  watching_ads: '📺',
  app_testing: '📱',
  data_annotation: '🔍',
  offers: '🎁',
  video_tasks: '🎬',
  daily_tasks: '📅',
  referrals: '👥',
};

const TasksPage: React.FC = () => {
  const { profile, isActive, refreshProfile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | 'all'>('all');
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    const [tasksRes, completionsRes] = await Promise.all([
      supabase.from('tasks').select('*').eq('is_active', true).order('reward', { ascending: false }),
      supabase.from('task_completions').select('task_id').gte('completed_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    ]);

    if (tasksRes.data) setTasks(tasksRes.data as Task[]);
    if (completionsRes.data) {
      setCompletedToday(new Set(completionsRes.data.map(c => c.task_id)));
    }
    setLoading(false);
  };

  const canAccessTask = (task: Task): boolean => {
    if (!isActive || !profile?.package) return false;
    return task.required_packages.includes(profile.package);
  };

  const handleCompleteTask = async () => {
    if (!activeTask || !profile) return;
    setSubmitting(true);
    const { data, error } = await supabase.rpc('complete_task', {
      p_task_id: activeTask.id,
      p_proof_url: null,
      p_notes: null,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message || 'Failed to complete task');
    } else if (data?.error) {
      toast.error(data.error);
    } else {
      toast.success(`Task completed! You earned KES ${activeTask.reward}`);
      setCompletedToday(prev => new Set([...prev, activeTask.id]));
      setActiveTask(null);
      refreshProfile();
    }
  };

  const filteredTasks = selectedCategory === 'all'
    ? tasks
    : tasks.filter(t => t.category === selectedCategory);

  const categories: (TaskCategory | 'all')[] = ['all', 'surveys', 'watching_ads', 'app_testing', 'data_annotation', 'offers', 'video_tasks', 'daily_tasks', 'referrals'];

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-balance">Available Tasks</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isActive ? `${filteredTasks.filter(t => canAccessTask(t) && !completedToday.has(t.id)).length} tasks available` : '0 tasks – activate your account'}
            </p>
          </div>
          {!isActive && (
            <Link to="/dashboard/packages" className="inline-flex items-center justify-center rounded-md text-sm font-medium px-4 py-2 gradient-bg-primary text-white shrink-0 transition-colors">
              Activate Account
            </Link>
          )}
        </div>

        {/* Category Filter */}
        <div className="overflow-x-auto pb-2 mb-6">
          <div className="flex gap-2 whitespace-nowrap min-w-max">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors',
                  selectedCategory === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {cat !== 'all' && <span>{CATEGORY_EMOJIS[cat as TaskCategory]}</span>}
                <span>{cat === 'all' ? 'All Tasks' : TASK_CATEGORY_LABELS[cat as TaskCategory]}</span>
              </button>
            ))}
          </div>
        </div>

        {!isActive && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6 flex items-center gap-3">
            <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-300">
              <strong>Account inactive.</strong> Purchase a package to unlock tasks and start earning.
            </p>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-2xl bg-muted" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTasks.map((task, index) => {
              const accessible = canAccessTask(task);
              const doneToday = completedToday.has(task.id);
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    'bg-card border border-border rounded-2xl p-5 flex flex-col h-full transition-shadow',
                    accessible && !doneToday ? 'hover:shadow-md' : 'opacity-70'
                  )}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{CATEGORY_EMOJIS[task.category]}</span>
                      <div>
                        <p className="text-sm font-semibold leading-tight text-balance">{task.title}</p>
                        <Badge className="text-xs mt-0.5 bg-muted text-muted-foreground">{TASK_CATEGORY_LABELS[task.category]}</Badge>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">KES {task.reward}</p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mb-3 flex-1 text-pretty line-clamp-2">{task.description}</p>

                  <div className="flex items-center gap-3 mb-3">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium capitalize', DIFFICULTY_COLORS[task.difficulty])}>
                      {task.difficulty}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {task.estimated_time_minutes} min
                    </span>
                  </div>

                  {doneToday ? (
                    <div className="flex items-center gap-2 justify-center py-2 bg-green-50 dark:bg-green-900/20 rounded-xl text-green-700 dark:text-green-400 text-sm font-medium">
                      <CheckCircle className="h-4 w-4" />
                      Completed Today
                    </div>
                  ) : accessible ? (
                    <Button
                      size="sm"
                      className="w-full gradient-bg-primary text-white border-0"
                      onClick={() => setActiveTask(task)}
                    >
                      <Zap className="h-3.5 w-3.5 mr-1" />
                      Start Task
                    </Button>
                  ) : (
                    <div className="w-full flex items-center justify-center gap-1 h-8 px-3 text-sm rounded-md border border-border text-muted-foreground cursor-not-allowed opacity-60">
                      <Lock className="h-3.5 w-3.5" />
                      {!isActive ? 'Activate to Unlock' : 'Upgrade Package'}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Task Dialog */}
      <Dialog open={!!activeTask} onOpenChange={() => setActiveTask(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader>
            <DialogTitle>{activeTask?.title}</DialogTitle>
          </DialogHeader>
          {activeTask && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
                  <p className="text-xs text-muted-foreground">Reward</p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">KES {activeTask.reward}</p>
                </div>
                <div className="flex-1 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
                  <p className="text-xs text-muted-foreground">Time Est.</p>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{activeTask.estimated_time_minutes}m</p>
                </div>
                <div className="flex-1 bg-muted rounded-xl p-3 text-center">
                  <p className="text-xs text-muted-foreground">Difficulty</p>
                  <p className="text-sm font-bold capitalize">{activeTask.difficulty}</p>
                </div>
              </div>

              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-sm font-medium mb-1">Instructions</p>
                <p className="text-sm text-muted-foreground text-pretty">{activeTask.instructions || activeTask.description}</p>
              </div>

              {activeTask.external_url && (
                <a
                  href={activeTask.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-xl text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                >
                  Open Task Link ↗
                </a>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setActiveTask(null)} className="flex-1">Cancel</Button>
                <Button
                  className="flex-1 gradient-bg-primary text-white border-0"
                  onClick={handleCompleteTask}
                  disabled={submitting}
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Mark Complete
                    </span>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default TasksPage;
