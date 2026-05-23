import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Zap, Lock, CheckCircle, Play, Share2, Gift, ChevronRight } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import type { Task, TaskCategory, TaskQuestion } from '@/types/types';
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

// ── In-App Task Execution Components ──────────────────────────────────────

interface VideoTaskProps { embedUrl: string; watchDuration: number; onReady: () => void; }
const VideoTask: React.FC<VideoTaskProps> = ({ embedUrl, watchDuration, onReady }) => {
  const [elapsed, setElapsed] = useState(0);
  const [started, setStarted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pct = Math.min(100, Math.round((elapsed / watchDuration) * 100));

  const start = () => {
    if (started) return;
    setStarted(true);
    timerRef.current = setInterval(() => {
      setElapsed(p => {
        const next = p + 1;
        if (next >= watchDuration) {
          clearInterval(timerRef.current!);
          onReady();
        }
        return next;
      });
    }, 1000);
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const remaining = Math.max(0, watchDuration - elapsed);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div className="space-y-3">
      <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
        <iframe
          src={embedUrl}
          title="Task Video"
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        {!started && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <button
              onClick={start}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full gradient-bg-primary text-white font-semibold text-sm shadow-lg hover:opacity-90 transition-opacity"
            >
              <Play className="h-4 w-4" /> Start Watching
            </button>
          </div>
        )}
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{started ? (pct >= 100 ? '✅ Watch complete!' : 'Watching...') : 'Press Start to begin'}</span>
          <span>{mins}:{secs.toString().padStart(2,'0')} remaining</span>
        </div>
        <Progress value={pct} className="h-2" />
        <p className="text-xs text-muted-foreground text-center">
          Watch {watchDuration}s to unlock reward. Do not close this window.
        </p>
      </div>
    </div>
  );
};

interface SurveyTaskProps { questions: TaskQuestion[]; onAnswers: (a: Record<string, string | string[]>) => void; }
const SurveyTask: React.FC<SurveyTaskProps> = ({ questions, onAnswers }) => {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

  const set = (id: string, val: string | string[]) => {
    const next = { ...answers, [id]: val };
    setAnswers(next);
    if (questions.every(q => {
      const a = next[q.id];
      return Array.isArray(a) ? a.length > 0 : typeof a === 'string' && a.trim().length > 0;
    })) onAnswers(next);
  };

  const toggleCheckbox = (id: string, opt: string) => {
    const cur = (answers[id] as string[] | undefined) ?? [];
    set(id, cur.includes(opt) ? cur.filter(x => x !== opt) : [...cur, opt]);
  };

  return (
    <div className="space-y-5 max-h-[55vh] overflow-y-auto pr-1">
      {questions.map((q, qi) => (
        <div key={q.id} className="space-y-2">
          <p className="text-sm font-medium">{qi + 1}. {q.question}</p>
          {q.type === 'radio' && q.options?.map(opt => (
            <label key={opt} className="flex items-center gap-2.5 cursor-pointer group">
              <div className={cn('w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                answers[q.id] === opt ? 'border-primary bg-primary' : 'border-border group-hover:border-primary/60')}>
                {answers[q.id] === opt && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <span className="text-sm text-foreground">{opt}</span>
              <input type="radio" className="sr-only" checked={answers[q.id] === opt} onChange={() => set(q.id, opt)} />
            </label>
          ))}
          {q.type === 'checkbox' && q.options?.map(opt => {
            const checked = ((answers[q.id] as string[]) ?? []).includes(opt);
            return (
              <label key={opt} className="flex items-center gap-2.5 cursor-pointer group">
                <div className={cn('w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                  checked ? 'border-primary bg-primary' : 'border-border group-hover:border-primary/60')}>
                  {checked && <CheckCircle className="h-2.5 w-2.5 text-white" />}
                </div>
                <span className="text-sm text-foreground">{opt}</span>
                <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggleCheckbox(q.id, opt)} />
              </label>
            );
          })}
          {q.type === 'textarea' && (
            <Textarea
              placeholder={q.placeholder ?? ''}
              value={(answers[q.id] as string) ?? ''}
              onChange={e => set(q.id, e.target.value)}
              className="resize-none text-sm min-h-[80px]"
            />
          )}
          {q.type === 'text' && (
            <Input
              placeholder={q.placeholder ?? ''}
              value={(answers[q.id] as string) ?? ''}
              onChange={e => set(q.id, e.target.value)}
              className="text-sm"
            />
          )}
        </div>
      ))}
    </div>
  );
};

interface AnnotationTaskProps { questions: TaskQuestion[]; onAnswers: (a: Record<string, string | string[]>) => void; }
const AnnotationTask: React.FC<AnnotationTaskProps> = ({ questions, onAnswers }) => {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [current, setCurrent] = useState(0);

  const set = (id: string, val: string | string[]) => {
    const next = { ...answers, [id]: val };
    setAnswers(next);
    if (questions.every(q => {
      const a = next[q.id];
      return Array.isArray(a) ? a.length > 0 : typeof a === 'string' && a.trim().length > 0;
    })) onAnswers(next);
  };

  const toggleCheckbox = (id: string, opt: string) => {
    const cur = (answers[id] as string[] | undefined) ?? [];
    set(id, cur.includes(opt) ? cur.filter(x => x !== opt) : [...cur, opt]);
  };

  const q = questions[current];
  const answered = answers[q.id] !== undefined && (Array.isArray(answers[q.id]) ? (answers[q.id] as string[]).length > 0 : (answers[q.id] as string).trim().length > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Item {current + 1} of {questions.length}</span>
        <span>{Object.keys(answers).length}/{questions.length} answered</span>
      </div>
      <Progress value={(Object.keys(answers).length / questions.length) * 100} className="h-1.5" />

      {q.imageUrl && (
        <div className="rounded-xl overflow-hidden border border-border">
          <img src={q.imageUrl} alt="annotation target" className="w-full object-cover max-h-44" />
        </div>
      )}
      {q.review && (
        <div className="bg-muted/60 rounded-xl p-3 border border-border">
          <p className="text-sm italic text-foreground">"{q.review}"</p>
        </div>
      )}

      <p className="text-sm font-medium">{q.question}</p>
      <div className="space-y-2">
        {q.type === 'radio' && q.options?.map(opt => (
          <label key={opt} className="flex items-center gap-2.5 cursor-pointer group">
            <div className={cn('w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
              answers[q.id] === opt ? 'border-primary bg-primary' : 'border-border group-hover:border-primary/60')}>
              {answers[q.id] === opt && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
            <span className="text-sm">{opt}</span>
            <input type="radio" className="sr-only" checked={answers[q.id] === opt} onChange={() => set(q.id, opt)} />
          </label>
        ))}
        {q.type === 'checkbox' && q.options?.map(opt => {
          const checked = ((answers[q.id] as string[]) ?? []).includes(opt);
          return (
            <label key={opt} className="flex items-center gap-2.5 cursor-pointer group">
              <div className={cn('w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                checked ? 'border-primary bg-primary' : 'border-border group-hover:border-primary/60')}>
                {checked && <CheckCircle className="h-2.5 w-2.5 text-white" />}
              </div>
              <span className="text-sm">{opt}</span>
              <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggleCheckbox(q.id, opt)} />
            </label>
          );
        })}
      </div>

      <div className="flex gap-2 pt-1">
        {current > 0 && (
          <Button variant="outline" size="sm" onClick={() => setCurrent(p => p - 1)} className="flex-1">
            ← Previous
          </Button>
        )}
        {current < questions.length - 1 && (
          <Button size="sm" disabled={!answered} onClick={() => setCurrent(p => p + 1)}
            className={cn('flex-1 gradient-bg-primary text-white border-0', !answered && 'opacity-50')}>
            Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
};

interface DailyClaimProps { task: Task; onReady: () => void; }
const DailyClaim: React.FC<DailyClaimProps> = ({ task, onReady }) => {
  const [claimed, setClaimed] = useState(false);
  return (
    <div className="flex flex-col items-center py-6 gap-4">
      <div className="w-20 h-20 rounded-full gradient-bg-primary flex items-center justify-center">
        <Gift className="h-10 w-10 text-white" />
      </div>
      <p className="text-lg font-bold">Daily Reward Available!</p>
      <p className="text-sm text-muted-foreground text-center text-pretty">
        {task.instructions ?? 'Claim your daily reward. Come back tomorrow for the next one!'}
      </p>
      <div className="text-3xl font-extrabold text-green-600 dark:text-green-400">KES {task.reward}</div>
      {!claimed ? (
        <Button className="gradient-bg-primary text-white border-0 px-8" onClick={() => { setClaimed(true); onReady(); }}>
          Claim Reward
        </Button>
      ) : (
        <div className="flex items-center gap-2 text-green-600 font-medium">
          <CheckCircle className="h-5 w-5" /> Reward claimed!
        </div>
      )}
    </div>
  );
};

interface ReferralShareProps { profile: { referral_code: string; username: string } | null; onReady: () => void; }
const ReferralShare: React.FC<ReferralShareProps> = ({ profile, onReady }) => {
  const [shared, setShared] = useState(false);
  const link = `${window.location.origin}/register?ref=${profile?.referral_code ?? ''}`;

  const copyLink = () => {
    navigator.clipboard.writeText(link);
    toast.success('Referral link copied!');
    setShared(true);
    onReady();
  };

  return (
    <div className="space-y-4">
      <div className="bg-muted/50 rounded-xl p-4 space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Your Referral Code</p>
        <p className="text-2xl font-bold tracking-widest text-primary">{profile?.referral_code}</p>
      </div>
      <div className="bg-muted/50 rounded-xl p-3 break-all">
        <p className="text-xs font-medium text-muted-foreground mb-1">Referral Link</p>
        <p className="text-xs text-foreground">{link}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={copyLink}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
          <Share2 className="h-4 w-4" /> Copy & Share
        </button>
        {typeof navigator.share === 'function' && (
          <button onClick={() => {
            navigator.share({ title: 'Join MetaPay', text: 'Earn money with MetaPay!', url: link });
            setShared(true); onReady();
          }} className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-accent transition-colors">
            <Share2 className="h-4 w-4" /> Native Share
          </button>
        )}
      </div>
      {shared && (
        <div className="flex items-center gap-2 text-green-600 text-sm font-medium justify-center">
          <CheckCircle className="h-4 w-4" /> Link shared – mark complete below!
        </div>
      )}
      {!shared && (
        <p className="text-xs text-muted-foreground text-center">Copy and share your link to unlock the complete button</p>
      )}
    </div>
  );
};

// ── Main TasksPage ─────────────────────────────────────────────────────────

const TasksPage: React.FC = () => {
  const { profile, isActive, refreshProfile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | 'all'>('all');
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [taskReady, setTaskReady] = useState(false);
  const [taskAnswers, setTaskAnswers] = useState<Record<string, string | string[]>>({});

  useEffect(() => { loadTasks(); }, []);

  const loadTasks = async () => {
    setLoading(true);
    const [tasksRes, completionsRes] = await Promise.all([
      supabase.from('tasks').select('*').eq('is_active', true).order('reward', { ascending: false }),
      supabase.from('task_completions').select('task_id').gte('completed_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    ]);
    if (tasksRes.data) setTasks(tasksRes.data as Task[]);
    if (completionsRes.data) setCompletedToday(new Set(completionsRes.data.map(c => c.task_id)));
    setLoading(false);
  };

  const canAccessTask = (task: Task): boolean => {
    if (!isActive || !profile?.package) return false;
    return task.required_packages.includes(profile.package);
  };

  const openTask = (task: Task) => {
    setActiveTask(task);
    setTaskReady(false);
    setTaskAnswers({});
  };

  const handleCompleteTask = async () => {
    if (!activeTask || !profile) return;
    setSubmitting(true);
    const { data, error } = await supabase.rpc('complete_task', {
      p_task_id: activeTask.id,
      p_proof_url: null,
      p_notes: Object.keys(taskAnswers).length > 0 ? JSON.stringify(taskAnswers) : null,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message || 'Failed to complete task');
    } else if (data?.error) {
      toast.error(data.error);
    } else {
      toast.success(`✅ Task completed! You earned KES ${activeTask.reward}`);
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
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-balance">Available Tasks</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isActive
                ? `${filteredTasks.filter(t => canAccessTask(t) && !completedToday.has(t.id)).length} tasks available`
                : '0 tasks – activate your account'}
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
              <button key={cat} onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors',
                  selectedCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}>
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

        {/* Task Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl bg-muted" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTasks.map((task, index) => {
              const accessible = canAccessTask(task);
              const doneToday = completedToday.has(task.id);
              return (
                <motion.div key={task.id}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn('bg-card border border-border rounded-2xl p-5 flex flex-col h-full transition-shadow', accessible && !doneToday ? 'hover:shadow-md' : 'opacity-70')}>
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
                      <Clock className="h-3.5 w-3.5" />{task.estimated_time_minutes} min
                    </span>
                  </div>
                  {doneToday ? (
                    <div className="flex items-center gap-2 justify-center py-2 bg-green-50 dark:bg-green-900/20 rounded-xl text-green-700 dark:text-green-400 text-sm font-medium">
                      <CheckCircle className="h-4 w-4" /> Completed Today
                    </div>
                  ) : accessible ? (
                    <Button size="sm" className="w-full gradient-bg-primary text-white border-0" onClick={() => openTask(task)}>
                      <Zap className="h-3.5 w-3.5 mr-1" /> Start Task
                    </Button>
                  ) : (
                    <div className="w-full flex items-center justify-center gap-1 h-8 px-3 text-sm rounded-md border border-border text-muted-foreground cursor-not-allowed opacity-60">
                      <Lock className="h-3.5 w-3.5" />{!isActive ? 'Activate to Unlock' : 'Upgrade Package'}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── In-App Task Execution Dialog ── */}
      <Dialog open={!!activeTask} onOpenChange={() => setActiveTask(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {activeTask && <span>{CATEGORY_EMOJIS[activeTask.category]}</span>}
              {activeTask?.title}
            </DialogTitle>
          </DialogHeader>

          {activeTask && (
            <div className="space-y-4">
              {/* Reward banner */}
              <div className="flex gap-3">
                <div className="flex-1 bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
                  <p className="text-xs text-muted-foreground">Reward</p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">KES {activeTask.reward}</p>
                </div>
                <div className="flex-1 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{activeTask.estimated_time_minutes}m</p>
                </div>
                <div className="flex-1 bg-muted rounded-xl p-3 text-center">
                  <p className="text-xs text-muted-foreground">Difficulty</p>
                  <p className="text-sm font-bold capitalize">{activeTask.difficulty}</p>
                </div>
              </div>

              {/* ── Task Content by Type ── */}

              {(activeTask.content_type === 'video_embed' || activeTask.content_type === 'text_instructions') && activeTask.embed_url && (
                <VideoTask
                  embedUrl={activeTask.embed_url}
                  watchDuration={activeTask.watch_duration_seconds ?? 60}
                  onReady={() => setTaskReady(true)}
                />
              )}

              {activeTask.content_type === 'survey_form' && activeTask.task_questions && (
                <SurveyTask
                  questions={activeTask.task_questions}
                  onAnswers={a => { setTaskAnswers(a); setTaskReady(true); }}
                />
              )}

              {activeTask.content_type === 'annotation' && activeTask.task_questions && (
                <AnnotationTask
                  questions={activeTask.task_questions}
                  onAnswers={a => { setTaskAnswers(a); setTaskReady(true); }}
                />
              )}

              {activeTask.content_type === 'countdown_claim' && (
                <DailyClaim task={activeTask} onReady={() => setTaskReady(true)} />
              )}

              {activeTask.content_type === 'referral_share' && (
                <ReferralShare
                  profile={profile ? { referral_code: profile.referral_code, username: profile.username } : null}
                  onReady={() => setTaskReady(true)}
                />
              )}

              {activeTask.content_type === 'feedback_form' && activeTask.task_questions && (
                <>
                  <div className="bg-muted/50 rounded-xl p-3">
                    <p className="text-sm font-medium mb-1">Instructions</p>
                    <p className="text-sm text-muted-foreground text-pretty">{activeTask.instructions ?? activeTask.description}</p>
                  </div>
                  <SurveyTask
                    questions={activeTask.task_questions}
                    onAnswers={a => { setTaskAnswers(a); setTaskReady(true); }}
                  />
                </>
              )}

              {activeTask.content_type === 'text_instructions' && !activeTask.embed_url && (
                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="text-sm font-medium mb-1">Instructions</p>
                  <p className="text-sm text-muted-foreground text-pretty">{activeTask.instructions ?? activeTask.description}</p>
                  <button
                    onClick={() => setTaskReady(true)}
                    className="mt-3 text-xs text-primary underline underline-offset-2">
                    I have read and understood the instructions
                  </button>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <Button variant="outline" onClick={() => setActiveTask(null)} className="flex-1">Cancel</Button>
                <Button
                  className="flex-1 gradient-bg-primary text-white border-0 disabled:opacity-50"
                  onClick={handleCompleteTask}
                  disabled={submitting || !taskReady}
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      {taskReady ? 'Mark Complete & Claim' : 'Complete Task First'}
                    </span>
                  )}
                </Button>
              </div>
              {!taskReady && (
                <p className="text-xs text-muted-foreground text-center">
                  Complete the task above to unlock the claim button
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default TasksPage;
