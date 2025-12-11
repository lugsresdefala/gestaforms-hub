# CSV Import Guide - GestaForms Hub

## Overview
The GestaForms Hub system supports importing patient appointment data from CSV/TSV files, with special support for Google Forms exports in Brazilian Portuguese.

## Supported CSV Formats

### 1. Google Forms Export (Primary)
The system automatically detects and processes Google Forms exports with Portuguese column headers. The import handler is flexible and accepts:

- Long-form descriptive headers (as exported from Google Forms)
- Short-form headers
- Headers with or without accents
- Headers with special characters and parentheses

### 2. Microsoft Forms / Hapvida Excel Export
**NEW:** Full support for the Microsoft Forms + Power Automate Excel layout used in the Hapvida workflow. This layout includes specific column headers like:

- `Coluna1` - Row number (automatically handled)
- `Hora de início` - Timestamp
- `Nome completo da paciente` - Patient name
- `CARTEIRINHA (tem na guia que sai do sistema - não inserir CPF)` - Insurance card
- `Data da DUM` - Last menstrual period date
- `DUM` - DUM status (text: "Sim - Confiavel", "Incerta", "Não sabe")
- `Data do Primeiro USG` - First ultrasound date
- `Numero de semanas no primeiro USG (inserir apenas o numero)...` - Weeks at first USG
- `Numero de dias no primeiro USG (inserir apenas o numero)...` - Days at first USG
- `USG mais recente (...)` - Most recent ultrasound description
- `Maternidade que a paciente deseja` - Preferred maternity hospital
- `Médico responsável pelo agendamento` - Responsible physician
- `DATA_AGENDADA` - Scheduled date (calculated field)
- `IG_IDEAL` - Ideal gestational age (calculated field)
- `IG_NA_DATA` - Gestational age at scheduled date (calculated field)

**Date Format Support:**
- Brazilian format with 2-digit years: `11/12/25` → December 11, 2025
- Automatic year interpretation: years 00-50 → 2000s, years 51-99 → 1900s
- Mixed formats: Birth dates may come in American format (`3/25/1996`), automatically detected
- Auto-swap: When DD/MM is invalid (e.g., month > 12), automatically tries MM/DD
- All date corrections are logged for audit trail

### 3. Custom CSV/TSV
Standard delimiter-separated files with tab (`\t`) or comma (`,`) separation.

## Column Mapping

### Required Fields
- **Nome completo da paciente** / Nome completo / Nome → Patient's full name
- **CARTEIRINHA** / Carteirinha → Insurance card number

### Important Medical Fields
- **Hora de início** / Carimbo de data/hora → Registration timestamp
- **Data de nascimento da gestante** / Data de nascimento → Birth date
- **Data da DUM** → Last menstrual period date
- **DUM** / A DUM é → DUM status (Sim - Confiavel / Incerta / Não sabe)
- **Data do Primeiro USG** → First ultrasound date
- **Numero de semanas no primeiro USG** → Weeks at first ultrasound
- **Numero de dias no primeiro USG** → Days at first ultrasound
- **IG pretendida** → Intended gestational age for procedure

### Obstetric History
- **Número de Gestações** / Gestações → Number of pregnancies
- **Número de Partos Cesáreas** / Partos cesáreas → Number of C-sections
- **Número de Partos Normais** / Partos normais → Number of vaginal births
- **Número de Partos abortos** / Abortos → Number of miscarriages

### Clinical Information
- **Indicação do Procedimento** / Indicação → Procedure indication
- **Indique os Diagnósticos Obstétricos Maternos ATUAIS** / Diagnósticos maternos → Maternal diagnoses
- **Indique os Diagnósticos Fetais** / Diagnósticos fetais → Fetal diagnoses
- **História Obstétrica Prévia Relevante** / História obstétrica → Obstetric history
- **Medicação** / Indique qual medicação → Current medications

### Additional Information
- **Telefones** / Informe dois telefones de contato → Contact phone numbers
- **Procedimentos** / Informe o procedimento(s) → Procedures to be performed
- **Maternidade que a paciente deseja** / Maternidade → Preferred maternity hospital
- **Médico responsável pelo agendamento** / Médico → Responsible physician
- **E-mail da paciente** / Email → Patient's email

### Optional Fields
- **Placenta prévia** → Placenta previa status (Sim/Não)
- **Necessidade de UTI materna** / UTI → Need for maternal ICU (Sim/Não)
- **Necessidade de reserva de Sangue** / Sangue → Need for blood reserve (Sim/Não)
- **USG mais recente** → Most recent ultrasound description

## How to Import

### Via Web Interface
1. Navigate to "Importar Pacientes via Tabela"
2. Click "Carregar CSV" button
3. Select your CSV/TSV file
4. System automatically detects column headers and maps fields
5. Review imported data in the table
6. Click "Processar Dados" to calculate gestational ages and scheduling
7. Click "Salvar no Banco" to persist validated records

### Supported File Formats
- `.csv` - Comma-separated values
- `.txt` - Tab-separated values (TSV)

### File Encoding
- UTF-8 (recommended)
- System automatically handles Portuguese characters (á, é, í, ó, ú, ã, õ, ç)

## Data Processing Flow

1. **Import** → CSV file loaded and headers normalized
2. **Mapping** → Columns automatically mapped to internal fields
3. **Validation** → Date coherence checks and required field validation
4. **Calculation** → Gestational age calculation using DUM or USG data
5. **Protocol Detection** → Medical protocol applied based on diagnoses
6. **Scheduling** → Ideal appointment date calculated
7. **Review** → Manual review of any detected issues
8. **Persistence** → Validated records saved to database

## Column Header Normalization

The system automatically normalizes column headers by:
- Converting to lowercase
- Removing accents (á→a, é→e, í→i, ó→o, ú→u, ã→a, õ→o, ç→c)
- Trimming whitespace
- Removing quotes
- Preserving parenthetical content

This means all of these are equivalent:
- `Número de Gestações`
- `numero de gestacoes`
- `NUMERO DE GESTACOES`
- `"Número de Gestações"`

## Example CSV Formats

### Minimal Example (Tab-separated)
```
Nome completo	Carteirinha	Data de nascimento	DUM	Data da DUM
Maria Silva	ABC123456	01/01/1990	Sim - Confiavel	15/03/2024
```

### Full Google Forms Export
```
Hora de início	Nome completo da paciente	Data de nascimento da gestante	CARTEIRINHA	Número de Gestações	...
12/5/2025 8:45:50	Maria Silva	01/01/1990	ABC123456	1	...
```

### Microsoft Forms / Hapvida Excel Export
```
Coluna1	Hora de início	Nome completo da paciente	Data de nascimento da gestante	CARTEIRINHA (tem na guia que sai do sistema - não inserir CPF)	Número de Gestações	Paridade (G, Pn, Pc, A, Ectopica)	Número de Partos Cesáreas	Número de Partos Normais	Número de Partos abortos	Informe dois telefones de contato com o paciente para que ele seja contato pelo hospital	Informe o procedimento(s) que será(ão) realizado(s)	DUM	Data da DUM	Data do Primeiro USG	Numero de semanas no primeiro USG (inserir apenas o numero) - considerar o exame entre 8 e 12 semanas, embrião com BCF	Numero de dias no primeiro USG (inserir apenas o numero)- considerar o exame entre 8 e 12 semanas, embrião com BCF	USG mais recente (Inserir data, apresentação, PFE com percentil, ILA/MBV e doppler)	Informe IG pretendida para o procedimento  * Não confirmar essa data para a paciente, dependendo da agenda hospitalar poderemos ter uma variação * Para laqueaduras favor colocar data que completa 60 d	Indicação do Procedimento:	Indique os Diagnósticos Obstétricos Maternos ATUAIS:	Indique qual medicação e dosagem que a paciente utiliza.	Necessidade de cuidados neonatais diferenciados	Indique os Diagnósticos Fetais :	Placenta previa centro total com acretismo confirmado ou suspeito	Informe História Obstétrica Prévia Relevante e Diagnósticos clínicos cirúrgicos (ex. Aborto tardio, parto prematuro,  óbito fetal, macrossomia, eclampsia, pré eclampsia precoce, cardiopatia - especifi	Necessidade de reserva de UTI materna	Necessidade de reserva de Sangue	Maternidade que a paciente deseja	Médico responsável pelo agendamento	E-mail da paciente	DPP DUM	DPP USG	Idade	Dra Juliana	PGS	DATA_AGENDADA	IG_IDEAL	IG_NA_DATA	Fluxo encerrado
2752	11/12/25	Hellen Natália Silva Brito	6/17/2008	3010T000767000		2G 1A				(11) 95162-4179 (11) 8798-0443	Cesárea	Incerta		20/05/25	5	5	03/12/2025 - 33 3/7 semanas, PE 2123g, pctl 41, Ila e Doppler normais	39	Desejo materno	Sífilis tratada	SF + AF 	Não	Nenhum	Não	Sífilis tratada, 1 abortamento anterior 	Não	Não	Salvalus	Patricia Varella		06/10/00	15/01/26	17
```

## Troubleshooting

### Common Issues

**Issue**: "Nenhum registro válido encontrado no CSV"
- **Solution**: Ensure at least Nome completo and Carteirinha columns are present and filled

**Issue**: Column not recognized
- **Solution**: Check that column name matches one of the supported variations (with or without accents)

**Issue**: Date format errors
- **Solution**: Use DD/MM/YYYY format for all dates (e.g., 15/03/2024)

**Issue**: "Datas incoerentes"
- **Solution**: Review and correct DUM, USG dates through the interactive correction modal

### Date Format Rules
- **DUM**: DD/MM/YYYY (e.g., 15/03/2024)
- **USG Date**: DD/MM/YYYY (e.g., 20/04/2024)
- **Birth Date**: DD/MM/YYYY (e.g., 01/01/1990)
- **Timestamp**: DD/MM/YYYY HH:MM:SS or variations

### DUM Status Values
- `Sim - Confiavel` or `Sim` → Reliable DUM
- `Incerta` → Uncertain DUM
- `Não sabe` or empty → Unknown DUM

## Best Practices

1. **Always include required fields** (Nome completo, Carteirinha)
2. **Use consistent date formats** (DD/MM/YYYY)
3. **Provide DUM status** to help system choose calculation method
4. **Include diagnostic information** for proper protocol detection
5. **Review validation warnings** before saving
6. **Export results** after processing for record-keeping

## Advanced Features

### Batch Processing
- Import up to 100 records at once
- Automatic protocol detection per patient
- Capacity-aware scheduling (respects hospital limits)
- Priority-based slot allocation (cerclagem and high-risk cases first)

### Data Validation
- Automatic date coherence checking
- Interactive correction modal for inconsistencies
- Required field validation
- Email format validation
- Phone number validation (Brazilian format)

### Export Options
- Export processed data to Excel (.xlsx)
- Includes calculated fields (IG, scheduled date, protocol)
- Color-coded status indicators
- Complete audit trail

## Related Documentation
- See `FLUXO_VALIDACAO.md` for validation rules
- See `DIAGNOSTICOS-SUPORTADOS.md` for supported diagnoses
- See `DATA_DICTIONARY.md` for field definitions

## Support
For issues or questions about CSV import, contact the system administrator or check the GitHub repository issues.
