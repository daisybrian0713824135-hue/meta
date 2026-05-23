import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Zap, CheckCircle, Users, TrendingUp, Star, ChevronDown, ChevronUp,
  ArrowRight, Shield, Clock, Wallet, Target, Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LiveActivityTicker } from '@/components/common/LiveActivityTicker';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { cn } from '@/lib/utils';
import { supabase } from '@/db/supabase';

const PACKAGES = [
  { name: 'Starter', price: 500, daily: 80, tasks: 5, color: 'from-gray-500 to-gray-700', popular: false },
  { name: 'Bronze', price: 1000, daily: 200, tasks: 10, color: 'from-amber-600 to-amber-800', popular: false },
  { name: 'Silver', price: 2000, daily: 500, tasks: 20, color: 'from-slate-400 to-slate-600', popular: false },
  { name: 'Gold', price: 3500, daily: 1000, tasks: 35, color: 'from-yellow-400 to-yellow-600', popular: true },
  { name: 'VIP', price: 5500, daily: 1800, tasks: 999, color: 'from-purple-500 to-indigo-600', popular: false },
];

const TESTIMONIALS = [
  { name: 'Sarah M.', location: 'Nairobi', amount: 'KES 12,400', text: 'I have been earning steadily on MetaPay for 3 months. The tasks are easy and payments are always on time!', pkg: 'Gold', stars: 5 },
  { name: 'Kevin O.', location: 'Mombasa', amount: 'KES 9,850', text: 'I started with the Bronze package and upgraded to Silver. My daily earnings have tripled since then!', pkg: 'Silver', stars: 5 },
  { name: 'Grace A.', location: 'Kisumu', amount: 'KES 7,200', text: 'MetaPay is the best earning platform I have used. Smooth M-Pesa withdrawals every time.', pkg: 'Silver', stars: 5 },
  { name: 'James K.', location: 'Eldoret', amount: 'KES 5,600', text: 'Completing surveys and watching ads has never been this rewarding. Highly recommend!', pkg: 'Bronze', stars: 4 },
];

const FAQS = [
  { q: 'How do I start earning?', a: 'Register an account, choose a package that fits your budget, complete the activation payment, and start completing tasks immediately!' },
  { q: 'When are payments processed?', a: 'Withdrawals are processed within 24 hours of approval. M-Pesa transfers are instant once approved.' },
  { q: 'What is the minimum withdrawal?', a: 'The minimum withdrawal amount is KES 500. There is no maximum limit.' },
  { q: 'How does the referral system work?', a: 'Share your unique referral code with friends. When they activate an account, you earn 10% commission on all their task earnings.' },
  { q: 'Can I upgrade my package?', a: 'Yes! You can upgrade to a higher package at any time. Higher packages unlock more tasks and higher daily earnings.' },
  { q: 'Is MetaPay safe and legitimate?', a: 'Yes! MetaPay is a legitimate earning platform. All payments are processed through Paynecta and M-Pesa for security.' },
];

const HOW_IT_WORKS = [
  { step: 1, title: 'Register', desc: 'Create your free account with your name, username, and phone number.', icon: Users },
  { step: 2, title: 'Activate', desc: 'Choose a package that fits your budget and complete your activation payment.', icon: Zap },
  { step: 3, title: 'Complete Tasks', desc: 'Start completing surveys, watching ads, testing apps and more.', icon: Target },
  { step: 4, title: 'Withdraw', desc: 'Withdraw your earnings directly to your M-Pesa at any time.', icon: Wallet },
];

const HomePage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [stats, setStats] = useState({ users: 0, earned: 0, tasks: 0 });

  useEffect(() => {
    // Load site stats
    Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('earnings').select('amount'),
      supabase.from('task_completions').select('id', { count: 'exact', head: true }),
    ]).then(([usersRes, earningsRes, tasksRes]) => {
      const totalEarned = (earningsRes.data ?? []).reduce((s, e) => s + Number(e.amount), 0);
      setStats({
        users: usersRes.count ?? 0,
        earned: totalEarned,
        tasks: tasksRes.count ?? 0,
      });
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 gradient-bg-primary rounded-xl flex items-center justify-center">
              <Zap className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">MetaPay</span>
          </Link>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/login" className="hidden sm:inline-flex items-center justify-center rounded-md border border-input bg-background text-sm font-medium px-3 h-9 hover:bg-accent hover:text-accent-foreground transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="inline-flex items-center justify-center rounded-md text-sm font-medium px-3 h-9 gradient-bg-primary text-white transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-96 h-96 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full bg-chart-2/15 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-chart-3/5 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 px-4 py-1.5 text-sm font-medium">
              🚀 Kenya's #1 Earning Platform
            </Badge>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-5 text-balance leading-tight">
              Earn Real Money
              <span className="block gradient-text">From Simple Tasks</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 text-pretty">
              Complete surveys, watch ads, test apps, and more — earn KES every day and withdraw directly to your M-Pesa!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/register" className="inline-flex items-center justify-center rounded-md text-base font-semibold h-12 px-8 gradient-bg-primary text-white transition-colors">
                Start Earning Free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link to="/login" className="inline-flex items-center justify-center rounded-md border border-input bg-background text-base font-medium h-12 px-8 hover:bg-accent hover:text-accent-foreground transition-colors">
                <Play className="mr-2 h-4 w-4" />Sign In
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-8 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-green-500" />Secure Payments</span>
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-blue-500" />24h Payouts</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-purple-500" />Verified Platform</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Live Activity */}
      <section className="py-4 bg-muted/30 border-y border-border">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <LiveActivityTicker compact />
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-background">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Active Members', value: `${(stats.users || 2400).toLocaleString()}+`, icon: Users, color: 'text-blue-500' },
              { label: 'Total Earnings Paid', value: `KES ${(stats.earned || 1200000).toLocaleString()}+`, icon: TrendingUp, color: 'text-green-500' },
              { label: 'Tasks Completed', value: `${(stats.tasks || 48000).toLocaleString()}+`, icon: CheckCircle, color: 'text-purple-500' },
            ].map(({ label, value, icon: Icon, color }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-6 bg-card border border-border rounded-2xl"
              >
                <div className={cn('w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3', color)}>
                  <Icon className="h-6 w-6" />
                </div>
                <p className="text-3xl font-extrabold mb-1">{value}</p>
                <p className="text-muted-foreground text-sm">{label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-muted/20">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-balance mb-3">How It Works</h2>
            <p className="text-muted-foreground text-pretty max-w-xl mx-auto">Getting started with MetaPay is simple and takes less than 5 minutes.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map(({ step, title, desc, icon: Icon }, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center relative"
              >
                <div className="w-12 h-12 gradient-bg-primary rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="absolute top-5 left-[calc(50%+24px)] right-[-50%] h-0.5 bg-gradient-to-r from-primary/40 to-transparent hidden md:block" />
                <p className="text-lg font-bold mb-1">{title}</p>
                <p className="text-sm text-muted-foreground text-pretty">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section className="py-16 bg-background">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-balance mb-3">Choose Your Package</h2>
            <p className="text-muted-foreground text-pretty max-w-xl mx-auto">Start with any package and upgrade anytime. Higher packages unlock more tasks and higher earnings.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {PACKAGES.map((pkg, i) => (
              <motion.div
                key={pkg.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className={cn(
                  'bg-card border rounded-2xl overflow-hidden flex flex-col',
                  pkg.popular ? 'border-yellow-400 ring-2 ring-yellow-400 ring-offset-2' : 'border-border'
                )}
              >
                {pkg.popular && (
                  <div className="bg-yellow-400 text-yellow-900 text-xs font-bold text-center py-1.5">🔥 MOST POPULAR</div>
                )}
                <div className={cn('p-4 bg-gradient-to-br text-white', pkg.color)}>
                  <p className="text-base font-bold">{pkg.name}</p>
                  <p className="text-2xl font-extrabold mt-1">KES {pkg.price.toLocaleString()}</p>
                  <p className="text-white/70 text-xs">one-time</p>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="space-y-2 flex-1 mb-4 text-sm">
                    <p className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />Est. KES {pkg.daily.toLocaleString()}/day</p>
                    <p className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />{pkg.tasks === 999 ? 'Unlimited' : pkg.tasks} tasks/day</p>
                    <p className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />M-Pesa withdrawals</p>
                  </div>
                  <Link
                    to="/register"
                    className={cn(
                      'w-full inline-flex items-center justify-center rounded-md text-sm font-medium h-8 px-3 transition-colors',
                      pkg.popular ? 'gradient-bg-primary text-white' : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    Get Started
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Task Preview */}
      <section className="py-16 bg-muted/20">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-balance mb-3">Available Task Types</h2>
            <p className="text-muted-foreground text-pretty max-w-xl mx-auto">We offer a wide variety of tasks to match your skills and schedule.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { emoji: '📋', name: 'Surveys', desc: 'Share your opinion', reward: 'KES 20–100' },
              { emoji: '📺', name: 'Watch Ads', desc: 'View short videos', reward: 'KES 5–30' },
              { emoji: '📱', name: 'App Testing', desc: 'Test mobile apps', reward: 'KES 50–200' },
              { emoji: '🔍', name: 'Data Tasks', desc: 'Label & annotate', reward: 'KES 30–150' },
              { emoji: '🎁', name: 'Offers', desc: 'Complete offers', reward: 'KES 100–500' },
              { emoji: '🎬', name: 'Video Tasks', desc: 'Watch & review', reward: 'KES 20–80' },
              { emoji: '📅', name: 'Daily Tasks', desc: 'Check in daily', reward: 'KES 10–50' },
              { emoji: '👥', name: 'Referrals', desc: 'Invite friends', reward: '10% commission' },
            ].map(({ emoji, name, desc, reward }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-xl p-4 text-center hover:shadow-md transition-shadow"
              >
                <div className="text-3xl mb-2">{emoji}</div>
                <p className="text-sm font-semibold">{name}</p>
                <p className="text-xs text-muted-foreground mb-1">{desc}</p>
                <p className="text-xs font-medium text-green-600 dark:text-green-400">{reward}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Activity Full */}
      <section className="py-16 bg-background">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-balance mb-3">Live Earnings Activity</h2>
            <p className="text-muted-foreground text-pretty">See what members are earning right now</p>
          </div>
          <LiveActivityTicker />
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-muted/20">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-balance mb-3">What Members Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {TESTIMONIALS.map(({ name, location, amount, text, pkg, stars }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-border rounded-2xl p-5"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 gradient-bg-primary rounded-xl flex items-center justify-center text-white font-bold shrink-0">
                    {name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold">{name}</p>
                      <Badge className="text-xs bg-primary/10 text-primary">{pkg}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{location} · Earned {amount}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-2">
                  {Array.from({ length: stars }).map((_, j) => (
                    <Star key={j} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground italic text-pretty">"{text}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-background">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-balance mb-3">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map(({ q, a }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-sm font-semibold pr-4">{q}</span>
                  {openFaq === i ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-muted-foreground text-pretty">{a}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 gradient-bg-primary">
        <div className="max-w-3xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 text-balance">Ready to Start Earning?</h2>
          <p className="text-white/80 mb-8 text-pretty">Join thousands of Kenyans earning real money on MetaPay. Get started today!</p>
          <Link
            to="/register"
            className="inline-flex items-center justify-center bg-white text-primary hover:bg-white/90 h-12 px-10 text-base font-bold rounded-md transition-colors"
          >
            Create Free Account <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 gradient-bg-primary rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold gradient-text">MetaPay</span>
            </Link>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/terms" className="hover:text-foreground">Terms</Link>
              <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
              <Link to="/login" className="hover:text-foreground">Login</Link>
              <Link to="/register" className="hover:text-foreground">Register</Link>
            </div>
            <p className="text-xs text-muted-foreground">© 2025 MetaPay. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
