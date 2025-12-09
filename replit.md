# Sistema de Agendamentos Obstétricos

## Overview
A comprehensive obstetric scheduling system (Sistema de Agendamentos Obstétricos) for managing surgical scheduling of pregnant patients across multiple Hapvida network maternities. The system implements clinical protocols PT-AON-097 and PR-DIMEP-PGS-01 for gestational age calculation and procedure timing.

## Architecture
- **Frontend**: React + Vite + TypeScript + TailwindCSS + ShadCN UI
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based auth with bcrypt password hashing

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

## Migration Status
Migrated from Lovable/Supabase to Replit's fullstack architecture:
- Database schema: Complete (20+ tables)
- Backend API routes: Complete
- Frontend: Working with mock Supabase client adapter
- Authentication: Express-based with bcrypt/sessions

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
- `/api/webhook/logs` - GET - View webhook processing logs

## Webhook Configuration
The system accepts Excel data via webhook at:
```
POST https://agenda-hapvida.replit.app/api/webhook/excel
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

## Running the Project
```bash
npm run dev  # Starts Express + Vite dev server on port 5000
```

## Database Management
```bash
npm run db:push  # Push schema changes to database
```
