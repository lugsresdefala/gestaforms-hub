import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const [hasShownError, setHasShownError] = useState(false);

  // Determine authorization status
  const isUnauthorized = user && (
    (requireAdmin && !isAdmin()) ||
    (requireAdminMed && !isAdminMed() && !isAdmin()) ||
    (requireMedicoUnidade && !isMedicoUnidade() && !isAdmin()) ||
    (requireMedicoMaternidade && !isMedicoMaternidade() && !isAdmin())
  );

  // Show error toast when unauthorized
  useEffect(() => {
    if (isUnauthorized && !hasShownError) {
      let message = 'Esta página requer permissões especiais.';
      
      if (requireAdmin) {
        message = 'Esta página requer permissões de administrador.';
      } else if (requireAdminMed) {
        message = 'Esta página requer permissões de administrador médico.';
      } else if (requireMedicoUnidade) {
        message = 'Esta página requer permissões de médico de unidade.';
      } else if (requireMedicoMaternidade) {
        message = 'Esta página requer permissões de médico de maternidade.';
      }

      toast({
        variant: 'destructive',
        title: 'Acesso negado',
        description: message,
      });
      setHasShownError(true);
    }
  }, [
    isUnauthorized,
    hasShownError,
    requireAdmin,
    requireAdminMed,
    requireMedicoUnidade,
    requireMedicoMaternidade,
    toast,
  ]);

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

  if (isUnauthorized) {
    // Redirect home after showing toast
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;