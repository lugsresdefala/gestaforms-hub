# Scripts de Importação de Agendamentos

Scripts Node.js para importar agendamentos obstétricos para o Supabase.

## Scripts Disponíveis

### export-agendamentos-mensais.js
Exporta agendamentos aprovados para planilhas XLSX, organizados por maternidade e mês.

**Uso:**
```bash
# Buscar dados do Supabase
npm run export:agendamentos-mensais
node scripts/export-agendamentos-mensais.js

# Usando um arquivo CSV como fonte de dados
node scripts/export-agendamentos-mensais.js --csv caminho/para/arquivo.csv
```

**Saída:** 
- Planilhas XLSX na pasta `exports/`
- Formato: `agendamentos_[Maternidade]_[Mês]_[Ano].xlsx`
- Maternidades: Guarulhos, NotreCare, Salvalus, Cruzeiro
- Período: Novembro/2025 a Janeiro/2026

**Características:**
- Formatação Excel com cabeçalhos estilizados
- Datas no formato DD/MM/YYYY
- Arrays JSON convertidos para texto legível
- Ordenação por data e nome
- Estatísticas de exportação no console

### importar_cruzeiro_dez_2025.js
Importa agenda Maternidade Cruzeiro - Dezembro/2025

**Uso:**
```bash
node scripts/importar_cruzeiro_dez_2025.js
```

**Dados:** 7 agendamentos (01/12 a 09/12/2025)

### importar_forms_pacientes.js  
Importa 60 pacientes de formulários (IDs 2449-2514)

**Uso:**
```bash
node scripts/importar_forms_pacientes.js
```

**Dados:** 48 aprovados + 12 pendentes (urgentes)

## Funcionalidades

- Parser inteligente de datas (detecta inversão DD/MM)
- Classificação automática de procedimentos
- Tratamento de pacientes urgentes (sem tolerância +7 dias)
- Inserção em lotes de 50 registros

## Requisitos

```bash
npm install @supabase/supabase-js xlsx
```

## Resultados

Após execução, exibe:
- Total de registros processados
- Aprovados vs Pendentes
- Lotes inseridos
- Total geral no banco

## Data de Criação

17/11/2025 - 343 agendamentos totais após importações
