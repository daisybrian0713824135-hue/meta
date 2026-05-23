import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";

import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import Packages from "@/pages/packages";
import Payment from "@/pages/payment";
import Dashboard from "@/pages/dashboard";
import Tasks from "@/pages/tasks";
import TaskDetail from "@/pages/tasks/[id]";
import NewTask from "@/pages/tasks/new";
import Admin from "@/pages/admin";
import Layout from "@/components/layout";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, adminOnly = false }: { component: any, adminOnly?: boolean }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    setLocation("/login");
    return null;
  }

  if (user.status === "inactive") {
    // If inactive, they must choose a package or pay
    const path = window.location.pathname;
    if (!path.startsWith("/packages") && !path.startsWith("/payment")) {
      setLocation("/packages");
      return null;
    }
  }

  if (adminOnly && user.role !== "admin") {
    setLocation("/dashboard");
    return null;
  }

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function Router() {
  const { user } = useAuth();
  
  return (
    <Switch>
      <Route path="/" component={() => {
        const [, setLocation] = useLocation();
        if (user) { setLocation("/dashboard"); return null; }
        return <Landing />;
      }} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Protected routes */}
      <Route path="/packages">
        <ProtectedRoute component={Packages} />
      </Route>
      <Route path="/payment">
        <ProtectedRoute component={Payment} />
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/tasks">
        <ProtectedRoute component={Tasks} />
      </Route>
      <Route path="/tasks/new">
        <ProtectedRoute component={NewTask} />
      </Route>
      <Route path="/tasks/:id">
        <ProtectedRoute component={TaskDetail} />
      </Route>
      <Route path="/admin">
        <ProtectedRoute component={Admin} adminOnly={true} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
