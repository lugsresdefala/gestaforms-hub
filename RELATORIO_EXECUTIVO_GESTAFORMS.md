# RELATÓRIO EXECUTIVO - GESTAFORMS HUB
## Sistema de Gestão de Agendamentos Obstétricos

**Versão:** 1.0  
**Data:** 19 de Novembro de 2025  
**Proprietário:** Hapvida  
**Ambiente:** Produção

---

## SUMÁRIO EXECUTIVO

O **GestaForms Hub** é uma plataforma web moderna e segura desenvolvida para gerenciar agendamentos obstétricos de forma centralizada, eficiente e auditável. O sistema implementa controles rigorosos de segurança, fluxos de aprovação médica e conformidade com a LGPD.

### Principais Benefícios
- ✅ Redução do tempo de processamento de agendamentos
- ✅ Centralização de dados clínicos obstétricos
- ✅ Controle de capacidade por maternidade
- ✅ Rastreabilidade completa com auditoria
- ✅ Notificações em tempo real
- ✅ Conformidade com LGPD

---

## 1. ARQUITETURA TÉCNICA

### 1.1 Stack Tecnológico

#### Frontend
| Tecnologia | Versão | Finalidade |
|------------|--------|------------|
| **React** | 18.3.1 | Framework UI principal |
| **TypeScript** | 5.x | Tipagem estática e segurança de código |
| **Vite** | 6.x | Build tool e dev server |
| **Tailwind CSS** | 3.x | Framework CSS utilitário |
| **Shadcn/ui** | Latest | Componentes UI acessíveis |
| **React Router DOM** | 6.30.1 | Roteamento client-side |
| **React Query** | 5.83.0 | Gerenciamento de estado servidor |

#### Backend
| Tecnologia | Versão | Finalidade |
|------------|--------|------------|
| **Lovable Cloud** | - | Infraestrutura backend (Supabase) |
| **PostgreSQL** | 15+ | Banco de dados relacional |
| **Deno Edge Functions** | Latest | Serverless functions |
| **Supabase Realtime** | Latest | WebSocket para notificações |

#### Segurança
- **Row-Level Security (RLS)** - Políticas nível de linha no PostgreSQL
- **JWT Authentication** - Tokens seguros de autenticação
- **SECURITY DEFINER Functions** - Funções privilegiadas seguras
- **HTTPS/TLS** - Criptografia em trânsito
- **Encryption at Rest** - Criptografia de dados em repouso

### 1.2 Arquitetura de Deployment

```
┌─────────────────┐
│   Vercel/CDN    │ ← Frontend (React + Vite)
└────────┬────────┘
         │ HTTPS
         ↓
┌─────────────────┐
│  Lovable Cloud  │ ← Backend + DB + Edge Functions
│   (Supabase)    │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  PostgreSQL 15+ │ ← Banco de dados
└─────────────────┘
```

---

## 2. MODELO DE DADOS

### 2.1 Tabelas Principais

#### **agendamentos_obst** (41 campos)
Armazena todos os dados clínicos e administrativos dos agendamentos obstétricos.

**Campos Principais:**
- Identificação da paciente (nome, carteirinha, contatos)
- Dados clínicos (DUM, USG, IG calculada)
- Diagnósticos maternos e fetais
- Procedimentos solicitados
- Status do agendamento (pendente/aprovado/rejeitado)
- Dados de aprovação (aprovador, data, observações)
- Timestamps (criação, atualização)

**Campos de Controle:**
- `created_by` - Médico que criou
- `aprovado_por` - Admin médico que aprovou
- `status` - Estado do agendamento
- `data_agendamento_calculada` - Data sugerida/confirmada

#### **profiles**
Perfis dos usuários do sistema.

**Campos:**
- `id` (UUID - FK para auth.users)
- `nome_completo`
- `email`
- `status_aprovacao` (ativo/pendente/suspenso)
- `tipo_acesso_solicitado`
- `maternidade_solicitada`
- `aprovado_por` e `aprovado_em`

#### **user_roles** (CRÍTICA PARA SEGURANÇA)
Tabela separada para armazenar roles de usuários.

**Campos:**
- `id` (UUID)
- `user_id` (UUID - FK para auth.users)
- `role` (ENUM: admin | admin_med | medico_unidade | medico_maternidade)
- `maternidade` (text - apenas para medico_maternidade)

**Motivo da Separação:** Previne ataques de escalação de privilégios, pois não permite que usuários modifiquem suas próprias roles.

#### **capacidade_maternidades**
Define limites de vagas por maternidade.

**Campos:**
- `maternidade`
- `vagas_dia_util` (padrão: 3)
- `vagas_sabado` (padrão: 1)
- `vagas_domingo` (padrão: 0)
- `vagas_dia_max` (padrão: 10)
- `vagas_semana_max` (padrão: 50)

#### **notificacoes**
Sistema de notificações em tempo real (Realtime habilitado).

**Campos:**
- `agendamento_id`
- `tipo` (novo_agendamento | agendamento_urgente | status_alterado)
- `mensagem`
- `lida` (boolean)
- `lida_por` e `lida_em`

#### **agendamentos_historico**
Auditoria de alterações em agendamentos.

**Campos:**
- `agendamento_id`
- `user_id` (quem alterou)
- `action` (create | update | delete)
- `campo_alterado`
- `valor_anterior` e `valor_novo`
- `observacoes`

#### **audit_logs**
Logs completos do sistema (todas as operações).

**Campos:**
- `user_id`
- `table_name`
- `action`
- `record_id`
- `old_data` (JSONB)
- `new_data` (JSONB)
- `ip_address`
- `user_agent`

#### **solicitacoes_acesso**
Pedidos de acesso ao sistema.

**Campos:**
- `user_id`
- `tipo_acesso` (role solicitado)
- `maternidade` (se aplicável)
- `justificativa`
- `status` (pendente/aprovado/rejeitado)
- `aprovado_por` e `aprovado_em`

#### **faq_items**
Sistema de perguntas frequentes.

**Campos:**
- `categoria`
- `pergunta`
- `resposta`
- `ordem`
- `ativo`

### 2.2 Enums do Sistema

```sql
CREATE TYPE app_role AS ENUM (
  'admin',
  'admin_med',
  'medico_unidade',
  'medico_maternidade'
);
```

---

## 3. TIPOS DE USUÁRIOS E PERMISSÕES

### 3.1 **Admin** (Administrador do Sistema)

**Atribuições:**
- ✅ Acesso total ao sistema
- ✅ Gerenciar todos os usuários
- ✅ Atribuir e revogar roles
- ✅ Configurar capacidades das maternidades
- ✅ Aprovar solicitações de acesso
- ✅ Visualizar todos os agendamentos
- ✅ Aprovar/rejeitar agendamentos
- ✅ Acessar logs de auditoria completos
- ✅ Gerenciar FAQ
- ✅ Importar dados em lote

**Rotas Acessíveis:**
- Dashboard completo
- Gestão de usuários
- Aprovações de usuários
- Aprovações de agendamentos
- Logs de auditoria
- Configuração do sistema
- Importações
- Todas as funcionalidades

### 3.2 **Admin Médico** (admin_med)

**Atribuições:**
- ✅ Aprovar/rejeitar agendamentos obstétricos
- ✅ Visualizar todos os agendamentos (todas as maternidades)
- ✅ Aprovar novos usuários
- ✅ Atribuir roles aos usuários
- ✅ Visualizar histórico de alterações
- ✅ Acessar dashboard de métricas
- ❌ Não pode configurar capacidades
- ❌ Não pode acessar logs técnicos de sistema

**Rotas Acessíveis:**
- Dashboard
- Aprovações de agendamentos
- Aprovações de usuários
- Gerenciar usuários (atribuir roles)
- Visualizar todos os agendamentos
- Histórico de alterações
- FAQ

### 3.3 **Médico de Unidade** (medico_unidade)

**Atribuições:**
- ✅ Criar novos agendamentos (status inicial: **pendente**)
- ✅ Visualizar seus próprios agendamentos
- ✅ Editar agendamentos pendentes (antes da aprovação)
- ✅ Receber notificações de aprovação/rejeição
- ❌ **NÃO** pode aprovar agendamentos
- ❌ **NÃO** pode ver agendamentos de outros médicos
- ❌ **NÃO** pode alterar agendamentos aprovados

**Rotas Acessíveis:**
- Dashboard (métricas próprias)
- Novo agendamento
- Meus agendamentos
- FAQ
- Termos de uso
- Política de privacidade

**Workflow:**
1. Preenche formulário completo (6 etapas)
2. Sistema calcula IG e sugere data
3. Agendamento criado com status **"pendente"**
4. Aguarda aprovação de Admin Médico
5. Recebe notificação quando aprovado/rejeitado

### 3.4 **Médico de Maternidade** (medico_maternidade)

**Atribuições:**
- ✅ Visualizar agendamentos **aprovados** da sua maternidade
- ✅ Acessar calendário de ocupação da sua maternidade
- ✅ Visualizar métricas da sua maternidade
- ❌ **NÃO** pode ver agendamentos pendentes
- ❌ **NÃO** pode criar agendamentos
- ❌ **NÃO** pode ver outras maternidades

**Rotas Acessíveis:**
- Dashboard (filtrado por maternidade)
- Calendário da sua maternidade
- Agendamentos aprovados (apenas sua maternidade)
- FAQ

**Controle de Acesso:**
- Campo `maternidade` na tabela `user_roles` define qual maternidade ele acessa
- RLS filtra automaticamente os dados

---

## 4. FLUXOS DE TRABALHO (WORKFLOWS)

### 4.1 Workflow de Agendamento

```
┌──────────────────────────────────────────────────────────────┐
│ ETAPA 1: Médico da Unidade cria agendamento                 │
├──────────────────────────────────────────────────────────────┤
│ - Preenche formulário de 6 etapas                            │
│ - Sistema calcula IG automaticamente                         │
│ - Sistema valida protocolo obstétrico                        │
│ - Sistema sugere data ideal                                  │
│ - Status: "pendente"                                         │
│ - Notificação enviada aos admins médicos                     │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ↓
┌──────────────────────────────────────────────────────────────┐
│ ETAPA 2: Admin Médico revisa e aprova                       │
├──────────────────────────────────────────────────────────────┤
│ - Revisa todos os dados clínicos                            │
│ - Verifica disponibilidade de vagas                         │
│ - Define ou confirma data de agendamento                     │
│ - Adiciona observações (opcional)                            │
│ - Aprova ou Rejeita                                          │
│                                                              │
│ Se APROVADO:                                                 │
│   - Status: "aprovado"                                       │
│   - data_agendamento_calculada definida                      │
│   - aprovado_por e aprovado_em registrados                   │
│   - Notificação enviada ao médico criador                    │
│                                                              │
│ Se REJEITADO:                                                │
│   - Status: "rejeitado"                                      │
│   - observacoes_aprovacao (justificativa obrigatória)        │
│   - Notificação enviada ao médico criador                    │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ↓
┌──────────────────────────────────────────────────────────────┐
│ ETAPA 3: Paciente é atendida na data agendada               │
├──────────────────────────────────────────────────────────────┤
│ - Médico de maternidade visualiza agendamento                │
│ - Informações disponíveis para equipe clínica                │
│ - Histórico completo registrado                              │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 Workflow de Registro de Usuário

```
┌──────────────────────────────────────────────────────────────┐
│ ETAPA 1: Usuário solicita cadastro                          │
├──────────────────────────────────────────────────────────────┤
│ - Preenche formulário de registro                            │
│ - Aceita termos de uso e política de privacidade            │
│ - Senha mínima: 8 caracteres                                │
│ - Profile criado com status: "pendente"                      │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ↓
┌──────────────────────────────────────────────────────────────┐
│ ETAPA 2: Admin Médico aprova usuário                        │
├──────────────────────────────────────────────────────────────┤
│ - Revisa dados do usuário                                    │
│ - Atribui role apropriado                                    │
│ - Se medico_maternidade, define maternidade                  │
│ - Status: "ativo"                                            │
│ - Registro em user_roles criado                              │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ↓
┌──────────────────────────────────────────────────────────────┐
│ ETAPA 3: Usuário acessa sistema                             │
├──────────────────────────────────────────────────────────────┤
│ - Login com email/senha                                      │
│ - JWT gerado                                                 │
│ - Roles carregadas do user_roles                             │
│ - Roteamento baseado em permissões                           │
└──────────────────────────────────────────────────────────────┘
```

### 4.3 Workflow de Notificações em Tempo Real

```
TRIGGER → INSERT/UPDATE agendamento
    ↓
Database Function (create_agendamento_notification)
    ↓
INSERT notificacoes (tipo, mensagem)
    ↓
Supabase Realtime (WebSocket)
    ↓
Frontend (useRealtimeNotifications hook)
    ↓
┌─────────────────────────────────────┐
│ • Som de notificação                │
│ • Vibração (mobile)                 │
│ • Badge com contador                │
│ • Animação pulsante (urgente)       │
│ • Toast notification                │
└─────────────────────────────────────┘
```

---

## 5. ARQUITETURA DE SEGURANÇA

### 5.1 Modelo de Segurança em 3 Camadas

#### **Camada 1: Client-Side (UX Layer)**
**Propósito:** Experiência do usuário, NÃO é barreira de segurança

```typescript
// ProtectedRoute.tsx
if (requireAdmin && !isAdmin()) {
  return <Navigate to="/" replace />;
}
```

**Características:**
- ⚠️ Pode ser bypassado (console, DevTools)
- ✅ Melhora UX escondendo opções não permitidas
- ❌ **NUNCA** confiar apenas nesta camada

#### **Camada 2: Row-Level Security (PRINCIPAL)**
**Propósito:** Segurança real, imposição no banco de dados

```sql
-- Exemplo: Médicos só veem seus próprios agendamentos
CREATE POLICY "Usuários podem ler seus próprios agendamentos"
ON agendamentos_obst FOR SELECT
USING (created_by = auth.uid());

-- Exemplo: Admins veem tudo
CREATE POLICY "Admins podem ler todos os agendamentos"
ON agendamentos_obst FOR SELECT
USING (has_role(auth.uid(), 'admin'));
```

**Características:**
- ✅ **IMPOSSÍVEL** de bypassar
- ✅ Aplicada em TODA consulta SQL
- ✅ Protege contra acesso direto ao banco
- ✅ Garante isolamento de dados

**Funções de Segurança:**

```sql
-- Verifica se usuário tem role específico
CREATE FUNCTION has_role(_user_id uuid, _role app_role)
RETURNS boolean
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Verifica acesso a maternidade
CREATE FUNCTION has_maternidade_access(_user_id uuid, _maternidade text)
RETURNS boolean
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id 
      AND role = 'medico_maternidade'
      AND maternidade = _maternidade
  )
$$;
```

#### **Camada 3: Edge Functions (Server-Side)**
**Propósito:** Validação adicional em operações sensíveis

```typescript
// Edge Function com verificação JWT
serve(async (req) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const token = authHeader.replace('Bearer ', '');
  const { data: { user } } = await supabaseClient.auth.getUser(token);
  
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Lógica da função
});
```

**Características:**
- ✅ Validação server-side
- ✅ Impossível de bypassar
- ✅ Útil para lógica complexa
- ✅ Integração com APIs externas

### 5.2 Políticas RLS Implementadas

#### **agendamentos_obst**

| Operação | Política | Condição |
|----------|----------|----------|
| SELECT | Usuários veem próprios | `created_by = auth.uid()` |
| SELECT | Admins veem todos | `has_role(auth.uid(), 'admin')` |
| SELECT | Admin_med veem todos | `is_admin_med(auth.uid())` |
| SELECT | Medico_maternidade vê aprovados da sua unidade | `has_maternidade_access() AND status = 'aprovado'` |
| INSERT | Usuários autenticados podem criar | `created_by = auth.uid()` |
| UPDATE | Apenas admins e admin_med | `has_role(auth.uid(), 'admin') OR is_admin_med()` |
| DELETE | Ninguém pode deletar | - |

#### **profiles**

| Operação | Política | Condição |
|----------|----------|----------|
| SELECT | Usuários veem próprio perfil | `id = auth.uid()` |
| SELECT | Admins veem todos | `has_role(auth.uid(), 'admin')` |
| UPDATE | Usuários atualizam próprio | `id = auth.uid()` |
| UPDATE | Admins atualizam todos | `has_role(auth.uid(), 'admin')` |

#### **user_roles**

| Operação | Política | Condição |
|----------|----------|----------|
| SELECT | Usuários veem próprias roles | `user_id = auth.uid()` |
| SELECT | Admins veem todas | `has_role(auth.uid(), 'admin')` |
| INSERT | Apenas admins | `has_role(auth.uid(), 'admin')` |
| UPDATE | Apenas admins | `has_role(auth.uid(), 'admin')` |
| DELETE | Apenas admins | `has_role(auth.uid(), 'admin')` |

### 5.3 Proteções Contra Ataques Comuns

| Ataque | Proteção | Status |
|--------|----------|--------|
| **SQL Injection** | Supabase client usa prepared statements | ✅ Protegido |
| **Escalação de Privilégios** | user_roles separado, SECURITY DEFINER | ✅ Protegido |
| **Acesso Direto ao DB** | RLS em todas as tabelas | ✅ Protegido |
| **XSS** | React escapa HTML automaticamente | ✅ Protegido |
| **CSRF** | JWT em headers, SameSite cookies | ✅ Protegido |
| **Bypass de Auth** | Políticas RLS + JWT obrigatório | ✅ Protegido |
| **Enumeração de Usuários** | Mensagens genéricas de erro | ✅ Protegido |

---

## 6. CONFORMIDADE COM LGPD

### 6.1 Dados Sensíveis Tratados

**Artigo 11 - Dados de Saúde:**
- Idade gestacional
- Data da última menstruação (DUM)
- Ultrassonografias
- Diagnósticos maternos (hipertensão, diabetes, etc.)
- Diagnósticos fetais
- História obstétrica
- Medicações em uso
- Necessidades especiais (UTI, reserva de sangue)

### 6.2 Princípios Implementados

| Princípio | Implementação | Status |
|-----------|---------------|--------|
| **Finalidade** | Dados usados apenas para agendamentos obstétricos | ✅ |
| **Adequação** | Coleta mínima necessária | ✅ |
| **Necessidade** | Apenas campos essenciais | ✅ |
| **Livre Acesso** | Usuários veem seus próprios dados | ✅ |
| **Qualidade dos Dados** | Validações em tempo real | ✅ |
| **Transparência** | Termos de uso e política de privacidade | ✅ |
| **Segurança** | RLS + JWT + Criptografia | ✅ |
| **Prevenção** | Logs de auditoria + histórico | ✅ |
| **Não Discriminação** | Acesso igual para todos os usuários | ✅ |
| **Responsabilização** | Logs completos de acesso e alterações | ✅ |

### 6.3 Direitos dos Titulares

| Direito | Implementação | Status |
|---------|---------------|--------|
| **Acesso** | Usuários visualizam seus próprios dados | ✅ Implementado |
| **Correção** | Usuários podem editar agendamentos pendentes | ✅ Implementado |
| **Anonimização** | - | 🔄 A implementar |
| **Portabilidade** | Exportação de relatórios | ✅ Implementado |
| **Eliminação** | - | 🔄 A implementar |
| **Informação** | Política de privacidade acessível | ✅ Implementado |
| **Revogação** | - | 🔄 A implementar |

### 6.4 Medidas Técnicas de Proteção

**Criptografia:**
- ✅ TLS 1.3 em trânsito (HTTPS)
- ✅ AES-256 em repouso (Supabase)
- ✅ Senhas com bcrypt

**Auditoria:**
- ✅ Tabela `audit_logs` registra todas as operações
- ✅ Tabela `agendamentos_historico` rastreia alterações
- ✅ IP e User-Agent registrados
- ✅ Timestamps de todas as ações

**Controle de Acesso:**
- ✅ RLS granular por tabela
- ✅ Princípio do menor privilégio
- ✅ Separação de roles críticos

**DPO Responsável:**
- Email: dpo@hapvida.com.br

---

## 7. FUNCIONALIDADES PRINCIPAIS

### 7.1 Autenticação e Autorização

**Recursos:**
- ✅ Cadastro com email/senha
- ✅ Login com validação de credenciais
- ✅ Recuperação de senha
- ✅ Aprovação de novos usuários por admin
- ✅ Gestão de roles (4 tipos)
- ✅ Solicitação de acesso especial
- ✅ Termos de uso e política de privacidade obrigatórios

**Requisitos de Senha:**
- Mínimo 8 caracteres
- Caracteres diversos recomendados

### 7.2 Gestão de Agendamentos

**Formulário de 6 Etapas:**

1. **Dados da Paciente**
   - Nome completo, carteirinha, telefones
   - Data de nascimento, email

2. **Dados Obstétricos**
   - DUM (confiável/não confiável)
   - USG mais recente (semanas + dias)
   - História obstétrica (G-P-C-A)

3. **Diagnósticos Clínicos**
   - Diagnósticos maternos (múltipla escolha)
   - Diagnósticos fetais (múltipla escolha)
   - Medicações em uso

4. **Procedimento**
   - Tipo de procedimento (múltipla escolha)
   - Indicação do procedimento
   - IG pretendida

5. **Necessidades Especiais**
   - Reserva de sangue (sim/não)
   - UTI materna (sim/não)
   - Placenta prévia (sim/não)

6. **Unidade e Confirmação**
   - Centro clínico
   - Médico responsável
   - Maternidade
   - Observações adicionais

**Cálculos Automáticos:**
- ✅ Idade Gestacional (IG) atual baseada em DUM ou USG
- ✅ Data sugerida de agendamento baseada em IG pretendida
- ✅ Validação de protocolo obstétrico (48 regras)
- ✅ Verificação de capacidade de vagas

### 7.3 Dashboard e Métricas

**Métricas Principais:**
- 📊 Total de agendamentos
- 📊 Pendentes de aprovação
- 📊 Aprovados este mês
- 📊 Taxa de aprovação

**Gráficos:**
- 📈 Agendamentos por status (Pie Chart)
- 📈 Agendamentos por maternidade (Bar Chart)
- 📈 Tendência mensal (Line Chart)
- 📈 Distribuição por idade gestacional (Bar Chart)

**Filtros:**
- Por período (últimos 7, 30, 90 dias)
- Por maternidade
- Por status
- Por médico (para admin)

### 7.4 Sistema de Notificações em Tempo Real

**Tecnologia:** Supabase Realtime (WebSocket)

**Eventos Notificados:**
- 🔔 Novo agendamento criado
- 🔔 Agendamento urgente (≤7 dias)
- 🔔 Agendamento aprovado
- 🔔 Agendamento rejeitado
- 🔔 Status alterado

**Recursos:**
- ✅ Som de notificação customizado
- ✅ Vibração (dispositivos móveis)
- ✅ Badge com contador de não lidas
- ✅ Animação pulsante para urgentes
- ✅ Toast notification no canto da tela
- ✅ Histórico de notificações
- ✅ Marcar como lida

### 7.5 Calendário de Ocupação

**Visualizações:**
- 📅 Mensal - Visão geral do mês
- 📅 Semanal - Detalhes por semana
- 📅 Diária - Agendamentos do dia

**Indicadores:**
- 🟢 Verde - Vagas disponíveis
- 🟡 Amarelo - Capacidade média
- 🔴 Vermelho - Capacidade máxima atingida

**Controle de Capacidade:**
- Vagas por dia útil: 3
- Vagas sábado: 1
- Vagas domingo: 0
- Máximo dia: 10
- Máximo semana: 50

### 7.6 Gestão de Usuários (Admin)

**Funcionalidades:**
- ✅ Listar todos os usuários
- ✅ Filtrar por status/role
- ✅ Aprovar/rejeitar novos usuários
- ✅ Atribuir e revogar roles
- ✅ Definir maternidade (para medico_maternidade)
- ✅ Suspender/reativar usuários
- ✅ Visualizar histórico de ações

### 7.7 Logs de Auditoria

**Informações Registradas:**
- 🔍 Usuário que realizou a ação
- 🔍 Timestamp exato
- 🔍 Tabela afetada
- 🔍 Tipo de ação (INSERT/UPDATE/DELETE)
- 🔍 Dados anteriores (JSON)
- 🔍 Dados novos (JSON)
- 🔍 IP Address
- 🔍 User Agent

**Filtros Disponíveis:**
- Por usuário
- Por tabela
- Por tipo de ação
- Por período

### 7.8 Histórico de Alterações

**Por Agendamento:**
- 📝 Criação inicial
- 📝 Todas as alterações de campos
- 📝 Mudanças de status
- 📝 Aprovações/rejeições
- 📝 Quem alterou e quando

### 7.9 Importação de Dados

**Formatos Suportados:**
- ✅ CSV
- ✅ Excel (.xlsx)

**Funcionalidades:**
- ✅ Importação em lote de agendamentos
- ✅ Validação de dados na importação
- ✅ Mapeamento automático de campos
- ✅ Relatório de erros
- ✅ Preview antes da importação

### 7.10 FAQ (Perguntas Frequentes)

**Categorias:**
- Sistema
- Agendamentos
- Permissões
- Técnicas

**Gestão (Admin):**
- ✅ Criar/editar/deletar perguntas
- ✅ Organizar por ordem
- ✅ Ativar/desativar itens
- ✅ Categorização

---

## 8. EDGE FUNCTIONS (Serverless)

### 8.1 create-default-users

**Finalidade:** Criar usuários padrão do sistema

**Segurança:** `verify_jwt = true`

**Parâmetros:**
```typescript
{
  users: Array<{
    email: string;
    password: string;
    nome_completo: string;
    roles: app_role[];
    maternidade?: string;
  }>
}
```

### 8.2 import-csv

**Finalidade:** Importar agendamentos via CSV

**Segurança:** `verify_jwt = true`

**Validações:**
- Campos obrigatórios
- Formato de datas
- Diagnósticos válidos
- Maternidades existentes

### 8.3 corrigir-paridade

**Finalidade:** Corrigir dados obstétricos (G-P-C-A)

**Segurança:** `verify_jwt = true`

**Lógica:**
```
G = P + C + A
```

### 8.4 importar-csv-lote

**Finalidade:** Importação massiva de dados

**Segurança:** `verify_jwt = true`

**Recursos:**
- Processamento em chunks
- Validação individual
- Rollback em erros críticos

---

## 9. DEPLOYMENT E INFRAESTRUTURA

### 9.1 Estratégia de Deploy

**Frontend:**
- Plataforma: Vercel / Netlify
- Build: `npm run build`
- Domínio: Custom domain (configurável)
- CDN: Global
- SSL: Automático

**Backend:**
- Plataforma: Lovable Cloud (Supabase)
- Região: Configurável
- Auto-scaling: Sim
- Backup: Automático diário

### 9.2 Variáveis de Ambiente

```env
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=[anon-key]
VITE_SUPABASE_PROJECT_ID=[project-id]
```

### 9.3 CI/CD

**Processo Automático:**
1. Push para branch `main`
2. Build automático (Vercel)
3. Testes de build
4. Deploy para produção
5. Invalidação de cache CDN

**Edge Functions:**
- Deploy automático ao salvar
- Sem necessidade de build manual

### 9.4 Monitoramento

**Métricas Disponíveis:**
- 📊 Requisições por minuto
- 📊 Tempo de resposta (p50, p95, p99)
- 📊 Taxa de erro
- 📊 Uso de banda
- 📊 Conexões ao banco
- 📊 Tamanho do banco de dados

**Logs:**
- Application logs (Frontend)
- Database logs (PostgreSQL)
- Edge function logs (Deno)
- Auth logs (Supabase Auth)

---

## 10. LIMITAÇÕES CONHECIDAS

### 10.1 Limitações Atuais

| Funcionalidade | Status | Impacto |
|----------------|--------|---------|
| **Anexos de arquivos** | ❌ Não implementado | Médio |
| **Emails automáticos** | ❌ Não implementado | Médio |
| **App mobile nativo** | ❌ Não implementado | Baixo (PWA funciona) |
| **Integração HIS/RIS** | ❌ Não implementado | Alto |
| **Impressão de relatórios** | 🔄 Parcial (apenas tela) | Médio |
| **Exportação PDF** | ❌ Não implementado | Médio |
| **Backup manual** | ❌ Não implementado | Baixo (automático existe) |

### 10.2 Limitações Técnicas

- **WebSocket:** Requer conexão estável (falha em redes instáveis)
- **Browser Support:** Chrome 90+, Firefox 88+, Safari 14+
- **Mobile:** PWA, não app nativo
- **Offline:** Não suporta modo offline
- **Concorrência:** Otimista (last-write-wins)

---

## 11. ROADMAP

### 11.1 Curto Prazo (0-3 meses)

- [ ] **Sistema de anexos de arquivos**
  - Upload de exames
  - Visualização de imagens
  - Storage seguro

- [ ] **Emails automáticos**
  - Notificação de aprovação/rejeição
  - Lembretes de agendamento
  - Recuperação de senha aprimorada

- [ ] **Exportação PDF**
  - Relatórios de agendamentos
  - Comprovantes
  - Histórico médico

- [ ] **Melhorias de UX**
  - Tutorial interativo
  - Tooltips contextuais
  - Atalhos de teclado

### 11.2 Médio Prazo (3-6 meses)

- [ ] **App Mobile Nativo**
  - iOS (Swift)
  - Android (Kotlin)
  - Push notifications nativas

- [ ] **Integração WhatsApp Business**
  - Notificações via WhatsApp
  - Confirmação de agendamentos
  - Lembretes automáticos

- [ ] **Dashboard Avançado**
  - Machine Learning para predição de vagas
  - Análise de tendências
  - Alertas inteligentes

- [ ] **Módulo de Protocolos**
  - Biblioteca de protocolos obstétricos
  - Sugestões baseadas em diagnóstico
  - Atualização de guidelines

### 11.3 Longo Prazo (6-12 meses)

- [ ] **Integração HIS/RIS**
  - Importação automática de dados
  - Sincronização bidirecional
  - Padrão HL7/FHIR

- [ ] **IA para Sugestões**
  - Análise de risco obstétrico
  - Sugestão de data ótima
  - Detecção de anomalias

- [ ] **Multi-tenancy**
  - Suporte para múltiplas organizações
  - Isolamento completo de dados
  - Customização por tenant

- [ ] **API Pública**
  - REST API documentada
  - SDK para integrações
  - Webhooks

---

## 12. REQUISITOS DE INFRAESTRUTURA

### 12.1 Requisitos Mínimos

**Cliente (Browser):**
- Chrome 90+ / Firefox 88+ / Safari 14+
- JavaScript habilitado
- Cookies habilitados
- Conexão internet (mínimo 1 Mbps)

**Servidor (Lovable Cloud):**
- Provisionamento automático
- Escalabilidade automática
- Backup diário automático

### 12.2 Recomendações

**Para Melhor Performance:**
- Conexão mínima: 5 Mbps
- RAM livre: 2 GB+
- Tela: 1366x768 ou superior
- Navegador atualizado

---

## 13. CUSTOS ESTIMADOS

### 13.1 Lovable Cloud (Backend)

| Recurso | Uso Estimado | Custo Mensal |
|---------|--------------|--------------|
| **Database Storage** | 10 GB | Incluído no plano |
| **Bandwidth** | 100 GB | Incluído no plano |
| **Edge Function Invocations** | 500k/mês | Incluído no plano |
| **Authentication** | 10k MAU | Incluído no plano |

**Plano Recomendado:** Pro ($25/mês) ou Team ($599/mês para equipe)

### 13.2 Frontend Hosting (Vercel)

| Item | Custo |
|------|-------|
| **Hosting** | Grátis (Hobby) ou $20/mês (Pro) |
| **Bandwidth** | 100 GB inclusos |
| **Builds** | Ilimitados |

---

## 14. SUPORTE E MANUTENÇÃO

### 14.1 Canais de Suporte

**Interno:**
- Email: suporte-gestaforms@hapvida.com.br
- Chat interno (admin)
- FAQ integrado

**Externo (Lovable Cloud):**
- Documentação: docs.lovable.dev
- Discord: Lovable Community
- Email: support@lovable.dev

### 14.2 Manutenção Preventiva

**Diária:**
- ✅ Backup automático do banco de dados
- ✅ Monitoramento de performance
- ✅ Verificação de logs de erro

**Semanal:**
- 🔄 Revisão de notificações não lidas
- 🔄 Limpeza de sessões expiradas
- 🔄 Análise de métricas de uso

**Mensal:**
- 🔄 Atualização de dependências
- 🔄 Revisão de políticas RLS
- 🔄 Auditoria de segurança
- 🔄 Análise de performance

**Trimestral:**
- 🔄 Revisão de roadmap
- 🔄 Testes de segurança
- 🔄 Avaliação de satisfação

---

## 15. CONCLUSÃO

O **GestaForms Hub** representa uma solução moderna, segura e escalável para a gestão de agendamentos obstétricos na Hapvida. Com arquitetura robusta em 3 camadas de segurança, conformidade com LGPD e funcionalidades em tempo real, o sistema está preparado para atender as necessidades atuais e futuras da organização.

### Principais Destaques

✅ **Segurança:** RLS + JWT + Auditoria completa  
✅ **Conformidade:** LGPD compliance  
✅ **Escalabilidade:** Auto-scaling na infraestrutura  
✅ **Usabilidade:** Interface moderna e intuitiva  
✅ **Rastreabilidade:** Histórico completo de alterações  
✅ **Tempo Real:** Notificações WebSocket  
✅ **Métricas:** Dashboard completo com gráficos  

### Próximos Passos Recomendados

1. **Treinamento de Usuários** - Workshop de 2h para cada perfil
2. **Documentação de Processos** - Manual operacional interno
3. **Monitoramento Ativo** - Dashboard de KPIs
4. **Feedback Contínuo** - Canal de sugestões
5. **Roadmap de Evolução** - Implementação gradual das melhorias

---

**Documento Gerado em:** 19 de Novembro de 2025  
**Versão:** 1.0  
**Contato Técnico:** dpo@hapvida.com.br  
**Suporte:** suporte-gestaforms@hapvida.com.br

---

*Este documento é confidencial e destinado exclusivamente ao Setor de TI e Diretoria da Hapvida.*