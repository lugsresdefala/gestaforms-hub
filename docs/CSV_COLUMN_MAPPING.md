# CSV Import Column Mapping Reference

## Quick Reference: Google Forms → System Fields

This document shows the exact mapping between Google Forms export columns and internal system fields.

### Primary Fields (Required)

| Google Forms Column | Normalized | System Field | Type |
|---------------------|-----------|--------------|------|
| Hora de início | `hora de inicio` | `data_registro` | Timestamp |
| Nome completo da paciente | `nome completo da paciente` | `nome_completo` | Text |
| Data de nascimento da gestante | `data de nascimento da gestante` | `data_nascimento` | Date |
| CARTEIRINHA (tem na guia que sai do sistema - não inserir CPF) | `carteirinha (...)` | `carteirinha` | Text |

### Obstetric History

| Google Forms Column | Normalized | System Field | Type |
|---------------------|-----------|--------------|------|
| Número de Gestações | `numero de gestacoes` | `numero_gestacoes` | Number |
| Número de Partos Cesáreas | `numero de partos cesareas` | `numero_partos_cesareas` | Number |
| Número de Partos Normais | `numero de partos normais` | `numero_partos_normais` | Number |
| Número de Partos abortos | `numero de partos abortos` | `numero_abortos` | Number |

### Contact Information

| Google Forms Column | Normalized | System Field | Type |
|---------------------|-----------|--------------|------|
| Informe dois telefones de contato... | `informe dois telefones...` | `telefones` | Text |
| E-mail da paciente | `e-mail da paciente` | `email_paciente` | Email |

### Medical Information - DUM/USG

| Google Forms Column | Normalized | System Field | Type |
|---------------------|-----------|--------------|------|
| DUM | `dum` | `dum_status` | Text |
| Data da DUM | `data da dum` | `data_dum` | Date |
| Data do Primeiro USG | `data do primeiro usg` | `data_primeiro_usg` | Date |
| Numero de semanas no primeiro USG (inserir apenas o numero)... | `numero de semanas...` | `semanas_usg` | Number |
| Numero de dias no primeiro USG (inserir apenas o numero)... | `numero de dias...` | `dias_usg` | Number |
| USG mais recente (Inserir data, apresentação, PFE com percentil...) | `usg mais recente...` | `usg_recente` | Text |

### Procedure Information

| Google Forms Column | Normalized | System Field | Type |
|---------------------|-----------|--------------|------|
| Informe o procedimento(s) que será(ão) realizado(s) | `informe o procedimento(s)...` | `procedimentos` | Text |
| Informe IG pretendida para o procedimento... | `informe ig pretendida...` | `ig_pretendida` | Text |
| Indicação do Procedimento: | `indicacao do procedimento:` | `indicacao_procedimento` | Text |

### Clinical Diagnoses

| Google Forms Column | Normalized | System Field | Type |
|---------------------|-----------|--------------|------|
| Indique os Diagnósticos Obstétricos Maternos ATUAIS: | `indique os diagnosticos obstetricos maternos atuais:` | `diagnosticos_maternos` | Text |
| Indique os Diagnósticos Fetais : | `indique os diagnosticos fetais :` | `diagnosticos_fetais` | Text |
| Placenta previa centro total com acretismo confirmado ou suspeito | `placenta previa...` | `placenta_previa` | Yes/No |

### Additional Information

| Google Forms Column | Normalized | System Field | Type |
|---------------------|-----------|--------------|------|
| Indique qual medicação e dosagem que a paciente utiliza. | `indique qual medicacao...` | `medicacao` | Text |
| Informe História Obstétrica Prévia Relevante... | `informe historia obstetrica...` | `historia_obstetrica` | Text |
| Necessidade de reserva de UTI materna | `necessidade de reserva de uti materna` | `necessidade_uti_materna` | Yes/No |
| Necessidade de reserva de Sangue | `necessidade de reserva de sangue` | `necessidade_reserva_sangue` | Yes/No |
| Maternidade que a paciente deseja | `maternidade que a paciente deseja` | `maternidade` | Text |
| Médico responsável pelo agendamento | `medico responsavel pelo agendamento` | `medico_responsavel` | Text |

## Example Mapping Process

### Input (Google Forms Export)
```csv
Hora de início,Nome completo da paciente,CARTEIRINHA,Número de Gestações
12/5/2025 8:45:50,Maria Silva Santos,ABC123456,2
```

### Step 1: Header Normalization
```
"Hora de início" → "hora de inicio"
"Nome completo da paciente" → "nome completo da paciente"
"CARTEIRINHA" → "carteirinha"
"Número de Gestações" → "numero de gestacoes"
```

### Step 2: Field Mapping
```javascript
{
  "hora de inicio": "data_registro",
  "nome completo da paciente": "nome_completo",
  "carteirinha": "carteirinha",
  "numero de gestacoes": "numero_gestacoes"
}
```

### Step 3: Data Import
```javascript
{
  data_registro: "12/5/2025 8:45:50",
  nome_completo: "Maria Silva Santos",
  carteirinha: "ABC123456",
  numero_gestacoes: "2"
}
```

## Normalization Rules

The system applies the following transformations to column headers:

1. **Convert to lowercase**
   - `Número de Gestações` → `número de gestações`

2. **Remove accents (NFD normalization)**
   - `número de gestações` → `numero de gestacoes`

3. **Trim whitespace**
   - `  Nome completo  ` → `nome completo`

4. **Remove quotes**
   - `"Carteirinha"` → `carteirinha`

5. **Normalize multiple spaces**
   - `Nome    completo` → `nome completo`

## Supported Variations

The system recognizes multiple variations of each column header. Examples:

### For "Nome Completo"
- ✅ `Nome completo da paciente`
- ✅ `Nome completo`
- ✅ `Nome`
- ✅ `NOME COMPLETO`
- ✅ `nome completo da paciente`

### For "Carteirinha"
- ✅ `CARTEIRINHA (tem na guia que sai do sistema - não inserir CPF)`
- ✅ `Carteirinha`
- ✅ `CARTEIRINHA`
- ✅ `carteirinha`

### For "DUM Status"
- ✅ `DUM`
- ✅ `A DUM é`
- ✅ `DUM status`
- ✅ `dum`

## Special Cases

### Timestamp Fields
The system recognizes various timestamp formats:
- `Hora de início` (Google Forms Portuguese)
- `Carimbo de data/hora` (Google Forms Portuguese alternative)
- `Timestamp` (English)
- `Data registro` (Short form)

### Procedure Fields
Long descriptive headers are fully supported:
- `Informe o procedimento(s) que será(ão) realizado(s)` (Full)
- `Procedimentos` (Short)
- `Procedimento` (Singular)

### USG Fields with Instructions
Even with long instructions, the system recognizes:
- `Numero de semanas no primeiro USG (inserir apenas o numero) - considerar o exame entre 8 e 12 semanas, embrião com BCF`
- `Semanas no 1 USG`
- `Semanas USG`
- `Semanas`

## Troubleshooting

### Column Not Recognized?

1. **Check the CSV file encoding**
   - Must be UTF-8
   - Portuguese characters must be preserved

2. **Verify column header matches one of the variations**
   - Compare with the mapping table above
   - Try using a shorter form if available

3. **Check for typos**
   - Even with normalization, the base words must match
   - Example: "Gestalões" won't match "Gestações"

4. **Test with simpler headers**
   - Use short form headers like "Nome completo", "Carteirinha", etc.
   - Once working, gradually add more complex headers

### Data Not Importing?

1. **Verify required fields are present**
   - At minimum: `Nome completo` and `Carteirinha`
   - System will reject rows without these

2. **Check date formats**
   - Must be DD/MM/YYYY (e.g., 15/03/2024)
   - Not MM/DD/YYYY or YYYY-MM-DD

3. **Verify delimiter**
   - System auto-detects tabs or commas
   - Mixed delimiters will cause issues

## Adding New Column Mappings

If you need to add support for a new column header variation:

1. Edit `client/src/pages/ImportarPorTabela.tsx`
2. Find the `columnMap` object
3. Add your mapping (use normalized form as key):

```typescript
const columnMap: Record<string, keyof PacienteRow> = {
  // ... existing mappings ...
  'your new header normalized': 'field_name',
};
```

4. Test with actual CSV file
5. Add test case to `tests/csvHeaderNormalization.test.ts`

## References

- Full Documentation: `docs/CSV_IMPORT_GUIDE.md`
- Test Suite: `tests/csvHeaderNormalization.test.ts`
- Utility Functions: `client/src/lib/csvUtils.ts`
- Import Handler: `client/src/pages/ImportarPorTabela.tsx`
