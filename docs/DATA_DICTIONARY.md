# Dicionário de Dados - GestaForms Hub

Este documento descreve os campos utilizados no sistema GestaForms Hub para gerenciamento de agendamentos obstétricos.

## Campos de Agendamento

### Campos Básicos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único do agendamento |
| `nome_completo` | String | Nome completo da paciente |
| `carteirinha` | String | Número da carteirinha do convênio |
| `data_nascimento` | Date | Data de nascimento da paciente |
| `maternidade` | String | Nome da maternidade (Guarulhos, NotreCare, Salvalus, Cruzeiro) |
| `status` | Enum | Status do agendamento (pendente, aprovado, rejeitado) |

### Campos de Idade Gestacional

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `data_dum` | Date | Data da Última Menstruação |
| `dum_status` | String | Status da DUM (Sim - Confiavel, Incerta, Não sabe) |
| `data_primeiro_usg` | Date | Data do primeiro ultrassom |
| `semanas_usg` | Number | Semanas de gestação no momento do USG |
| `dias_usg` | Number | Dias adicionais (0-6) no momento do USG |
| `idade_gestacional_calculada` | String | IG calculada em formato "X semanas e Y dias" |

### Campos de Agendamento Calculado

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `igIdeal` | String | Idade gestacional ideal para o parto conforme protocolo, formato "39s2d" |
| `igNaDataAgendada` | String | IG projetada na data do agendamento, formato "39s2d" |
| `data_agendamento_calculada` | Date | Data calculada para o agendamento |
| `data_agendada_editavel` | Date | Data agendada editável manualmente pelo usuário (sobrescreve o cálculo automático) |
| `intervaloDias` | Number | Diferença em dias entre data agendada e data ideal (positivo = após ideal) |
| `leadTimeDias` | Number | Dias entre a data de referência (hoje) e a data agendada |
| `statusAgendamento` | Enum | Status do cálculo: `calculado`, `needs_review`, `manual` |

## Status de Agendamento

### `calculado`
A data foi calculada automaticamente pelo sistema respeitando todas as regras:
- Não é domingo
- Respeita capacidade da maternidade
- Lead time mínimo de 10 dias
- Dentro da janela IG permitida pelo protocolo

### `needs_review`
O sistema não conseguiu encontrar uma data válida automaticamente. Requer análise manual. Possíveis causas:
- Todas as datas na janela estão sem vagas
- Lead time não pode ser satisfeito dentro da margem do protocolo
- Data ideal cai em período com restrições

### `manual`
A data foi definida manualmente por um usuário, não calculada automaticamente.

## Capacidade por Maternidade

| Maternidade | Segunda-Sexta | Sábado | Domingo |
|-------------|---------------|--------|---------|
| Guarulhos | 2 | 1 | 0 |
| NotreCare | 6 | 2 | 0 |
| Salvalus | 9 | 7 | 0 |
| Cruzeiro | 3 | 1 | 0 |

## Regras de Cálculo

### Intervalo (intervaloDias)
- **Verde** (|dif| ≤ margem): Dentro da tolerância do protocolo
- **Amarelo** (|dif| ≤ margem × 2): Fora da tolerância, mas aceitável
- **Vermelho** (|dif| > margem × 2): Significativamente fora da tolerância

### Lead Time (leadTimeDias)
- **Verde** (≥ 10 dias): Antecedência adequada
- **Vermelho** (< 10 dias): Antecedência insuficiente, requer atenção

## Protocolos

Os protocolos obstétricos definem a IG ideal e margem de tolerância para cada condição clínica. Consulte `obstetricProtocols.ts` para a lista completa de protocolos disponíveis.

### Exemplo de Protocolo
```typescript
{
  igIdeal: "39",      // 39 semanas
  margemDias: 7,      // +/- 7 dias de tolerância
  prioridade: 3,      // 1 = crítica, 2 = alta, 3 = normal
  viaPreferencial: "Cesárea",
  observacoes: "39 semanas (PT-AON-097)"
}
```

## Exportação de Resultados

O sistema permite exportar os dados processados em formato CSV. O arquivo exportado contém:

- Todas as colunas de entrada (dados brutos da paciente)
- Colunas calculadas (IG, datas sugeridas)
- Data Agendada Original (do arquivo de entrada)
- Data Agendada Editada (se modificada manualmente pelo usuário)

### Formato do Nome do Arquivo
O arquivo é exportado com o seguinte padrão de nomenclatura:
```
resultados_YYYY-MM-DD_HHhmm.csv
```
Exemplo: `resultados_2025-11-30_15h30.csv`

### Edição Manual de Data Agendada

Na tela de processamento, é possível editar manualmente a data agendada de cada paciente:

1. Carregue o arquivo CSV para processamento
2. Na tabela de preview, utilize o campo de data na coluna "Data Agendada" para editar a data
3. A data editada será incluída na exportação na coluna "Data Agendada (Editada)"
4. A data original permanece preservada na coluna "Data Agendada Original"

**Validação:** A data informada deve estar em formato válido (DD/MM/YYYY ou selecionada via calendário).

## Correção Automática de Datas (Auto-Swap Dia/Mês)

O sistema implementa correção automática de datas quando há inversão entre dia e mês. Esta funcionalidade reduz erros de importação causados por formatos de data inconsistentes.

### Comportamento

1. **Prioridade ao formato brasileiro (DD/MM/YYYY)**: O sistema sempre tenta interpretar a data como DD/MM/YYYY primeiro
2. **Inversão automática**: Se DD/MM/YYYY for inválido (ex: mês > 12), o sistema tenta MM/DD/YYYY
3. **Registro de auditoria**: Quando uma inversão é aplicada, o sistema registra no log

### Exemplos

| Entrada | Interpretação DD/MM | Resultado | Ação |
|---------|---------------------|-----------|------|
| `15/03/2025` | Dia 15, mês 3 | 15 de março de 2025 ✓ | Nenhuma inversão |
| `03/15/2025` | Dia 3, mês 15 (inválido) | Inverte para mês 3, dia 15 = 15 de março de 2025 ✓ | **Inversão aplicada** |
| `10/05/2025` | Dia 10, mês 5 | 10 de maio de 2025 ✓ | Nenhuma inversão (ambíguo, usa brasileiro) |
| `32/13/2025` | Inválido em ambos | ERRO | Nenhuma correção possível |

### Campos de Auditoria

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `dumDateCorrection` | Object | Informações sobre correção da DUM (se houve inversão) |
| `usgDateCorrection` | Object | Informações sobre correção da data do USG (se houve inversão) |
| `dataAgendadaCorrection` | Object | Informações sobre correção da data agendada (se houve inversão) |
| `dateCorrectionsAuditLog` | String | Log consolidado de todas as correções aplicadas |

### Estrutura do Objeto de Correção

```typescript
interface DateParseResult {
  date: Date | null;           // Data resultante
  dayMonthSwapped: boolean;    // Se houve inversão dia/mês
  originalRaw: string;         // Valor original bruto
  formatUsed: 'ISO' | 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'date-fns' | null;
  reason: string;              // Explicação detalhada
}
```

### Funções Disponíveis

- `parseDateSafe(raw)`: Retorna apenas a data parseada (compatibilidade)
- `parseDateSafeWithSwapInfo(raw)`: Retorna objeto completo com informações de correção

### Uso no Código

```typescript
import { parseDateSafeWithSwapInfo } from '@/lib/import';

const result = parseDateSafeWithSwapInfo('03/15/2025');
if (result.dayMonthSwapped) {
  console.log('⚠️ Data corrigida:', result.reason);
}
```

### Aplicação

Esta funcionalidade é aplicada em:

- **Frontend**: Importação de arquivos TSV/CSV (`gestationalSnapshot.ts`)
- **Backend**: Webhook do Power Automate (`processar-forms-webhook/index.ts`)
- **Cálculos de IG**: Todos os cálculos usam a data já corrigida
