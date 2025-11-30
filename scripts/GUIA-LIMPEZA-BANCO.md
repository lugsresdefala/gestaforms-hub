# 🗑️ Guia de Limpeza do Banco de Dados - Agendamentos

## 📋 Objetivo
Limpar todos os agendamentos do banco de dados para reiniciar testes das duas vias de inclusão:
1. **Via Formulário**: `/novo-agendamento`
2. **Via Importação**: `/importar-tabela`

---

## ⚠️ IMPORTANTE - Leia Antes de Executar

### **Dados Serão Perdidos:**
- ✅ Todos os agendamentos serão removidos
- ✅ Todo o histórico de alterações será removido
- ❌ Usuários NÃO serão afetados
- ❌ Configurações NÃO serão afetadas

### **Quando Usar:**
- ✅ Ambiente de desenvolvimento/teste
- ✅ Dados de teste que podem ser descartados
- ❌ Ambiente de produção com dados reais

---

## 🚀 Opção 1: Limpeza Simples (Recomendada para Testes)

### **Passo a Passo:**

1. **Acesse o Supabase Dashboard**
   - URL: [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Faça login
   - Selecione seu projeto

2. **Abra o SQL Editor**
   - Menu lateral → **SQL Editor**
   - Clique em **New Query**

3. **Cole o Script de Limpeza Simples**
   ```sql
   -- Limpar histórico primeiro (devido à foreign key)
   DELETE FROM agendamentos_historico;

   -- Limpar agendamentos
   DELETE FROM agendamentos_obst;

   -- Verificar resultado
   SELECT 
     (SELECT COUNT(*) FROM agendamentos_obst) as total_agendamentos,
     (SELECT COUNT(*) FROM agendamentos_historico) as total_historico;
   ```

4. **Execute o Script**
   - Clique em **Run** (ou pressione Ctrl+Enter)
   - Aguarde a execução

5. **Verifique o Resultado**
   - Você deve ver: `total_agendamentos: 0` e `total_historico: 0`
   - ✅ Limpeza concluída!

---

## 💾 Opção 2: Limpeza com Backup (Recomendada para Produção)

### **Passo a Passo:**

1. **Acesse o Supabase Dashboard**
   - URL: [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Faça login
   - Selecione seu projeto

2. **Abra o SQL Editor**
   - Menu lateral → **SQL Editor**
   - Clique em **New Query**

3. **Cole o Script de Backup e Limpeza**
   ```sql
   -- PASSO 1: CRIAR BACKUP
   CREATE TABLE IF NOT EXISTS agendamentos_obst_backup_20241130 AS 
   SELECT * FROM agendamentos_obst;

   CREATE TABLE IF NOT EXISTS agendamentos_historico_backup_20241130 AS 
   SELECT * FROM agendamentos_historico;

   -- Verificar backup
   SELECT 
     (SELECT COUNT(*) FROM agendamentos_obst_backup_20241130) as backup_agendamentos,
     (SELECT COUNT(*) FROM agendamentos_historico_backup_20241130) as backup_historico;

   -- PASSO 2: LIMPAR TABELAS
   DELETE FROM agendamentos_historico;
   DELETE FROM agendamentos_obst;

   -- Verificar limpeza
   SELECT 
     (SELECT COUNT(*) FROM agendamentos_obst) as total_agendamentos,
     (SELECT COUNT(*) FROM agendamentos_historico) as total_historico;
   ```

4. **Execute o Script**
   - Clique em **Run**
   - Aguarde a execução

5. **Verifique o Resultado**
   - Primeira query: Mostra quantos registros foram copiados para backup
   - Segunda query: Deve mostrar 0 em ambas as tabelas
   - ✅ Backup criado e limpeza concluída!

### **Para Restaurar o Backup (se necessário):**
```sql
-- Restaurar agendamentos
INSERT INTO agendamentos_obst 
SELECT * FROM agendamentos_obst_backup_20241130;

-- Restaurar histórico
INSERT INTO agendamentos_historico 
SELECT * FROM agendamentos_historico_backup_20241130;
```

### **Para Remover o Backup (após confirmar):**
```sql
DROP TABLE agendamentos_obst_backup_20241130;
DROP TABLE agendamentos_historico_backup_20241130;
```

---

## 🧪 Após a Limpeza - Testar as Duas Vias

### **Via 1: Novo Agendamento (Formulário)**

1. **Acesse a aplicação**
   - URL: [https://8080-019ad07e-de42-72e0-8db4-59094a3f35a5.us-east-1-01.gitpod.dev/novo-agendamento](https://8080-019ad07e-de42-72e0-8db4-59094a3f35a5.us-east-1-01.gitpod.dev/novo-agendamento)

2. **Preencha o formulário**
   - Dados da paciente
   - Dados obstétricos
   - Procedimentos
   - Diagnósticos

3. **Submeta o formulário**
   - Clique em "Salvar Agendamento"
   - Aguarde confirmação

4. **Verifique no banco**
   ```sql
   SELECT * FROM agendamentos_obst ORDER BY created_at DESC LIMIT 5;
   ```

### **Via 2: Importar por Tabela**

1. **Acesse a página de importação**
   - URL: [https://8080-019ad07e-de42-72e0-8db4-59094a3f35a5.us-east-1-01.gitpod.dev/importar-tabela](https://8080-019ad07e-de42-72e0-8db4-59094a3f35a5.us-east-1-01.gitpod.dev/importar-tabela)

2. **Prepare dados de teste**
   - Cole dados do Excel (Ctrl+V)
   - Ou preencha manualmente algumas linhas

3. **Processe os dados**
   - Clique em "Processar Dados"
   - Aguarde cálculos

4. **Salve no banco**
   - Clique em "Salvar no Banco"
   - Aguarde confirmação

5. **Verifique no banco**
   ```sql
   SELECT * FROM agendamentos_obst ORDER BY created_at DESC LIMIT 5;
   ```

---

## 📊 Verificações Recomendadas

### **Antes da Limpeza:**
```sql
-- Contar registros atuais
SELECT 
  (SELECT COUNT(*) FROM agendamentos_obst) as total_agendamentos,
  (SELECT COUNT(*) FROM agendamentos_historico) as total_historico,
  (SELECT COUNT(*) FROM agendamentos_obst WHERE status = 'pendente') as pendentes,
  (SELECT COUNT(*) FROM agendamentos_obst WHERE status = 'aprovado') as aprovados;
```

### **Após a Limpeza:**
```sql
-- Verificar se está vazio
SELECT 
  (SELECT COUNT(*) FROM agendamentos_obst) as total_agendamentos,
  (SELECT COUNT(*) FROM agendamentos_historico) as total_historico;
-- Resultado esperado: 0, 0
```

### **Após Testes:**
```sql
-- Verificar novos registros
SELECT 
  id,
  nome_completo,
  carteirinha,
  maternidade,
  data_agendamento_calculada,
  status,
  created_at,
  data_pedido  -- Nova coluna!
FROM agendamentos_obst 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 🔍 Troubleshooting

### **Erro: "violates foreign key constraint"**
**Causa:** Tentou deletar agendamentos antes do histórico

**Solução:** Execute na ordem correta:
```sql
DELETE FROM agendamentos_historico;  -- Primeiro
DELETE FROM agendamentos_obst;       -- Depois
```

### **Erro: "permission denied"**
**Causa:** Usuário sem permissão para deletar

**Solução:** 
- Verifique se está usando a chave de serviço (service_role_key)
- Ou execute via SQL Editor do Supabase Dashboard

### **Backup não criado**
**Causa:** Tabela de backup já existe

**Solução:**
```sql
-- Remover backup antigo primeiro
DROP TABLE IF EXISTS agendamentos_obst_backup_20241130;
DROP TABLE IF EXISTS agendamentos_historico_backup_20241130;

-- Depois criar novo backup
CREATE TABLE agendamentos_obst_backup_20241130 AS 
SELECT * FROM agendamentos_obst;
```

---

## 📝 Checklist de Teste

Após limpar o banco, teste:

- [ ] **Via Formulário**
  - [ ] Criar novo agendamento
  - [ ] Verificar cálculo de IG
  - [ ] Verificar data agendada
  - [ ] Verificar campo data_pedido (se preenchido)
  - [ ] Verificar status "pendente"

- [ ] **Via Importação**
  - [ ] Colar dados do Excel
  - [ ] Processar dados
  - [ ] Verificar cálculos
  - [ ] Salvar no banco
  - [ ] Exportar Excel
  - [ ] Verificar campo data_pedido

- [ ] **Aprovações**
  - [ ] Ver agendamentos pendentes
  - [ ] Aprovar um agendamento
  - [ ] Verificar campos obrigatórios
  - [ ] Verificar alertas de validação

---

## 🎯 Resultado Esperado

Após executar a limpeza e os testes:

✅ Banco de dados limpo
✅ Novos agendamentos criados via formulário
✅ Novos agendamentos importados via tabela
✅ Campo `data_pedido` funcionando
✅ Cálculos de IG corretos
✅ Exportação Excel funcionando

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do Supabase
2. Verifique o console do navegador (F12)
3. Verifique se a migration `data_pedido` foi aplicada

---

**Última atualização:** 30/11/2024
