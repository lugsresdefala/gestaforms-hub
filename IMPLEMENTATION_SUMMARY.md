# Microsoft Forms / Hapvida Excel Import - Implementation Summary

## Overview

This implementation adds **complete support** for the Microsoft Forms + Power Automate Excel layout used in the Hapvida workflow. The system can now import Excel files with 40+ columns directly without manual adjustments.

## What Was Implemented

### 1. Frontend Import (CSV/TSV Upload)
**File:** `client/src/pages/ImportarPorTabela.tsx`

- Added comprehensive column mapping for all Microsoft Forms/Hapvida headers
- Supports long descriptive headers (e.g., `"CARTEIRINHA (tem na guia que sai do sistema - não inserir CPF)"`)
- Automatically normalizes headers (removes accents, converts to lowercase)
- Maps 40+ columns to internal schema

### 2. Backend Webhook (Power Automate Integration)
**File:** `supabase/functions/webhook-excel/index.ts`

- Created `normalizePayload()` function to handle multiple formats
- Supports both legacy format and new Microsoft Forms format
- Extracts all fields including:
  - Patient demographics
  - Obstetric history (gestations, deliveries, abortions)
  - Medical history and medications
  - Diagnostic information
  - Procedure details
  - Hospital preferences

### 3. Date Parsing Enhancements
**Files:** Already existed in `client/src/lib/import/dateParser.ts`

- ✅ Brazilian format with 2-digit years: `11/12/25` → December 11, 2025
- ✅ Year interpretation: 00-50 = 2000s, 51-99 = 1900s
- ✅ Auto-swap: Detects when DD/MM is invalid and tries MM/DD
- ✅ Audit logging: All date corrections are logged with `parseDateSafeWithSwapInfo`

### 4. Documentation
**Files:** `docs/DATA_DICTIONARY.md`, `docs/CSV_IMPORT_GUIDE.md`

- Complete column mapping table
- Date format examples
- Troubleshooting guide
- Import workflow description

### 5. Testing
**File:** `tests/microsoftFormsHapvidaImport.test.ts`

- 13 comprehensive tests covering:
  - Column header normalization
  - Date parsing (DD/MM/YY and MM/DD/YYYY)
  - Sample data from all 4 rows in problem statement
  - DUM status normalization
  - Medical field extraction
- **All tests passing ✅**

### 6. Sample Data
**File:** `tests/fixtures/microsoft-forms-hapvida-sample.tsv`

- Real sample data from problem statement (rows 2752-2755)
- Ready for manual testing via web interface

## How to Use

### Via Web Interface (CSV/TSV Import)

1. Navigate to **"Importar Pacientes via Tabela"**
2. Click **"Carregar CSV"** button
3. Select your Excel file (exported as CSV/TSV)
4. The system will automatically:
   - Detect and normalize column headers
   - Map all 40+ columns to internal fields
   - Parse dates with auto-swap detection
5. Review imported data
6. Click **"Processar Dados"** to calculate gestational ages
7. Click **"Salvar no Banco"** to persist records

### Via Webhook (Power Automate)

The webhook at `supabase/functions/webhook-excel` automatically processes Excel data sent by Power Automate. The `normalizePayload()` function handles both legacy and new formats.

**Endpoint:** `/functions/v1/webhook-excel`
**Method:** POST
**Auth:** `x-webhook-secret: hapvida_forms_2025`

## Supported Column Headers

The system recognizes these Microsoft Forms / Hapvida column headers:

| Excel Column | Internal Field | Example Value |
|--------------|----------------|---------------|
| `Hora de início` | `data_registro` | `11/12/25` |
| `Nome completo da paciente` | `nome_completo` | `Maria Silva` |
| `Data de nascimento da gestante` | `data_nascimento` | `3/25/1996` |
| `CARTEIRINHA (...)` | `carteirinha` | `3010T000767000` |
| `DUM` | `dum_status` | `Sim - Confiavel` |
| `Data da DUM` | `data_dum` | `11/03/25` |
| `Data do Primeiro USG` | `data_primeiro_usg` | `20/05/25` |
| `Numero de semanas no primeiro USG...` | `semanas_usg` | `5` |
| `Numero de dias no primeiro USG...` | `dias_usg` | `5` |
| `USG mais recente (...)` | `usg_recente` | Free text |
| `Maternidade que a paciente deseja` | `maternidade` | `Salvalus` |
| `Médico responsável pelo agendamento` | `medico_responsavel` | `Patricia Varella` |
| `Informe o procedimento(s)...` | `procedimentos` | `Cesárea;Laqueadura` |
| `Indique os Diagnósticos Obstétricos Maternos...` | `diagnosticos_maternos` | `HAC compensada` |
| `Indique os Diagnósticos Fetais :` | `diagnosticos_fetais` | `GIG` |

*See full list in `docs/DATA_DICTIONARY.md` → Microsoft Forms / Hapvida Excel Layout section*

## Date Formats

### Brazilian Format (Primary)
- **Format:** `DD/MM/YY`
- **Examples:**
  - `11/12/25` → December 11, 2025
  - `20/05/25` → May 20, 2025
  - `25/03/25` → March 25, 2025

### American Format (Auto-detected for Birth Dates)
- **Format:** `MM/DD/YYYY`
- **Examples:**
  - `3/25/1996` → March 25, 1996
  - `6/17/2008` → June 17, 2008

### Auto-Swap Logic
When DD/MM/YYYY is invalid (e.g., month > 12), the system automatically tries MM/DD/YYYY and logs the correction:

```
Input: "05/13/2025"
DD/MM: Invalid (month 13)
MM/DD: Valid (May 13, 2025) ✅
Result: Date corrected with swap logged
```

## Validation & Error Handling

### Required Fields
Only two fields are required:
- `nome_completo` (Patient name)
- `carteirinha` (Insurance card)

All other fields have defaults or can be empty.

### Date Validation
- Dates must be after 1920
- Invalid dates are logged but don't block import
- Date corrections are logged in audit trail

### DUM Status Normalization
The system normalizes these values:
- `"Sim - Confiavel"`, `"Sim"`, `"confiável"` → `"Sim - Confiavel"`
- `"Incerta"` → `"Incerta"`
- `"Não sabe"`, empty → `"Não sabe"`

## Testing

### Automated Tests
```bash
npm test -- microsoftFormsHapvidaImport.test.ts
```

Expected output: **13 tests passing ✅**

### Manual Testing
1. Use sample file: `tests/fixtures/microsoft-forms-hapvida-sample.tsv`
2. Import via web interface
3. Verify 4 patient records are processed correctly

## Troubleshooting

### Issue: Dates not parsing correctly
**Solution:** 
- Check if dates are in DD/MM/YY or MM/DD/YYYY format
- The system prioritizes Brazilian format but handles both
- Check console for date correction logs

### Issue: Column not recognized
**Solution:**
- Header normalization removes accents and special characters
- Verify column name in `ImportarPorTabela.tsx` column mapping
- Add new alias if needed

### Issue: DUM status not recognized
**Solution:**
- Ensure value is one of: "Sim - Confiavel", "Incerta", or "Não sabe"
- Case-insensitive matching is supported

### Issue: Multiple procedures not split
**Solution:**
- Procedures should be separated by semicolon (`;`)
- Example: `"Cesárea;Laqueadura"`

## Files Changed

### Modified
1. `client/src/pages/ImportarPorTabela.tsx` - Added column aliases
2. `supabase/functions/webhook-excel/index.ts` - Added normalizePayload()
3. `docs/DATA_DICTIONARY.md` - Added MS Forms/Hapvida section
4. `docs/CSV_IMPORT_GUIDE.md` - Added examples

### Created
1. `tests/microsoftFormsHapvidaImport.test.ts` - Test suite
2. `tests/fixtures/microsoft-forms-hapvida-sample.tsv` - Sample data
3. `tests/fixtures/README.md` - Fixture documentation
4. `IMPLEMENTATION_SUMMARY.md` - This file

## Next Steps (Optional Enhancements)

While the current implementation is complete and production-ready, potential future enhancements could include:

1. **Excel Direct Import:** Currently requires CSV/TSV export. Could add native Excel file parsing.
2. **Column Mapping UI:** Visual interface to map custom column names.
3. **Import Templates:** Save/load column mapping presets.
4. **Bulk Validation Report:** Pre-import validation summary.
5. **Date Format Auto-Detection:** More sophisticated date format detection.

## Support

For issues or questions:
1. Check `docs/CSV_IMPORT_GUIDE.md` for usage examples
2. Check `docs/DATA_DICTIONARY.md` for field definitions
3. Run tests to verify functionality: `npm test`
4. Review GitHub issues in `lugsresdefala/gestaforms-hub`

---

**Status:** ✅ Implementation Complete and Production Ready
**Tests:** ✅ All 13 tests passing
**Documentation:** ✅ Complete with examples
**Sample Data:** ✅ Ready for manual testing
