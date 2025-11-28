# Data Dictionary - GestaForms Hub

Este documento define os campos e termos utilizados no sistema GestaForms Hub, com foco especial nos cálculos gestacionais e protocolos obstétricos.

## Campos de Cálculo Gestacional

### IG (Idade Gestacional)

Representa a idade gestacional da paciente, calculada a partir da DUM (Data da Última Menstruação) ou do USG (Ultrassonografia).

**Formato de exibição:**
- Longo: "39 semanas e 2 dias"
- Compacto: "39s2d"

### IG Calculada (`ig_calculada`)

Idade gestacional atual da paciente na data de referência (geralmente hoje).

- **Origem**: Calculado via `chooseAndCompute()` no módulo `gestationalCalculator.ts`
- **Fonte**: DUM confiável ou USG (fallback)
- **Formato**: "XX semanas e Y dias"

### IG Ideal (`igIdeal`)

Idade gestacional ideal para resolução da gestação segundo o protocolo obstétrico aplicável.

- **Origem**: Definido no protocolo em `obstetricProtocols.ts`
- **Fonte**: Baseado em diagnósticos maternos, fetais ou indicação do procedimento
- **Formato compacto**: "39s0d" (39 semanas e 0 dias)
- **Exemplo por protocolo**:
  - Desejo Materno: 39s0d
  - Diabetes Gestacional sem insulina: 40s0d
  - Diabetes Gestacional com insulina: 38s0d
  - Pré-eclâmpsia grave: 34s0d

### IG na Data Agendada (`igNaDataAgendada`)

Idade gestacional projetada para a data do agendamento.

- **Cálculo**: IG atual + dias até a data agendada
- **Formato compacto**: "39s5d"
- **Uso**: Verificar se a paciente estará na IG apropriada no dia do procedimento

### Data Ideal (`dataIdeal`)

Data ideal para resolução da gestação baseada na IG Ideal do protocolo.

- **Cálculo**: DPP - (40 - IG_Ideal) semanas
- **Formato**: DD/MM/YYYY

### Data Agendada (`dataAgendada`)

Data efetivamente agendada para o procedimento.

- **Fonte**: Pode ser calculada automaticamente ou definida manualmente
- **Formato**: DD/MM/YYYY

### Fonte do Agendamento (`fonteAgendamento`)

Indica como a data de agendamento foi determinada.

- **Valores possíveis**:
  - `calculada`: Data calculada automaticamente pelo sistema
  - `manual`: Data definida manualmente pelo usuário

### Intervalo (`intervaloDias`)

Diferença em dias entre a data agendada e a data ideal.

- **Cálculo**: Data Agendada - Data Ideal
- **Formato de exibição**: "+2d", "-3d", "0d"
- **Interpretação**:
  - Positivo (+): Agendamento após a data ideal
  - Negativo (-): Agendamento antes da data ideal
  - Zero (0): Agendamento na data ideal

### Margem de Tolerância (`margemDias`)

Número de dias de tolerância definido pelo protocolo obstétrico.

- **Origem**: Campo `margemDias` no objeto de protocolo
- **Padrão**: 7 dias para a maioria dos protocolos
- **Uso**: Determinar se o intervalo está dentro dos limites aceitáveis

## Indicadores de Status

### Dentro da Margem (`dentroMargem`)

Indica se o intervalo está dentro da margem tolerada pelo protocolo.

- **Cálculo**: |intervaloDias| <= margemDias
- **Exibição**: 
  - 🟢 Verde: Dentro da margem
  - 🟡 Amarelo: Dentro da margem estendida (2x margem)
  - 🔴 Vermelho: Fora de todas as margens

## Protocolos Obstétricos

Os protocolos são definidos em `src/lib/obstetricProtocols.ts` e incluem:

### Estrutura do Protocolo

```typescript
interface ProtocolConfig {
  igIdeal: string;        // IG ideal para resolução (semanas)
  margemDias: number;     // Tolerância em dias
  prioridade: number;     // 1 = crítico, 2 = alto, 3 = normal
  viaPreferencial: string; // "Cesárea", "Via obstétrica"
  observacoes: string;    // Notas clínicas
}
```

### Protocolos Disponíveis

| Protocolo | IG Ideal | Margem | Prioridade |
|-----------|----------|--------|------------|
| desejo_materno | 39 | ±7d | 3 |
| dmg_sem_insulina | 40 | ±7d | 3 |
| dmg_insulina | 38 | ±7d | 2 |
| pre_eclampsia_grave | 34 | ±7d | 1 |
| gemelar_monocorionico | 34 | ±7d | 2 |
| placenta_previa_total | 36 | ±7d | 1 |
| ... | ... | ... | ... |

Para a lista completa, consulte `src/lib/obstetricProtocols.ts`.

## Referências

- **PT-AON-097**: Protocolo de Assistência Obstétrica - Hapvida NotreDame
- **PR-DIMEP-PGS-01**: Procedimento de Assistência Pré-Natal
- **PR-GNDI-PPS-27**: Protocolo de Gestação de Alto Risco
