# Sistema de Agendamentos Obstétricos

## Visão Geral
Sistema completo de agendamentos obstétricos para gestão de cirurgias e procedimentos nas maternidades da rede Hapvida. Implementa os protocolos clínicos PT-AON-097 e PR-DIMEP-PGS-01 para cálculo de idade gestacional e definição de datas ideais.

## Arquitetura
- **Frontend**: React + Vite + TypeScript + TailwindCSS + ShadCN UI
- **Backend**: Supabase Edge Functions (Node/TypeScript) + Express local para desenvolvimento
- **Database**: PostgreSQL (Supabase) com Drizzle ORM
- **Authentication**: Supabase Auth

## Estrutura de Pastas
```
├── client/src/           # Aplicação React (frontend)
│   ├── components/       # Componentes reutilizáveis
│   ├── contexts/         # Contextos React (Auth, etc.)
│   ├── hooks/            # Hooks personalizados
│   ├── pages/            # Páginas
│   ├── lib/              # Utilitários e clientes
│   └── integrations/     # Cliente Supabase/API
├── server/               # Servidor Express (desenvolvimento)
│   ├── index.ts          # Entrada do servidor
│   ├── routes.ts         # Rotas de API
│   ├── storage.ts        # Camada de acesso a dados (Drizzle ORM)
│   ├── db.ts             # Conexão com o banco
│   └── vite.ts           # Integração Vite no dev
├── shared/               # Código compartilhado entre client/server
│   └── schema.ts         # Schema Drizzle + validação Zod
└── scripts/              # Scripts utilitários para dados
```

## Status de Deploy (Produção)
Publicado utilizando pipeline padrão de produção:
- Frontend estático (Vite) publicado em ambiente de produção (ex: Vercel)
- API e webhooks expostos via Functions do Supabase
- Autenticação/Sessão gerenciada via Supabase Auth

## Endpoints (API local)
- `/api/health` - Verificação de saúde
- `/api/auth/register` - Cadastro de usuário
- `/api/auth/login` - Login
- `/api/agendamentos` - CRUD de agendamentos
- `/api/capacidades` - Gestão de capacidade das maternidades
- `/api/notificacoes` - Notificações
- `/api/user-roles` - Gestão de roles/usuários
- `/api/solicitacoes-acesso` - Solicitações de acesso
- `/api/profiles` - Perfis de usuário
- `/api/faq` - Itens de FAQ
- `/api/audit-logs` - Trilhas de auditoria
- `/api/webhook/excel` - POST - Webhook para importação de Excel
- `/api/webhook/forms` - POST - Webhook do Microsoft Forms (Power Automate)
- `/api/webhook/logs` - GET - Logs de processamento de webhooks
- `/api/pendentes` - GET - Lista agendamentos pendentes para aprovação
- `/api/pendentes/:id` - GET/PATCH - Visualiza/atualiza agendamento específico

## Configuração dos Webhooks

> Substitua `<PROJECT_ID>` pelo identificador do projeto Supabase (prefixo da URL mostrado no dashboard, antes de `.supabase.co`). Exemplo: se a URL for `https://abcd1234.supabase.co`, use `abcd1234`.

### Excel Webhook (Produção)
Edge Function publicada no Supabase:
```
POST https://<PROJECT_ID>.supabase.co/functions/v1/webhook-excel
Content-Type: application/json
```

Campos obrigatórios:
- `carteirinha` - Número da carteirinha
- `nome_completo` ou `nomeCompleto` - Nome completo
- `maternidade` - Nome da maternidade de destino

Campos opcionais (com valores padrão):
- `telefone` / `telefones` - Telefones de contato
- `email` / `emailPaciente` - E-mail da paciente
- `data_nascimento` / `dataNascimento` - Data de nascimento
- `procedimentos` - Lista de procedimentos (default: ["Cesárea"])
- `data_agendamento` / `dataAgendamentoCalculada` - Data agendada
- E outros campos clínicos...

### Forms Webhook (Produção)
Edge Function publicada no Supabase:
```
POST https://<PROJECT_ID>.supabase.co/functions/v1/processar-forms-webhook
Content-Type: application/json
```

Este endpoint executa todo o pipeline clínico PT-AON-097:
1. Comparação DUM vs USG e definição do método de datação
2. Cálculo da idade gestacional ideal (IG) pelos diagnósticos
3. Verificação de capacidade da maternidade
4. Cálculo automático da data de agendamento

Campos obrigatórios:
- `paciente` ou `nome_paciente` - Nome completo da paciente
- `maternidade` ou `hospital` - Nome da maternidade

Campos recomendados para o pipeline clínico:
- `data_dum` / `dum` - Data da última menstruação (DD/MM/YYYY ou YYYY-MM-DD)
- `data_primeiro_usg` / `data_usg` - Data do primeiro USG
- `semanas_usg` - Semanas gestacionais no USG
- `dias_usg` - Dias adicionais (0-6)
- `diagnostico_materno` - Diagnósticos maternos
- `diagnostico_fetal` - Diagnósticos fetais

Consulte [WEBHOOK_FORMS_CONTRATO.md](./WEBHOOK_FORMS_CONTRATO.md) para a documentação completa da API.

## Credenciais de Teste
- Email: admin@teste.com
- Senha: admin123
- Papel: admin

## Alterações Recentes
- 2025-12-08: Migração do backend para Express + Drizzle ORM concluída
- 2025-12-08: Adapter mock do Supabase para compatibilidade do frontend
- 2025-12-08: Correção da estrutura de diretórios (client/src/src -> client/src)
- 2025-12-08: Inclusão de aliases de script (@scripts)
- 2025-12-08: Inclusão das rotas de API que estavam faltando

## Execução Local
```bash
npm run dev  # Inicia servidor Express + Vite em http://localhost:5000
```

## Gerenciamento do Banco de Dados
```bash
npm run db:push  # Push schema changes to database (desenvolvimento)
```
