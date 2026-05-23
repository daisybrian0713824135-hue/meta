import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";

const BRAND = "#f97316";

const packages = [
  {
    name: "Starter",
    price: "KES 999",
    period: "/mo",
    badge: null,
    color: "border-gray-200",
    features: [
      "Up to 3 team members",
      "100 tasks per month",
      "Basic reporting",
      "Email support",
      "Task categories",
    ],
  },
  {
    name: "Professional",
    price: "KES 2,499",
    period: "/mo",
    badge: "Most Popular",
    color: "border-orange-500",
    features: [
      "Up to 15 team members",
      "Unlimited tasks",
      "Advanced analytics",
      "Priority support",
      "Custom workflows",
      "API access",
    ],
  },
  {
    name: "Enterprise",
    price: "KES 4,999",
    period: "/mo",
    badge: "Best Value",
    color: "border-gray-800",
    features: [
      "Unlimited team members",
      "Unlimited tasks",
      "Custom reporting",
      "24/7 dedicated support",
      "SSO & compliance",
      "White-label option",
      "SLA guarantee",
    ],
  },
];

const reviews = [
  {
    name: "Amina Ochieng",
    role: "Project Manager, CreativeHub Nairobi",
    avatar: "AO",
    rating: 5,
    text: "MetaPay Agencies transformed how our team manages projects. The task dashboard is incredibly intuitive and the Paynecta integration made billing seamless.",
  },
  {
    name: "Brian Mwangi",
    role: "CEO, DigitalPulse Kenya",
    avatar: "BM",
    rating: 5,
    text: "We switched from spreadsheets to MetaPay and our productivity jumped by 60%. The reporting features help us stay on top of every client deliverable.",
  },
  {
    name: "Faith Wanjiku",
    role: "Operations Lead, SkyAgency",
    avatar: "FW",
    rating: 5,
    text: "The subscription packages are perfectly priced for the Kenyan market. Outstanding customer support and the UI is clean and fast.",
  },
  {
    name: "Dennis Kamau",
    role: "Founder, Nexus Digital",
    avatar: "DK",
    rating: 4,
    text: "Finally a task management tool built for African agencies. The M-Pesa-friendly payment through Paynecta is a game-changer for our entire team.",
  },
  {
    name: "Grace Njeri",
    role: "Account Director, BoldMark",
    avatar: "GN",
    rating: 5,
    text: "We manage 20+ client projects simultaneously and MetaPay keeps everything organised. The mobile-friendly dashboard is perfect for on-the-go management.",
  },
];

const ACTIVITIES = [
  { user: "Alice K.", action: "completed task", item: "Brand identity redesign", time: "2s ago", color: "bg-green-500" },
  { user: "James M.", action: "created task", item: "SEO audit for client portal", time: "8s ago", color: "bg-blue-500" },
  { user: "Sara W.", action: "subscribed to", item: "Professional plan", time: "15s ago", color: "bg-orange-500" },
  { user: "Peter N.", action: "assigned task", item: "Q4 social media calendar", time: "22s ago", color: "bg-purple-500" },
  { user: "Linda O.", action: "completed task", item: "Website copywriting — homepage", time: "31s ago", color: "bg-green-500" },
  { user: "Tom K.", action: "created task", item: "Email campaign — November", time: "45s ago", color: "bg-blue-500" },
  { user: "Mercy A.", action: "subscribed to", item: "Enterprise plan", time: "1m ago", color: "bg-orange-500" },
  { user: "Chris O.", action: "completed task", item: "Client onboarding deck", time: "1m ago", color: "bg-green-500" },
  { user: "Naomi T.", action: "created task", item: "Analytics dashboard setup", time: "2m ago", color: "bg-blue-500" },
  { user: "Evans R.", action: "completed task", item: "Competitor analysis report", time: "3m ago", color: "bg-green-500" },
];

const features = [
  {
    icon: "📋",
    title: "Smart Task Management",
    desc: "Create, assign, and track tasks across your entire team with priorities, deadlines, and real-time status updates.",
  },
  {
    icon: "📊",
    title: "Live Analytics Dashboard",
    desc: "Get a bird's-eye view of all projects — completed, in-progress, pending, and overdue — all in one place.",
  },
  {
    icon: "💳",
    title: "Seamless Paynecta Payments",
    desc: "Pay securely via M-Pesa, cards, and bank transfer. Instant account activation once payment is confirmed.",
  },
  {
    icon: "👥",
    title: "Team Collaboration",
    desc: "Assign tasks to team members, set categories, and track who's responsible for every deliverable.",
  },
  {
    icon: "🔔",
    title: "Smart Filtering & Search",
    desc: "Filter tasks by status, priority, category, and due date. Find anything in seconds with full-text search.",
  },
  {
    icon: "🛡️",
    title: "Admin Controls",
    desc: "Full admin panel to manage users, monitor subscriptions, and control account statuses across your agency.",
  },
];

const stats = [
  { value: "500+", label: "Active Agencies" },
  { value: "50,000+", label: "Tasks Completed" },
  { value: "98%", label: "Client Satisfaction" },
  { value: "KES 2B+", label: "Projects Managed" },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= rating ? "text-orange-400" : "text-gray-200"}>★</span>
      ))}
    </div>
  );
}

function ActivityFeed() {
  const [items, setItems] = useState(ACTIVITIES.slice(0, 6));
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setItems((prev) => {
          const next = [...prev];
          const random = ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)];
          next.unshift({ ...random, time: "just now" });
          next.pop();
          return next;
        });
        setVisible(true);
      }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-2.5">
      {items.map((a, i) => (
        <div
          key={i}
          className="flex items-start gap-3 p-3 bg-white rounded-xl shadow-sm border border-gray-100 transition-all duration-300"
          style={{ opacity: visible ? 1 : 0.4, transform: visible ? "translateY(0)" : "translateY(-4px)" }}
        >
          <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${a.color}`} />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-800 truncate">
              <span className="font-semibold">{a.user}</span>{" "}
              <span className="text-gray-500">{a.action}</span>{" "}
              <span className="font-medium text-gray-700 truncate">"{a.item}"</span>
            </p>
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">{a.time}</span>
        </div>
      ))}
    </div>
  );
}

function CountUp({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        let start = 0;
        const step = Math.ceil(target / 60);
        const timer = setInterval(() => {
          start += step;
          if (start >= target) { setCount(target); clearInterval(timer); }
          else setCount(start);
        }, 25);
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <div ref={ref}>{count.toLocaleString()}{suffix}</div>;
}

export default function Landing() {
  const [, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [reviewIdx, setReviewIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setReviewIdx((i) => (i + 1) % reviews.length), 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm" style={{ background: BRAND }}>M</div>
            <span className="text-lg font-bold text-gray-900">MetaPay <span className="font-light text-gray-500">Agencies</span></span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-600 font-medium">
            <a href="#features" className="hover:text-orange-500 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-orange-500 transition-colors">Pricing</a>
            <a href="#activity" className="hover:text-orange-500 transition-colors">Live Activity</a>
            <a href="#reviews" className="hover:text-orange-500 transition-colors">Reviews</a>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => setLocation("/login")} className="text-sm font-medium text-gray-700 hover:text-orange-500 transition-colors px-4 py-2">Sign in</button>
            <button onClick={() => setLocation("/register")} className="text-sm font-semibold text-white rounded-lg px-5 py-2.5 transition-all hover:opacity-90 shadow-md" style={{ background: BRAND }}>
              Get Started Free
            </button>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-gray-700 text-2xl">☰</button>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
            <a href="#features" onClick={() => setMenuOpen(false)} className="block text-gray-700 font-medium">Features</a>
            <a href="#pricing" onClick={() => setMenuOpen(false)} className="block text-gray-700 font-medium">Pricing</a>
            <a href="#activity" onClick={() => setMenuOpen(false)} className="block text-gray-700 font-medium">Live Activity</a>
            <a href="#reviews" onClick={() => setMenuOpen(false)} className="block text-gray-700 font-medium">Reviews</a>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setLocation("/login")} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium text-gray-700">Sign in</button>
              <button onClick={() => setLocation("/register")} className="flex-1 rounded-lg py-2 text-sm font-semibold text-white" style={{ background: BRAND }}>Get Started</button>
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #fff7f0 0%, #fff 60%, #fef3e2 100%)" }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-20 w-72 h-72 rounded-full opacity-10" style={{ background: BRAND, filter: "blur(60px)" }} />
          <div className="absolute bottom-0 left-10 w-64 h-64 rounded-full opacity-5" style={{ background: BRAND, filter: "blur(80px)" }} />
        </div>
        <div className="max-w-6xl mx-auto px-4 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-orange-600 bg-orange-50 border border-orange-100 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
              Trusted by 500+ Kenyan Agencies
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
              Manage Your Agency<br />
              <span style={{ color: BRAND }}>Tasks & Payments</span><br />
              In One Place
            </h1>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-md">
              MetaPay Agencies is the all-in-one task management platform built for Kenyan digital agencies — with seamless Paynecta billing, team collaboration, and real-time analytics.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setLocation("/register")}
                className="flex items-center gap-2 text-white font-semibold rounded-xl px-7 py-3.5 text-base shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
                style={{ background: BRAND }}
              >
                Start Free Trial <span>→</span>
              </button>
              <a
                href="#pricing"
                className="flex items-center gap-2 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl px-7 py-3.5 text-base hover:border-orange-300 transition-all"
              >
                View Pricing
              </a>
            </div>
            <p className="text-sm text-gray-400 mt-4">No credit card required · Cancel anytime</p>
          </div>

          {/* Hero Widget */}
          <div className="hidden md:block">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 max-w-sm ml-auto">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: BRAND }}>M</div>
                <div>
                  <div className="text-sm font-bold text-gray-900">Dashboard Overview</div>
                  <div className="text-xs text-gray-400">Today · Live</div>
                </div>
                <div className="ml-auto flex gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: "Total Tasks", value: "247", icon: "📋", color: "bg-blue-50 text-blue-600" },
                  { label: "Completed", value: "189", icon: "✅", color: "bg-green-50 text-green-600" },
                  { label: "In Progress", value: "42", icon: "⚡", color: "bg-orange-50 text-orange-600" },
                  { label: "Overdue", value: "16", icon: "🔴", color: "bg-red-50 text-red-600" },
                ].map((s) => (
                  <div key={s.label} className={`rounded-xl p-3 ${s.color}`}>
                    <div className="text-lg mb-1">{s.icon}</div>
                    <div className="text-xl font-bold">{s.value}</div>
                    <div className="text-xs opacity-70">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {["Brand redesign — InProgress", "SEO audit — Pending", "Social campaign — Done"].map((t, i) => (
                  <div key={i} className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${i === 0 ? "bg-orange-400" : i === 1 ? "bg-yellow-400" : "bg-green-400"}`} />
                    <span className="text-xs text-gray-600 truncate">{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BANNER */}
      <section className="py-14" style={{ background: BRAND }}>
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
          {[
            { raw: 500, suffix: "+", label: "Active Agencies" },
            { raw: 50000, suffix: "+", label: "Tasks Completed" },
            { raw: 98, suffix: "%", label: "Satisfaction Rate" },
            { raw: 120, suffix: "+", label: "Cities Covered" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl md:text-4xl font-extrabold mb-1">
                <CountUp target={s.raw} suffix={s.suffix} />
              </div>
              <div className="text-sm opacity-80">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <div className="inline-block text-xs font-bold uppercase tracking-widest text-orange-500 mb-3">What We Offer</div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Everything your agency needs</h2>
            <p className="text-gray-500 max-w-xl mx-auto">A complete toolkit to manage tasks, collaborate with your team, and grow your Kenyan agency — all in one beautifully designed platform.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-base font-bold text-gray-900 mb-2 group-hover:text-orange-500 transition-colors">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LIVE ACTIVITY */}
      <section id="activity" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block text-xs font-bold uppercase tracking-widest text-orange-500 mb-3">Live Feed</div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">See what's happening right now</h2>
            <p className="text-gray-500 mb-6 leading-relaxed">Agencies across Kenya are managing tasks, completing projects, and activating subscriptions on MetaPay every minute of the day.</p>
            <div className="flex items-center gap-2 text-sm text-green-600 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse inline-block" />
              Live · Updates every 3 seconds
            </div>
          </div>
          <div>
            <ActivityFeed />
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <div className="inline-block text-xs font-bold uppercase tracking-widest text-orange-500 mb-3">Pricing</div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Simple, transparent pricing</h2>
            <p className="text-gray-500 max-w-md mx-auto">No hidden fees. Pay securely via M-Pesa or card through Paynecta. Cancel anytime.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {packages.map((pkg) => (
              <div
                key={pkg.name}
                className={`bg-white rounded-2xl p-7 border-2 ${pkg.color} relative shadow-sm hover:shadow-lg transition-shadow flex flex-col`}
              >
                {pkg.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="text-xs font-bold text-white rounded-full px-4 py-1.5 shadow" style={{ background: BRAND }}>{pkg.badge}</span>
                  </div>
                )}
                <div className="mb-5">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{pkg.name}</h3>
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-extrabold text-gray-900">{pkg.price}</span>
                    <span className="text-sm text-gray-400 mb-1">{pkg.period}</span>
                  </div>
                </div>
                <ul className="space-y-2.5 mb-7 flex-1">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <span className="text-green-500 font-bold mt-0.5 flex-shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setLocation("/register")}
                  className={`w-full rounded-xl py-3 text-sm font-semibold transition-all ${pkg.badge ? "text-white shadow-md hover:opacity-90" : "border-2 border-gray-200 text-gray-700 hover:border-orange-300"}`}
                  style={pkg.badge ? { background: BRAND } : {}}
                >
                  Get Started
                </button>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-400 mt-6">All plans include a 7-day free trial. Payment processed via Paynecta.</p>
        </div>
      </section>

      {/* REVIEWS */}
      <section id="reviews" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <div className="inline-block text-xs font-bold uppercase tracking-widest text-orange-500 mb-3">Testimonials</div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Loved by Kenyan agencies</h2>
            <p className="text-gray-500">Don't take our word for it — hear from teams already using MetaPay.</p>
          </div>
          {/* Featured review */}
          <div className="max-w-2xl mx-auto mb-10">
            <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl p-8 border border-orange-100 shadow-sm transition-all duration-500">
              <StarRating rating={reviews[reviewIdx].rating} />
              <p className="text-lg text-gray-800 font-medium leading-relaxed my-5">"{reviews[reviewIdx].text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: BRAND }}>
                  {reviews[reviewIdx].avatar}
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-sm">{reviews[reviewIdx].name}</div>
                  <div className="text-xs text-gray-500">{reviews[reviewIdx].role}</div>
                </div>
              </div>
            </div>
            <div className="flex justify-center gap-2 mt-4">
              {reviews.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setReviewIdx(i)}
                  className="rounded-full transition-all"
                  style={{
                    width: i === reviewIdx ? 24 : 8,
                    height: 8,
                    background: i === reviewIdx ? BRAND : "#e5e7eb",
                  }}
                />
              ))}
            </div>
          </div>
          {/* Grid of other reviews */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {reviews.slice(0, 3).map((r, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <StarRating rating={r.rating} />
                <p className="text-sm text-gray-600 my-3 leading-relaxed line-clamp-3">"{r.text}"</p>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: BRAND }}>
                    {r.avatar}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900">{r.name}</div>
                    <div className="text-xs text-gray-400">{r.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <div className="inline-block text-xs font-bold uppercase tracking-widest text-orange-500 mb-3">How It Works</div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Up and running in minutes</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6 text-center">
            {[
              { step: "1", icon: "📝", title: "Register", desc: "Create your agency account in under 60 seconds." },
              { step: "2", icon: "📦", title: "Choose a Plan", desc: "Pick Starter, Professional, or Enterprise." },
              { step: "3", icon: "💳", title: "Pay via Paynecta", desc: "Secure payment via M-Pesa, card, or bank." },
              { step: "4", icon: "🚀", title: "Start Managing", desc: "Access your full dashboard instantly." },
            ].map((s) => (
              <div key={s.step} className="relative">
                <div className="w-12 h-12 rounded-full text-white font-extrabold text-lg flex items-center justify-center mx-auto mb-4 shadow-lg" style={{ background: BRAND }}>
                  {s.step}
                </div>
                <div className="text-2xl mb-2">{s.icon}</div>
                <h3 className="font-bold text-gray-900 mb-1">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20" style={{ background: "linear-gradient(135deg, #ea580c 0%, #f97316 60%, #fb923c 100%)" }}>
        <div className="max-w-2xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Ready to grow your agency?</h2>
          <p className="text-lg opacity-90 mb-8">Join 500+ Kenyan agencies already managing their work smarter with MetaPay Agencies.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => setLocation("/register")}
              className="bg-white font-bold rounded-xl px-8 py-4 text-base shadow-xl hover:-translate-y-0.5 transition-all"
              style={{ color: BRAND }}
            >
              Get Started Free →
            </button>
            <button
              onClick={() => setLocation("/login")}
              className="border-2 border-white/50 text-white font-semibold rounded-xl px-8 py-4 text-base hover:bg-white/10 transition-all"
            >
              Sign In
            </button>
          </div>
          <p className="text-sm opacity-70 mt-4">7-day free trial · No credit card required · Cancel anytime</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ background: BRAND }}>M</div>
                <span className="text-white font-bold text-base">MetaPay Agencies</span>
              </div>
              <p className="text-sm leading-relaxed max-w-xs">The task management platform built for Kenyan digital agencies. Powered by Paynecta.</p>
            </div>
            <div>
              <div className="text-white font-semibold mb-3 text-sm">Product</div>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-orange-400 transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-orange-400 transition-colors">Pricing</a></li>
                <li><a href="#reviews" className="hover:text-orange-400 transition-colors">Reviews</a></li>
                <li><button onClick={() => setLocation("/register")} className="hover:text-orange-400 transition-colors">Sign Up</button></li>
              </ul>
            </div>
            <div>
              <div className="text-white font-semibold mb-3 text-sm">Company</div>
              <ul className="space-y-2 text-sm">
                <li><span>Nairobi, Kenya</span></li>
                <li><span>support@metapay.co.ke</span></li>
                <li><button onClick={() => setLocation("/login")} className="hover:text-orange-400 transition-colors">Admin Login</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <span>© 2026 MetaPay Agencies. All rights reserved.</span>
            <span>Built for Kenyan agencies · Powered by Paynecta</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
