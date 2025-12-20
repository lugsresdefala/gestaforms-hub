# Sistema de Agendamentos Obstétricos

## Overview
A comprehensive obstetric scheduling system (Sistema de Agendamentos Obstétricos) for managing surgical scheduling of pregnant patients across multiple Hapvida network maternities. The system implements clinical protocols PT-AON-097 and PR-DIMEP-PGS-01 for gestational age calculation and procedure timing.

## Architecture
- **Frontend**: React + Vite + TypeScript + TailwindCSS + ShadCN UI
- **Backend**: Supabase Edge Functions (Node/TypeScript) + Express local para desenvolvimento
- **Database**: PostgreSQL (Supabase) com Drizzle ORM
- **Authentication**: Supabase Auth

## Directory Structure
```
├── client/src/           # Frontend React application
│   ├── components/       # Reusable UI components
│   ├── contexts/         # React contexts (Auth, etc.)
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Page components
│   ├── lib/              # Utility functions and clients
│   └── integrations/     # API client (mock Supabase interface)
├── server/               # Backend Express server
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Data access layer (Drizzle ORM)
│   ├── db.ts             # Database connection
│   └── vite.ts           # Vite dev server integration
├── shared/               # Shared code between frontend/backend
│   └── schema.ts         # Drizzle schema + Zod validation
└── scripts/              # Utility scripts for data processing
```

## Deployment Status (Produção)
Publicado fora do Replit, utilizando pipeline padrão de produção:
- Frontend estático (Vite) publicado em ambiente de produção (ex: Vercel)
- API e webhooks expostos via Functions do Supabase
- Autenticação/Sessão gerenciada via Supabase Auth

## API Endpoints
- `/api/health` - Health check
- `/api/auth/register` - User registration
- `/api/auth/login` - User login
- `/api/agendamentos` - CRUD for scheduling records
- `/api/capacidades` - Maternity capacity management
- `/api/notificacoes` - Notifications
- `/api/user-roles` - User role management
- `/api/solicitacoes-acesso` - Access requests
- `/api/profiles` - User profiles
- `/api/faq` - FAQ items
- `/api/audit-logs` - Audit trail
- `/api/webhook/excel` - POST - Webhook for Excel data import
- `/api/webhook/forms` - POST - Webhook for Microsoft Forms (Power Automate)
- `/api/webhook/logs` - GET - View webhook processing logs
- `/api/pendentes` - GET - List pending appointments for approval
- `/api/pendentes/:id` - GET/PATCH - View/update specific pending appointment

## Webhook Configuration

### Excel Webhook (Produção)
Edge Function publicada no Supabase:
```
POST https://<SEU_PROJETO>.supabase.co/functions/v1/webhook-excel
Content-Type: application/json
```

Required fields:
- `carteirinha` - Patient ID card number
- `nome_completo` or `nomeCompleto` - Full name
- `maternidade` - Maternity hospital name

Optional fields (with defaults):
- `telefone` / `telefones` - Phone number(s)
- `email` / `emailPaciente` - Patient email
- `data_nascimento` / `dataNascimento` - Birth date
- `procedimentos` - Array of procedures (default: ["Cesárea"])
- `data_agendamento` / `dataAgendamentoCalculada` - Scheduled date
- And other clinical fields...

### Forms Webhook (Produção)
Edge Function publicada no Supabase:
```
POST https://<SEU_PROJETO>.supabase.co/functions/v1/processar-forms-webhook
Content-Type: application/json
```

This endpoint implements the complete PT-AON-097 clinical protocol pipeline:
1. DUM vs USG comparison and dating method selection
2. Diagnosis-based ideal gestational age (IG) calculation
3. Maternity capacity verification
4. Automatic scheduling date calculation

Required fields:
- `paciente` or `nome_paciente` - Patient full name
- `maternidade` or `hospital` - Maternity hospital name

Recommended fields for clinical pipeline:
- `data_dum` / `dum` - Last menstrual period (DD/MM/YYYY or YYYY-MM-DD)
- `data_primeiro_usg` / `data_usg` - First ultrasound date
- `semanas_usg` - Gestational weeks at ultrasound
- `dias_usg` - Additional days (0-6)
- `diagnostico_materno` - Maternal diagnoses
- `diagnostico_fetal` - Fetal diagnoses

See [WEBHOOK_FORMS_CONTRATO.md](./WEBHOOK_FORMS_CONTRATO.md) for complete API documentation.

## Test Credentials
- Email: admin@teste.com
- Password: admin123
- Role: admin

## Recent Changes
- 2025-12-08: Completed backend migration to Express + Drizzle ORM
- 2025-12-08: Created mock Supabase client adapter for frontend compatibility
- 2025-12-08: Fixed directory structure (client/src/src -> client/src)
- 2025-12-08: Added script path aliases (@scripts)
- 2025-12-08: Added missing API routes for all entities

## Running the Project (local)
```bash
npm run dev  # Inicia servidor Express + Vite em http://localhost:5000
```

## Database Management
```bash
npm run db:push  # Push schema changes to database (desenvolvimento)
```
