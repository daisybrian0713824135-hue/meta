import React from 'react';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { RouteGuard } from '@/components/common/RouteGuard';

// Public pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFound from './pages/NotFound';

// Dashboard pages
import DashboardHome from './pages/dashboard/DashboardHome';
import TasksPage from './pages/dashboard/TasksPage';
import PackagesPage from './pages/dashboard/PackagesPage';
import EarningsPage from './pages/dashboard/EarningsPage';
import ReferralsPage from './pages/dashboard/ReferralsPage';
import WithdrawalsPage from './pages/dashboard/WithdrawalsPage';
import AccountPage from './pages/dashboard/AccountPage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminTasks from './pages/admin/AdminTasks';
import AdminWithdrawals from './pages/admin/AdminWithdrawals';
import AdminReferrals from './pages/admin/AdminReferrals';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import AdminSettings from './pages/admin/AdminSettings';

export interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  public?: boolean;
}

// Helper wrappers
const AuthRequired = ({ children }: { children: ReactNode }) => (
  <RouteGuard>{children}</RouteGuard>
);
const AdminRequired = ({ children }: { children: ReactNode }) => (
  <RouteGuard requireAdmin>{children}</RouteGuard>
);

export const routes: RouteConfig[] = [
  // Public
  { name: 'Home', path: '/', element: <HomePage />, public: true },
  { name: 'Login', path: '/login', element: <LoginPage />, public: true },
  { name: 'Register', path: '/register', element: <RegisterPage />, public: true },

  // User dashboard
  { name: 'Dashboard', path: '/dashboard', element: <AuthRequired><DashboardHome /></AuthRequired> },
  { name: 'Tasks', path: '/dashboard/tasks', element: <AuthRequired><TasksPage /></AuthRequired> },
  { name: 'Packages', path: '/dashboard/packages', element: <AuthRequired><PackagesPage /></AuthRequired> },
  { name: 'Earnings', path: '/dashboard/earnings', element: <AuthRequired><EarningsPage /></AuthRequired> },
  { name: 'Referrals', path: '/dashboard/referrals', element: <AuthRequired><ReferralsPage /></AuthRequired> },
  { name: 'Withdrawals', path: '/dashboard/withdrawals', element: <AuthRequired><WithdrawalsPage /></AuthRequired> },
  { name: 'Account', path: '/dashboard/account', element: <AuthRequired><AccountPage /></AuthRequired> },

  // Admin panel
  { name: 'Admin Dashboard', path: '/admin', element: <AdminRequired><AdminDashboard /></AdminRequired> },
  { name: 'Admin Users', path: '/admin/users', element: <AdminRequired><AdminUsers /></AdminRequired> },
  { name: 'Admin Tasks', path: '/admin/tasks', element: <AdminRequired><AdminTasks /></AdminRequired> },
  { name: 'Admin Payments', path: '/admin/payments', element: <AdminRequired><AdminWithdrawals /></AdminRequired> },
  { name: 'Admin Withdrawals', path: '/admin/withdrawals', element: <AdminRequired><AdminWithdrawals /></AdminRequired> },
  { name: 'Admin Referrals', path: '/admin/referrals', element: <AdminRequired><AdminReferrals /></AdminRequired> },
  { name: 'Admin Activity', path: '/admin/activity', element: <AdminRequired><AdminAnnouncements /></AdminRequired> },
  { name: 'Admin Announcements', path: '/admin/announcements', element: <AdminRequired><AdminAnnouncements /></AdminRequired> },
  { name: 'Admin Packages', path: '/admin/packages', element: <AdminRequired><PackagesPage /></AdminRequired> },
  { name: 'Admin Settings', path: '/admin/settings', element: <AdminRequired><AdminSettings /></AdminRequired> },

  // Catch-all
  { name: '404', path: '/404', element: <NotFound />, public: true },
];
