import { ReactNode } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useLogout, useHealthCheck, getHealthCheckQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, CheckSquare, Settings, Users, LogOut, Loader2, Package, CreditCard, Activity } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const logoutMutation = useLogout();
  
  const { data: health } = useHealthCheck({
    query: { queryKey: getHealthCheckQueryKey(), refetchInterval: 60000 }
  });

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        logout();
        setLocation("/login");
      },
      onError: () => {
        // Fallback local logout
        logout();
        setLocation("/login");
      }
    });
  };

  const isAuthRoute = location === "/login" || location === "/register";
  const isSetupRoute = location === "/packages" || location === "/payment";

  if (isAuthRoute) {
    return <>{children}</>;
  }

  if (isSetupRoute) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        <header className="h-16 border-b bg-white dark:bg-slate-900 flex items-center px-6 justify-between">
          <div className="font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white">
              M
            </div>
            MetaPay
          </div>
          <Button variant="ghost" onClick={handleLogout}>
            Logout
          </Button>
        </header>
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-white dark:bg-slate-900 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b">
          <div className="font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white">
              M
            </div>
            MetaPay
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1">
          <Link href="/dashboard" className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${location === "/dashboard" ? "bg-slate-100 dark:bg-slate-800 text-primary" : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50"}`}>
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          <Link href="/tasks" className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.startsWith("/tasks") ? "bg-slate-100 dark:bg-slate-800 text-primary" : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50"}`}>
            <CheckSquare className="w-4 h-4" />
            Tasks
          </Link>
          
          {user?.role === "admin" && (
            <Link href="/admin" className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${location === "/admin" ? "bg-slate-100 dark:bg-slate-800 text-primary" : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50"}`}>
              <Users className="w-4 h-4" />
              Admin
            </Link>
          )}
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-medium text-slate-600 dark:text-slate-300">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          
          {health && (
            <div className="flex items-center gap-2 px-2 py-1 mb-3 text-xs text-slate-500">
              <Activity className="w-3 h-3 text-green-500" />
              API Status: {health.status}
            </div>
          )}

          <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={handleLogout}>
            {logoutMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogOut className="w-4 h-4 mr-2" />}
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 flex items-center px-8 border-b bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
          <h1 className="text-xl font-semibold capitalize">
            {location.split("/")[1] || "Dashboard"}
          </h1>
        </header>
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
