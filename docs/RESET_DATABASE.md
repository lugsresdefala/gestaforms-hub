# Reset do Banco de Dados - GestaForms Hub

Este documento descreve como usar o script de reset do banco de dados para limpar agendamentos e logs.

## ⚠️ ATENÇÃO

**Esta operação é DESTRUTIVA e IRREVERSÍVEL!**

O script deleta PERMANENTEMENTE:
- ✅ TODOS os registros de `agendamentos_obst`
- ✅ TODOS os registros de `audit_logs`

O script PRESERVA:
- ✅ Usuários e papéis (`user_roles`)
- ✅ Capacidades das maternidades (`capacidade_maternidades`)
- ✅ FAQ e outras configurações

---

## Quando Usar

### ✅ Use para:
- Limpar ambiente de testes antes de uma nova bateria de testes
- Remover dados de demonstração antes de ir para produção
- Resetar banco após importações incorretas em massa
- Preparar ambiente para treinamento

### ❌ NÃO use para:
- Remover alguns agendamentos específicos (use a interface)
- Produção com dados reais de pacientes
- Qualquer ambiente sem backup

---

## Pré-Requisitos

### 1. Variáveis de Ambiente

Configure as seguintes variáveis de ambiente:

```bash
# URL do projeto Supabase
export SUPABASE_URL="https://seu-projeto.supabase.co"

# Chave de serviço (com permissões de admin)
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIs..."
```

**Alternativamente**, use o prefixo `VITE_`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_SERVICE_ROLE_KEY`

### 2. Dependências

Certifique-se de ter `tsx` instalado:

```bash
npm install
```

---

## Comandos

### Modo Dry-Run (Simulação)

Simula a operação SEM deletar nada:

```bash
npx tsx scripts/resetDatabase.ts
```

**Saída esperada:**
```
==================================================
🧹 RESET DO BANCO DE DADOS - GestaForms Hub
==================================================

ℹ️  Modo DRY-RUN: Nenhum dado será deletado.
   Use --confirm para executar a operação de verdade.

📊 Estado Atual:

   - Agendamentos: 159
   - Logs de Auditoria: 423

🔍 DRY-RUN: Operação simulada.

Para executar de verdade, rode:
   npx tsx scripts/resetDatabase.ts --confirm
```

### Modo Execução Real

Deleta TODOS os dados de agendamentos e logs:

```bash
npx tsx scripts/resetDatabase.ts --confirm
```

**Saída esperada:**
```
==================================================
🧹 RESET DO BANCO DE DADOS - GestaForms Hub
==================================================

⚠️  ATENÇÃO: Esta operação é DESTRUTIVA!
   Todos os agendamentos e logs serão PERMANENTEMENTE deletados.

📊 Estado Atual:

   - Agendamentos: 159
   - Logs de Auditoria: 423

❓ Confirme para prosseguir: --confirm detectado

🗑️  Deletando registros...

   ✅ 159 agendamentos deletados
   ✅ 423 logs deletados

📊 Estado Final:

   - Agendamentos: 0
   - Logs de Auditoria: 0

✅ Reset concluído com sucesso!

📋 Resumo:
   - Agendamentos deletados: 159
   - Logs deletados: 423
   - Usuários: PRESERVADOS
   - Capacidades: PRESERVADAS
   - FAQ: PRESERVADO
   - Configurações: PRESERVADAS
```

---

## Checklist Pós-Reset

Após executar o reset, verifique:

### No Sistema
- [ ] Dashboard mostra 0 agendamentos
- [ ] Lista de agendamentos está vazia
- [ ] Calendário de ocupação está vazio
- [ ] Logs de auditoria estão vazios

### No Supabase Dashboard
- [ ] Tabela `agendamentos_obst` tem 0 registros
- [ ] Tabela `audit_logs` tem 0 registros (se existir)

### Dados Preservados
- [ ] Usuários ainda podem fazer login
- [ ] Capacidades das maternidades estão configuradas
- [ ] FAQ está disponível

---

## Troubleshooting

### Erro: Variáveis de ambiente não configuradas

```
❌ ERRO: Variáveis de ambiente não configuradas!

Configure as seguintes variáveis de ambiente:
  - SUPABASE_URL (ou VITE_SUPABASE_URL)
  - SUPABASE_SERVICE_ROLE_KEY (ou VITE_SUPABASE_SERVICE_ROLE_KEY)
```

**Solução:** Configure as variáveis de ambiente conforme descrito acima.

### Erro: Permissão negada

```
❌ ERRO: Erro ao deletar agendamentos: permission denied
```

**Solução:** Verifique se está usando a `SERVICE_ROLE_KEY` (não a chave anônima).

### Erro: Tabela não encontrada

```
ℹ️  Tabela audit_logs não encontrada ou vazia
```

**Isso é normal** se a tabela `audit_logs` não existe no seu projeto.

---

## Segurança

### Recomendações

1. **NUNCA** execute em produção sem backup
2. **NUNCA** comite a `SERVICE_ROLE_KEY` no código
3. Use arquivos `.env` locais (já está no `.gitignore`)
4. Confirme o ambiente antes de executar

### Verificar Ambiente

Antes de executar, confirme que está no ambiente correto:

```bash
echo $SUPABASE_URL
# Deve mostrar a URL do ambiente desejado (dev/staging)
```

---

## Estrutura do Script

```
scripts/resetDatabase.ts
├── Verifica argumentos (--confirm)
├── Carrega variáveis de ambiente
├── Conecta ao Supabase (service role)
├── Conta registros atuais
├── [dry-run] Exibe contagem e sai
├── [confirm] Deleta agendamentos_obst
├── [confirm] Deleta audit_logs (se existir)
├── Verifica estado final
└── Exibe resumo
```

---

## Referências

- Script: `scripts/resetDatabase.ts`
- Dependência: `@supabase/supabase-js`
- Tabelas afetadas:
  - `agendamentos_obst` (deletada)
  - `audit_logs` (deletada, se existir)
- Tabelas preservadas:
  - `user_roles`
  - `capacidade_maternidades`
  - `faq`
  - Todas as outras
