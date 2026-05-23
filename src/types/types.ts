export type UserRole = 'user' | 'moderator' | 'admin' | 'super_admin';
export type AccountStatus = 'inactive' | 'active' | 'suspended';
export type PackageName = 'starter' | 'bronze' | 'silver' | 'gold' | 'vip';
export type WithdrawalStatus = 'pending' | 'approved' | 'rejected';
export type TaskDifficulty = 'easy' | 'medium' | 'hard';
export type TaskCategory = 'surveys' | 'watching_ads' | 'app_testing' | 'data_annotation' | 'offers' | 'video_tasks' | 'daily_tasks' | 'referrals';
export type TransactionType = 'payment' | 'withdrawal' | 'earning' | 'referral_earning' | 'refund';
export type ActivityType = 'registration' | 'withdrawal' | 'task_completion' | 'earning' | 'package_activation' | 'manual';
export type NotificationType = 'payment' | 'withdrawal' | 'task' | 'referral' | 'announcement' | 'system';

export interface Profile {
  id: string;
  full_name: string | null;
  username: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  status: AccountStatus;
  account_approved: boolean;
  package: PackageName | null;
  package_activated_at: string | null;
  package_expires_at: string | null;
  completed_tasks: number;
  withdrawal_balance: number;
  total_earnings: number;
  referral_earnings: number;
  premium_referrals_used: number;
  payment_verified: boolean;
  referral_code: string;
  referred_by: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Package {
  id: string;
  name: PackageName;
  display_name: string;
  price: number;
  daily_earnings_estimate: number;
  task_limit_per_day: number;
  max_premium_referrals: number;
  features: string[];
  benefits: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  category: TaskCategory;
  reward: number;
  difficulty: TaskDifficulty;
  estimated_time_minutes: number;
  instructions: string | null;
  external_url: string | null;
  is_active: boolean;
  daily_limit: number;
  total_completions: number;
  max_completions: number | null;
  required_packages: PackageName[];
  created_at: string;
  updated_at: string;
}

export interface TaskCompletion {
  id: string;
  user_id: string;
  task_id: string;
  reward_earned: number;
  status: string;
  proof_url: string | null;
  notes: string | null;
  completed_at: string;
  created_at: string;
  tasks?: Task;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string | null;
  reference_id: string | null;
  paynecta_transaction_id: string | null;
  package: PackageName | null;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  method: string;
  phone_number: string;
  status: WithdrawalStatus;
  admin_notes: string | null;
  processed_by: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
  profiles?: Pick<Profile, 'username' | 'full_name' | 'phone'>;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  is_premium: boolean;
  commission_rate: number;
  total_commission_earned: number;
  created_at: string;
  referred_profile?: Pick<Profile, 'username' | 'full_name' | 'status' | 'package' | 'created_at'>;
}

export interface Earning {
  id: string;
  user_id: string;
  amount: number;
  source: string;
  source_id: string | null;
  description: string | null;
  earned_at: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string | null;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  is_broadcast: boolean;
  action_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ActivationLog {
  id: string;
  user_id: string;
  package: PackageName;
  amount_paid: number;
  paynecta_transaction_id: string | null;
  payment_reference: string | null;
  activated_at: string;
  expires_at: string | null;
  notes: string | null;
  created_at: string;
  profiles?: Pick<Profile, 'username' | 'full_name' | 'email'>;
}

export interface LiveActivity {
  id: string;
  type: ActivityType;
  message: string;
  user_name: string | null;
  user_display_name: string | null;
  location: string | null;
  amount: number | null;
  is_pinned: boolean;
  is_visible: boolean;
  is_real: boolean;
  created_by: string | null;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  priority: number;
  is_published: boolean;
  is_pinned: boolean;
  target_role: UserRole | null;
  target_status: AccountStatus | null;
  published_at: string | null;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminSettings {
  id: string;
  key: string;
  value: unknown;
  description: string | null;
  updated_by: string | null;
  updated_at: string;
}

export const PACKAGE_PRICES: Record<PackageName, number> = {
  starter: 500,
  bronze: 1000,
  silver: 2000,
  gold: 3500,
  vip: 5500,
};

export const PACKAGE_COLORS: Record<PackageName, string> = {
  starter: 'from-gray-400 to-gray-600',
  bronze: 'from-amber-600 to-amber-800',
  silver: 'from-slate-400 to-slate-600',
  gold: 'from-yellow-400 to-yellow-600',
  vip: 'from-purple-500 to-indigo-600',
};

export const PACKAGE_BADGE_COLORS: Record<PackageName, string> = {
  starter: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  bronze: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  silver: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  gold: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  vip: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
};

export const TASK_CATEGORY_LABELS: Record<TaskCategory, string> = {
  surveys: 'Surveys',
  watching_ads: 'Watching Ads',
  app_testing: 'App Testing',
  data_annotation: 'Data Annotation',
  offers: 'Offers',
  video_tasks: 'Video Tasks',
  daily_tasks: 'Daily Tasks',
  referrals: 'Referrals',
};

export const DIFFICULTY_COLORS: Record<TaskDifficulty, string> = {
  easy: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
  medium: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400',
  hard: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400',
};
