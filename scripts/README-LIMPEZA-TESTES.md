# 🧹 Limpeza e Testes do Banco de Dados

## 📚 Documentação Completa

Este diretório contém scripts e guias para limpar o banco de dados e testar as funcionalidades de agendamento.

---

## 📁 Arquivos Disponíveis

### **Scripts SQL**

1. **`limpar-agendamentos.sql`**
   - Limpeza COM backup
   - Recomendado para produção
   - Cria tabelas de backup antes de limpar

2. **`limpar-agendamentos-simples.sql`**
   - Limpeza SEM backup
   - Recomendado para desenvolvimento/teste
   - Mais rápido e direto

3. **`verificar-banco.sql`**
   - Verificação rápida do estado do banco
   - Conta registros por status
   - Mostra últimos agendamentos

### **Guias em Markdown**

1. **`GUIA-LIMPEZA-BANCO.md`** ⭐
   - Guia completo passo a passo
   - Instruções detalhadas
   - Troubleshooting
   - Checklist de testes

2. **`DADOS-TESTE.md`** ⭐
   - Dados prontos para teste
   - 4 pacientes de exemplo
   - Dados para formulário
   - Dados para importação (TSV)
   - Cenários de teste

3. **`README-LIMPEZA-TESTES.md`** (este arquivo)
   - Índice geral
   - Visão geral do processo

---

## 🚀 Início Rápido

### **Passo 1: Limpar o Banco**

**Opção A - Sem Backup (Desenvolvimento):**
```sql
-- Cole no Supabase SQL Editor
DELETE FROM agendamentos_historico;
DELETE FROM agendamentos_obst;
```

**Opção B - Com Backup (Produção):**
```sql
-- Veja o arquivo: limpar-agendamentos.sql
```

### **Passo 2: Verificar Limpeza**
```sql
-- Cole no Supabase SQL Editor
SELECT 
  (SELECT COUNT(*) FROM agendamentos_obst) as total_agendamentos,
  (SELECT COUNT(*) FROM agendamentos_historico) as total_historico;
-- Resultado esperado: 0, 0
```

### **Passo 3: Testar Via Formulário**
1. Acesse: `/novo-agendamento`
2. Use dados de: `DADOS-TESTE.md` → Paciente 1
3. Submeta o formulário
4. Verifique no banco

### **Passo 4: Testar Via Importação**
1. Acesse: `/importar-tabela`
2. Cole dados TSV de: `DADOS-TESTE.md`
3. Clique "Processar Dados"
4. Clique "Salvar no Banco"
5. Clique "Exportar Excel"

---

## 📋 Fluxo Completo de Teste

```
┌─────────────────────────────────────────┐
│  1. LIMPAR BANCO DE DADOS               │
│     - Executar script SQL               │
│     - Verificar limpeza                 │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  2. TESTAR VIA FORMULÁRIO               │
│     - Acessar /novo-agendamento         │
│     - Preencher dados                   │
│     - Submeter                          │
│     - Verificar no banco                │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  3. TESTAR VIA IMPORTAÇÃO               │
│     - Acessar /importar-tabela          │
│     - Colar dados TSV                   │
│     - Processar                         │
│     - Salvar                            │
│     - Exportar Excel                    │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  4. VERIFICAR RESULTADOS                │
│     - Contar registros                  │
│     - Verificar cálculos                │
│     - Verificar campo data_pedido       │
│     - Testar aprovações                 │
└─────────────────────────────────────────┘
```

---

## 🎯 Objetivos dos Testes

### **Via Formulário (`/novo-agendamento`)**
- ✅ Validar entrada de dados manual
- ✅ Testar cálculo de IG em tempo real
- ✅ Verificar sugestão de data agendada
- ✅ Validar campos obrigatórios
- ✅ Testar diferentes cenários (DUM confiável, incerta, etc)

### **Via Importação (`/importar-tabela`)**
- ✅ Validar importação em lote
- ✅ Testar processamento de múltiplos registros
- ✅ Verificar campo **data_pedido** (NOVO!)
- ✅ Testar cálculo de IG na data do pedido
- ✅ Validar exportação Excel profissional
- ✅ Verificar filtros e ordenação

---

## 📊 Tabelas Afetadas

### **`agendamentos_obst`**
- Tabela principal de agendamentos
- Contém todos os dados da paciente
- Inclui campo **data_pedido** (novo)
- Status: pendente, aprovado, rejeitado

### **`agendamentos_historico`**
- Histórico de alterações
- Auditoria de mudanças
- Relacionado via foreign key

---

## ⚠️ Avisos Importantes

### **Antes de Limpar:**
- ⚠️ Todos os agendamentos serão removidos
- ⚠️ Todo o histórico será removido
- ✅ Usuários NÃO serão afetados
- ✅ Configurações NÃO serão afetadas

### **Ordem de Execução:**
```sql
-- SEMPRE nesta ordem:
DELETE FROM agendamentos_historico;  -- 1º (filho)
DELETE FROM agendamentos_obst;       -- 2º (pai)
```

### **Backup Recomendado:**
- ✅ Ambiente de produção: SEMPRE fazer backup
- ✅ Ambiente de desenvolvimento: Opcional
- ✅ Dados de teste: Não necessário

---

## 🔍 Verificações Pós-Teste

### **Verificar Agendamentos Criados:**
```sql
SELECT 
  id,
  nome_completo,
  carteirinha,
  maternidade,
  data_pedido,  -- NOVO CAMPO
  data_agendamento_calculada,
  idade_gestacional_calculada,
  status,
  created_at
FROM agendamentos_obst 
ORDER BY created_at DESC 
LIMIT 10;
```

### **Verificar Campo data_pedido:**
```sql
SELECT 
  nome_completo,
  data_pedido,
  idade_gestacional_calculada,
  CASE 
    WHEN data_pedido IS NOT NULL THEN 'IG calculada na data do pedido'
    ELSE 'IG calculada hoje'
  END as tipo_calculo
FROM agendamentos_obst 
ORDER BY created_at DESC;
```

### **Verificar Estatísticas:**
```sql
SELECT 
  status,
  COUNT(*) as total,
  COUNT(CASE WHEN data_pedido IS NOT NULL THEN 1 END) as com_data_pedido
FROM agendamentos_obst 
GROUP BY status;
```

---

## 📝 Checklist Completo

### **Preparação:**
- [ ] Ler `GUIA-LIMPEZA-BANCO.md`
- [ ] Ler `DADOS-TESTE.md`
- [ ] Acessar Supabase Dashboard
- [ ] Abrir SQL Editor

### **Limpeza:**
- [ ] Executar script de limpeza
- [ ] Verificar resultado (0 registros)
- [ ] Confirmar backup (se aplicável)

### **Teste Via Formulário:**
- [ ] Acessar `/novo-agendamento`
- [ ] Preencher Paciente 1 (Maria Silva)
- [ ] Submeter formulário
- [ ] Verificar no banco
- [ ] Verificar status "pendente"

### **Teste Via Importação:**
- [ ] Acessar `/importar-tabela`
- [ ] Colar dados TSV (3 pacientes)
- [ ] Clicar "Processar Dados"
- [ ] Verificar cálculos
- [ ] Clicar "Salvar no Banco"
- [ ] Verificar confirmação
- [ ] Clicar "Exportar Excel"
- [ ] Abrir arquivo Excel
- [ ] Verificar formatação

### **Verificações:**
- [ ] Contar total de registros
- [ ] Verificar campo data_pedido
- [ ] Verificar cálculos de IG
- [ ] Verificar datas agendadas
- [ ] Testar aprovações

---

## 🆘 Troubleshooting

### **Erro: "violates foreign key constraint"**
```sql
-- Solução: Deletar na ordem correta
DELETE FROM agendamentos_historico;  -- Primeiro
DELETE FROM agendamentos_obst;       -- Depois
```

### **Campo data_pedido não existe**
```sql
-- Aplicar migration primeiro
ALTER TABLE agendamentos_obst 
ADD COLUMN IF NOT EXISTS data_pedido DATE;
```

### **Exportação Excel não funciona**
- Verificar se há registros válidos/salvos
- Verificar console do navegador (F12)
- Verificar se biblioteca XLSX está carregada

---

## 📞 Suporte

### **Documentação:**
- `GUIA-LIMPEZA-BANCO.md` - Guia completo
- `DADOS-TESTE.md` - Dados prontos
- `README.md` (raiz) - Documentação geral

### **Scripts:**
- `limpar-agendamentos.sql` - Limpeza com backup
- `limpar-agendamentos-simples.sql` - Limpeza rápida
- `verificar-banco.sql` - Verificação

---

## 🎉 Resultado Esperado

Após completar todos os testes:

✅ Banco de dados limpo
✅ 4+ agendamentos criados (1 via formulário, 3+ via importação)
✅ Campo data_pedido funcionando
✅ Cálculos de IG corretos
✅ Exportação Excel profissional
✅ Validações funcionando
✅ Sistema pronto para uso

---

**Última atualização:** 30/11/2024
**Versão:** 1.0
