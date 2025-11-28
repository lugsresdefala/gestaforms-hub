# Correção de Overbooking de Agendamentos

## Visão Geral

Este documento descreve o processo de correção de overbooking (excesso de agendamentos) nas maternidades e as medidas preventivas implementadas.

## Problema Identificado

Agendamentos no banco de dados não estavam respeitando a capacidade configurada de cada maternidade, resultando em overbooking.

### Capacidades Configuradas (tabela `capacidade_maternidades`)

| Maternidade | Seg-Sex | Sábado | Domingo |
|-------------|---------|--------|---------|
| Guarulhos   | 2       | 1      | 0       |
| NotreCare   | 6       | 2      | 0       |
| Salvalus    | 9       | 7      | 0       |
| Cruzeiro    | 3       | 1      | 0       |

## Soluções Implementadas

### 1. Trigger PostgreSQL (Prevenção)

Foi criado um trigger no banco de dados que valida automaticamente a capacidade antes de qualquer INSERT ou UPDATE na tabela `agendamentos_obst`.

**Arquivo:** `supabase/migrations/20251128165634_trigger_validar_capacidade.sql`

**Comportamento:**
- Verifica capacidade do dia baseado no dia da semana
- Conta agendamentos existentes (exceto rejeitados)
- Bloqueia inserção se capacidade estiver esgotada
- Retorna mensagem de erro clara com detalhes

**Exemplo de erro:**
```
Capacidade excedida para Guarulhos em 15/12/2025: 3 de 2 vagas usadas.
Escolha outra data ou maternidade.
```

### 2. Script de Correção (Remediation)

**Arquivo:** `scripts/corrigirOverbooking.ts`

Script para auditar e corrigir casos de overbooking existentes.

**Uso:**

```bash
# Modo simulação (dry-run) - não altera dados
npx tsx scripts/corrigirOverbooking.ts

# Modo execução real - aplica correções
npx tsx scripts/corrigirOverbooking.ts --execute
```

**Variáveis de ambiente necessárias:**
```bash
export SUPABASE_URL="https://seu-projeto.supabase.co"
export SUPABASE_SERVICE_KEY="sua-service-key"
```

**Funcionamento:**
1. Audita todos os casos de overbooking por maternidade/data
2. Mantém os primeiros N agendamentos (FIFO por `created_at`)
3. Realoca excedentes para datas alternativas (±7 dias)
4. Marca para revisão manual casos sem solução automática
5. Gera relatórios CSV em `relatorios_overbooking/`

**Relatórios gerados:**
- `problemas_YYYYMMDD_HHMMSS.csv` - Casos de overbooking encontrados
- `ajustes_YYYYMMDD_HHMMSS.csv` - Realocações realizadas
- `nao_resolvidos_YYYYMMDD_HHMMSS.csv` - Casos para revisão manual

### 3. Validação em Scripts de Importação

Todos os scripts de importação foram atualizados para validar capacidade ANTES de inserir:

#### TypeScript (Frontend)

**Arquivos atualizados:**
- `src/utils/importConsolidado.ts`
- `src/utils/importNotrecare2025.ts`
- `src/utils/importAgendamentosLote.ts`

**Lógica implementada:**
```typescript
const disponibilidade = await verificarDisponibilidade(
  maternidade,
  dataAgendamento,
  false // isUrgente
);

if (!disponibilidade.disponivel) {
  if (disponibilidade.dataAlternativa) {
    // Usar data alternativa
    agendamento.data_agendamento_calculada = format(disponibilidade.dataAlternativa, 'yyyy-MM-dd');
    agendamento.observacoes_agendamento += `\n⚠️ [IMPORTAÇÃO] ${disponibilidade.mensagem}`;
  } else {
    // Marcar para revisão
    agendamento.status = 'pendente';
    agendamento.observacoes_agendamento += `\n⚠️ SEM VAGAS DISPONÍVEIS: ${disponibilidade.mensagem}`;
  }
}
```

#### JavaScript (Scripts Node.js)

**Arquivos atualizados:**
- `scripts/importar_cruzeiro_dez_2025.js`

#### Python

**Arquivos atualizados:**
- `scripts/importar_fluxo_novo_2025.py`

#### Edge Functions (Supabase)

**Arquivos atualizados:**
- `supabase/functions/import-csv/index.ts`

## Regras de Negócio

### Prioridade FIFO
- Em caso de overbooking, os primeiros agendamentos criados (`created_at`) são mantidos
- Excedentes são realocados ou marcados para revisão

### Janela de Realocação
- Busca alternativa primeiro em +1 a +7 dias após a data ideal
- Se não encontrar, busca em -1 a -7 dias antes da data ideal
- Domingos são sempre ignorados (capacidade = 0)

### Status de Agendamentos
- `aprovado`: Agendamento confirmado com vaga
- `pendente`: Aguardando revisão (sem vaga encontrada)
- `rejeitado`: Cancelado (não conta para capacidade)

### Observações Automáticas
Quando há ajuste de data, uma observação é adicionada:
```
⚠️ [IMPORTAÇÃO] Data ajustada de 2025-12-15 para 2025-12-16 (+1 dias)
```

## Fluxo de Verificação

1. **Verificar se há vagas na data ideal**
   - Contar agendamentos existentes (exceto rejeitados)
   - Comparar com capacidade do dia

2. **Se não houver vagas**
   - Buscar data alternativa nos próximos 7 dias
   - Se não encontrar, buscar nos 7 dias anteriores
   - Se não encontrar, marcar como pendente

3. **Registrar observação**
   - Indicar ajuste realizado ou motivo da pendência

## Monitoramento

### Consulta SQL para verificar overbooking atual

```sql
SELECT 
  maternidade,
  data_agendamento_calculada,
  COUNT(*) as total,
  (SELECT 
    CASE 
      WHEN EXTRACT(DOW FROM a.data_agendamento_calculada::date) = 0 THEN vagas_domingo
      WHEN EXTRACT(DOW FROM a.data_agendamento_calculada::date) = 6 THEN vagas_sabado
      ELSE vagas_dia_util
    END
   FROM capacidade_maternidades c 
   WHERE LOWER(c.maternidade) = LOWER(a.maternidade)
  ) as capacidade
FROM agendamentos_obst a
WHERE status != 'rejeitado'
  AND data_agendamento_calculada IS NOT NULL
GROUP BY maternidade, data_agendamento_calculada
HAVING COUNT(*) > (
  SELECT 
    CASE 
      WHEN EXTRACT(DOW FROM a.data_agendamento_calculada::date) = 0 THEN vagas_domingo
      WHEN EXTRACT(DOW FROM a.data_agendamento_calculada::date) = 6 THEN vagas_sabado
      ELSE vagas_dia_util
    END
  FROM capacidade_maternidades c 
  WHERE LOWER(c.maternidade) = LOWER(a.maternidade)
)
ORDER BY maternidade, data_agendamento_calculada;
```

## Contato

Para dúvidas ou problemas com o sistema de agendamentos, contate a equipe de desenvolvimento.
