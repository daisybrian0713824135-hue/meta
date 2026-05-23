import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, CheckSquare, Package, DollarSign, Users, Wallet, User,
  Zap, LogOut, Menu, X, Bell, ChevronRight, Shield
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PACKAGE_BADGE_COLORS } from '@/types/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/dashboard/tasks', label: 'Tasks', icon: CheckSquare },
  { path: '/dashboard/packages', label: 'Packages', icon: Package },
  { path: '/dashboard/earnings', label: 'Earnings', icon: DollarSign },
  { path: '/dashboard/referrals', label: 'Referrals', icon: Users },
  { path: '/dashboard/withdrawals', label: 'Withdrawals', icon: Wallet },
  { path: '/dashboard/account', label: 'Account', icon: User },
];

const SidebarContent: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut, isAdmin } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/');
    onClose?.();
  };

  return (
    <div className="flex flex-col h-full bg-sidebar">
      {/* Logo */}
      <div className="p-5 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2.5" onClick={onClose}>
          <div className="w-9 h-9 gradient-bg-primary rounded-xl flex items-center justify-center shadow">
            <Zap className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-xl font-bold gradient-text">MetaPay</span>
        </Link>
      </div>

      {/* User info */}
      {profile && (
        <div className="px-4 py-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="gradient-bg-primary text-white text-sm font-semibold">
                {(profile.full_name || profile.username).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground truncate">
                {profile.full_name || profile.username}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {profile.package ? (
                  <Badge className={cn('text-xs px-1.5 py-0 capitalize', PACKAGE_BADGE_COLORS[profile.package])}>
                    {profile.package}
                  </Badge>
                ) : (
                  <Badge className="text-xs px-1.5 py-0 bg-muted text-muted-foreground">Inactive</Badge>
                )}
                <span className={cn(
                  'inline-flex items-center gap-1 text-xs',
                  profile.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                )}>
                  <span className={cn('w-1.5 h-1.5 rounded-full', profile.status === 'active' ? 'bg-green-500' : 'bg-muted-foreground')} />
                  {profile.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Balance chip */}
      {profile && (
        <div className="px-4 py-3 border-b border-sidebar-border">
          <div className="bg-sidebar-accent rounded-xl px-3 py-2.5">
            <p className="text-xs text-sidebar-foreground/60 mb-0.5">Available Balance</p>
            <p className="text-lg font-bold text-sidebar-primary">
              KES {(profile.withdrawal_balance || 0).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));
          return (
            <Link key={path} to={path} onClick={onClose}>
              <div className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 group transition-colors',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}>
                <Icon className="h-4.5 w-4.5 shrink-0" />
                <span className="text-sm font-medium flex-1">{label}</span>
                {isActive && <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
              </div>
            </Link>
          );
        })}

        {isAdmin && (
          <Link to="/admin" onClick={onClose}>
            <div className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 mt-2 border border-dashed border-sidebar-border',
              location.pathname.startsWith('/admin')
                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}>
              <Shield className="h-4.5 w-4.5 shrink-0" />
              <span className="text-sm font-medium flex-1">Admin Panel</span>
            </div>
          </Link>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          <span className="text-sm">Sign Out</span>
        </Button>
      </div>
    </div>
  );
};

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { profile } = useAuth();

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-border">
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col overflow-x-hidden">
        {/* Top bar */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-4 md:px-6 h-14 flex items-center justify-between gap-4">
          {/* Mobile menu trigger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-sidebar">
              <SidebarContent onClose={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          {/* Page title area placeholder */}
          <div className="flex-1 min-w-0" />

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9 relative" asChild>
              <Link to="/dashboard/notifications">
                <Bell className="h-4.5 w-4.5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </Link>
            </Button>
            <ThemeToggle />
            <Link to="/dashboard/account">
              <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarFallback className="gradient-bg-primary text-white text-xs font-semibold">
                  {((profile?.full_name || profile?.username) ?? 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex-1 p-4 md:p-6"
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DashboardLayout;
