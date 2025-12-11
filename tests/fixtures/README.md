# Test Fixtures for Microsoft Forms / Hapvida Excel Import

## microsoft-forms-hapvida-sample.tsv

This file contains sample data in the exact format exported by Microsoft Forms + Power Automate in the Hapvida workflow.

### How to Use

1. **Via Web Interface:**
   - Navigate to "Importar Pacientes via Tabela" in the application
   - Click "Carregar CSV" button
   - Select this TSV file
   - The system will automatically detect and map all columns
   - Review the imported data and click "Processar Dados"

2. **For Testing:**
   - This file is used by the automated tests in `tests/microsoftFormsHapvidaImport.test.ts`
   - Contains 4 real sample rows from the problem statement

### Sample Data Description

The file contains 4 patient records (rows 2752-2755) with:

- **Row 2752:** Hellen Natália Silva Brito
  - USG-based calculation (DUM incerta)
  - Diagnosis: Sífilis tratada
  - Procedure: Cesárea
  - Maternidade: Salvalus

- **Row 2753:** Maria de Fátima de Jesus Souza Melo
  - DUM confiável
  - Diagnosis: DMG + insulina descompensado
  - Procedure: Indução Programada + DIU
  - Maternidade: Salvalus

- **Row 2754:** Camila Silvestre Lima Matoba
  - DUM confiável
  - Diagnosis: HAC compensada
  - Procedure: Indução Programada
  - Maternidade: NotreCare

- **Row 2755:** Solange Neves de Sousa
  - DUM não sabe
  - Diagnosis: HAC compensada + Obesidade
  - Procedure: Cesárea + Laqueadura
  - Maternidade: NotreCare

### Key Features Tested

✅ Column header normalization (40+ columns)
✅ Brazilian date format with 2-digit years (DD/MM/YY)
✅ American date format for birth dates (MM/DD/YYYY)
✅ DUM status normalization ("Sim - Confiavel", "Incerta", "Não sabe")
✅ Multiple procedures separated by semicolon
✅ Complex diagnostic strings
✅ Phone number formats
✅ Free-text USG descriptions

### Expected Import Behavior

1. All 4 rows should be imported successfully
2. Dates should be parsed correctly:
   - `11/12/25` → December 11, 2025
   - `20/05/25` → May 20, 2025
   - `3/25/1996` → March 25, 1996 (auto-detected as MM/DD)
3. DUM status should be normalized to internal format
4. Procedures should be split into arrays
5. Gestational ages should be calculated
6. Appointment dates should be scheduled based on protocols
