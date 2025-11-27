/**
 * Unit Tests for the new modular import structure
 *
 * Tests cover the new module organization:
 * - dateParser: Date parsing functions
 * - gestationalCalculator: Gestational age and DPP calculations
 * - tsvProcessor: TSV file processing
 * - types: TypeScript types
 *
 * Run with: npm run test
 */

import { describe, it, expect } from 'vitest';

// Import from the new modular structure
import {
  parseDateSafe,
  isPlaceholderDate,
  sanitizeDateToISO,
  createValidDate,
  MIN_VALID_YEAR_THRESHOLD
} from '../src/lib/import/dateParser';

import {
  gaFromDumAt,
  gaFromUsgAt,
  dppFromDum,
  dppFromGaDays,
  formatGa,
  chooseAndCompute,
  FULL_TERM_DAYS_CONSTANT
} from '../src/lib/import/gestationalCalculator';

import { processTsvContent } from '../src/lib/import/tsvProcessor';

// Import from barrel export
import * as ImportModule from '../src/lib/import';

describe('dateParser module', () => {
  describe('parseDateSafe', () => {
    it('should parse Brazilian date format (DD/MM/YYYY)', () => {
      const result = parseDateSafe('15/03/2024');
      expect(result).not.toBeNull();
      expect(result?.getFullYear()).toBe(2024);
      expect(result?.getMonth()).toBe(2); // March = 2 (0-indexed)
      expect(result?.getDate()).toBe(15);
    });

    it('should prioritize DD/MM/YYYY for ambiguous dates', () => {
      const result = parseDateSafe('05/12/2024');
      expect(result).not.toBeNull();
      expect(result?.getMonth()).toBe(11); // December = 11 (0-indexed)
      expect(result?.getDate()).toBe(5);
    });

    it('should parse ISO format (YYYY-MM-DD)', () => {
      const result = parseDateSafe('2024-03-15');
      expect(result).not.toBeNull();
      expect(result?.getFullYear()).toBe(2024);
      expect(result?.getMonth()).toBe(2);
      expect(result?.getDate()).toBe(15);
    });

    it('should return null for placeholder dates', () => {
      expect(parseDateSafe('10/6/1900')).toBeNull();
      expect(parseDateSafe('1900-01-01')).toBeNull();
    });

    it('should return null for invalid inputs', () => {
      expect(parseDateSafe('')).toBeNull();
      expect(parseDateSafe(null)).toBeNull();
      expect(parseDateSafe(undefined)).toBeNull();
      expect(parseDateSafe('-')).toBeNull();
    });
  });

  describe('isPlaceholderDate', () => {
    it('should detect 1900 placeholders', () => {
      expect(isPlaceholderDate('10/6/1900')).toBe(true);
      expect(isPlaceholderDate('1900-01-01')).toBe(true);
    });

    it('should not flag valid dates', () => {
      expect(isPlaceholderDate('15/03/2024')).toBe(false);
      expect(isPlaceholderDate('2024-03-15')).toBe(false);
    });
  });

  describe('sanitizeDateToISO', () => {
    it('should convert valid date to ISO format', () => {
      expect(sanitizeDateToISO('15/03/2024')).toBe('2024-03-15');
    });

    it('should return null for placeholder dates', () => {
      expect(sanitizeDateToISO('10/6/1900')).toBeNull();
    });
  });

  describe('createValidDate', () => {
    it('should create valid dates', () => {
      const date = createValidDate(2024, 2, 15); // March 15, 2024
      expect(date).not.toBeNull();
      expect(date?.getFullYear()).toBe(2024);
      expect(date?.getMonth()).toBe(2);
      expect(date?.getDate()).toBe(15);
    });

    it('should return null for invalid dates (e.g., Feb 30)', () => {
      expect(createValidDate(2024, 1, 30)).toBeNull(); // Feb 30 is invalid even in leap year
    });
  });

  describe('constants', () => {
    it('should export MIN_VALID_YEAR_THRESHOLD', () => {
      expect(MIN_VALID_YEAR_THRESHOLD).toBe(1920);
    });
  });
});

describe('gestationalCalculator module', () => {
  describe('gaFromDumAt', () => {
    it('should calculate gestational age correctly', () => {
      const dum = new Date('2024-01-01');
      const at = new Date('2024-03-21'); // 80 days later
      
      const result = gaFromDumAt(dum, at);
      
      expect(result.totalDays).toBe(80);
      expect(result.weeks).toBe(11);
      expect(result.days).toBe(3);
    });
  });

  describe('gaFromUsgAt', () => {
    it('should calculate gestational age from USG data', () => {
      const usgDate = new Date('2024-02-01');
      const at = new Date('2024-03-01'); // 29 days later
      
      // At USG: 10 weeks 3 days = 73 days
      // Plus 29 days = 102 days = 14 weeks 4 days
      const result = gaFromUsgAt(usgDate, 10, 3, at);
      
      expect(result.totalDays).toBe(102);
      expect(result.weeks).toBe(14);
      expect(result.days).toBe(4);
    });
  });

  describe('dppFromDum', () => {
    it('should calculate DPP as DUM + 280 days', () => {
      const dum = new Date('2024-01-01');
      const dpp = dppFromDum(dum);
      
      // 280 days from Jan 1, 2024 = October 7, 2024
      expect(dpp.getFullYear()).toBe(2024);
      expect(dpp.getMonth()).toBe(9); // October = 9
      expect(dpp.getDate()).toBe(7);
    });
  });

  describe('dppFromGaDays', () => {
    it('should calculate DPP from current GA', () => {
      const referenceDate = new Date('2024-06-01');
      const gaDays = 196; // 28 weeks = 196 days
      
      const dpp = dppFromGaDays(gaDays, referenceDate);
      
      // 280 - 196 = 84 days remaining
      // June 1 + 84 days = August 24
      expect(dpp.getFullYear()).toBe(2024);
      expect(dpp.getMonth()).toBe(7); // August = 7
      expect(dpp.getDate()).toBe(24);
    });
  });

  describe('formatGa', () => {
    it('should format gestational age correctly', () => {
      expect(formatGa(38, 2)).toBe('38 semanas e 2 dias');
      expect(formatGa(40, 0)).toBe('40 semanas e 0 dias');
    });
  });

  describe('chooseAndCompute', () => {
    it('should use DUM when reliable and valid', () => {
      const result = chooseAndCompute({
        dumRaw: '01/01/2024',
        dumStatus: 'Sim - Confiavel',
        usgDateRaw: '15/02/2024',
        usgWeeks: '12',
        usgDays: '3',
        referenceDate: new Date('2024-04-01')
      });

      expect(result.source).toBe('DUM');
      expect(result.gaDays).toBe(91); // 91 days from Jan 1 to Apr 1
      expect(result.gaWeeks).toBe(13);
      expect(result.reason).toContain('DUM confiável');
    });

    it('should fall back to USG when DUM is placeholder', () => {
      const result = chooseAndCompute({
        dumRaw: '10/6/1900', // Placeholder
        dumStatus: 'Sim - Confiavel',
        usgDateRaw: '01/02/2024',
        usgWeeks: '10',
        usgDays: '2',
        referenceDate: new Date('2024-03-01')
      });

      expect(result.source).toBe('USG');
      expect(result.reason).toContain('DUM inválida/placeholder');
    });

    it('should return INVALID when neither source is valid', () => {
      const result = chooseAndCompute({
        dumRaw: null,
        dumStatus: null,
        usgDateRaw: null,
        usgWeeks: null,
        usgDays: null
      });

      expect(result.source).toBe('INVALID');
      expect(result.gaDays).toBe(0);
      expect(result.gaFormatted).toBe('Não calculado');
    });
  });

  describe('constants', () => {
    it('should export FULL_TERM_DAYS_CONSTANT', () => {
      expect(FULL_TERM_DAYS_CONSTANT).toBe(280); // 40 weeks * 7 days
    });
  });
});

describe('tsvProcessor module', () => {
  describe('processTsvContent', () => {
    it('should process TSV content with valid data', () => {
      const tsvContent = `Header\tcol1\tcol2\tcol3\tcol4\tcol5\tcol6\tcol7\tcol8\tcol9\tdum_status\tdum\tusg_date\tusg_weeks\tusg_days
Row1\tdata\tdata\tdata\tdata\tdata\tdata\tdata\tdata\tdata\tSim - Confiavel\t01/01/2024\t15/02/2024\t12\t3`;

      const results = processTsvContent(tsvContent, {
        dumIndex: 11,
        dumStatusIndex: 10,
        usgDateIndex: 12,
        usgWeeksIndex: 13,
        usgDaysIndex: 14
      });

      expect(results.length).toBe(1);
      expect(results[0].result.source).toBe('DUM');
    });

    it('should detect placeholder dates', () => {
      const tsvContent = `Header\tcol1\tcol2\tcol3\tcol4\tcol5\tcol6\tcol7\tcol8\tcol9\tdum_status\tdum\tusg_date\tusg_weeks\tusg_days
Row1\tdata\tdata\tdata\tdata\tdata\tdata\tdata\tdata\tdata\tSim\t10/6/1900\t15/02/2024\t12\t3`;

      const results = processTsvContent(tsvContent, {
        dumIndex: 11,
        dumStatusIndex: 10,
        usgDateIndex: 12,
        usgWeeksIndex: 13,
        usgDaysIndex: 14
      });

      expect(results.length).toBe(1);
      expect(results[0].warnings.some(w => w.includes('placeholder'))).toBe(true);
    });
  });
});

describe('barrel export (index.ts)', () => {
  it('should export all dateParser functions', () => {
    expect(ImportModule.parseDateSafe).toBeDefined();
    expect(ImportModule.isPlaceholderDate).toBeDefined();
    expect(ImportModule.sanitizeDateToISO).toBeDefined();
    expect(ImportModule.createValidDate).toBeDefined();
  });

  it('should export all gestationalCalculator functions', () => {
    expect(ImportModule.gaFromDumAt).toBeDefined();
    expect(ImportModule.gaFromUsgAt).toBeDefined();
    expect(ImportModule.dppFromDum).toBeDefined();
    expect(ImportModule.dppFromGaDays).toBeDefined();
    expect(ImportModule.formatGa).toBeDefined();
    expect(ImportModule.chooseAndCompute).toBeDefined();
  });

  it('should export processTsvContent', () => {
    expect(ImportModule.processTsvContent).toBeDefined();
  });

  it('should work correctly with barrel exports', () => {
    const result = ImportModule.parseDateSafe('15/03/2024');
    expect(result).not.toBeNull();
    expect(result?.getFullYear()).toBe(2024);
  });
});
