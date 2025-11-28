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
