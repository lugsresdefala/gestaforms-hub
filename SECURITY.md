# Security Architecture

## Authorization Model

This application uses a **defense-in-depth** security model with multiple layers:

### 1. Client-Side Checks (UX Layer)
- **Purpose**: Optimize user experience, not security
- **Implementation**: React components check roles to show/hide UI elements
- **Location**: `ProtectedRoute`, `AuthContext`, conditional rendering
- **Security Level**: ⚠️ Can be bypassed by manipulating browser developer tools

**Important**: Client-side checks are for UX only. They prevent confusion and improve performance, but do NOT provide security.

### 2. Row-Level Security Policies (Primary Security Boundary)
- **Purpose**: Enforce data access control at the database level
- **Implementation**: PostgreSQL RLS policies on all tables
- **Security Level**: ✅ Cannot be bypassed - enforced by database
- **Key Policies**:
  - Users can only read their own profiles
  - Admins can read all profiles
  - `medico_unidade` can only access appointments they created
  - `medico_maternidade` can only access approved appointments for their facility

### 3. Server-Side Role Verification (Edge Functions)
- **Purpose**: Validate user permissions before executing privileged operations
- **Implementation**: Edge functions verify JWT and check roles using `has_role()` function
- **Security Level**: ✅ Cannot be bypassed - enforced server-side
- **Example**: `create-default-users` function verifies admin role before creating users

## Security Functions

### `has_role(_user_id uuid, _role app_role)`
- **Type**: SECURITY DEFINER function
- **Purpose**: Check if a user has a specific role
- **Security**: Uses SECURITY DEFINER to bypass RLS and prevent recursion
- **Usage**: Called by RLS policies and edge functions

### `has_maternidade_access(_user_id uuid, _maternidade text)`
- **Type**: SECURITY DEFINER function
- **Purpose**: Check if a user can access a specific maternidade
- **Usage**: Restricts `medico_maternidade` users to their assigned facilities

## Role Storage

Roles are stored in a separate `user_roles` table, **NOT** in the profiles or auth.users table. This prevents privilege escalation attacks where users could modify their own roles.

## Best Practices

1. ✅ **Always use RLS policies** - They are your primary security boundary
2. ✅ **Verify roles server-side** - Edge functions must independently verify user roles
3. ✅ **Never trust client input** - Treat all client data as untrusted
4. ✅ **Use SECURITY DEFINER carefully** - Set `search_path = public` to prevent injection
5. ✅ **Separate role storage** - Keep roles in dedicated table with admin-only write access

## Authentication Flow

1. User logs in via Supabase Auth
2. JWT token is stored in browser (localStorage)
3. Client fetches user roles from `user_roles` table (RLS allows reading own roles)
4. Client-side checks show/hide UI elements based on roles
5. All API requests include JWT token in Authorization header
6. Server verifies JWT and checks roles using `has_role()` function
7. Database enforces RLS policies on all queries

## Threat Model

### ✅ Protected Against
- Direct database access (RLS policies enforce access control)
- Privilege escalation (roles in separate table with admin-only write)
- Bypassing client-side checks (RLS is the real security boundary)
- Unauthorized API calls (edge functions verify roles)

### ⚠️ Not Protected Against
- XSS attacks (mitigated by React's built-in escaping)
- Social engineering (users can be tricked into giving credentials)
- Compromised admin accounts (implement MFA for admins)

## Production Checklist

Before deploying to production:

- [ ] Remove default credentials display from login page
- [ ] Delete or disable default test accounts
- [ ] Review all RLS policies for correctness
- [ ] Verify all edge functions check roles server-side
- [ ] Enable audit logging for sensitive operations
- [ ] Implement rate limiting on authentication endpoints
- [ ] Configure password policies (minimum length, complexity)
- [ ] Enable MFA for admin accounts
- [ ] Review and restrict CORS policies
- [ ] Set up monitoring and alerting for security events
