# Sistema de Autenticação e Autorização - GESTAForms Hub

## Visão Geral

O sistema utiliza **Supabase** para autenticação e controle de acesso baseado em roles (RBAC - Role-Based Access Control).

## Configuração do Supabase

### Variáveis de Ambiente

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_publica
```

### Fallback de Configuração

O sistema possui fallback robusto para as credenciais do Supabase, garantindo que:
- O build não quebre mesmo sem variáveis de ambiente
- O runtime trata graciosamente a falta de configuração
- Logs informativos são gerados quando a configuração está faltando

**Arquivo:** `src/lib/supabase.ts`

## Roles de Usuário

### Tipos de Perfil

1. **admin** - Administrador do sistema
   - Acesso total a todas as funcionalidades
   - Gerenciamento de usuários
   - Importação e processamento de dados
   - Logs de auditoria
   - Aprovação de usuários

2. **admin_med** - Administrador Médico
   - Aprovação de agendamentos
   - Aprovação de novos usuários
   - Importação de pacientes pendentes
   - Visualização de dados médicos

3. **medico_unidade** - Médico da Unidade
   - Criação de novos agendamentos
   - Visualização de seus próprios agendamentos
   - Acesso a protocolos obstétricos

4. **medico_maternidade** - Médico da Maternidade
   - Visualização de agendamentos da sua maternidade
   - Acesso específico baseado em maternidade

### Hierarquia de Permissões

```
admin (acesso completo)
  └── admin_med (acesso médico + aprovações)
        └── medico_unidade (criação de agendamentos)
        └── medico_maternidade (visualização por maternidade)
```

## Autenticação

### Context Provider

**Arquivo:** `src/contexts/AuthContext.tsx`

O `AuthContext` fornece:
- Estado do usuário autenticado
- Sessão ativa
- Roles do usuário
- Funções de autenticação (login, cadastro, logout)
- Funções de verificação de permissões

### Métodos Disponíveis

```typescript
// Login
signIn(email: string, password: string): Promise<{ error: Error | null }>

// Cadastro
signUp(email: string, password: string, nomeCompleto: string): Promise<{ error: Error | null }>

// Logout
signOut(): Promise<void>

// Verificações de permissão
isAdmin(): boolean
isAdminMed(): boolean
isMedicoUnidade(): boolean
isMedicoMaternidade(): boolean

// Obter maternidades com acesso
getMaternidadesAcesso(): string[]
```

### Tratamento de Erros

Todos os métodos de autenticação incluem:
- Try-catch para captura de exceções
- Toast notifications para feedback ao usuário
- Limpeza de estado local em caso de erro
- Mensagens em português

## Proteção de Rotas

### ProtectedRoute Component

**Arquivo:** `src/components/ProtectedRoute.tsx`

Componente wrapper para proteger rotas baseado em permissões:

```tsx
<ProtectedRoute requireAdmin>
  <AdminPage />
</ProtectedRoute>

<ProtectedRoute requireAdminMed>
  <AprovacaoPage />
</ProtectedRoute>
```

### Props Disponíveis

- `requireAdmin` - Requer role de admin
- `requireAdminMed` - Requer role de admin_med (ou admin)
- `requireMedicoUnidade` - Requer role de medico_unidade (ou admin)
- `requireMedicoMaternidade` - Requer role de medico_maternidade (ou admin)

### Comportamento

1. Usuário não autenticado → Redireciona para `/auth`
2. Usuário sem permissão → Redireciona para `/` + mostra toast de erro
3. Usuário autorizado → Renderiza o componente filho

**Nota:** O role `admin` sempre tem acesso a todas as rotas protegidas.

## Menu e Navegação

### Componente AppLayout

**Arquivo:** `src/components/AppLayout.tsx`

O menu lateral exibe itens baseado nas permissões do usuário:

#### Itens Principais (todos os usuários)
- Início
- Listagem de Agendamentos (Dashboard)
- Sistema de Ocupação

#### Seção de Agendamentos (todos os usuários)
- Novo Agendamento
- Meus Agendamentos

#### Seção de Administração (admin e admin_med)
- Aprovações Médicas (admin_med)
- Aprovações de Usuários (admin e admin_med)
- Importações diversas (admin)
- Gerenciar Usuários (admin)
- Logs de Auditoria (admin)

#### Seção de Ajuda (todos os usuários)
- Guia do Sistema
- FAQ
- **Protocolos** (modal com protocolos obstétricos)
- **Contato** (link direto para email de suporte)
- Sobre o Sistema

## Helpers de Autorização

### Arquivo de Utilitários

**Arquivo:** `src/utils/authHelpers.ts`

Funções auxiliares para verificação de permissões:

```typescript
hasAdminRole(userRoles): boolean
hasAdminMedRole(userRoles): boolean
hasMedicoUnidadeRole(userRoles): boolean
hasMedicoMaternidadeRole(userRoles): boolean
getUserMaternidades(userRoles): string[]
canAccessAdminFeatures(userRoles): boolean
canAccessAdminMedFeatures(userRoles): boolean
getHighestPriorityRole(userRoles): UserRole | null
```

## Fluxo de Acesso

### 1. Cadastro de Usuário
1. Usuário acessa `/auth`
2. Preenche formulário de cadastro
3. Escolhe tipo de acesso desejado
4. Justifica a solicitação
5. Aceita termos e política de privacidade
6. Sistema envia email de confirmação
7. Status inicial: **pendente aprovação**

### 2. Aprovação de Acesso
1. Admin acessa `/aprovacoes-usuarios`
2. Revisa solicitação
3. Define role apropriado
4. Aprova ou rejeita
5. Usuário recebe notificação

### 3. Login
1. Usuário acessa `/auth`
2. Insere credenciais
3. Sistema valida
4. Busca roles do usuário
5. Redireciona para dashboard
6. Menu adaptado às permissões

### 4. Sessão
- Sessão persiste em localStorage
- Auto-refresh de token habilitado
- Detecção de sessão em URL
- Logout limpa todos os dados

## Segurança

### Boas Práticas Implementadas

1. **Senha Forte**
   - Mínimo 8 caracteres
   - Letras maiúsculas e minúsculas
   - Números e caracteres especiais
   - Indicador visual de força

2. **Fallback Seguro**
   - Validação de configuração do Supabase
   - Logs de erro informativos
   - Sem exposição de credenciais

3. **Verificação Dupla**
   - Proteção no frontend (UX)
   - Proteção no backend via RLS do Supabase
   - Row Level Security (RLS) nas tabelas

4. **Tratamento de Erros**
   - Captura de todas as exceções
   - Mensagens amigáveis ao usuário
   - Logs detalhados para debug

## Sincronização com pgs-procedimentos

Este documento reflete o sistema de autenticação sincronizado com as melhorias implementadas no repositório `pgs-procedimentos-1fdf3be0` até 20/11/2025, incluindo:

- ✅ Menu responsivo com hamburger
- ✅ Links dinâmicos para Dashboard, Protocolos e Contato
- ✅ Proteção consolidada de rotas admin/admin_med
- ✅ Fallback robusto do Supabase
- ✅ Tratamento de erros de autenticação
- ✅ Nomenclatura padronizada do sistema

## Manutenção

### Adicionar Nova Role

1. Atualizar tipo `UserRole` em `AuthContext.tsx`
2. Adicionar método `is[NovaRole]()` no context
3. Atualizar `ProtectedRoute` com nova prop
4. Criar helper em `authHelpers.ts`
5. Atualizar documentação

### Adicionar Nova Rota Protegida

1. Adicionar rota em `App.tsx`
2. Envolver com `ProtectedRoute` e especificar permissão
3. Adicionar item no menu em `AppLayout.tsx` (se necessário)
4. Aplicar filtro de visibilidade baseado em role

---

**Última atualização:** 20/11/2025  
**Responsável:** Sistema de sincronização com pgs-procedimentos-1fdf3be0
