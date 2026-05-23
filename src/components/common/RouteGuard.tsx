import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface RouteGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireActive?: boolean;
}

const PUBLIC_ROUTES = ['/', '/login', '/register'];

export const RouteGuard: React.FC<RouteGuardProps> = ({ children, requireAdmin = false, requireActive = false }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Loading MetaPay...</p>
        </div>
      </div>
    );
  }

  const isPublic = PUBLIC_ROUTES.includes(location.pathname);

  if (!user && !isPublic) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && profile?.role === 'user') {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireActive && profile?.status !== 'active') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
