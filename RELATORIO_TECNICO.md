# RELATÓRIO TÉCNICO - GESTAFORMS HUB

## 1. IDENTIFICAÇÃO DO SISTEMA

**Nome:** GestaForms Hub  
**Versão:** 1.0  
**Ambiente:** Produção  
**Data:** Novembro 2025

---

## 2. ARQUITETURA TÉCNICA

### 2.1 Stack Tecnológico

**Frontend:**
- React 18.3.1
- TypeScript 5.x
- Vite 6.x (Build Tool)
- React Router DOM 6.30.1

**Bibliotecas UI:**
- Tailwind CSS 3.x
- Shadcn/ui (Radix UI primitives)
- Lucide React (ícones)
- React Hook Form 7.61.1
- Zod 3.25.76 (validação)

**Backend:**
- Lovable Cloud (Supabase)
- PostgreSQL 13+
- Supabase Auth
- Deno Edge Functions

**Gestão de Estado:**
- React Query (@tanstack/react-query 5.83.0)
- React Context API

---

## 3. MODELO DE DADOS

### 3.1 Tabelas Principais

**agendamentos_obst**
- Armazena todos os agendamentos obstétricos
- 41 colunas incluindo dados clínicos, diagnósticos e metadados
- Campos-chave: id (uuid), created_by (uuid), status (text), data_agendamento_calculada (date)

**profiles**
- Perfis de usuários do sistema
- Campos: id (uuid), nome_completo (text), email (text), status_aprovacao (text)

**user_roles**
- Controle de permissões baseado em roles
- Campos: id (uuid), user_id (uuid), role (enum: app_role), maternidade (text nullable)

**capacidade_maternidades**
- Capacidade de vagas por maternidade
- Campos: id (uuid), maternidade (text), vagas_dia_util (int), vagas_sabado (int), vagas_domingo (int), vagas_dia_max (int), vagas_semana_max (int)

**notificacoes**
- Sistema de notificações internas
- Campos: id (uuid), agendamento_id (uuid), tipo (text), mensagem (text), lida (boolean)

**solicitacoes_acesso**
- Solicitações de acesso ao sistema
- Campos: id (uuid), user_id (uuid), tipo_acesso (text), status (text), maternidade (text nullable)

### 3.2 Enums

**app_role:**
- `admin`: Administrador do sistema
- `admin_med`: Administrador médico
- `medico_unidade`: Médico de unidade de saúde
- `medico_maternidade`: Médico de maternidade

---

## 4. TIPOS DE USUÁRIOS E PERMISSÕES

### 4.1 Admin
**Capacidades:**
- Gerenciar todos os usuários
- Criar/editar/deletar roles
- Acesso total a todas as tabelas
- Configurar capacidades de maternidades

### 4.2 Admin Médico (admin_med)
**Capacidades:**
- Aprovar/rejeitar agendamentos pendentes
- Editar agendamentos (incluindo aprovados)
- Gerenciar usuários (aprovação de cadastros)
- Visualizar todos os agendamentos
- Criar/editar/deletar roles de usuários

### 4.3 Médico de Unidade (medico_unidade)
**Capacidades:**
- Criar novos agendamentos (status: pendente)
- Visualizar próprios agendamentos
- Editar próprios agendamentos pendentes

### 4.4 Médico de Maternidade (medico_maternidade)
**Capacidades:**
- Visualizar agendamentos aprovados da sua maternidade
- Acesso filtrado por maternidade específica

---

## 5. WORKFLOWS OPERACIONAIS

### 5.1 Fluxo de Agendamento

**Etapa 1: Criação (medico_unidade)**
1. Preenche formulário com dados clínicos
2. Sistema calcula IG automaticamente
3. Sistema valida protocolos obstétricos
4. Status inicial: "pendente"
5. Registro salvo sem data definitiva

**Etapa 2: Aprovação (admin_med)**
1. Revisa dados clínicos
2. Define data final de agendamento
3. Adiciona observações (opcional)
4. Aprova ou rejeita
5. Status: "aprovado" ou "rejeitado"

**Etapa 3: Visualização**
- Médico unidade: vê status e data confirmada
- Médico maternidade: vê agendamentos aprovados da sua unidade
- Admin/Admin_med: acesso total

### 5.2 Fluxo de Cadastro

1. Usuário cria conta (signup)
2. Perfil criado automaticamente via trigger
3. Status: "pendente"
4. Admin_med aprova e atribui role
5. Usuário recebe acesso conforme role

---

## 6. SEGURANÇA E CONFORMIDADE

### 6.1 Arquitetura de Segurança (3 Camadas)

**Camada 1: Client-Side**
- Validação de formulários (Zod schemas)
- Proteção de rotas (ProtectedRoute component)
- Verificação de roles (AuthContext)

**Camada 2: Row-Level Security (RLS)**
- Políticas por tabela e operação
- Uso de funções SECURITY DEFINER
- Isolamento de dados por user_id

**Camada 3: Edge Functions**
- Validação server-side
- Operações críticas isoladas
- Verificação de JWT tokens

### 6.2 Funções de Segurança

**has_role(_user_id uuid, _role app_role)**
- Verifica se usuário possui role específico
- SECURITY DEFINER, STABLE
- Usado em todas as RLS policies

**has_maternidade_access(_user_id uuid, _maternidade text)**
- Verifica acesso a maternidade específica
- Usado para medico_maternidade

**is_admin_med(_user_id uuid)**
- Verificação específica de admin médico
- SECURITY DEFINER, STABLE

### 6.3 Políticas RLS Implementadas

**agendamentos_obst:**
- SELECT: admin, admin_med, medico_unidade (próprios), medico_maternidade (aprovados)
- INSERT: medico_unidade, admin
- UPDATE: admin, admin_med
- DELETE: nenhum

**profiles:**
- SELECT: próprio perfil, admin, admin_med
- UPDATE: próprio perfil, admin, admin_med
- INSERT/DELETE: via trigger automático

**user_roles:**
- SELECT: próprios roles, admin, admin_med
- INSERT/UPDATE/DELETE: admin, admin_med

**capacidade_maternidades:**
- SELECT: todos autenticados
- INSERT/UPDATE/DELETE: admin

**notificacoes:**
- SELECT: admin
- UPDATE: admin
- INSERT/DELETE: via trigger automático

**solicitacoes_acesso:**
- SELECT: próprias solicitações, admin, admin_med
- INSERT: próprio user_id
- UPDATE: admin, admin_med
- DELETE: nenhum

---

## 7. CONFORMIDADE LGPD

### 7.1 Princípios Implementados

**Finalidade:**
- Dados coletados apenas para agendamentos obstétricos
- Sem uso secundário não autorizado

**Adequação:**
- Campos específicos para contexto médico
- Relacionamento direto com finalidade

**Necessidade:**
- Apenas dados essenciais para procedimento
- Sem coleta excessiva

**Livre Acesso:**
- Médicos visualizam dados de pacientes sob sua responsabilidade
- RLS garante acesso apropriado

**Segurança:**
- Criptografia em trânsito (HTTPS)
- Criptografia em repouso (Supabase)
- RLS impede acessos não autorizados
- Autenticação JWT obrigatória

### 7.2 Dados Sensíveis (Artigo 5º, II LGPD)

**Dados de Saúde Armazenados:**
- Idade gestacional
- Diagnósticos maternos e fetais
- Histórico obstétrico
- Medicações
- Indicações de procedimentos
- Necessidades clínicas (UTI, reserva de sangue)

**Medidas Especiais:**
- Acesso restrito por role
- Logs de acesso (via Supabase)
- Políticas RLS específicas
- Autenticação obrigatória

### 7.3 Direitos dos Titulares (Artigo 18 LGPD)

**Implementado:**
- Acesso aos dados (médicos veem dados dos pacientes)
- Correção (admin_med pode editar agendamentos)
- Exclusão lógica (status de cancelamento)

**A Implementar:**
- Portal do paciente (acesso direto aos próprios dados)
- Exportação de dados em formato estruturado
- Logs de auditoria detalhados com timestamp
- Mecanismo de anonimização pós-tratamento

---

## 8. RECURSOS ATUAIS

### 8.1 Funcionalidades Principais

- Sistema de autenticação JWT
- Cadastro e aprovação de usuários
- Criação de agendamentos obstétricos
- Workflow de aprovação médica
- Cálculo automático de IG
- Validação de protocolos obstétricos
- Sistema de notificações
- Gestão de capacidade por maternidade
- Calendários de ocupação
- Importação de agendamentos (SQL)
- Detecção de duplicados

### 8.2 Páginas/Rotas

- `/auth` - Login/Signup
- `/` - Dashboard
- `/novo-agendamento` - Criar agendamento
- `/meus-agendamentos` - Visualizar próprios
- `/aprovacoes-agendamentos` - Aprovar/rejeitar (admin_med)
- `/editar-agendamento/:id` - Editar (admin_med)
- `/gerenciar-usuarios` - Gestão de usuários
- `/aprovacoes-usuarios` - Aprovação de cadastros
- `/ocupacao-maternidades` - Ocupação semanal
- `/calendario-ocupacao` - Calendário mensal
- `/calendario-completo` - Visão completa
- `/importar-sql` - Importação em lote
- `/guia-sistema` - Documentação

---

## 9. INTEGRAÇÕES

### 9.1 Supabase (Lovable Cloud)

**Serviços Utilizados:**
- Supabase Auth (autenticação)
- PostgreSQL (banco de dados)
- Realtime (notificações)
- Edge Functions (lógica server-side)

**Configuração:**
- Project ID: uoyzfzzjzhvcxfmpmufz
- Região: us-east-1
- Auto-confirm emails: habilitado (ambiente interno)

### 9.2 Bibliotecas de Terceiros

- date-fns: manipulação de datas
- XLSX: exportação/importação de planilhas
- Recharts: gráficos e visualizações
- Sonner: toast notifications
- React Query: cache e sincronização

---

## 10. DEPLOY E INFRAESTRUTURA

### 10.1 Build

**Comando:** `npm run build`  
**Output:** `/dist`  
**Otimizações:** 
- Tree shaking
- Code splitting
- Minificação
- Asset optimization

### 10.2 Variáveis de Ambiente

```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_PROJECT_ID
```

### 10.3 Hospedagem

- Frontend: Vercel/Lovable hosting
- Backend: Lovable Cloud (Supabase)
- Edge Functions: Deno Deploy

---

## 11. MONITORAMENTO

### 11.1 Logs Disponíveis

- Supabase Auth logs
- PostgreSQL logs
- Edge Function logs
- Network requests (client-side)
- Console logs (client-side)

### 11.2 Métricas

- Tempo de resposta de queries
- Taxa de erro em requisições
- Utilização de capacidade por maternidade
- Agendamentos por status

---

## 12. MANUTENÇÃO E ATUALIZAÇÕES

### 12.1 Migrations

- Versionamento via Supabase migrations
- Schema changes via SQL migrations
- Rollback suportado

### 12.2 Dependências

**Atualização Recomendada:**
- React: mensal
- Supabase Client: quando há breaking changes
- Tailwind: semestral
- Shadcn/ui: sob demanda

---

## 13. LIMITAÇÕES CONHECIDAS

1. Sem portal do paciente
2. Sem logs de auditoria detalhados (LGPD)
3. Sem exportação de dados estruturada
4. Sem mecanismo de anonimização
5. Validação de duplicados por carteirinha+data apenas

---

## 14. PRÓXIMAS VERSÕES (ROADMAP)

### 14.1 Curto Prazo
- Portal do paciente (visualização de agendamentos)
- Logs de auditoria LGPD-compliant
- Exportação de dados (CSV/PDF)

### 14.2 Médio Prazo
- Dashboard analítico avançado
- Relatórios automatizados
- Integração com sistemas hospitalares

### 14.3 Longo Prazo
- Aplicativo móvel
- Telemedicina integrada
- IA para sugestão de protocolos

---

**Documento gerado em:** 18 de Novembro de 2025  
**Responsável técnico:** Equipe GestaForms Hub
