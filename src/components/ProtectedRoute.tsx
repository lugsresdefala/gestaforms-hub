import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireMedicoUnidade?: boolean;
  requireMedicoMaternidade?: boolean;
}

const ProtectedRoute = ({ 
  children, 
  requireAdmin, 
  requireMedicoUnidade,
  requireMedicoMaternidade 
}: ProtectedRouteProps) => {
  const { user, loading, isAdmin, isMedicoUnidade, isMedicoMaternidade } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requireAdmin && !isAdmin()) {
    return <Navigate to="/" replace />;
  }

  if (requireMedicoUnidade && !isMedicoUnidade() && !isAdmin()) {
    return <Navigate to="/" replace />;
  }

  if (requireMedicoMaternidade && !isMedicoMaternidade() && !isAdmin()) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
