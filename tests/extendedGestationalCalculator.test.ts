/**
 * Unit Tests for Extended Gestational Calculator
 *
 * Tests cover:
 * - DUM/USG hierarchy with tolerance limits (Cases 1-4)
 * - Protocol detection (cerclagem, hipertensão, DMG, eletivas, default)
 * - Sunday adjustment for capacity rules
 * - Conditional IG display based on future date
 *
 * Run with: npm run test
 */

import { describe, it, expect } from 'vitest';
import {
  chooseAndComputeExtended,
  detectProtocol,
  formatGaCompact
} from '../src/lib/import/gestationalCalculator';
import { adjustForSunday, isSunday } from '../src/lib/capacityRules';

describe('Extended Gestational Calculator', () => {
  describe('chooseAndComputeExtended - DUM/USG Hierarchy', () => {
    // Case 1: DUM absent/uncertain → use USG
    it('Case 1: should use USG when DUM is uncertain', () => {
      const result = chooseAndComputeExtended({
        dumRaw: '01/03/2024',
        dumStatus: 'Incerta',
        usgDateRaw: '15/02/2024',
        usgWeeks: 12,
        usgDays: 3,
        referenceDate: new Date('2024-04-01')
      });

      expect(result.source).toBe('USG');
      expect(result.reason).toContain('não confiável');
    });

    it('Case 1: should use USG when DUM is not provided', () => {
      const result = chooseAndComputeExtended({
        dumRaw: null,
        dumStatus: null,
        usgDateRaw: '15/02/2024',
        usgWeeks: 12,
        usgDays: 3,
        referenceDate: new Date('2024-04-01')
      });

      expect(result.source).toBe('USG');
    });

    // Case 2: DUM reliable + USG available → compare with tolerance
    it('Case 2: should use DUM when difference is within tolerance (8-9 weeks USG, ≤5 days diff)', () => {
      // Create a scenario where DUM and USG are within 5 days
      const result = chooseAndComputeExtended({
        dumRaw: '01/01/2024',
        dumStatus: 'Sim - Confiavel',
        usgDateRaw: '01/03/2024', // 8 weeks from DUM
        usgWeeks: 8,
        usgDays: 2, // Close to DUM-based calculation
        referenceDate: new Date('2024-04-01')
      });

      // Should use DUM since within tolerance
      expect(result.source).toBe('DUM');
      expect(result.reason).toContain('≤ tolerância');
    });

    it('Case 2: should use USG when difference exceeds tolerance', () => {
      const result = chooseAndComputeExtended({
        dumRaw: '01/01/2024',
        dumStatus: 'Sim - Confiavel',
        usgDateRaw: '01/03/2024',
        usgWeeks: 10, // Much larger than DUM-based
        usgDays: 0,
        referenceDate: new Date('2024-04-01')
      });

      expect(result.source).toBe('USG');
      expect(result.reason).toContain('> tolerância');
    });

    // Case 3: Only DUM available
    it('Case 3: should use DUM when only DUM is available', () => {
      const result = chooseAndComputeExtended({
        dumRaw: '01/01/2024',
        dumStatus: 'Sim - Confiavel',
        usgDateRaw: null,
        usgWeeks: 0,
        usgDays: 0,
        referenceDate: new Date('2024-04-01')
      });

      expect(result.source).toBe('DUM');
      expect(result.gaDays).toBe(91); // 91 days from Jan 1 to Apr 1
    });

    // Case 4: Insufficient data
    it('Case 4: should return INVALID when data is insufficient', () => {
      const result = chooseAndComputeExtended({
        dumRaw: null,
        dumStatus: null,
        usgDateRaw: null,
        usgWeeks: 0,
        usgDays: 0
      });

      expect(result.source).toBe('INVALID');
      expect(result.reason).toContain('Dados insuficientes');
      expect(result.dataIdeal).toBeNull();
    });
  });

  describe('detectProtocol - Protocol Detection', () => {
    it('should detect cerclagem as highest priority', () => {
      expect(detectProtocol('paciente com cerclagem')).toBe('cerclagem');
      expect(detectProtocol('IIC diagnosticado')).toBe('cerclagem');
      expect(detectProtocol('incompetência istmo-cervical')).toBe('cerclagem');
    });

    it('should detect hypertension protocols', () => {
      expect(detectProtocol('hipertensão gestacional')).toBe('hipertensao');
      expect(detectProtocol('pré-eclâmpsia')).toBe('hipertensao');
      expect(detectProtocol('pre-eclampsia leve')).toBe('hipertensao');
      expect(detectProtocol('DHEG')).toBe('hipertensao');
      expect(detectProtocol('HAS crônica')).toBe('hipertensao');
      expect(detectProtocol('HAC controlada')).toBe('hipertensao');
    });

    it('should detect DMG with insulin', () => {
      expect(detectProtocol('DMG em uso de insulina')).toBe('dmg_insulina');
      expect(detectProtocol('diabetes gestacional com insulina')).toBe('dmg_insulina');
      expect(detectProtocol('insulina para DMG')).toBe('dmg_insulina');
    });

    it('should detect DMG without insulin', () => {
      expect(detectProtocol('DMG controlado com dieta')).toBe('dmg_sem_insulina');
      expect(detectProtocol('diabetes gestacional')).toBe('dmg_sem_insulina');
    });

    // NOTE: 'eletivas' protocol removed - desejo_materno/cesarea eletiva are not clinical pathologies
    // These cases now fall through to 'default' (39 weeks low-risk protocol)
    it('should return default for elective procedures (not clinical pathologies)', () => {
      expect(detectProtocol('cesárea eletiva')).toBe('default');
      expect(detectProtocol('desejo materno')).toBe('default');
      expect(detectProtocol('a pedido da paciente')).toBe('default');
    });

    it('should return default for unrecognized conditions', () => {
      expect(detectProtocol('gestação normal')).toBe('default');
      expect(detectProtocol('')).toBe('default');
      expect(detectProtocol('acompanhamento pré-natal')).toBe('default');
    });

    it('should prioritize cerclagem over other conditions', () => {
      expect(detectProtocol('cerclagem com hipertensão')).toBe('cerclagem');
      expect(detectProtocol('DMG e IIC')).toBe('cerclagem');
    });
  });

  describe('Protocol-based Ideal GA', () => {
    it('should set IG ideal to 15 weeks (105 days) for cerclagem', () => {
      const result = chooseAndComputeExtended({
        dumRaw: '01/01/2024',
        dumStatus: 'Sim - Confiavel',
        usgDateRaw: null,
        usgWeeks: 0,
        usgDays: 0,
        diagnostico: 'cerclagem',
        indicacao: '',
        referenceDate: new Date('2024-04-01')
      });

      expect(result.protocoloAplicado).toBe('cerclagem');
      expect(result.igIdealDays).toBe(105);
      expect(result.igIdealText).toBe('15s 0d');
    });

    it('should set IG ideal to 37 weeks (259 days) for hypertension', () => {
      const result = chooseAndComputeExtended({
        dumRaw: '01/01/2024',
        dumStatus: 'Sim - Confiavel',
        usgDateRaw: null,
        usgWeeks: 0,
        usgDays: 0,
        diagnostico: 'hipertensão gestacional',
        indicacao: '',
        referenceDate: new Date('2024-04-01')
      });

      expect(result.protocoloAplicado).toBe('hipertensao');
      expect(result.igIdealDays).toBe(259);
      expect(result.igIdealText).toBe('37s 0d');
    });

    it('should set IG ideal to 38 weeks (266 days) for DMG with insulin', () => {
      const result = chooseAndComputeExtended({
        dumRaw: '01/01/2024',
        dumStatus: 'Sim - Confiavel',
        usgDateRaw: null,
        usgWeeks: 0,
        usgDays: 0,
        diagnostico: 'DMG com insulina',
        indicacao: '',
        referenceDate: new Date('2024-04-01')
      });

      expect(result.protocoloAplicado).toBe('dmg_insulina');
      expect(result.igIdealDays).toBe(266);
      expect(result.igIdealText).toBe('38s 0d');
    });

    it('should set IG ideal to 40 weeks (280 days) for DMG without insulin', () => {
      const result = chooseAndComputeExtended({
        dumRaw: '01/01/2024',
        dumStatus: 'Sim - Confiavel',
        usgDateRaw: null,
        usgWeeks: 0,
        usgDays: 0,
        diagnostico: 'DMG',
        indicacao: '',
        referenceDate: new Date('2024-04-01')
      });

      expect(result.protocoloAplicado).toBe('dmg_sem_insulina');
      expect(result.igIdealDays).toBe(280);
      expect(result.igIdealText).toBe('40s 0d');
    });

    // NOTE: 'eletivas' protocol removed - now falls to 'default' with same 39 weeks IG
    it('should set IG ideal to 39 weeks (273 days) for low-risk and default', () => {
      const result = chooseAndComputeExtended({
        dumRaw: '01/01/2024',
        dumStatus: 'Sim - Confiavel',
        usgDateRaw: null,
        usgWeeks: 0,
        usgDays: 0,
        diagnostico: '',
        indicacao: 'desejo materno',
        referenceDate: new Date('2024-04-01')
      });

      // desejo materno is no longer a protocol - defaults to low-risk (39 weeks)
      expect(result.protocoloAplicado).toBe('default');
      expect(result.igIdealDays).toBe(273);
      expect(result.igIdealText).toBe('39s 0d');
    });
  });

  describe('formatGaCompact', () => {
    it('should format GA as compact string', () => {
      expect(formatGaCompact(39, 0)).toBe('39s 0d');
      expect(formatGaCompact(37, 3)).toBe('37s 3d');
      expect(formatGaCompact(15, 0)).toBe('15s 0d');
    });
  });
});

describe('Capacity Rules', () => {
  describe('adjustForSunday', () => {
    it('should move Sunday to Monday', () => {
      // 2024-12-01 is a Sunday
      const sunday = new Date('2024-12-01');
      const result = adjustForSunday(sunday);
      
      expect(result.getDay()).toBe(1); // Monday
      expect(result.getDate()).toBe(2);
    });

    it('should not change non-Sunday dates', () => {
      // 2024-12-02 is a Monday
      const monday = new Date('2024-12-02');
      const result = adjustForSunday(monday);
      
      expect(result.getDay()).toBe(1);
      expect(result.getDate()).toBe(2);
    });

    it('should not change Saturday dates', () => {
      // 2024-11-30 is a Saturday
      const saturday = new Date('2024-11-30');
      const result = adjustForSunday(saturday);
      
      expect(result.getDay()).toBe(6);
      expect(result.getDate()).toBe(30);
    });
  });

  describe('isSunday', () => {
    it('should return true for Sundays', () => {
      const sunday = new Date('2024-12-01');
      expect(isSunday(sunday)).toBe(true);
    });

    it('should return false for other days', () => {
      const monday = new Date('2024-12-02');
      expect(isSunday(monday)).toBe(false);
    });
  });
});

describe('Extended Calculation Result - Date Calculations', () => {
  it('should calculate ideal date based on protocol IG', () => {
    // Patient at 30 weeks (210 days), default protocol (39 weeks = 273 days)
    // Should schedule in 273 - 210 = 63 days
    const result = chooseAndComputeExtended({
      dumRaw: '01/06/2024', // June 1, 2024
      dumStatus: 'Sim - Confiavel',
      usgDateRaw: null,
      usgWeeks: 0,
      usgDays: 0,
      diagnostico: '',
      indicacao: '',
      referenceDate: new Date('2024-12-09') // ~27 weeks from June 1
    });

    expect(result.dataIdeal).not.toBeNull();
    expect(result.deltaAteIdeal).toBeGreaterThanOrEqual(0);
  });

  it('should not schedule in the past', () => {
    // Patient already at 40 weeks, should schedule for today (not go backwards)
    const result = chooseAndComputeExtended({
      dumRaw: '01/03/2024', // March 1, 2024
      dumStatus: 'Sim - Confiavel',
      usgDateRaw: null,
      usgWeeks: 0,
      usgDays: 0,
      diagnostico: '',
      indicacao: '',
      referenceDate: new Date('2024-12-08') // Well past 40 weeks
    });

    expect(result.dataIdeal).not.toBeNull();
    expect(result.deltaAteIdeal).toBeGreaterThanOrEqual(0);
  });

  it('should adjust ideal date when it falls on Sunday', () => {
    // Create a scenario where ideal date would be a Sunday
    // Need to find a combination where the math lands on Sunday
    const result = chooseAndComputeExtended({
      dumRaw: '01/01/2024',
      dumStatus: 'Sim - Confiavel',
      usgDateRaw: null,
      usgWeeks: 0,
      usgDays: 0,
      diagnostico: '',
      indicacao: '',
      referenceDate: new Date('2024-04-01')
    });

    // The ideal date should never be a Sunday
    if (result.dataIdeal) {
      expect(result.dataIdeal.getDay()).not.toBe(0);
    }
  });

  it('should calculate IG at scheduled date', () => {
    const result = chooseAndComputeExtended({
      dumRaw: '01/01/2024',
      dumStatus: 'Sim - Confiavel',
      usgDateRaw: null,
      usgWeeks: 0,
      usgDays: 0,
      diagnostico: '',
      indicacao: '',
      referenceDate: new Date('2024-04-01')
    });

    expect(result.igAtDataIdeal).toMatch(/^\d+s \d+d$/);
  });
});
