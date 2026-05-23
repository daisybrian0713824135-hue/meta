import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, CheckSquare, CreditCard, Wallet, Share2,
  Activity, Megaphone, Settings, Zap, LogOut, Menu, Shield, Package
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const adminNav = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/tasks', label: 'Tasks', icon: CheckSquare },
  { path: '/admin/payments', label: 'Payments', icon: CreditCard },
  { path: '/admin/withdrawals', label: 'Withdrawals', icon: Wallet },
  { path: '/admin/referrals', label: 'Referrals', icon: Share2 },
  { path: '/admin/activity', label: 'Live Activity', icon: Activity },
  { path: '/admin/announcements', label: 'Announcements', icon: Megaphone },
  { path: '/admin/packages', label: 'Packages', icon: Package },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
];

const AdminSidebarContent: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out');
    navigate('/login');
    onClose?.();
  };

  return (
    <div className="flex flex-col h-full bg-sidebar">
      <div className="p-5 border-b border-sidebar-border">
        <Link to="/admin" className="flex items-center gap-2" onClick={onClose}>
          <div className="w-9 h-9 gradient-bg-primary rounded-xl flex items-center justify-center shadow">
            <Shield className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-sidebar-foreground">Admin Panel</p>
            <p className="text-xs text-sidebar-foreground/50">MetaPay</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-3">
        {adminNav.map(({ path, label, icon: Icon }) => {
          const isActive = path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(path);
          return (
            <Link key={path} to={path} onClick={onClose}>
              <div className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 transition-colors',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}>
                <Icon className="h-4.5 w-4.5 shrink-0" />
                <span className="text-sm font-medium">{label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-2 mb-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="gradient-bg-primary text-white text-xs font-semibold">
              {(profile?.full_name || profile?.username || 'A').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-sidebar-foreground truncate">{profile?.username}</p>
            <p className="text-xs text-sidebar-foreground/50 capitalize">{profile?.role}</p>
          </div>
        </div>
        <Button variant="ghost" className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-9" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" />
          <span className="text-sm">Sign Out</span>
        </Button>
      </div>
    </div>
  );
};

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-border">
        <AdminSidebarContent />
      </aside>

      <div className="flex-1 min-w-0 flex flex-col overflow-x-hidden">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-4 md:px-6 h-14 flex items-center justify-between gap-4">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-sidebar">
              <AdminSidebarContent onClose={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="flex-1 min-w-0" />
          <div className="flex items-center gap-2">
            <Link to="/dashboard" className="text-xs text-muted-foreground hover:text-foreground">← User View</Link>
            <ThemeToggle />
          </div>
        </header>

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

export default AdminLayout;
