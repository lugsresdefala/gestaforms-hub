# Fluxo de Validação - GestaForms Hub

Este documento descreve as regras de validação unificadas para criação de agendamentos obstétricos no sistema GestaForms Hub.

## Visão Geral

O sistema possui duas vias para criar agendamentos:
1. **Importação por Tabela** (`ImportarPorTabela.tsx`) - colar dados de Excel/planilhas
2. **Formulário Manual** (`NovoAgendamento.tsx`) - preenchimento guiado em 6 etapas

Ambas as vias utilizam o módulo de **validação unificada** (`src/lib/validation/unifiedValidation.ts`) para garantir consistência.

---

## Campos Obrigatórios vs Opcionais

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| `nome_completo` | ✅ Sim | Nome completo da paciente |
| `carteirinha` | ✅ Sim | Número da carteirinha (único no sistema) |
| `data_nascimento` | ✅ Sim | Data de nascimento (DD/MM/YYYY ou YYYY-MM-DD) |
| `maternidade` | ✅ Sim | Hospital maternidade |
| `dum_status` | ⚠️ Condicional | Obrigatório se não tiver USG |
| `data_dum` | ⚠️ Condicional | Obrigatório se DUM for confiável |
| `data_primeiro_usg` | ⚠️ Condicional | Obrigatório se não tiver DUM confiável |
| `semanas_usg` | ⚠️ Condicional | Obrigatório junto com data_primeiro_usg |
| `dias_usg` | Opcional | Dias adicionais do USG (0-6) |
| `diagnosticos_maternos` | Opcional | Diagnósticos maternos |
| `diagnosticos_fetais` | Opcional | Diagnósticos fetais |
| `ig_pretendida` | Opcional | IG desejada (padrão: protocolo) |

---

## Regras de Validação

### 1. Validações Críticas (Bloqueiam Criação)

#### 1.1. Campos Obrigatórios
```
❌ ERRO: Nome completo é obrigatório
❌ ERRO: Carteirinha é obrigatória
❌ ERRO: Data de nascimento é obrigatória
❌ ERRO: Maternidade é obrigatória
```

#### 1.2. Formato de Datas
```
✅ Formatos aceitos: DD/MM/YYYY, YYYY-MM-DD, ISO 8601
❌ ERRO: Data de nascimento inválida: [valor]
❌ ERRO: Data de nascimento não pode ser no futuro
❌ ERRO: Data DUM não pode ser no futuro
```

#### 1.3. Carteirinha Única
```
❌ ERRO: Carteirinha já existe no sistema - Agendamento em: DD/MM/YYYY
```

#### 1.4. Cálculo de IG
```
❌ ERRO: Não é possível calcular a idade gestacional
   Forneça:
   - DUM confiável (status "Sim - Confiavel" + data válida)
   OU
   - Dados de USG (data + semanas > 0)
```

#### 1.5. Lead Time Mínimo (10 dias)
```
❌ ERRO: Data de agendamento está no passado
❌ ERRO: URGENTE (< 7 dias): Lead time de X dias. Encaminhar para PRONTO-SOCORRO
⚠️ AVISO: Lead time de X dias é inferior ao mínimo de 10 dias
```

#### 1.6. IG Dentro do Protocolo (margem máxima: 7 dias)
```
❌ ERRO: IG na data do agendamento (XXsYYd) está Z dias ACIMA da IG ideal do protocolo
```

### 2. Validações de Aviso (Permitem Criação)

#### 2.1. IG Pretendida vs Protocolo
```
⚠️ AVISO: IG pretendida (XX semanas) difere da IG ideal do protocolo "nome" (YY semanas)
```

#### 2.2. Ajustes de Data
```
⚠️ AVISO: Data de agendamento é domingo - será remapeada para segunda-feira
⚠️ AVISO: Data ajustada: +X dias após data ideal (capacidade)
```

#### 2.3. IG Abaixo do Ideal
```
⚠️ AVISO: IG na data do agendamento está X dias ABAIXO da IG ideal. Considere reagendar.
```

---

## Fluxograma: Importação vs Manual

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ENTRADA DE DADOS                                     │
└─────────────────────────────────────────────────────────────────────────────┘
                │                                     │
                ▼                                     ▼
    ┌───────────────────┐                 ┌───────────────────┐
    │  Importação por   │                 │   Formulário      │
    │     Tabela        │                 │     Manual        │
    │  (Ctrl+V Excel)   │                 │   (6 etapas)      │
    └─────────┬─────────┘                 └─────────┬─────────┘
              │                                     │
              ▼                                     ▼
    ┌───────────────────┐                 ┌───────────────────┐
    │  Processar Dados  │                 │  Preencher Form   │
    │  (parsing/mapping)│                 │  (validação Zod)  │
    └─────────┬─────────┘                 └─────────┬─────────┘
              │                                     │
              └───────────────┬─────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────────────┐
              │   validarAgendamento()                 │
              │   (validação unificada)                │
              │                                        │
              │   1. Campos obrigatórios              │
              │   2. Formato de datas                 │
              │   3. Carteirinha única (DB)           │
              │   4. Cálculo de IG                    │
              │   5. Lead time mínimo                 │
              │   6. IG vs Protocolo                  │
              └───────────────┬────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
    ┌───────────────────┐           ┌───────────────────┐
    │  Erros Críticos   │           │    Sem Erros      │
    │  (valido: false)  │           │  (valido: true)   │
    └─────────┬─────────┘           └─────────┬─────────┘
              │                               │
              ▼                               │
    ┌───────────────────┐                     │
    │  BLOQUEADO        │                     │
    │  - Exibir erros   │                     │
    │  - Não salvar     │                     │
    └───────────────────┘                     │
                                              │
                              ┌───────────────┴───────────────┐
                              │                               │
                              ▼                               ▼
                    ┌───────────────────┐           ┌───────────────────┐
                    │   Com Avisos      │           │    Sem Avisos     │
                    │ (avisos.length>0) │           │                   │
                    └─────────┬─────────┘           └─────────┬─────────┘
                              │                               │
                              ▼                               │
                    ┌───────────────────┐                     │
                    │ Exibir AlertDialog│                     │
                    │ "Confirmar mesmo  │                     │
                    │  assim?"          │                     │
                    └─────────┬─────────┘                     │
                              │                               │
              ┌───────────────┴───────────────┐               │
              │                               │               │
              ▼                               ▼               │
    ┌───────────────────┐           ┌───────────────────┐     │
    │  Usuário Cancela  │           │ Usuário Confirma  │     │
    │  → Voltar e       │           │ → Prosseguir      │     │
    │    Revisar        │           └─────────┬─────────┘     │
    └───────────────────┘                     │               │
                                              ├───────────────┘
                                              │
                                              ▼
                              ┌───────────────────────────────────────┐
                              │   SALVAR NO BANCO                     │
                              │   - status: 'pendente'                │
                              │   - created_by: user.id               │
                              │   - data_agendamento_calculada        │
                              │   - idade_gestacional_calculada       │
                              └───────────────────────────────────────┘
```

---

## Exemplos de Uso

### Exemplo 1: Agendamento Válido Simples
```typescript
const resultado = await validarAgendamento({
  nome_completo: 'Maria Silva',
  carteirinha: '123456789',
  data_nascimento: '15/03/1990',
  maternidade: 'Salvalus',
  dum_status: 'Sim - Confiavel',
  data_dum: '01/01/2024',
}, { supabase, userId });

// Resultado:
// { valido: true, errosCriticos: [], avisos: [], detalhes: {} }
```

### Exemplo 2: Carteirinha Duplicada
```typescript
const resultado = await validarAgendamento({
  nome_completo: 'Ana Costa',
  carteirinha: '123456789', // Já existe!
  data_nascimento: '20/05/1988',
  maternidade: 'NotreCare',
  // ...
}, { supabase, userId });

// Resultado:
// {
//   valido: false,
//   errosCriticos: ['Carteirinha já existe no sistema - Agendamento em: 15/12/2024'],
//   avisos: [],
//   detalhes: {
//     carteirinhaDuplicada: true,
//     agendamentoExistente: { id: 'uuid', dataAgendamento: '15/12/2024' }
//   }
// }
```

### Exemplo 3: IG Fora do Protocolo
```typescript
const resultado = await validarAgendamento({
  nome_completo: 'Juliana Lima',
  carteirinha: '987654321',
  data_nascimento: '10/10/1992',
  maternidade: 'Guarulhos',
  data_primeiro_usg: '01/01/2024',
  semanas_usg: 40, // IG alta
  dias_usg: 5,
  data_agendamento_calculada: '2024-03-15',
  // ...
}, { supabase, userId });

// Resultado:
// {
//   valido: false,
//   errosCriticos: ['IG na data do agendamento (41s2d) está 16 dias ACIMA...'],
//   avisos: [],
//   detalhes: { igForaProtocolo: true }
// }
```

---

## Erros Comuns e Soluções

| Erro | Causa | Solução |
|------|-------|---------|
| "Carteirinha já existe" | Paciente já tem agendamento | Verificar na lista de agendamentos |
| "Não é possível calcular IG" | Falta DUM ou USG | Preencher DUM confiável OU dados de USG |
| "IG acima da ideal" | Gestação avançada | Verificar datas, considerar urgência |
| "Lead time insuficiente" | Muito perto do parto | Se < 7 dias, encaminhar para PS |
| "Data é domingo" | Não há atendimento | Data será remapeada automaticamente |

---

## Interface TypeScript

```typescript
interface ValidationResult {
  valido: boolean;
  errosCriticos: string[];
  avisos: string[];
  detalhes: {
    carteirinhaDuplicada?: boolean;
    overbooking?: boolean;
    leadTimeInsuficiente?: boolean;
    igForaProtocolo?: boolean;
    igNaoCalculavel?: boolean;
    agendamentoExistente?: {
      id: string;
      dataAgendamento: string;
    };
  };
}

interface DadosAgendamento {
  nome_completo: string;
  carteirinha: string;
  data_nascimento: string;
  maternidade: string;
  dum_status?: string;
  data_dum?: string;
  data_primeiro_usg?: string;
  semanas_usg?: number | string;
  dias_usg?: number | string;
  ig_pretendida?: string | number;
  indicacao_procedimento?: string;
  diagnosticos_maternos?: string | string[];
  diagnosticos_fetais?: string | string[];
  data_agendamento_calculada?: string | Date;
  excludeId?: string; // Para edição
}

async function validarAgendamento(
  dados: DadosAgendamento,
  context: { supabase: SupabaseClient; userId: string }
): Promise<ValidationResult>
```

---

## Referências

- Código: `src/lib/validation/unifiedValidation.ts`
- Testes: `tests/unifiedValidation.test.ts`
- Testes de consistência: `tests/importacao-vs-manual.test.ts`
- Protocolos: `src/lib/obstetricProtocols.ts`
