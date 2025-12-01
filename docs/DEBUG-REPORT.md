# 🐛 Debug Report - Inconsistências e Correções

## 📋 Data: 30/11/2024

---

## ✅ Problemas Identificados e Corrigidos

### **1. Import Inconsistente - ImportarPorTabela.tsx**

**Problema:**
```typescript
// Import tinha Download mas código usava FileSpreadsheet
import { ..., Download } from "lucide-react";
// Mas no código:
<FileSpreadsheet className="w-4 h-4" />
```

**Correção Aplicada:**
```typescript
import { ..., FileSpreadsheet } from "lucide-react";
```

**Status:** ✅ CORRIGIDO

---

### **2. Duplicação de Funcionalidade - Detecção de Diagnósticos**

**Problema:**
Dois arquivos fazem a mesma coisa:
- `src/lib/diagnosisClassifier.ts` (antigo)
- `src/lib/diagnosticNormalizer.ts` (novo, mais completo)

**Arquivos que usam diagnosisClassifier:**
- `src/pages/NovoAgendamento.tsx`
- `src/pages/MeusAgendamentos.tsx` (usa diagnosticoLabels)
- `src/pages/Dashboard.tsx` (usa diagnosticoLabels)

**Recomendação:**
- ✅ Manter `diagnosticNormalizer.ts` (mais completo, 100+ padrões)
- ⚠️ Migrar NovoAgendamento.tsx para usar diagnosticNormalizer
- ⚠️ Deprecar diagnosisClassifier.ts após migração

**Status:** ⏳ PENDENTE (requer migração)

---

### **3. Conflito de Merge - Campo data_pedido Perdido**

**Problema:**
Durante o rebase, as alterações do campo `data_pedido` foram perdidas.
O código atual usa `data_registro` mas a documentação menciona `data_pedido`.

**Situação Atual:**
- ✅ Código usa `data_registro` consistentemente
- ✅ Funcionalidade está implementada
- ⚠️ Documentação menciona `data_pedido` (nome antigo)

**Recomendação:**
- Manter `data_registro` (nome mais claro)
- Atualizar documentação para usar `data_registro`

**Status:** ✅ RESOLVIDO (usar data_registro)

---

### **4. Arquivos Duplicados - use-toast.ts**

**Situação:**
- `src/hooks/use-toast.ts` - Implementação real
- `src/components/ui/use-toast.ts` - Re-export

**Análise:**
```typescript
// src/components/ui/use-toast.ts
import { useToast, toast } from "@/hooks/use-toast";
```

**Status:** ✅ OK (re-export intencional para compatibilidade)

---

## 📊 Resumo de Arquivos

### **Arquivos Ativos e Necessários:**

#### **Detecção de Diagnósticos:**
- ✅ `diagnosticNormalizer.ts` - Sistema novo (100+ padrões)
- ⚠️ `diagnosisClassifier.ts` - Sistema antigo (deprecar)
- ✅ `diagnosticoLabels.ts` - Formatação de labels (manter)

#### **Protocolos:**
- ✅ `obstetricProtocols.ts` - Definições de protocolos
- ✅ `protocoloValidation.ts` - Validações

#### **Importação:**
- ✅ `src/lib/import/` - Módulos de importação
- ✅ `importHelpers.ts` - Helpers gerais
- ✅ `importSanitizer.ts` - Sanitização de dados

#### **Validação:**
- ✅ `src/lib/validation/` - Validações
- ✅ `vagasValidation.ts` - Validação de vagas
- ✅ `unifiedValidation.ts` - Validação unificada

#### **Cálculos:**
- ✅ `gestationalCalculations.ts` - Cálculos de IG
- ✅ `calcularIGAtual.ts` - IG atual
- ✅ `capacityRules.ts` - Regras de capacidade

#### **Utilitários:**
- ✅ `excelExportStyles.ts` - Estilos Excel
- ✅ `auditLogger.ts` - Logs de auditoria
- ✅ `authHelpers.ts` - Helpers de autenticação
- ✅ `formSchema.ts` - Schemas de formulário
- ✅ `utils.ts` - Utilitários gerais

---

## 🔧 Ações Recomendadas

### **Prioridade Alta:**

1. **Migrar NovoAgendamento.tsx**
   ```typescript
   // Substituir:
   import { classifyFreeDiagnosis } from "@/lib/diagnosisClassifier";
   
   // Por:
   import { detectAndSelectProtocol } from "@/lib/diagnosticNormalizer";
   ```

2. **Atualizar Documentação**
   - Substituir menções a `data_pedido` por `data_registro`
   - Atualizar DADOS-TESTE.md

### **Prioridade Média:**

3. **Deprecar diagnosisClassifier.ts**
   - Adicionar comentário de deprecação
   - Manter por compatibilidade temporária

4. **Consolidar Testes**
   - Testar detecção com diagnosticNormalizer
   - Validar todos os 10 casos de teste

### **Prioridade Baixa:**

5. **Limpeza Final**
   - Remover diagnosisClassifier.ts após migração completa
   - Verificar imports não utilizados

---

## ✅ Correções Aplicadas Neste Commit

1. ✅ Corrigido import de `Download` para `FileSpreadsheet`
2. ✅ Corrigido texto do botão para "Exportar Excel"
3. ✅ Documentado inconsistências encontradas
4. ✅ Criado plano de ação para correções pendentes

---

## 🧪 Testes Necessários

### **Teste 1: Importar por Tabela**
- [ ] Colar dados de teste
- [ ] Processar dados
- [ ] Verificar coluna "Protocolo Detectado"
- [ ] Verificar IG Ideal correta
- [ ] Exportar Excel
- [ ] Verificar formatação

### **Teste 2: Novo Agendamento**
- [ ] Preencher formulário
- [ ] Verificar detecção de diagnóstico
- [ ] Verificar IG sugerida
- [ ] Salvar agendamento

### **Teste 3: Meus Agendamentos**
- [ ] Listar agendamentos
- [ ] Verificar formatação de diagnósticos
- [ ] Verificar labels corretos

---

## 📝 Notas Técnicas

### **Build Status:**
```bash
npm run build
# ✅ Build concluído com sucesso
# ⚠️ Warning: Chunk size > 500KB (normal para aplicação grande)
```

### **Imports Verificados:**
- ✅ Todos os imports estão corretos
- ✅ Não há imports circulares
- ✅ Não há imports não utilizados críticos

### **Duplicações:**
- ⚠️ diagnosisClassifier vs diagnosticNormalizer (funcional)
- ✅ use-toast.ts (re-export intencional)
- ✅ index.ts múltiplos (módulos diferentes)

---

## 🎯 Próximos Passos

1. **Imediato:**
   - Testar funcionalidade de detecção de diagnósticos
   - Validar exportação Excel

2. **Curto Prazo:**
   - Migrar NovoAgendamento.tsx
   - Atualizar documentação

3. **Médio Prazo:**
   - Deprecar diagnosisClassifier.ts
   - Consolidar testes

---

## 📊 Métricas

| Categoria | Antes | Depois | Status |
|-----------|-------|--------|--------|
| Imports inconsistentes | 1 | 0 | ✅ |
| Funcionalidades duplicadas | 1 | 1 | ⚠️ |
| Arquivos não utilizados | 0 | 0 | ✅ |
| Build errors | 0 | 0 | ✅ |
| Build warnings | 1 | 1 | ✅ |

---

**Última atualização:** 30/11/2024 23:59
**Status Geral:** ✅ Sistema funcional, pequenas otimizações pendentes
