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

---

## Colunas do CSV de Importação

O arquivo CSV de agendamentos obstétricos pode conter até 28 colunas. Abaixo está a documentação completa de cada campo.

### Campos de Identificação

| Coluna | Aliases | Tipo | Obrigatório | Descrição |
|--------|---------|------|-------------|-----------|
| `nome` | `nome_completo`, `paciente` | String | Sim | Nome completo da paciente |
| `carteirinha` | `cartao` | String | Não | Número da carteirinha do convênio |
| `data_nascimento` | `dt_nascimento`, `nascimento` | Date | Não | Data de nascimento (DD/MM/YYYY ou YYYY-MM-DD) |

### Campos de Agendamento

| Coluna | Aliases | Tipo | Obrigatório | Descrição |
|--------|---------|------|-------------|-----------|
| `maternidade` | `hospital`, `unidade` | String | Sim | Nome da maternidade (Guarulhos, NotreCare, Salvalus, Cruzeiro) |
| `data_agendamento` | `data_agendada`, `dt_agendamento` | Date | Sim | Data do agendamento pretendido |
| `procedimento` | `tipo_procedimento` | String | Não | Tipo de procedimento (Cesárea, Parto Normal, Indução) |
| `ig_pretendida` | `ig_ideal` | Number | Não | Idade gestacional pretendida em semanas |

### Campos de DUM (Data da Última Menstruação)

| Coluna | Aliases | Tipo | Descrição |
|--------|---------|------|-----------|
| `dum_status` | `status_dum`, `dum` | String | Status de confiabilidade da DUM |
| `data_dum` | `dt_dum` | Date | Data da última menstruação |

**Valores aceitos para `dum_status`:**
- `Sim - Confiavel` ou `Confiável` - DUM é confiável
- `Incerta` - DUM aproximada
- `Não sabe` ou `Desconhecida` - DUM não disponível

### Campos de USG (Ultrassom)

| Coluna | Aliases | Tipo | Descrição |
|--------|---------|------|-----------|
| `data_primeiro_usg` | `data_1o_usg`, `dt_usg`, `data_usg` | Date | Data do primeiro ultrassom |
| `semanas_usg` | `sem_usg`, `ig_semanas` | Number | Semanas gestacionais no momento do USG |
| `dias_usg` | `ig_dias` | Number | Dias adicionais (0-6) no momento do USG |
| `usg_recente` | `usg_mais_recente`, `ultimo_usg` | String | Campo texto livre com dados do USG mais recente |

**Extração de dados do campo `usg_recente`:**

O sistema extrai automaticamente os seguintes dados do texto livre:

| Dado | Padrões Aceitos | Exemplo |
|------|-----------------|---------|
| Data | `DD/MM/YYYY`, `DD/MM/YY` | `15/03/2025` |
| IG | `32+5`, `32/5`, `32s5d`, `32 semanas e 5 dias` | `32+5 sem` |
| Peso | `1500g`, `1.500g`, `1500 gramas`, `PF 1500` | `peso 2300g` |
| Percentil | `p25`, `P50`, `percentil 75` | `p50` |
| ILA | `ILA normal`, `ILA nl`, `ILA aumentado`, `oligodramnia` | `ILA nl` |
| Doppler | `Doppler normal`, `Doppler alterado`, `fluxo nl` | `Doppler nl` |

### Campos de Diagnóstico

| Coluna | Aliases | Tipo | Descrição |
|--------|---------|------|-----------|
| `diagnosticos_maternos` | `diag_maternos`, `patologias_maternas` | String | Diagnósticos/patologias maternas (separados por vírgula) |
| `diagnosticos_fetais` | `diag_fetais`, `patologias_fetais` | String | Diagnósticos/patologias fetais (separados por vírgula) |

### Campos de Contato

| Coluna | Aliases | Tipo | Descrição |
|--------|---------|------|-----------|
| `telefones` | `telefone`, `contato`, `fone` | String | Números de telefone |
| `email` | `e-mail` | String | Endereço de e-mail |

### Campos Administrativos

| Coluna | Aliases | Tipo | Descrição |
|--------|---------|------|-----------|
| `medico_responsavel` | `medico`, `dr` | String | Nome do médico responsável |
| `observacoes` | `obs`, `observacao` | String | Observações gerais |

---

## Siglas Médicas

### Siglas de Condições Maternas

| Sigla | Significado | Protocolo Relacionado |
|-------|-------------|----------------------|
| **DMG** | Diabetes Mellitus Gestacional | `dmg_sem_insulina`, `dmg_com_insulina` |
| **DM** | Diabetes Mellitus (pré-gestacional) | `dm_pregestacional` |
| **HAC** | Hipertensão Arterial Crônica | `hac`, `hac_dificil_controle` |
| **HAS** | Hipertensão Arterial Sistêmica | `hac` (sinônimo) |
| **HG** | Hipertensão Gestacional | `hipertensao_gestacional` |
| **PE** | Pré-eclâmpsia | `pre_eclampsia_sem_deterioracao` |
| **HELLP** | Hemólise, Elevação de Enzimas Hepáticas, Plaquetopenia | `hellp` |
| **SAF** | Síndrome Antifosfolípide | `trombofilia` |
| **TVP** | Trombose Venosa Profunda | `trombofilia` |
| **ITU** | Infecção do Trato Urinário | Não altera IG |
| **VDRL** | Teste para sífilis | `sifilis_tratada` |
| **HIV** | Vírus da Imunodeficiência Humana | `hiv_bem_controlado` |
| **IIC** | Incompetência Istmo-Cervical | `iic_cerclagem` |

### Siglas de Condições Fetais

| Sigla | Significado | Protocolo Relacionado |
|-------|-------------|----------------------|
| **RCF** | Restrição de Crescimento Fetal | `rcf_leve`, `rcf_estagio_2`, `rcf_estagio_3` |
| **CIUR** | Crescimento Intrauterino Restrito | `rcf_leve` (sinônimo) |
| **GIG** | Grande para Idade Gestacional | `macrossomia` |
| **PIG** | Pequeno para Idade Gestacional | `rcf_leve` |
| **AIG** | Adequado para Idade Gestacional | Normal |
| **ILA** | Índice de Líquido Amniótico | `oligoamnio`, `polidramnia_severo` |
| **DBP** | Diâmetro Biparietal | Medida fetal |
| **CCN** | Comprimento Cabeça-Nádega | Medida de 1º trimestre |
| **CA** | Circunferência Abdominal | Medida fetal |
| **FL** | Fêmur Length (comprimento do fêmur) | Medida fetal |
| **BCF** | Batimentos Cardíacos Fetais | Vitalidade fetal |
| **LA** | Líquido Amniótico | Avaliação de volume |

### Siglas de Exames e Procedimentos

| Sigla | Significado | Uso |
|-------|-------------|-----|
| **USG** | Ultrassonografia | Datação e avaliação fetal |
| **CTG** | Cardiotocografia | Avaliação de vitalidade |
| **PBF** | Perfil Biofísico Fetal | Avaliação de bem-estar |
| **ACM** | Artéria Cerebral Média | Doppler fetal |
| **AUmb** | Artéria Umbilical | Doppler placentário |
| **DPP** | Data Provável do Parto | Cálculo baseado em IG |
| **DUM** | Data da Última Menstruação | Referência para IG |
| **IG** | Idade Gestacional | Em semanas + dias |
| **TOTG** | Teste Oral de Tolerância à Glicose | Rastreio de DMG |

### Siglas de Tipos de Gestação

| Sigla | Significado | Protocolo Relacionado |
|-------|-------------|----------------------|
| **Mono/Di** | Monocoriônica/Dicoriônica | Classificação de gemelares |
| **Mono/Mono** | Monocoriônica/Monoamniótica | `gemelar_monoamniotico` |
| **Di/Di** | Dicoriônica/Diamniótica | `gemelar_dicorionico` |

---

## Formatos de Data Aceitos

O sistema aceita os seguintes formatos de data:

| Formato | Exemplo | Prioridade |
|---------|---------|------------|
| DD/MM/YYYY | `15/03/2025` | **Prioritário (brasileiro)** |
| D/M/YYYY | `5/3/2025` | Aceito |
| DD/MM/YY | `15/03/25` | Aceito (anos 00-50 = 2000s, 51-99 = 1900s) |
| YYYY-MM-DD | `2025-03-15` | Aceito (ISO) |
| MM/DD/YYYY | `03/15/2025` | Fallback (quando DD/MM é inválido) |

**Nota:** Para datas ambíguas (ex: `05/12/2025`), o sistema sempre assume o formato brasileiro DD/MM/YYYY.

---

## Regras de Validação do Pipeline de Importação

### Validações de Data

1. **Janela de agendamento**: 2025-11-01 a 2026-01-31
2. **Exclusão de domingos**: Datas em domingos são remapeadas para segunda-feira
3. **Ano mínimo**: Anos anteriores a 1920 são considerados placeholders

### Validações de Maternidade

Nomes aceitos (case-insensitive, com correspondência parcial):
- Guarulhos
- NotreCare
- Salvalus
- Cruzeiro

### Validações de Capacidade

| Maternidade | Segunda-Sexta | Sábado | Domingo |
|-------------|---------------|--------|---------|
| Guarulhos | 2 | 1 | 0 |
| NotreCare | 6 | 2 | 0 |
| Salvalus | 9 | 7 | 0 |
| Cruzeiro | 3 | 1 | 0 |

### Tratamento de Duplicados

Registros duplicados (mesma carteirinha ou nome normalizado) são redistribuídos:
1. Primeiro registro mantém a data original
2. Registros subsequentes são movidos para ±7 dias
3. Se não houver vaga disponível, status = `needs_review`

### Status Finais

| Status | Descrição |
|--------|-----------|
| `mantido` | Registro não alterado |
| `ajustado` | Data ou dados foram corrigidos automaticamente |
| `needs_review` | Requer revisão manual (sem vaga ou dados inválidos) |
