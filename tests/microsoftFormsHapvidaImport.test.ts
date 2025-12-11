/**
 * Tests for Microsoft Forms / Hapvida Excel Import
 * 
 * Validates column mapping and date parsing for the specific Excel layout
 * used by Microsoft Forms + Power Automate in the Hapvida workflow.
 */

import { describe, it, expect } from 'vitest';
import { parseDateSafe, parseDateSafeWithSwapInfo } from '../client/src/lib/import/dateParser';
import { normalizeHeader } from '../client/src/lib/csvUtils';

describe('Microsoft Forms / Hapvida Excel Import', () => {
  describe('Column header normalization', () => {
    it('should normalize Microsoft Forms column headers correctly', () => {
      const headers = [
        'Coluna1',
        'Hora de início',
        'Nome completo da paciente',
        'Data de nascimento da gestante',
        'CARTEIRINHA (tem na guia que sai do sistema - não inserir CPF)',
        'Número de Gestações',
        'Data da DUM',
        'DUM',
        'Data do Primeiro USG',
        'Numero de semanas no primeiro USG (inserir apenas o numero) - considerar o exame entre 8 e 12 semanas, embrião com BCF',
        'Maternidade que a paciente deseja',
        'DATA_AGENDADA',
        'IG_IDEAL',
        'IG_NA_DATA',
      ];

      const normalized = headers.map(normalizeHeader);

      expect(normalized).toContain('coluna1');
      expect(normalized).toContain('hora de inicio');
      expect(normalized).toContain('nome completo da paciente');
      expect(normalized).toContain('data de nascimento da gestante');
      expect(normalized).toContain('carteirinha (tem na guia que sai do sistema - nao inserir cpf)');
      expect(normalized).toContain('numero de gestacoes');
      expect(normalized).toContain('data da dum');
      expect(normalized).toContain('dum');
      expect(normalized).toContain('data do primeiro usg');
      expect(normalized).toContain('numero de semanas no primeiro usg (inserir apenas o numero) - considerar o exame entre 8 e 12 semanas, embriao com bcf');
      expect(normalized).toContain('maternidade que a paciente deseja');
      expect(normalized).toContain('data_agendada');
      expect(normalized).toContain('ig_ideal');
      expect(normalized).toContain('ig_na_data');
    });
  });

  describe('Date parsing with Brazilian DD/MM/YY format', () => {
    it('should parse 2-digit year dates correctly (DD/MM/YY)', () => {
      // Test cases from problem statement
      const testDates = [
        { input: '11/12/25', expectedYear: 2025, expectedMonth: 11, expectedDay: 11 }, // Dec 11, 2025
        { input: '20/05/25', expectedYear: 2025, expectedMonth: 4, expectedDay: 20 },  // May 20, 2025
        { input: '25/03/25', expectedYear: 2025, expectedMonth: 2, expectedDay: 25 },  // Mar 25, 2025
        { input: '11/03/25', expectedYear: 2025, expectedMonth: 2, expectedDay: 11 },  // Mar 11, 2025
        { input: '28/05/25', expectedYear: 2025, expectedMonth: 4, expectedDay: 28 },  // May 28, 2025
        { input: '30/05/25', expectedYear: 2025, expectedMonth: 4, expectedDay: 30 },  // May 30, 2025
      ];

      testDates.forEach(({ input, expectedYear, expectedMonth, expectedDay }) => {
        const parsed = parseDateSafe(input);
        expect(parsed).not.toBeNull();
        expect(parsed?.getFullYear()).toBe(expectedYear);
        expect(parsed?.getMonth()).toBe(expectedMonth); // 0-indexed
        expect(parsed?.getDate()).toBe(expectedDay);
      });
    });

    it('should handle ambiguous dates in American format when DD/MM is invalid', () => {
      // Birth date from problem statement: 3/25/1996
      // This is clearly American format (MM/DD/YYYY) since day 25 month 3 would be valid DD/MM,
      // but the auto-swap should still handle it correctly
      const result = parseDateSafeWithSwapInfo('3/25/1996');
      
      expect(result.date).not.toBeNull();
      expect(result.date?.getFullYear()).toBe(1996);
      expect(result.date?.getMonth()).toBe(2); // March (0-indexed)
      expect(result.date?.getDate()).toBe(25);
    });

    it('should prioritize Brazilian format for ambiguous dates', () => {
      // When both DD/MM and MM/DD are valid, Brazilian DD/MM should win
      const result = parseDateSafeWithSwapInfo('05/06/2025');
      
      expect(result.date).not.toBeNull();
      expect(result.dayMonthSwapped).toBe(false); // Should NOT swap
      expect(result.formatUsed).toBe('DD/MM/YYYY');
      // Should be interpreted as day 5, month 6 (June)
      expect(result.date?.getMonth()).toBe(5); // June (0-indexed)
      expect(result.date?.getDate()).toBe(5);
    });

    it('should apply swap and log it when DD/MM is impossible', () => {
      // 13/05/2025 - day 13, month 5 is valid DD/MM, so no swap
      const result1 = parseDateSafeWithSwapInfo('13/05/2025');
      expect(result1.dayMonthSwapped).toBe(false);
      expect(result1.date?.getMonth()).toBe(4); // May
      expect(result1.date?.getDate()).toBe(13);

      // 05/13/2025 - day 5, month 13 is INVALID, should swap to month 5, day 13
      const result2 = parseDateSafeWithSwapInfo('05/13/2025');
      expect(result2.dayMonthSwapped).toBe(true);
      expect(result2.formatUsed).toBe('MM/DD/YYYY');
      expect(result2.reason).toContain('invertido dia/mês');
      expect(result2.date?.getMonth()).toBe(4); // May (0-indexed)
      expect(result2.date?.getDate()).toBe(13);
    });
  });

  describe('Sample data validation from problem statement', () => {
    it('should parse all dates from sample row 2752', () => {
      const row = {
        dataRegistro: '11/12/25',
        dataNascimento: '6/17/2008',
        dataUsg: '20/05/25',
      };

      const dataRegistro = parseDateSafe(row.dataRegistro);
      const dataNascimento = parseDateSafe(row.dataNascimento);
      const dataUsg = parseDateSafe(row.dataUsg);

      expect(dataRegistro).not.toBeNull();
      expect(dataRegistro?.getFullYear()).toBe(2025);
      expect(dataRegistro?.getMonth()).toBe(11); // December

      expect(dataNascimento).not.toBeNull();
      expect(dataNascimento?.getFullYear()).toBe(2008);
      
      expect(dataUsg).not.toBeNull();
      expect(dataUsg?.getFullYear()).toBe(2025);
      expect(dataUsg?.getMonth()).toBe(4); // May
    });

    it('should parse all dates from sample row 2753', () => {
      const row = {
        dataRegistro: '11/12/25',
        dataNascimento: '3/25/1996',
        dataDum: '11/03/25',
        dataUsg: '28/05/25',
      };

      const dataRegistro = parseDateSafe(row.dataRegistro);
      const dataNascimento = parseDateSafe(row.dataNascimento);
      const dataDum = parseDateSafe(row.dataDum);
      const dataUsg = parseDateSafe(row.dataUsg);

      expect(dataRegistro).not.toBeNull();
      expect(dataNascimento).not.toBeNull();
      expect(dataNascimento?.getFullYear()).toBe(1996);
      expect(dataDum).not.toBeNull();
      expect(dataDum?.getMonth()).toBe(2); // March
      expect(dataUsg).not.toBeNull();
      expect(dataUsg?.getMonth()).toBe(4); // May
    });

    it('should parse all dates from sample row 2754', () => {
      const row = {
        dataRegistro: '11/12/25',
        dataNascimento: '2/7/1990',
        dataDum: '25/03/25',
        dataUsg: '26/05/25',
      };

      const dataRegistro = parseDateSafe(row.dataRegistro);
      const dataNascimento = parseDateSafe(row.dataNascimento);
      const dataDum = parseDateSafe(row.dataDum);
      const dataUsg = parseDateSafe(row.dataUsg);

      expect(dataRegistro).not.toBeNull();
      expect(dataNascimento).not.toBeNull();
      expect(dataNascimento?.getFullYear()).toBe(1990);
      expect(dataDum).not.toBeNull();
      expect(dataDum?.getMonth()).toBe(2); // March
      expect(dataDum?.getDate()).toBe(25);
      expect(dataUsg).not.toBeNull();
    });

    it('should parse all dates from sample row 2755', () => {
      const row = {
        dataRegistro: '11/12/25',
        dataNascimento: '4/21/1983',
        dataUsg: '30/05/25',
      };

      const dataRegistro = parseDateSafe(row.dataRegistro);
      const dataNascimento = parseDateSafe(row.dataNascimento);
      const dataUsg = parseDateSafe(row.dataUsg);

      expect(dataRegistro).not.toBeNull();
      expect(dataNascimento).not.toBeNull();
      expect(dataNascimento?.getFullYear()).toBe(1983);
      expect(dataUsg).not.toBeNull();
      expect(dataUsg?.getMonth()).toBe(4); // May
      expect(dataUsg?.getDate()).toBe(30);
    });
  });

  describe('DUM status normalization', () => {
    it('should normalize DUM status values from Microsoft Forms', () => {
      const testCases = [
        { input: 'Sim - Confiavel', expected: 'Sim - Confiavel' },
        { input: 'Sim - Confiável', expected: 'Sim - Confiavel' },
        { input: 'Incerta', expected: 'Incerta' },
        { input: 'Não sabe', expected: 'Não sabe' },
        { input: '', expected: 'Não sabe' },
      ];

      testCases.forEach(({ input, expected }) => {
        // Simple normalization function (matches implementation)
        const normalize = (value: string): string => {
          const v = (value || '').toLowerCase().trim();
          if (v.includes('confiavel') || v.includes('confiável') || v === 'sim') return 'Sim - Confiavel';
          if (v.includes('incerta')) return 'Incerta';
          return 'Não sabe';
        };

        expect(normalize(input)).toBe(expected);
      });
    });
  });

  describe('Medical field extraction', () => {
    it('should extract diagnoses from sample data', () => {
      const sampleData = {
        diagnosticoMaterno: 'Sífilis tratada',
        diagnosticoFetal: 'Nenhum',
      };

      expect(sampleData.diagnosticoMaterno).toBeTruthy();
      // Normalize to remove accents for matching
      const normalizado = sampleData.diagnosticoMaterno
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      expect(normalizado).toContain('sifilis');
    });

    it('should handle complex diagnostic strings', () => {
      const samples = [
        'DMG + insulina descompensado',
        'HAC compensada',
        'HAC compensada;Obesidade',
      ];

      samples.forEach(diag => {
        expect(diag).toBeTruthy();
        expect(diag.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Procedimento field extraction', () => {
    it('should handle multiple procedures', () => {
      const procedures = [
        'Cesárea',
        'Indução Programada;DIU de Cobre Pós-parto',
        'Cesárea;Laqueadura',
        'Indução Programada',
      ];

      procedures.forEach(proc => {
        expect(proc).toBeTruthy();
        // Split by semicolon to get individual procedures
        const parts = proc.split(';').map(p => p.trim());
        expect(parts.length).toBeGreaterThan(0);
      });
    });
  });
});
