/**
 * Unit Tests for Import Sanitizer Utility
 *
 * Tests cover:
 * - Date parsing with multiple formats
 * - Placeholder date detection
 * - Gestational age calculation from DUM and USG
 * - DPP calculation
 * - Source selection logic (DUM vs USG)
 *
 * Run with: npm run test
 */

import { describe, it, expect } from 'vitest';
import {
  parseDateSafe,
  gaFromDumAt,
  gaFromUsgAt,
  dppFromDum,
  dppFromGaDays,
  formatGa,
  chooseAndCompute,
  isPlaceholderDate,
  sanitizeDateToISO
} from '../src/lib/importSanitizer';

describe('parseDateSafe', () => {
  describe('DD/MM/YYYY format (Brazilian)', () => {
    it('should parse valid Brazilian date format', () => {
      const result = parseDateSafe('15/03/2024');
      expect(result).not.toBeNull();
      expect(result?.getFullYear()).toBe(2024);
      expect(result?.getMonth()).toBe(2); // March = 2 (0-indexed)
      expect(result?.getDate()).toBe(15);
    });

    it('should parse single-digit day and month', () => {
      const result = parseDateSafe('5/3/2024');
      expect(result).not.toBeNull();
      expect(result?.getFullYear()).toBe(2024);
    });
  });

  describe('MM/DD/YYYY format (American)', () => {
    it('should parse American date format when unambiguous', () => {
      // 13/05/2024 can only be DD/MM/YYYY since 13 > 12
      const result = parseDateSafe('13/05/2024');
      expect(result).not.toBeNull();
      expect(result?.getDate()).toBe(13);
      expect(result?.getMonth()).toBe(4); // May = 4
    });
  });

  describe('YYYY-MM-DD format (ISO)', () => {
    it('should parse ISO format', () => {
      const result = parseDateSafe('2024-03-15');
      expect(result).not.toBeNull();
      expect(result?.getFullYear()).toBe(2024);
      expect(result?.getMonth()).toBe(2);
      expect(result?.getDate()).toBe(15);
    });

    it('should parse ISO format with time component', () => {
      const result = parseDateSafe('2024-03-15 10:30:00');
      expect(result).not.toBeNull();
      expect(result?.getFullYear()).toBe(2024);
    });
  });

  describe('Placeholder detection', () => {
    it('should return null for 1900 placeholder dates', () => {
      expect(parseDateSafe('10/6/1900')).toBeNull();
      expect(parseDateSafe('06/10/1900')).toBeNull();
      expect(parseDateSafe('1900-01-01')).toBeNull();
    });

    it('should return null for years before 1920', () => {
      expect(parseDateSafe('01/01/1919')).toBeNull();
      expect(parseDateSafe('15/06/1910')).toBeNull();
    });

    it('should accept valid years from 1920 onwards', () => {
      expect(parseDateSafe('01/01/1920')).not.toBeNull();
      expect(parseDateSafe('15/06/1990')).not.toBeNull();
    });
  });

  describe('Invalid inputs', () => {
    it('should return null for empty string', () => {
      expect(parseDateSafe('')).toBeNull();
    });

    it('should return null for null', () => {
      expect(parseDateSafe(null)).toBeNull();
    });

    it('should return null for undefined', () => {
      expect(parseDateSafe(undefined)).toBeNull();
    });

    it('should return null for dash placeholder', () => {
      expect(parseDateSafe('-')).toBeNull();
    });

    it('should return null for invalid date strings', () => {
      expect(parseDateSafe('invalid')).toBeNull();
      expect(parseDateSafe('abc/def/ghi')).toBeNull();
    });
  });

  describe('Two-digit year handling', () => {
    it('should interpret years 00-50 as 2000s', () => {
      const result = parseDateSafe('15/03/24');
      expect(result).not.toBeNull();
      expect(result?.getFullYear()).toBe(2024);
    });

    it('should interpret years 51-99 as 1900s', () => {
      const result = parseDateSafe('15/03/85');
      expect(result).not.toBeNull();
      expect(result?.getFullYear()).toBe(1985);
    });
  });
});

describe('isPlaceholderDate', () => {
  it('should detect 1900 placeholders', () => {
    expect(isPlaceholderDate('10/6/1900')).toBe(true);
    expect(isPlaceholderDate('1900-01-01')).toBe(true);
  });

  it('should detect 0000 placeholders', () => {
    expect(isPlaceholderDate('00/00/0000')).toBe(true);
  });

  it('should not flag valid dates', () => {
    expect(isPlaceholderDate('15/03/2024')).toBe(false);
    expect(isPlaceholderDate('2024-03-15')).toBe(false);
  });

  it('should return false for empty/null input', () => {
    expect(isPlaceholderDate(null)).toBe(false);
    expect(isPlaceholderDate('')).toBe(false);
  });
});

describe('gaFromDumAt', () => {
  it('should calculate gestational age correctly', () => {
    const dum = new Date('2024-01-01');
    const at = new Date('2024-03-21'); // 80 days later
    
    const result = gaFromDumAt(dum, at);
    
    expect(result.totalDays).toBe(80);
    expect(result.weeks).toBe(11);
    expect(result.days).toBe(3);
  });

  it('should handle exact week boundaries', () => {
    const dum = new Date('2024-01-01');
    const at = new Date('2024-03-18'); // 77 days = 11 weeks exactly
    
    const result = gaFromDumAt(dum, at);
    
    expect(result.totalDays).toBe(77);
    expect(result.weeks).toBe(11);
    expect(result.days).toBe(0);
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

  it('should handle zero days at USG', () => {
    const usgDate = new Date('2024-02-01');
    const at = new Date('2024-02-08'); // 7 days later
    
    // At USG: 12 weeks 0 days = 84 days
    // Plus 7 days = 91 days = 13 weeks 0 days
    const result = gaFromUsgAt(usgDate, 12, 0, at);
    
    expect(result.totalDays).toBe(91);
    expect(result.weeks).toBe(13);
    expect(result.days).toBe(0);
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
    expect(formatGa(12, 5)).toBe('12 semanas e 5 dias');
  });
});

describe('sanitizeDateToISO', () => {
  it('should convert valid date to ISO format', () => {
    expect(sanitizeDateToISO('15/03/2024')).toBe('2024-03-15');
  });

  it('should return null for placeholder dates', () => {
    expect(sanitizeDateToISO('10/6/1900')).toBeNull();
  });

  it('should return null for invalid dates', () => {
    expect(sanitizeDateToISO('invalid')).toBeNull();
    expect(sanitizeDateToISO(null)).toBeNull();
  });
});

describe('chooseAndCompute', () => {
  describe('DUM reliable', () => {
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
      expect(result.gaDaysRemainder).toBe(0);
      expect(result.dpp).not.toBeNull();
      expect(result.reason).toContain('DUM confiável');
    });

    it('should accept "Certa" as reliable DUM status', () => {
      const result = chooseAndCompute({
        dumRaw: '01/01/2024',
        dumStatus: 'Certa',
        usgDateRaw: null,
        usgWeeks: null,
        usgDays: null,
        referenceDate: new Date('2024-02-01')
      });

      expect(result.source).toBe('DUM');
    });
  });

  describe('DUM placeholder with valid USG', () => {
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
      expect(result.reason).toContain('USG');
      // 10w2d = 72 days + 29 days since USG = 101 days = 14w3d
      expect(result.gaWeeks).toBe(14);
      expect(result.gaDaysRemainder).toBe(3);
    });
  });

  describe('USG with valid weeks/days', () => {
    it('should calculate from USG when DUM not available', () => {
      const result = chooseAndCompute({
        dumRaw: null,
        dumStatus: null,
        usgDateRaw: '01/03/2024',
        usgWeeks: '20',
        usgDays: '0',
        referenceDate: new Date('2024-04-01')
      });

      expect(result.source).toBe('USG');
      // 20w0d = 140 days + 31 days = 171 days = 24w3d
      expect(result.gaWeeks).toBe(24);
      expect(result.gaDaysRemainder).toBe(3);
    });

    it('should use USG when DUM status is unreliable', () => {
      const result = chooseAndCompute({
        dumRaw: '01/01/2024',
        dumStatus: 'Incerta',
        usgDateRaw: '15/02/2024',
        usgWeeks: '12',
        usgDays: '0',
        referenceDate: new Date('2024-03-15')
      });

      expect(result.source).toBe('USG');
      expect(result.reason).toContain('não confiável');
    });
  });

  describe('MM/DD/YYYY and DD/MM/YYYY format handling', () => {
    it('should handle ambiguous dates', () => {
      // 05/03/2024 could be May 3 or March 5
      // Brazilian format (DD/MM) should be preferred when valid
      const result = chooseAndCompute({
        dumRaw: '05/03/2024',
        dumStatus: 'Sim - Confiavel',
        usgDateRaw: null,
        usgWeeks: null,
        usgDays: null,
        referenceDate: new Date('2024-04-01')
      });

      expect(result.source).toBe('DUM');
      // Should parse as March 5, 2024 (DD/MM/YYYY)
      // Days from March 5 to April 1 = 27 days = 3w6d
      expect(result.gaWeeks).toBe(3);
      expect(result.gaDaysRemainder).toBe(6);
    });

    it('should handle unambiguous American format', () => {
      // When first number > 12, it must be DD/MM/YYYY
      const result = chooseAndCompute({
        dumRaw: '25/03/2024',
        dumStatus: 'Confiável',
        usgDateRaw: null,
        usgWeeks: null,
        usgDays: null,
        referenceDate: new Date('2024-04-01')
      });

      expect(result.source).toBe('DUM');
      // March 25 to April 1 = 7 days = 1w0d
      expect(result.gaWeeks).toBe(1);
      expect(result.gaDaysRemainder).toBe(0);
    });
  });

  describe('Invalid source handling', () => {
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
      expect(result.dpp).toBeNull();
      expect(result.gaFormatted).toBe('Não calculado');
    });

    it('should return INVALID when USG has no weeks/days', () => {
      const result = chooseAndCompute({
        dumRaw: '10/6/1900', // Placeholder
        dumStatus: 'Sim',
        usgDateRaw: '01/03/2024',
        usgWeeks: '0',
        usgDays: '0'
      });

      expect(result.source).toBe('INVALID');
      expect(result.reason).toContain('USG não informada');
    });
  });
});
