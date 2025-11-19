# RELATÓRIO TÉCNICO COMPLETO - GESTAFORMS HUB

## 1. IDENTIFICAÇÃO DO SISTEMA

**Nome:** GestaForms Hub - Sistema de Gestão de Agendamentos Obstétricos  
**Versão:** 1.0  
**Ambiente:** Produção  
**Data:** 19 de Novembro de 2025  
**Proprietário:** Hapvida  

---

## 2. ARQUITETURA TÉCNICA

### Frontend
- React 18.3.1 + TypeScript
- Vite 6.x
- Tailwind CSS + Shadcn/ui
- React Router DOM 6.30.1

### Backend
- Lovable Cloud (Supabase)
- PostgreSQL 15+
- Deno Edge Functions
- Supabase Realtime (WebSocket)

### Segurança
- Row-Level Security (RLS)
- JWT Authentication
- SECURITY DEFINER Functions

---

## 3. MODELO DE DADOS

### Tabelas Principais

**agendamentos_obst** (41 campos)
- Dados da paciente, clínicos, IG, diagnósticos, aprovação

**profiles**
- Perfis de usuários

**user_roles** (SEPARADA - segurança)
- Controle de permissões por role

**capacidade_maternidades**
- Limites de vagas

**notificacoes** (Realtime habilitado)
- Sistema de notificações WebSocket

**solicitacoes_acesso**
- Pedidos de acesso

**agendamentos_historico**
- Auditoria de alterações

**audit_logs**
- Logs completos do sistema

---

## 4. ROLES E PERMISSÕES

### Admin
- ✅ Acesso total ao sistema
- ✅ Gerenciar usuários e roles
- ✅ Configurar capacidades
- ✅ Todas as rotas

### Admin Médico (admin_med)
- ✅ Aprovar/rejeitar agendamentos
- ✅ Aprovar usuários
- ✅ Visualizar todos agendamentos
- ✅ Gerenciar roles

### Médico de Unidade (medico_unidade)
- ✅ Criar agendamentos (status: pendente)
- ✅ Ver próprios agendamentos
- ❌ Não pode aprovar

### Médico de Maternidade (medico_maternidade)
- ✅ Ver agendamentos aprovados da sua maternidade
- ❌ Acesso filtrado por maternidade

---

## 5. ARQUITETURA DE SEGURANÇA (3 CAMADAS)

### Camada 1: Client-Side (UX)
- React Context API
- ProtectedRoute component
- ⚠️ Pode ser bypassado (apenas UX)

### Camada 2: RLS (PRINCIPAL)
- Políticas PostgreSQL
- ✅ Impossível bypassar
- Funções: has_role(), has_maternidade_access(), is_admin_med()

### Camada 3: Edge Functions
- Validação server-side
- verify_jwt = true
- ✅ Impossível bypassar

---

## 6. FUNCIONALIDADES

- **Autenticação**: Email/senha, recuperação
- **Agendamentos**: Formulário 6 etapas, cálculo automático IG
- **Aprovações**: Workflow pendente → aprovado/rejeitado
- **Notificações**: Realtime com som, vibração, animações
- **Dashboard**: Métricas e gráficos
- **Calendário**: Ocupação por maternidade
- **Gestão Usuários**: Aprovação e atribuição de roles
- **Importação**: CSV/Excel
- **FAQ**: Sistema de perguntas
- **Auditoria**: Logs completos

---

## 7. LGPD E PROTEÇÃO DE DADOS

### Dados Sensíveis
- Dados de saúde (Art. 11 LGPD)
- Diagnósticos, IG, medicações

### Medidas de Segurança
- RLS em todas tabelas
- Criptografia em trânsito e repouso
- Logs de auditoria
- Histórico de alterações

### Direitos Implementados
- ✅ Acesso aos dados
- ✅ Correção
- ✅ Portabilidade
- 🔄 Eliminação (a implementar)

**DPO:** dpo@hapvida.com.br

---

## 8. EDGE FUNCTIONS

1. **create-default-users**: Criar usuários padrão
2. **import-csv**: Importar agendamentos
3. **corrigir-paridade**: Corrigir dados obstétricos
4. **importar-csv-lote**: Importação em lote

Todas com `verify_jwt = true`

---

## 9. NOTIFICAÇÕES REALTIME

**Tecnologia:** Supabase Realtime (WebSocket)

**Recursos:**
- 🔔 Som de notificação
- 📳 Vibração
- 🎨 Animações
- 🔴 Badge contador
- ⚡ Alertas urgentes

**Implementação:**
```sql
ALTER TABLE notificacoes REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE notificacoes;
```

---

## 10. DEPLOYMENT

**Frontend:** Vercel/Netlify
**Backend:** Lovable Cloud
**Build:** `npm run build`

### Variáveis de Ambiente
```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_PROJECT_ID
```

---

## 11. LIMITAÇÕES

- ❌ Sem anexos de arquivos
- ❌ Sem e-mails automáticos
- ❌ Sem app mobile nativo
- ❌ Sem integração HIS/RIS

---

## 12. ROADMAP

### Curto Prazo
- [ ] Sistema de anexos
- [ ] E-mails automáticos
- [ ] Exportação PDF

### Médio Prazo
- [ ] App mobile
- [ ] Integração WhatsApp
- [ ] Dashboard avançado

### Longo Prazo
- [ ] Integração HIS/RIS
- [ ] IA para sugestões
- [ ] Multi-tenancy

---

**Documento completo gerado em:** 19/11/2025
