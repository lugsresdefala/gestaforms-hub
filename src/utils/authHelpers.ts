/**
 * Helper functions for authentication and authorization
 * Centralized logic for role checking and permission validation
 */

export type UserRole = 'admin' | 'admin_med' | 'medico_unidade' | 'medico_maternidade';

export interface UserRoleData {
  role: UserRole;
  maternidade?: string;
}

/**
 * Check if user has admin role
 */
export const hasAdminRole = (userRoles: UserRoleData[]): boolean => {
  return userRoles.some(r => r.role === 'admin');
};

/**
 * Check if user has admin_med role
 */
export const hasAdminMedRole = (userRoles: UserRoleData[]): boolean => {
  return userRoles.some(r => r.role === 'admin_med');
};

/**
 * Check if user has medico_unidade role
 */
export const hasMedicoUnidadeRole = (userRoles: UserRoleData[]): boolean => {
  return userRoles.some(r => r.role === 'medico_unidade');
};

/**
 * Check if user has medico_maternidade role
 */
export const hasMedicoMaternidadeRole = (userRoles: UserRoleData[]): boolean => {
  return userRoles.some(r => r.role === 'medico_maternidade');
};

/**
 * Get list of maternidades the user has access to
 */
export const getUserMaternidades = (userRoles: UserRoleData[]): string[] => {
  return userRoles
    .filter(r => r.role === 'medico_maternidade' && r.maternidade)
    .map(r => r.maternidade as string);
};

/**
 * Check if user can access admin-only features
 */
export const canAccessAdminFeatures = (userRoles: UserRoleData[]): boolean => {
  return hasAdminRole(userRoles);
};

/**
 * Check if user can access admin_med features (admin or admin_med)
 */
export const canAccessAdminMedFeatures = (userRoles: UserRoleData[]): boolean => {
  return hasAdminRole(userRoles) || hasAdminMedRole(userRoles);
};

/**
 * Get user's highest priority role
 */
export const getHighestPriorityRole = (userRoles: UserRoleData[]): UserRole | null => {
  if (hasAdminRole(userRoles)) return 'admin';
  if (hasAdminMedRole(userRoles)) return 'admin_med';
  if (hasMedicoUnidadeRole(userRoles)) return 'medico_unidade';
  if (hasMedicoMaternidadeRole(userRoles)) return 'medico_maternidade';
  return null;
};
