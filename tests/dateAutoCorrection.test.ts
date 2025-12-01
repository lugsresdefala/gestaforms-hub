/**
 * Unit Tests for Date Auto-Correction Module
 *
 * Tests cover:
 * - Detection of inverted month/day in dates
 * - Automatic correction when IG becomes valid
 * - No correction when original IG is valid
 * - No correction when both original and inverted produce invalid IG
 * - Audit trail formatting
 *
 * Run with: npm run test
 */

import { describe, it, expect } from 'vitest';
import {
  tryAutoCorrectDate,
  invertMonthDay,
  isIgValid,
  formatCorrectionForAudit,
  MIN_VALID_IG_DAYS_CONST,
  MAX_VALID_IG_DAYS_CONST,
} from '../src/lib/import/dateAutoCorrection';

describe('Date Auto-Correction Module', () => {
  describe('isIgValid', () => {
    it('should return true for valid IG (5-42 weeks)', () => {
      expect(isIgValid(35)).toBe(true);  // 5 weeks
      expect(isIgValid(140)).toBe(true); // 20 weeks
      expect(isIgValid(280)).toBe(true); // 40 weeks
      expect(isIgValid(294)).toBe(true); // 42 weeks
    });

    it('should return false for IG below 5 weeks', () => {
      expect(isIgValid(0)).toBe(false);
      expect(isIgValid(20)).toBe(false);
      expect(isIgValid(34)).toBe(false);
    });

    it('should return false for IG above 42 weeks', () => {
      expect(isIgValid(295)).toBe(false);
      expect(isIgValid(350)).toBe(false);
    });

    it('should return false for negative IG', () => {
      expect(isIgValid(-10)).toBe(false);
      expect(isIgValid(-100)).toBe(false);
    });
  });

  describe('invertMonthDay', () => {
    it('should invert month and day when both are <= 12', () => {
      expect(invertMonthDay('05/12/2024')).toBe('12/05/2024');
      expect(invertMonthDay('01/03/2024')).toBe('03/01/2024');
      expect(invertMonthDay('12/12/2024')).toBe('12/12/2024'); // Same
    });

    it('should return null when day > 12 (unambiguous)', () => {
      expect(invertMonthDay('15/03/2024')).toBe(null);
      expect(invertMonthDay('25/12/2024')).toBe(null);
    });

    it('should return null when month > 12 (unambiguous)', () => {
      expect(invertMonthDay('05/13/2024')).toBe(null);
    });

    it('should handle dash separator', () => {
      expect(invertMonthDay('05-12-2024')).toBe('12-05-2024');
    });

    it('should return null for invalid input', () => {
      expect(invertMonthDay('')).toBe(null);
      expect(invertMonthDay('invalid')).toBe(null);
      expect(invertMonthDay('2024')).toBe(null);
    });
  });

  describe('tryAutoCorrectDate', () => {
    // Test scenario: Date produces impossible IG, but inverted produces valid IG
    it('should correct date when inversion resolves impossible IG', () => {
      // Reference: 2024-12-01
      // Original: 05/12/2024 (Dec 5, 2024) → future date, IG < 0 (impossible)
      // Inverted: 12/05/2024 (May 12, 2024) → IG = ~200 days (valid)
      const result = tryAutoCorrectDate('05/12/2024', new Date('2024-12-01'));
      
      expect(result.wasCorrected).toBe(true);
      expect(result.originalRaw).toBe('05/12/2024');
      expect(result.correctedRaw).toBe('12/05/2024');
      expect(result.correctedIgDays).toBeGreaterThan(MIN_VALID_IG_DAYS_CONST);
      expect(result.correctedIgDays).toBeLessThan(MAX_VALID_IG_DAYS_CONST);
    });

    it('should NOT correct date when original IG is already valid', () => {
      // Reference: 2024-12-01
      // Original: 01/03/2024 (Mar 1, 2024) → IG = ~275 days (valid)
      const result = tryAutoCorrectDate('01/03/2024', new Date('2024-12-01'));
      
      expect(result.wasCorrected).toBe(false);
      expect(result.originalParsed).not.toBeNull();
      expect(result.reason).toContain('válida');
    });

    it('should NOT correct when day > 12 (unambiguous date)', () => {
      // Reference: 2024-12-01
      // Original: 15/03/2024 (Mar 15, 2024) → IG = ~260 days (valid, but unambiguous)
      const result = tryAutoCorrectDate('15/03/2024', new Date('2024-12-01'));
      
      expect(result.wasCorrected).toBe(false);
      // Day is 15, cannot be a month, so no inversion possible
    });

    it('should NOT correct when both original and inverted produce invalid IG', () => {
      // Reference: 2024-12-01
      // A date far in the past that would produce > 42 weeks even with inversion
      // Original: 01/01/2020 → IG = ~1800 days (impossible)
      // Inverted: 01/01/2020 → Same date, still impossible
      const result = tryAutoCorrectDate('01/01/2020', new Date('2024-12-01'));
      
      expect(result.wasCorrected).toBe(false);
      expect(result.reason).toContain('impossível');
    });

    it('should handle empty/null input gracefully', () => {
      expect(tryAutoCorrectDate(null).wasCorrected).toBe(false);
      expect(tryAutoCorrectDate(undefined).wasCorrected).toBe(false);
      expect(tryAutoCorrectDate('').wasCorrected).toBe(false);
    });

    it('should handle invalid date strings', () => {
      const result = tryAutoCorrectDate('invalid-date', new Date('2024-12-01'));
      expect(result.wasCorrected).toBe(false);
      expect(result.reason).toContain('interpretada');
    });

    it('should provide detailed reason for correction', () => {
      const result = tryAutoCorrectDate('05/12/2024', new Date('2024-12-01'));
      
      if (result.wasCorrected) {
        expect(result.reason).toContain('Auto-correção');
        expect(result.reason).toContain('05/12/2024');
        expect(result.reason).toContain('12/05/2024');
      }
    });

    // Edge case: date that looks like it needs correction but both versions are close
    it('should handle ambiguous dates near reference date', () => {
      // Reference: 2024-12-01
      // Original: 10/11/2024 (Nov 10, 2024) → IG = ~21 days (too early)
      // Inverted: 11/10/2024 (Oct 11, 2024) → IG = ~51 days (valid)
      const result = tryAutoCorrectDate('10/11/2024', new Date('2024-12-01'));
      
      // Original gives IG = 21 days (invalid), inverted gives IG = 51 days (valid)
      expect(result.wasCorrected).toBe(true);
    });
  });

  describe('formatCorrectionForAudit', () => {
    it('should format correction record for DUM', () => {
      const correction = {
        wasCorrected: true,
        originalRaw: '05/12/2024',
        originalParsed: new Date('2024-12-05'),
        correctedDate: new Date('2024-05-12'),
        correctedRaw: '12/05/2024',
        reason: 'Auto-correção aplicada',
        originalIgDays: -4,
        correctedIgDays: 203,
      };

      const audit = formatCorrectionForAudit(correction, 'DUM');
      
      expect(audit).toContain('Auto-correção DUM');
      expect(audit).toContain('05/12/2024');
      expect(audit).toContain('12/05/2024');
      expect(audit).toContain('IG antes');
      expect(audit).toContain('IG depois');
    });

    it('should format correction record for USG', () => {
      const correction = {
        wasCorrected: true,
        originalRaw: '05/12/2024',
        originalParsed: new Date('2024-12-05'),
        correctedDate: new Date('2024-05-12'),
        correctedRaw: '12/05/2024',
        reason: 'Auto-correção aplicada',
        originalIgDays: -4,
        correctedIgDays: 203,
      };

      const audit = formatCorrectionForAudit(correction, 'USG');
      
      expect(audit).toContain('Auto-correção USG');
    });

    it('should return empty string when no correction was made', () => {
      const correction = {
        wasCorrected: false,
        originalRaw: '15/03/2024',
        originalParsed: new Date('2024-03-15'),
        correctedDate: null,
        correctedRaw: null,
        reason: 'IG original válida',
        originalIgDays: 261,
        correctedIgDays: null,
      };

      expect(formatCorrectionForAudit(correction, 'DUM')).toBe('');
    });
  });

  describe('Integration with real-world scenarios', () => {
    it('should correct common typo: Dec entered as month when meant as day', () => {
      // User enters "05/12/2024" meaning "day 5 of month 12" (December 5)
      // But if reference is before Dec 5, IG would be negative
      // System should try inverting to "12/05/2024" (May 12)
      
      const reference = new Date('2024-11-15');
      const result = tryAutoCorrectDate('05/12/2024', reference);
      
      // Original: Dec 5, 2024 is AFTER Nov 15 → IG < 0 (impossible)
      // Inverted: May 12, 2024 is BEFORE Nov 15 → IG = ~187 days (valid)
      expect(result.wasCorrected).toBe(true);
      expect(result.correctedRaw).toBe('12/05/2024');
    });

    it('should NOT correct when user correctly entered DD/MM/YYYY', () => {
      // User enters "15/03/2024" meaning March 15 (clearly DD/MM)
      const reference = new Date('2024-12-01');
      const result = tryAutoCorrectDate('15/03/2024', reference);
      
      // 15 cannot be a month, so it's unambiguously day 15
      expect(result.wasCorrected).toBe(false);
    });

    it('should handle the example from the issue: 15/02/2024', () => {
      // From the issue: 15/02/2024 → IG = -50 days
      // But this date has day=15 > 12, so cannot be inverted
      // The example in the issue is actually about a different scenario
      
      const reference = new Date('2024-01-01');
      const result = tryAutoCorrectDate('15/02/2024', reference);
      
      // Day is 15, cannot swap to month 15
      // Original IG = ~46 days before (since ref is Jan 1 and date is Feb 15)
      // Wait, Feb 15 is AFTER Jan 1, so IG would be negative
      // But 15 > 12 so no swap possible
      expect(result.wasCorrected).toBe(false);
    });
  });
});
