# ANÁLISE DOS ARQUIVOS CSV NO WORKSPACE

## Arquivos Identificados

### 1. **agendamentos_completos.csv** (119 linhas)
- **Localização**: `/workspaces/gestaforms-hub/`
- **Estrutura**: Consolidado, normalizado, já processado
- **Campos principais**: ID, Nome, Maternidade, Procedimento, Data_Agendada_Sugerida
- **IDs**: 2505-2590 (range principal)
- **Status**: ARQUIVO ATUAL DO SISTEMA

### 2. **forms_fluxo_novo_raw.csv** (40 linhas)
- **Localização**: `/workspaces/gestaforms-hub/`
- **Estrutura**: Dados brutos do fluxo novo 2025
- **Delimitador**: ponto-e-vírgula (;)
- **IDs**: 2505, 2516, 2550, 2554, etc.
- **Status**: FONTE PRIMÁRIA - Fluxo Novo 2025

### 3. **public/csv-temp/forms_parto.csv** (93 linhas)
- **Localização**: `/workspaces/gestaforms-hub/public/csv-temp/`
- **Estrutura**: Formulários de parto completos com todos os campos do Google Forms
- **IDs**: 2449-2488+ (parece ser o arquivo "anteriores")
- **Campos**: 44 colunas incluindo campos de tempo, email, dados completos
- **Status**: ESTE É O ARQUIVO "ANTERIORES" QUE VOCÊ MENCIONOU

### 4. **public/csv-temp/forms_parto_pending.csv**
- **Localização**: `/workspaces/gestaforms-hub/public/csv-temp/`
- **Status**: Não analisado ainda

## CONCLUSÃO

**O arquivo que você estava procurando está em:**
```
/workspaces/gestaforms-hub/public/csv-temp/forms_parto.csv
```

Este arquivo tem 93 linhas e contém os registros anteriores (IDs 2449-2488+).

## Arquivos a Serem Utilizados

1. **forms_fluxo_novo_raw.csv** - 40 registros (Fluxo Novo 2025)
2. **public/csv-temp/forms_parto.csv** - 93 registros (Forms Anteriores)
3. **Consolidar em**: Novo arquivo limpo com todos os dados

## Próximo Passo

Processar ambos os arquivos e gerar CSV consolidado final.
