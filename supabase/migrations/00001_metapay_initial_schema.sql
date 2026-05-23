
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- ENUMS
-- ==========================================
CREATE TYPE public.user_role AS ENUM ('user', 'moderator', 'admin', 'super_admin');
CREATE TYPE public.account_status AS ENUM ('inactive', 'active', 'suspended');
CREATE TYPE public.package_name AS ENUM ('starter', 'bronze', 'silver', 'gold', 'vip');
CREATE TYPE public.withdrawal_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.task_difficulty AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE public.task_category AS ENUM ('surveys', 'watching_ads', 'app_testing', 'data_annotation', 'offers', 'video_tasks', 'daily_tasks', 'referrals');
CREATE TYPE public.transaction_type AS ENUM ('payment', 'withdrawal', 'earning', 'referral_earning', 'refund');
CREATE TYPE public.activity_type AS ENUM ('registration', 'withdrawal', 'task_completion', 'earning', 'package_activation', 'manual');
CREATE TYPE public.notification_type AS ENUM ('payment', 'withdrawal', 'task', 'referral', 'announcement', 'system');

-- ==========================================
-- PROFILES TABLE
-- ==========================================
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  username text UNIQUE NOT NULL,
  email text UNIQUE,
  phone text UNIQUE,
  role public.user_role NOT NULL DEFAULT 'user',
  status public.account_status NOT NULL DEFAULT 'inactive',
  account_approved boolean NOT NULL DEFAULT false,
  package public.package_name,
  package_activated_at timestamptz,
  package_expires_at timestamptz,
  completed_tasks integer NOT NULL DEFAULT 0,
  withdrawal_balance numeric(12,2) NOT NULL DEFAULT 0,
  total_earnings numeric(12,2) NOT NULL DEFAULT 0,
  referral_earnings numeric(12,2) NOT NULL DEFAULT 0,
  premium_referrals_used integer NOT NULL DEFAULT 0,
  payment_verified boolean NOT NULL DEFAULT false,
  referral_code text UNIQUE NOT NULL DEFAULT substr(md5(random()::text), 1, 8),
  referred_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ==========================================
-- PACKAGES TABLE
-- ==========================================
CREATE TABLE public.packages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name public.package_name UNIQUE NOT NULL,
  display_name text NOT NULL,
  price numeric(10,2) NOT NULL,
  daily_earnings_estimate numeric(10,2) NOT NULL,
  task_limit_per_day integer NOT NULL,
  max_premium_referrals integer NOT NULL DEFAULT 3,
  features jsonb NOT NULL DEFAULT '[]',
  benefits jsonb NOT NULL DEFAULT '[]',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ==========================================
-- TASKS TABLE
-- ==========================================
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  category public.task_category NOT NULL,
  reward numeric(10,2) NOT NULL,
  difficulty public.task_difficulty NOT NULL DEFAULT 'easy',
  estimated_time_minutes integer NOT NULL DEFAULT 5,
  instructions text,
  external_url text,
  is_active boolean NOT NULL DEFAULT true,
  daily_limit integer NOT NULL DEFAULT 1,
  total_completions integer NOT NULL DEFAULT 0,
  max_completions integer,
  required_packages public.package_name[] NOT NULL DEFAULT ARRAY['starter','bronze','silver','gold','vip']::public.package_name[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ==========================================
-- TASK COMPLETIONS TABLE
-- ==========================================
CREATE TABLE public.task_completions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  reward_earned numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'completed',
  proof_url text,
  notes text,
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ==========================================
-- TRANSACTIONS TABLE
-- ==========================================
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type public.transaction_type NOT NULL,
  amount numeric(12,2) NOT NULL,
  balance_before numeric(12,2) NOT NULL DEFAULT 0,
  balance_after numeric(12,2) NOT NULL DEFAULT 0,
  description text,
  reference_id text,
  paynecta_transaction_id text,
  package public.package_name,
  status text NOT NULL DEFAULT 'completed',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ==========================================
-- WITHDRAWALS TABLE
-- ==========================================
CREATE TABLE public.withdrawals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  method text NOT NULL DEFAULT 'mpesa',
  phone_number text NOT NULL,
  status public.withdrawal_status NOT NULL DEFAULT 'pending',
  admin_notes text,
  processed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ==========================================
-- REFERRALS TABLE
-- ==========================================
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_premium boolean NOT NULL DEFAULT false,
  commission_rate numeric(5,4) NOT NULL DEFAULT 0.10,
  total_commission_earned numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(referrer_id, referred_id)
);

-- ==========================================
-- EARNINGS TABLE
-- ==========================================
CREATE TABLE public.earnings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  source text NOT NULL,
  source_id uuid,
  description text,
  earned_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ==========================================
-- NOTIFICATIONS TABLE
-- ==========================================
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  type public.notification_type NOT NULL DEFAULT 'system',
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  is_broadcast boolean NOT NULL DEFAULT false,
  action_url text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ==========================================
-- ACTIVATION LOGS TABLE
-- ==========================================
CREATE TABLE public.activation_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  package public.package_name NOT NULL,
  amount_paid numeric(12,2) NOT NULL,
  paynecta_transaction_id text,
  payment_reference text,
  activated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ==========================================
-- LIVE ACTIVITY TABLE
-- ==========================================
CREATE TABLE public.live_activity (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  type public.activity_type NOT NULL DEFAULT 'manual',
  message text NOT NULL,
  user_name text,
  location text,
  amount numeric(12,2),
  is_pinned boolean NOT NULL DEFAULT false,
  is_visible boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ==========================================
-- ANNOUNCEMENTS TABLE
-- ==========================================
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  content text NOT NULL,
  priority integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  is_pinned boolean NOT NULL DEFAULT false,
  target_role public.user_role,
  target_status public.account_status,
  published_at timestamptz,
  expires_at timestamptz,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ==========================================
-- ADMIN SETTINGS TABLE
-- ==========================================
CREATE TABLE public.admin_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}',
  description text,
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ==========================================
-- INDEXES
-- ==========================================
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_phone ON public.profiles(phone);
CREATE INDEX idx_profiles_status ON public.profiles(status);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX idx_task_completions_user_id ON public.task_completions(user_id);
CREATE INDEX idx_task_completions_task_id ON public.task_completions(task_id);
CREATE INDEX idx_task_completions_completed_at ON public.task_completions(completed_at);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at);
CREATE INDEX idx_transactions_type ON public.transactions(type);
CREATE INDEX idx_withdrawals_user_id ON public.withdrawals(user_id);
CREATE INDEX idx_withdrawals_status ON public.withdrawals(status);
CREATE INDEX idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_referred_id ON public.referrals(referred_id);
CREATE INDEX idx_earnings_user_id ON public.earnings(user_id);
CREATE INDEX idx_earnings_earned_at ON public.earnings(earned_at);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_live_activity_created_at ON public.live_activity(created_at);
CREATE INDEX idx_live_activity_is_visible ON public.live_activity(is_visible);

-- ==========================================
-- HELPER FUNCTIONS
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_user_role(uid uuid)
RETURNS public.user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = uid;
$$;

CREATE OR REPLACE FUNCTION public.get_user_status(uid uuid)
RETURNS public.account_status
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT status FROM public.profiles WHERE id = uid;
$$;

CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role IN ('admin', 'super_admin', 'moderator') FROM public.profiles WHERE id = uid;
$$;

-- ==========================================
-- TRIGGER: Auto-create profile on signup
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_username text;
  v_referral_code text;
  v_referrer_id uuid;
BEGIN
  v_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );
  v_referral_code := substr(md5(NEW.id::text || random()::text), 1, 8);
  
  -- Check if referred_by code provided
  IF NEW.raw_user_meta_data->>'referral_code' IS NOT NULL THEN
    SELECT id INTO v_referrer_id FROM public.profiles WHERE referral_code = NEW.raw_user_meta_data->>'referral_code';
  END IF;

  INSERT INTO public.profiles (
    id, full_name, username, email, phone, role,
    status, account_approved, package, completed_tasks,
    withdrawal_balance, total_earnings, referral_earnings,
    premium_referrals_used, payment_verified, referral_code,
    referred_by
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', v_username),
    v_username,
    CASE WHEN NEW.email LIKE '%@miaoda.com' THEN NEW.raw_user_meta_data->>'actual_email' ELSE NEW.email END,
    NEW.phone,
    'user',
    'inactive',
    false,
    null,
    0,
    0,
    0,
    0,
    0,
    false,
    v_referral_code,
    v_referrer_id
  );
  
  -- Create referral record if referred
  IF v_referrer_id IS NOT NULL THEN
    INSERT INTO public.referrals (referrer_id, referred_id, commission_rate)
    VALUES (v_referrer_id, NEW.id, 0.10);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- TRIGGER: Update updated_at
-- ==========================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_packages_updated_at BEFORE UPDATE ON public.packages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_withdrawals_updated_at BEFORE UPDATE ON public.withdrawals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==========================================
-- RLS ENABLE
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- RLS POLICIES - PROFILES
-- ==========================================
CREATE POLICY "Admins full access to profiles" ON public.profiles
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (role IS NOT DISTINCT FROM public.get_user_role(auth.uid()));

-- ==========================================
-- RLS POLICIES - PACKAGES
-- ==========================================
CREATE POLICY "Anyone can read packages" ON public.packages
  FOR SELECT USING (true);

CREATE POLICY "Admins manage packages" ON public.packages
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- ==========================================
-- RLS POLICIES - TASKS
-- ==========================================
CREATE POLICY "Active users can view tasks" ON public.tasks
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Admins manage tasks" ON public.tasks
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Anyone can view active tasks" ON public.tasks
  FOR SELECT USING (is_active = true);

-- ==========================================
-- RLS POLICIES - TASK COMPLETIONS
-- ==========================================
CREATE POLICY "Users view own task completions" ON public.task_completions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own task completions" ON public.task_completions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage task completions" ON public.task_completions
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- ==========================================
-- RLS POLICIES - TRANSACTIONS
-- ==========================================
CREATE POLICY "Users view own transactions" ON public.transactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins manage transactions" ON public.transactions
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- ==========================================
-- RLS POLICIES - WITHDRAWALS
-- ==========================================
CREATE POLICY "Users view own withdrawals" ON public.withdrawals
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Active users insert withdrawals" ON public.withdrawals
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id AND
    public.get_user_status(auth.uid()) = 'active'
  );

CREATE POLICY "Admins manage withdrawals" ON public.withdrawals
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- ==========================================
-- RLS POLICIES - REFERRALS
-- ==========================================
CREATE POLICY "Users view own referrals" ON public.referrals
  FOR SELECT TO authenticated USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Admins manage referrals" ON public.referrals
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- ==========================================
-- RLS POLICIES - EARNINGS
-- ==========================================
CREATE POLICY "Users view own earnings" ON public.earnings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins manage earnings" ON public.earnings
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- ==========================================
-- RLS POLICIES - NOTIFICATIONS
-- ==========================================
CREATE POLICY "Users view own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR is_broadcast = true);

CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins manage notifications" ON public.notifications
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- ==========================================
-- RLS POLICIES - ACTIVATION LOGS
-- ==========================================
CREATE POLICY "Users view own activation logs" ON public.activation_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins manage activation logs" ON public.activation_logs
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- ==========================================
-- RLS POLICIES - LIVE ACTIVITY
-- ==========================================
CREATE POLICY "Anyone can view live activity" ON public.live_activity
  FOR SELECT USING (is_visible = true);

CREATE POLICY "Admins manage live activity" ON public.live_activity
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- ==========================================
-- RLS POLICIES - ANNOUNCEMENTS
-- ==========================================
CREATE POLICY "Anyone can view published announcements" ON public.announcements
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admins manage announcements" ON public.announcements
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- ==========================================
-- RLS POLICIES - ADMIN SETTINGS
-- ==========================================
CREATE POLICY "Anyone can view admin settings" ON public.admin_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins manage settings" ON public.admin_settings
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- ==========================================
-- ENABLE REALTIME
-- ==========================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_activity;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.withdrawals;

-- ==========================================
-- SEED: PACKAGES DATA
-- ==========================================
INSERT INTO public.packages (name, display_name, price, daily_earnings_estimate, task_limit_per_day, features, benefits, sort_order) VALUES
('starter', 'Starter', 500, 150, 5, 
  '["5 tasks per day","Access to Surveys & Ads","Basic support","Referral system"]'::jsonb,
  '["KES 150 daily earnings estimate","10% referral commission","Access to basic tasks"]'::jsonb,
  1),
('bronze', 'Bronze', 1000, 350, 10,
  '["10 tasks per day","Access to all task categories","Priority support","Referral system","Daily bonuses"]'::jsonb,
  '["KES 350 daily earnings estimate","10% referral commission","Up to 3 premium referrals","Access to all task types"]'::jsonb,
  2),
('silver', 'Silver', 2000, 700, 20,
  '["20 tasks per day","All task categories","24/7 support","Advanced referral tools","Weekly bonuses","Leaderboard access"]'::jsonb,
  '["KES 700 daily earnings estimate","10% referral commission","Premium task access","Weekly bonus rewards","Leaderboard visibility"]'::jsonb,
  3),
('gold', 'Gold', 3500, 1400, 40,
  '["40 tasks per day","VIP task categories","Dedicated support","Premium referral tools","Daily bonuses","Leaderboard priority","Early task access"]'::jsonb,
  '["KES 1400 daily earnings estimate","10% referral commission","VIP task access","Priority leaderboard","Early access to new tasks","Daily bonus rewards"]'::jsonb,
  4),
('vip', 'VIP', 5500, 2500, 999,
  '["Unlimited tasks","All premium categories","VIP support line","Maximum referral benefits","Daily + weekly bonuses","Leaderboard top position","Exclusive VIP tasks","Fastest withdrawals"]'::jsonb,
  '["KES 2500 daily earnings estimate","10% referral commission","Unlimited task access","VIP leaderboard position","Fastest withdrawal processing","Exclusive VIP task bonuses"]'::jsonb,
  5);

-- ==========================================
-- SEED: TASKS DATA
-- ==========================================
INSERT INTO public.tasks (title, description, category, reward, difficulty, estimated_time_minutes, instructions, required_packages) VALUES
('Product Satisfaction Survey', 'Complete a short survey about product satisfaction for a major brand.', 'surveys', 25.00, 'easy', 5, 'Answer all questions honestly. Survey will take approximately 5 minutes.', ARRAY['starter','bronze','silver','gold','vip']::public.package_name[]),
('Tech Usage Survey', 'Share your technology usage habits and preferences.', 'surveys', 35.00, 'easy', 8, 'Complete all sections. Your data helps brands improve their products.', ARRAY['starter','bronze','silver','gold','vip']::public.package_name[]),
('Watch Product Ad', 'Watch a 30-second product advertisement and answer a quick question.', 'watching_ads', 15.00, 'easy', 2, 'Watch the full ad without skipping. Answer the question at the end.', ARRAY['starter','bronze','silver','gold','vip']::public.package_name[]),
('Mobile App Video Ad', 'Watch a mobile app promotional video and rate it.', 'watching_ads', 20.00, 'easy', 3, 'Watch completely and give honest rating.', ARRAY['starter','bronze','silver','gold','vip']::public.package_name[]),
('Test New Mobile App', 'Download and test a new mobile application, provide feedback.', 'app_testing', 85.00, 'medium', 20, 'Download app, test all features, provide detailed feedback in the form.', ARRAY['bronze','silver','gold','vip']::public.package_name[]),
('Website UX Testing', 'Test a website for user experience issues and provide a report.', 'app_testing', 120.00, 'hard', 30, 'Use the website for 30 minutes, document any issues you encounter.', ARRAY['silver','gold','vip']::public.package_name[]),
('Image Labeling Task', 'Label objects in images for AI training datasets.', 'data_annotation', 45.00, 'easy', 15, 'Accurately label all objects shown. Quality matters more than speed.', ARRAY['starter','bronze','silver','gold','vip']::public.package_name[]),
('Sentiment Analysis', 'Classify customer reviews as positive, negative, or neutral.', 'data_annotation', 55.00, 'medium', 20, 'Read each review carefully and classify accurately.', ARRAY['bronze','silver','gold','vip']::public.package_name[]),
('Sign Up for Free Service', 'Register for a free online service using your email.', 'offers', 75.00, 'easy', 10, 'Use a valid email to register. Verify registration to earn reward.', ARRAY['starter','bronze','silver','gold','vip']::public.package_name[]),
('Download Free App', 'Download a featured app and keep it installed for 24 hours.', 'offers', 50.00, 'easy', 5, 'Download from provided link, keep installed for at least 24 hours.', ARRAY['starter','bronze','silver','gold','vip']::public.package_name[]),
('Watch & Rate YouTube Video', 'Watch a YouTube video and leave a genuine comment.', 'video_tasks', 30.00, 'easy', 8, 'Watch at least 80% of the video, leave a genuine comment.', ARRAY['starter','bronze','silver','gold','vip']::public.package_name[]),
('Review Product Video', 'Watch a product review video and answer comprehension questions.', 'video_tasks', 40.00, 'easy', 12, 'Watch carefully, answer all comprehension questions correctly.', ARRAY['starter','bronze','silver','gold','vip']::public.package_name[]),
('Daily Check-in', 'Log in daily to earn your daily bonus reward.', 'daily_tasks', 10.00, 'easy', 1, 'Simply log in and click claim to earn your daily reward.', ARRAY['starter','bronze','silver','gold','vip']::public.package_name[]),
('Daily Social Share', 'Share MetaPay on social media to earn extra rewards.', 'daily_tasks', 20.00, 'easy', 3, 'Share on any social platform and submit the share link.', ARRAY['starter','bronze','silver','gold','vip']::public.package_name[]),
('Refer a Friend', 'Invite a friend using your referral link to earn commission.', 'referrals', 100.00, 'easy', 5, 'Share your referral link. Earn 10% when they activate a package.', ARRAY['starter','bronze','silver','gold','vip']::public.package_name[]);

-- ==========================================
-- SEED: ADMIN SETTINGS
-- ==========================================
INSERT INTO public.admin_settings (key, value, description) VALUES
('site_name', '"MetaPay"', 'Platform display name'),
('site_logo', '"https://metapay.com/logo.png"', 'Logo URL'),
('support_email', '"support@metapay.co.ke"', 'Support contact email'),
('min_withdrawal', '500', 'Minimum withdrawal amount in KES'),
('referral_commission_rate', '0.10', 'Referral commission rate (0.10 = 10%)'),
('max_premium_referrals', '3', 'Maximum premium referrals allowed per user'),
('live_activity_enabled', 'true', 'Enable/disable live activity feed'),
('maintenance_mode', 'false', 'Enable maintenance mode'),
('terms_url', '"/terms"', 'Terms and conditions page URL'),
('privacy_url', '"/privacy"', 'Privacy policy page URL'),
('seo_title', '"MetaPay - Earn Money Online in Kenya"', 'SEO meta title'),
('seo_description', '"Join thousands of Kenyans earning money online through surveys, tasks, and referrals on MetaPay."', 'SEO meta description');

-- ==========================================
-- SEED: SAMPLE LIVE ACTIVITY
-- ==========================================
INSERT INTO public.live_activity (type, message, user_name, location, amount, is_visible) VALUES
('earning', 'John from Nairobi earned KES 200', 'John', 'Nairobi', 200, true),
('package_activation', 'Sarah activated Gold package', 'Sarah', 'Mombasa', 3500, true),
('withdrawal', 'Kevin withdrew KES 3,500', 'Kevin', 'Kisumu', 3500, true),
('registration', 'New member joined MetaPay', 'Alex', 'Nairobi', null, true),
('task_completion', 'Lucy completed App Testing', 'Lucy', 'Nakuru', 120, true),
('earning', 'David from Eldoret earned KES 450', 'David', 'Eldoret', 450, true),
('package_activation', 'Grace activated VIP package', 'Grace', 'Nairobi', 5500, true),
('withdrawal', 'Peter withdrew KES 1,200', 'Peter', 'Thika', 1200, true),
('task_completion', 'Ann completed Product Survey', 'Ann', 'Nairobi', 25, true),
('registration', 'Mike just joined MetaPay', 'Mike', 'Kisumu', null, true);

-- ==========================================
-- SEED: SAMPLE ANNOUNCEMENTS
-- ==========================================
INSERT INTO public.announcements (title, content, priority, is_published, is_pinned, published_at) VALUES
('Welcome to MetaPay!', 'Welcome to MetaPay - Kenya''s premier earning platform! Complete tasks, refer friends, and earn real money via M-Pesa. Activate your account today to start earning!', 10, true, true, now()),
('New Tasks Available', 'We''ve added 15 new high-paying tasks this week! Check the tasks section to start earning more today.', 5, true, false, now()),
('Withdrawal Processing Times', 'All approved withdrawals are processed within 24 hours via M-Pesa. Thank you for your patience.', 3, true, false, now());
