import { useAuth } from '@/contexts/AuthContext';

/**
 * Authorization helper functions for role-based access control
 */

export type UserRole = 'admin' | 'admin_med' | 'medico_unidade' | 'medico_maternidade';

/**
 * Check if user has any of the specified roles
 */
export const hasAnyRole = (userRoles: { role: UserRole }[], requiredRoles: UserRole[]): boolean => {
  return userRoles.some(userRole => requiredRoles.includes(userRole.role));
};

/**
 * Check if user has all of the specified roles
 */
export const hasAllRoles = (userRoles: { role: UserRole }[], requiredRoles: UserRole[]): boolean => {
  return requiredRoles.every(required => 
    userRoles.some(userRole => userRole.role === required)
  );
};

/**
 * Check if user is an admin
 */
export const isAdmin = (userRoles: { role: UserRole }[]): boolean => {
  return userRoles.some(r => r.role === 'admin');
};

/**
 * Check if user is an admin_med
 */
export const isAdminMed = (userRoles: { role: UserRole }[]): boolean => {
  return userRoles.some(r => r.role === 'admin_med');
};

/**
 * Check if user has admin or admin_med role
 */
export const isAdminOrAdminMed = (userRoles: { role: UserRole }[]): boolean => {
  return isAdmin(userRoles) || isAdminMed(userRoles);
};

/**
 * Hook to check if current user can access admin features
 */
export const useCanAccessAdmin = (): boolean => {
  const { isAdmin } = useAuth();
  return isAdmin();
};

/**
 * Hook to check if current user can access admin_med features
 */
export const useCanAccessAdminMed = (): boolean => {
  const { isAdmin, isAdminMed } = useAuth();
  return isAdmin() || isAdminMed();
};

/**
 * Route permission definitions
 * Maps route paths to required roles
 */
export const routePermissions: Record<string, UserRole[]> = {
  // Admin-only routes
  '/aprovacoes-usuarios': ['admin'],
  '/gerenciar-usuarios': ['admin'],
  '/importar-calendario': ['admin'],
  '/comparar-csvs': ['admin'],
  '/atualizar-ig': ['admin'],
  '/corrigir-paridade': ['admin'],
  '/importar-agendamentos-2025': ['admin'],
  '/processar-agendas-2025': ['admin'],
  '/importar-sql': ['admin'],
  '/processar-importacoes': ['admin'],
  '/importar-agendamentos-lote': ['admin'],
  '/processar-csv-upload': ['admin'],
  '/processar-forms-parto': ['admin'],
  '/recalcular-datas-2025': ['admin'],
  '/logs-auditoria': ['admin'],
  
  // Admin or Admin_med routes
  '/aprovacoes-agendamentos': ['admin', 'admin_med'],
  '/importar-pacientes-pendentes': ['admin', 'admin_med'],
  
  // Public routes (all authenticated users)
  '/': [],
  '/dashboard': [],
  '/novo-agendamento': [],
  '/meus-agendamentos': [],
  '/ocupacao': [],
  '/guia': [],
  '/calendario-ocupacao': [],
  '/calendario-completo': [],
  '/faq': [],
  '/sobre': [],
  '/protocolos': [],
  '/contato': [],
};

/**
 * Check if user can access a specific route
 */
export const canAccessRoute = (path: string, userRoles: { role: UserRole }[]): boolean => {
  const requiredRoles = routePermissions[path];
  
  // If no roles required, everyone can access
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }
  
  // Admin can access everything
  if (isAdmin(userRoles)) {
    return true;
  }
  
  // Check if user has any of the required roles
  return hasAnyRole(userRoles, requiredRoles);
};
