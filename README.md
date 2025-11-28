# Welcome to your Lovable project

## Project info

**URL**: [https://lovable.dev/projects/eed564ff-47e6-49d6-853c-b745c0fc6b35](https://lovable.dev/projects/eed564ff-47e6-49d6-853c-b745c0fc6b35)

## Gestaforms Hub - Sistema de Gestão de Procedimentos Obstétricos

Sistema integrado para gestão de agendamentos e procedimentos obstétricos do Programa Gestação Segura da Hapvida NotreDame.

### Documentação Complementar

* [Protocolo de validação de algoritmos e workflows](PROTOCOLO_VALIDACAO_WORKFLOWS.md): diretrizes para modelagem, auditoria e observabilidade de regras e fluxos críticos.

### Principais Funcionalidades

#### Páginas Principais

* **Dashboard**: Listagem completa de agendamentos com filtros avançados
* **Protocolos**: Consulta de protocolos obstétricos (PT-AON-097) organizados por categoria
* **Contato**: Formulário de contato e informações de suporte

#### Gestão de Agendamentos

* Novo agendamento com validação completa
* Visualização de agendamentos próprios
* Sistema de aprovações médicas (admin_med)
* Edição de agendamentos existentes

#### Administração

* Aprovação de usuários (admin)
* Gerenciamento de usuários e permissões (admin)
* Importação de dados e calendários (admin)
* Logs de auditoria (admin)

### Scripts de Exportação

#### Exportar Agendamentos Mensais

Script para gerar planilhas XLSX com agendamentos aprovados, organizados por maternidade e mês.

```bash
# Usando npm (busca dados do Supabase)
npm run export:agendamentos-mensais

# Ou diretamente
node scripts/export-agendamentos-mensais.js

# Usando um arquivo CSV como fonte de dados
node scripts/export-agendamentos-mensais.js --csv caminho/para/arquivo.csv
```

**Características:**

* Exporta agendamentos com status "aprovado"
* Agrupa por maternidade (Guarulhos, NotreCare, Salvalus, Cruzeiro)
* Período: Novembro/2025 a Janeiro/2026
* Formatação Excel com cabeçalhos estilizados
* Datas no formato DD/MM/YYYY
* Arrays JSON convertidos para texto legível
* Ordenação por data e nome da paciente

**Arquivos gerados:**

* `exports/agendamentos_[Maternidade]_[Mês]_[Ano].xlsx`

**Colunas exportadas:**

* Dados da paciente (carteirinha, nome, nascimento, contatos)
* Dados obstétricos (gestações, partos, DUM, USG, IG)
* Procedimento (tipo, indicação, data agendada, maternidade)
* Diagnósticos (maternos, fetais, medicação)
* UTI e reservas de sangue
* Observações e metadados

### Exportação de Calendários de Agendamentos

O sistema inclui um script para gerar calendários visuais de agendamentos em formato Excel (.xlsx), organizados por maternidade e mês.

#### Como usar

```bash
# Executar a exportação de calendários
npm run export:calendario
```

#### O que é gerado

O script gera arquivos Excel (.xlsx) na pasta `exports/` com:

1. **Aba CALENDÁRIO**: Visualização mensal estilo calendário

   * Grid de 7 colunas (Domingo a Sábado)
   * Células coloridas por quantidade de agendamentos:

     * Branco: 0 agendamentos
     * Verde claro: 1-2 agendamentos
     * Amarelo claro: 3-4 agendamentos
     * Laranja claro: 5-7 agendamentos
     * Vermelho claro: 8+ agendamentos
   * Comentários com lista de pacientes em cada dia
   * Estatísticas no rodapé

2. **Aba DETALHES DOS AGENDAMENTOS**: Lista completa com todos os dados

   * Data, carteirinha, nome, telefones
   * IG calculada, procedimentos, indicação
   * Diagnósticos maternos e fetais
   * Filtros automáticos habilitados

#### Arquivos gerados

```
exports/
├── calendario_Guarulhos_Novembro_2025.xlsx
├── calendario_Guarulhos_Dezembro_2025.xlsx
├── calendario_Guarulhos_Janeiro_2026.xlsx
├── calendario_NotreCare_Novembro_2025.xlsx
├── calendario_NotreCare_Dezembro_2025.xlsx
├── calendario_NotreCare_Janeiro_2026.xlsx
├── calendario_Salvalus_Novembro_2025.xlsx
├── calendario_Salvalus_Dezembro_2025.xlsx
├── calendario_Salvalus_Janeiro_2026.xlsx
├── calendario_Cruzeiro_Novembro_2025.xlsx
├── calendario_Cruzeiro_Dezembro_2025.xlsx
└── calendario_Cruzeiro_Janeiro_2026.xlsx
```

#### Requisitos

O script utiliza dados do arquivo CSV em `public/csv-temp/fluxo_novo_2025_CONSOLIDADO.csv`.

### Controle de Acesso e Permissões

O sistema utiliza um modelo de controle de acesso baseado em roles (funções):

#### Roles Disponíveis

1. **admin**: Acesso completo ao sistema

   * Todas as funcionalidades de outros roles
   * Gerenciamento de usuários
   * Importação de dados
   * Logs de auditoria
   * Configurações do sistema

2. **admin_med**: Administrador médico

   * Aprovação de agendamentos
   * Importação de pacientes pendentes
   * Visualização de dados médicos
   * Aprovação de usuários

3. **medico_unidade**: Médico da unidade

   * Acesso a funcionalidades específicas da unidade

4. **medico_maternidade**: Médico de maternidade

   * Acesso restrito a maternidades específicas

#### Proteção de Rotas

As rotas são protegidas pelo componente `ProtectedRoute` que verifica:

* Autenticação do usuário
* Permissões baseadas em role
* Redirecionamento para página de login com retorno automático
* Mensagens de erro amigáveis para acesso negado

#### Helpers de Autorização

O arquivo `src/lib/authHelpers.ts` fornece funções utilitárias para:

* Verificação de roles (`hasAnyRole`, `hasAllRoles`)
* Hooks React para permissões (`useCanAccessAdmin`, `useCanAccessAdminMed`)
* Definições centralizadas de permissões por rota
* Verificação de acesso a rotas específicas

### Configuração do Supabase

O sistema utiliza Supabase para autenticação e banco de dados:

```typescript
// Configuração com fallback automático
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'default_url';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'default_key';
```

#### Segurança

* Validação de configuração na inicialização
* Validação de formato de URL
* Helpers para uso seguro: `getSupabaseClient()`, `isSupabaseConfigured()`
* Logs de erro para problemas de configuração

### Layout e Navegação

#### Sidebar (Menu Lateral)

* **Principal**: Início, Listagem de Agendamentos, Sistema de Ocupação
* **Agendamentos**: Novo, Meus
* **Administração**: Baseado em permissões (admin/admin_med)
* **Ajuda**: Protocolos, Guia, FAQ, Sobre, Contato

#### Características da Navegação

* Menu colapsável (hamburger menu via SidebarTrigger)
* Links dinâmicos baseados em permissões
* Indicador visual de página ativa
* Responsivo para mobile

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/eed564ff-47e6-49d6-853c-b745c0fc6b35) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

* Navigate to the desired file(s).
* Click the "Edit" button (pencil icon) at the top right of the file view.
* Make your changes and commit the changes.

**Use GitHub Codespaces**

* Navigate to the main page of your repository.
* Click on the "Code" button (green button) near the top right.
* Select the "Codespaces" tab.
* Click on "New codespace" to launch a new Codespace environment.
* Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

* Vite
* TypeScript
* React
* shadcn-ui
* Tailwind CSS
* Supabase (Authentication & Database)
* React Router (Navigation)
* TanStack Query (Data fetching)

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/eed564ff-47e6-49d6-853c-b745c0fc6b35) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
