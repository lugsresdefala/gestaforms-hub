# README de Auditoria - GestaForms Hub

Este documento descreve os campos de auditoria e rastreabilidade do sistema de agendamento obstétrico.

## Campos de Auditoria no Agendamento

### Rastreabilidade de Criação e Aprovação

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `created_at` | Timestamp | Data/hora de criação do registro |
| `created_by` | UUID | ID do usuário que criou o registro |
| `updated_at` | Timestamp | Data/hora da última atualização |
| `aprovado_por` | UUID | ID do usuário que aprovou (se aplicável) |
| `data_aprovacao` | Timestamp | Data/hora da aprovação |

## Campos de Cálculo de Agendamento

Os seguintes campos documentam o processo de cálculo da data de agendamento para fins de auditoria:

### igIdeal
**Tipo:** String (formato "XsYd", ex: "39s2d")
**Descrição:** Idade gestacional ideal para o procedimento conforme protocolo médico aplicado.
**Fonte:** Determinado pelo protocolo obstétrico baseado nos diagnósticos da paciente.

### igNaDataAgendada
**Tipo:** String (formato "XsYd", ex: "39s5d")
**Descrição:** Projeção da idade gestacional na data do agendamento final.
**Cálculo:** IG atual + dias até a data agendada.

### intervaloDias
**Tipo:** Number
**Descrição:** Diferença em dias entre a data agendada e a data ideal calculada pelo protocolo.
**Valores:**
- Positivo: agendamento após a data ideal
- Zero: exatamente na data ideal
- Negativo: agendamento antes da data ideal (não permitido pelo sistema)

**Interpretação Visual:**
- 🟢 Verde: |intervalo| ≤ margem do protocolo
- 🟡 Amarelo: |intervalo| ≤ margem × 2
- 🔴 Vermelho: |intervalo| > margem × 2

### leadTimeDias
**Tipo:** Number
**Descrição:** Dias entre a data de referência (geralmente hoje) e a data agendada final.
**Mínimo:** 10 dias (conforme política operacional)
**Destaque:** Valores < 10 são destacados em vermelho.

### statusAgendamento
**Tipo:** Enum
**Valores possíveis:**
- `calculado`: Data calculada automaticamente pelo sistema
- `needs_review`: Sistema não encontrou data válida, requer revisão manual
- `manual`: Data definida manualmente por usuário

## Lógica de Cálculo

### Algoritmo encontrarDataAgendada

1. **Entrada:**
   - `dataIdeal`: Data ideal baseada no protocolo
   - `maternidade`: Nome da maternidade
   - `dataReferencia`: Data atual (referência para lead time)
   - `margemDias`: Tolerância em dias do protocolo

2. **Regras aplicadas em ordem:**
   a. Não agendar em domingos (pular para próximo dia útil)
   b. Verificar capacidade da maternidade para o dia
   c. Garantir lead time mínimo de 10 dias
   d. Respeitar janela IG máxima (dataIdeal + margemDias)
   e. Buscar até +7 dias a partir da data ideal

3. **Saída:**
   - `dataAgendada`: Data encontrada ou null
   - `status`: calculado, needs_review, ou manual
   - `intervaloDias`: Offset da data ideal
   - `leadTimeDias`: Antecedência calculada
   - `motivo`: Explicação do cálculo

### Capacidade por Maternidade

```
Maternidade    | Seg-Sex | Sábado | Domingo
---------------|---------|--------|--------
Guarulhos      |    2    |   1    |   0
NotreCare      |    6    |   2    |   0
Salvalus       |    9    |   7    |   0
Cruzeiro       |    3    |   1    |   0
```

## Trilha de Auditoria

### Eventos Registrados
1. **Criação de agendamento:** created_at, created_by
2. **Cálculo de data:** statusAgendamento, motivo_calculo
3. **Aprovação:** aprovado_por, data_aprovacao
4. **Alterações:** updated_at (histórico em tabela separada)

### Informações do Cálculo
Quando `statusAgendamento = 'calculado'`, o campo `motivo_calculo` contém:
- Data final calculada
- Ajustes aplicados (domingo, capacidade, lead time)
- Protocolo utilizado
- Margem aplicada

### Casos de Revisão
Quando `statusAgendamento = 'needs_review'`:
- Motivo do não-cálculo é registrado
- Requer intervenção manual
- Usuário que resolver deve registrar justificativa

## Conformidade

Este sistema de auditoria atende aos requisitos de:
- Rastreabilidade de ações médicas
- Documentação de decisões automatizadas
- Registro de intervenções manuais
- Conformidade com políticas operacionais (lead time, capacidade)
