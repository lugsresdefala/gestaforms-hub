import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireAdminMed?: boolean;
  requireMedicoUnidade?: boolean;
  requireMedicoMaternidade?: boolean;
}

const ProtectedRoute = ({ 
  children, 
  requireAdmin,
  requireAdminMed,
  requireMedicoUnidade,
  requireMedicoMaternidade 
}: ProtectedRouteProps) => {
  const { user, loading, isAdmin, isAdminMed, isMedicoUnidade, isMedicoMaternidade } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    // Save the attempted location for redirect after login
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check role-based permissions
  const hasPermission = (() => {
    if (requireAdmin) {
      return isAdmin();
    }
    
    if (requireAdminMed) {
      return isAdminMed() || isAdmin();
    }
    
    if (requireMedicoUnidade) {
      return isMedicoUnidade() || isAdmin();
    }
    
    if (requireMedicoMaternidade) {
      return isMedicoMaternidade() || isAdmin();
    }
    
    // No specific role required, authenticated user is enough
    return true;
  })();

  if (!hasPermission) {
    // Show unauthorized page instead of just redirecting
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acesso Negado</AlertTitle>
          <AlertDescription>
            Você não tem permissão para acessar esta página. 
            {requireAdmin && " Esta página requer permissões de administrador."}
            {requireAdminMed && !requireAdmin && " Esta página requer permissões administrativas ou médicas."}
            {' '}Entre em contato com o administrador do sistema se você acredita que deveria ter acesso.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
