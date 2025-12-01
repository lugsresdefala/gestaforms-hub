## **GestaForms Hub — Copilot Guidance (concise)**
This file tells AI coding agents how the project is organized, where to make safe changes, and which conventions are authoritative.
**Big Picture:**
- **Frontend:** Vite + React + TypeScript. UI components in `src/components/` and multi-step forms in `src/components/form-steps/`.
- **Business logic:** `src/lib/` (important: `gestationalCalculations.ts`, `obstetricProtocols.ts`, `formSchema.ts`).
- **Backend / DB:** Supabase (Postgres) with Edge Functions in `supabase/functions/` and migrations in `supabase/migrations/`.
**Security & Roles (authoritative):**
- **Primary boundary:** Row-Level Security (RLS) in the DB — do not rely on client checks for security.
- **Client checks only for UX:** `src/contexts/AuthContext.tsx` and `src/components/ProtectedRoute.tsx` enforce UX-level restrictions.
- **Role names:** `admin`, `admin_med`, `medico_unidade`, `medico_maternidade`. Use `useAuth()` helpers (e.g., `isAdmin()`) when altering UI or routes.
**Critical Patterns to Preserve:**
- Appointment workflow: `medico_unidade` creates (status: `pendente`) → `admin_med` approves (status: `aprovado`, sets final date).
- Calculation flow: Validate form (`src/lib/formSchema.ts`) → run `gestationalCalculations` → persist with `status='pendente'`.
- Medical protocols stored in `src/lib/obstetricProtocols.ts` (48 protocols). Edits here must be tested against `gestationalCalculations.ts` and unit tests in `tests/`.
**Where to change DB or roles safely:**
- Add migrations to `supabase/migrations/` and update TypeScript interfaces in `src/`.
- When changing access, update RLS policies in the Supabase dashboard and corresponding Edge Function checks (search `has_role` in `supabase/functions/`).
**Developer commands (local):**
- Start dev server: `npm run dev` (Vite; default dev port used historically is 8080).
- Build: `npm run build` or `npm run build:dev` for development build.
- Tests: `npm test` (Vitest). Use `npm run test:watch` for TDD.
- Lint: `npm run lint`.
- Helpful scripts: `node scripts/export-agendamentos-mensais.js` and other utilities in `scripts/` (CSV import/export).
**Integration points & examples:**
- CSV import samples: `public/csv-temp/` and `scripts/` (see `importar_fluxo_novo_2025.py` and JS import utilities).
- Supabase client setup: `src/integrations/supabase/` — update here if auth/URL keys change.
- Edge functions and migrations: `supabase/functions/` and `supabase/migrations/`.
**Testing & verification:**
- Unit tests live in `tests/` and `scripts/__tests__/`. Run `npm test` after changes to `gestationalCalculations` or protocols.
- To validate imports, compare generated CSV output against `public/csv-temp/` examples and use `scripts/analyze-csv-schema.js`.
**Conventions / Style:**
- All UI text is in Brazilian Portuguese — keep translations consistent.
- Avoid changing RLS or Edge Function logic without explicit migration and test coverage.
- Keep medical logic deterministic: prefer pure functions in `src/lib/` and add focused unit tests.
If anything above is ambiguous or you want more examples (specific functions, tests to run, or a migration template), tell me which section to expand.
# GestaForms Hub - AI Coding Instructions

## Project Overview
**GestaForms Hub** is a React + Supabase application for managing obstetric appointment scheduling in Brazil's Hapvida NotreDame healthcare network. It handles the complete workflow from medical form submission to administrative approval.

## Core Architecture

### Tech Stack
- **Frontend**: Vite + React + TypeScript + shadcn/ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Edge Functions + Auth + RLS)
- **Build/Dev**: `npm run dev` (port 8080) | `npm run build`
- **Key Dependencies**: `@tanstack/react-query`, `date-fns`, `zod`, form validation

### Three-Tier Security Model
1. **Client-side checks** (`AuthContext`, `ProtectedRoute`) - UX only, NOT security
2. **Row-Level Security (RLS)** - Primary security boundary in database
3. **Edge function validation** - Server-side role verification using `has_role()` function

**Critical**: All security depends on RLS policies. Client checks are for UX only.

### User Roles & Access Control
```typescript
type UserRole = 'admin' | 'admin_med' | 'medico_unidade' | 'medico_maternidade'
```
- `admin`: Full system access, user management
- `admin_med`: Approve appointments, manage medical aspects  
- `medico_unidade`: Create appointments (status: 'pendente')
- `medico_maternidade`: View approved appointments for their facility

**Pattern**: Always check roles via `useAuth()` hooks: `isAdmin()`, `isAdminMed()`, `isMedicoUnidade()`

## Essential Business Logic

### Appointment Workflow (CRITICAL PATTERN)
```
1. medico_unidade creates → status: 'pendente' 
2. admin_med approves → status: 'aprovado' + sets final date
3. Patient views approved appointment
```

**Key Files:**
- `/src/pages/NovoAgendamento.tsx` - Form submission (creates pending)
- `/src/pages/AprovacoesAgendamentos.tsx` - Admin approval workflow  
- `/src/lib/gestationalCalculations.ts` - Core pregnancy date calculations
- `/src/lib/obstetricProtocols.ts` - Medical protocol rules (48 protocols)

### Data Models (Main Tables)
```sql
agendamentos_obst {
  status: 'pendente' | 'aprovado' | 'rejeitado'
  created_by: UUID -- who created
  aprovado_por: UUID -- who approved  
  data_agendamento_calculada: DATE -- suggested date
  idade_gestacional_calculada: TEXT -- "39 weeks 2 days"
  // ... extensive medical fields
}

user_roles {
  user_id: UUID
  role: app_role
  maternidade: TEXT -- for medico_maternidade access
}
```

### Medical Calculation Engine
**Gestational Age Calculation** (`gestationalCalculations.ts`):
- Uses DUM (last menstrual period) OR ultrasound data
- Calculates ideal delivery dates per medical protocols
- Returns structured `CalculationResult` with methodology and dates

**Obstetric Protocols** (`obstetricProtocols.ts`):
- 48 condition-specific protocols (e.g., diabetes, hypertension)
- Each has `igIdeal` (ideal gestational age), `margemDias` (tolerance)
- Maps diagnoses to delivery timing rules

## Development Patterns

### Form Handling
- **Schema**: `src/lib/formSchema.ts` (Zod validation)
- **Multi-step forms**: `src/components/form-steps/` directory
- **Submission pattern**: Validate → Calculate dates → Insert with status='pendente'

### Data Fetching  
- **React Query** for server state management
- **Pattern**: `useEffect` + `supabase.from().select()` + loading states
- **RLS enforcement**: Queries automatically filtered by user permissions

### File Structure Navigation
```
src/
├── components/           # Reusable UI components
├── contexts/AuthContext.tsx  # Auth state management  
├── pages/               # Route components (main features)
├── lib/                 # Business logic, calculations, schemas
├── utils/               # Import utilities, CSV processing
└── integrations/supabase/  # Database client setup
```

### CSV Import System
- **Scripts**: `scripts/` (Node.js import utilities)  
- **Processing**: `src/pages/Processar*.tsx` (UI for bulk imports)
- **Utilities**: `src/utils/import*.ts` (parsing & validation logic)

## Common Workflows

### Adding New Medical Protocols
1. Update `PROTOCOLS` object in `obstetricProtocols.ts`
2. Add diagnosis mapping logic
3. Test calculation in `gestationalCalculations.ts`

### Role-Based Feature Implementation
```typescript
// Always use auth context for access control
const { isAdmin, isMedicoUnidade } = useAuth();

// Conditional rendering
{isMedicoUnidade() && <CreateAppointmentButton />}

// Route protection
<ProtectedRoute requireAdminMed>
  <ApprovalPage />
</ProtectedRoute>
```

### Database Schema Changes
1. Create migration in `supabase/migrations/`
2. Update TypeScript interfaces in relevant components
3. Verify RLS policies still apply correctly

## Testing & Debugging
- **Auth flow**: Use `/criar-usuarios-padrao` for default test users
- **Database**: Check Supabase dashboard for RLS policy violations
- **Calculations**: Medical date calculations are complex - verify against `FLUXO_AGENDAMENTOS.md`
- **Import issues**: Check CSV format in `public/csv-temp/` examples

## Critical Implementation Notes
- **Never bypass RLS** - it's the only real security boundary
- **Medical calculations must be precise** - pregnancy timing is critical
- **Status workflow is strict** - pendente → aprovado is the only valid approval path
- **Date calculations consider medical protocols** - not just calendar math
- **Portuguese language** - All user-facing text in Brazilian Portuguese

## ⚠️ Regras de Protocolo Obstétrico

### O que NÃO usar:
- ❌ `desejo_materno` - Não é indicação clínica, não define IG
- ❌ `cesarea_eletiva` - Não é protocolo médico
- ❌ `laqueadura` - É procedimento adicional, não protocolo
- ❌ `baixo_risco` - Não existe no protocolo clínico, foi removido do código

### Regra de ouro:
- ✅ IG ideal é definida **exclusivamente** por patologias clínicas (tabela PT-AON-097)
- ✅ Cesárea eletiva sem indicação médica = ERRO (diagnósticos clínicos são obrigatórios)
- ✅ Se não houver diagnóstico, lançar erro de validação (não criar protocolo fictício)
- ✅ Todas as pacientes devem ter diagnósticos maternos ou fetais registrados

### Arquivos de importação ativos:
- ✅ `src/pages/ImportarPorTabela.tsx` - Interface web principal
- ✅ `src/lib/importSanitizer.ts` - Validação de dados
- ✅ `src/lib/import/gestationalSnapshot.ts` - Cálculo de IG

### Arquivos DELETADOS (não recriar):
- ❌ Todos os `src/utils/import*2025.ts` (obsoletos)
- ❌ Scripts em `src/scripts/process*.ts` (obsoletos)
- ❌ Páginas de importação legadas (`ImportarAgendamentos2025.tsx`, `ProcessarAgendas2025.tsx`, etc.)