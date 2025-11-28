# Auditoria Automatizada de Agendamentos

Este módulo implementa uma auditoria automatizada sobre os agendamentos obstétricos para corrigir problemas de encoding, verificar datas, capacidade e duplicidades.

## Funcionalidades

### 1. Correção de Encoding
- Corrige problemas de encoding UTF-8 em nomes de pacientes
- Exemplo: "LaÃ\u00ads" → "Laís", "JosÃ©" → "José"

### 2. Normalização de Nomes
- Remove diacríticos para criar chaves de comparação
- Preserva forma original para exibição
- Exemplo: "Maria José" → "MARIA JOSE"

### 3. Verificação de Datas
- **Janela permitida**: 2025-11-01 a 2026-01-31
- **Regra absoluta**: Domingo não pode ter agendamentos
- Agendamentos em domingo são automaticamente movidos para segunda-feira

### 4. Capacidade por Maternidade

| Maternidade | Seg-Sex | Sábado | Domingo |
|-------------|---------|--------|---------|
| Guarulhos   | 2       | 1      | 0       |
| NotreCare   | 6       | 2      | 0       |
| Salvalus    | 9       | 7      | 0       |
| Cruzeiro    | 3       | 1      | 0       |

### 5. Detecção de Duplicidades
- Chave primária: carteirinha
- Fallback: nome normalizado
- Redistribuição automática dentro de ±7 dias

### 6. Regras de Redistribuição
1. Ordem de tentativa: +1, +2, +3, +4, +5, +6, +7 dias
2. Se não encontrar, tenta -1, -2, ..., -7 dias
3. Sempre dentro da janela permitida
4. Sempre evitando domingos
5. Se não encontrar data disponível, marca como `needs_review`

## Arquivos Gerados

- **comparacao.csv**: Comparação entre dados do banco e calendários
- **ajustes_domingo.csv**: Agendamentos movidos de domingo
- **agenda_final.csv**: Agenda completa após redistribuições
- **problemas.csv**: Registros que precisam de revisão manual

### Estrutura do agenda_final.csv

| Campo | Descrição |
|-------|-----------|
| id_interno | Identificador sequencial |
| carteirinha | Número da carteirinha |
| nome_original | Nome com acentos preservados |
| nome_normalizado | Nome em maiúsculas sem acentos |
| maternidade | Nome da maternidade |
| data_original | Data original do agendamento |
| data_final | Data após ajustes |
| motivo_alteracao | nenhum, domingo_remapeado, duplicado_redistribuido, overbooking_resolvido, sem_vaga_disponivel |
| status | mantido, ajustado, needs_review |

## Uso via Script

```typescript
import {
  parseBanco,
  parseCalendario,
  processarRegistros,
  gerarCSVAgendaFinal,
} from './scripts/processarAgendas';

// Parse dados do banco
const registrosBanco = parseBanco(textoCopiado);

// Parse calendários
const calendario = parseCalendario(textoCalendario, 11, 2025, 'Guarulhos');

// Processar
const resultado = processarRegistros(registrosBanco);

// Gerar CSV
const csv = gerarCSVAgendaFinal(resultado.registros);
```

## Uso via Interface Admin

1. Acesse `/admin/auditoria-agendamentos`
2. Cole os dados do banco no campo apropriado
3. Opcionalmente, cole dados dos calendários
4. Clique em **Simular** para ver os resultados
5. Clique em **Gerar CSVs** para baixar os arquivos
6. Use **Aplicar Correções** (em desenvolvimento) para integrar com o banco

### Formato de Entrada - Banco

Dados separados por TAB ou vírgula:
```
Nome Completo   Carteirinha   Maternidade   Data
Maria Silva     12345         Guarulhos     2025-11-03
João Santos     67890         NotreCare     2025-11-04
```

### Formato de Entrada - Calendário

Números de dia seguidos de nomes:
```
1
Maria Silva
João Santos
2
Ana Paula
3
Pedro Costa
```

## Testes

Execute os testes unitários:

```bash
npm run test
```

Os testes cobrem:
- Correção de encoding
- Herança de dia no parseCalendario
- Evitar domingo (remapeamento simples)
- Redistribuição de duplicados
- Overbooking (simulação artificial > capacidade)

## Estrutura de Arquivos

```
scripts/
├── processarAgendas.ts           # Lógica principal
└── __tests__/
    └── processarAgendas.test.ts  # Testes unitários

src/pages/admin/
└── AuditoriaAgendamentos.tsx     # Interface admin

data/
├── examples/                     # Arquivos de exemplo
│   ├── agenda_final.csv
│   ├── ajustes_domingo.csv
│   ├── comparacao.csv
│   └── problemas.csv
└── output/                       # Arquivos gerados (ignorado pelo git)
```

## Notas Importantes

1. **Não exclui pacientes**: Registros sem solução são mantidos em `problemas.csv`
2. **Foco em integridade de agenda**: Não modifica dados clínicos (IG, DUM/USG)
3. **Preserva dados originais**: Sempre mantém `nome_original` e `data_original`
4. **Código puro TypeScript**: Apenas `date-fns` como dependência externa
