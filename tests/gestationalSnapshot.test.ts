/**
 * Unit Tests for Gestational Snapshot Module
 *
 * Tests cover:
 * - getGestationalSnapshot function
 * - formatGaCompact function
 * - formatInterval function
 * - getIntervalColorClass function
 *
 * Run with: npm run test
 */

import { describe, it, expect } from 'vitest';

import {
  getGestationalSnapshot,
  formatGaCompact,
  formatInterval,
  getIntervalColorClass,
  type GestationalSnapshotResult,
  type SnapshotParams
} from '../src/lib/import/gestationalSnapshot';

describe('gestationalSnapshot module', () => {
  describe('formatGaCompact', () => {
    it('should format gestational age as compact string', () => {
      expect(formatGaCompact(39, 2)).toBe('39s2d');
      expect(formatGaCompact(40, 0)).toBe('40s0d');
      expect(formatGaCompact(37, 5)).toBe('37s5d');
    });
  });

  describe('formatInterval', () => {
    it('should format zero interval correctly', () => {
      expect(formatInterval(0)).toBe('0d');
    });

    it('should format positive interval with plus sign', () => {
      expect(formatInterval(3)).toBe('+3d');
      expect(formatInterval(7)).toBe('+7d');
    });

    it('should format negative interval with minus sign', () => {
      expect(formatInterval(-2)).toBe('-2d');
      expect(formatInterval(-5)).toBe('-5d');
    });
  });

  describe('getIntervalColorClass', () => {
    it('should return green for interval within margin', () => {
      expect(getIntervalColorClass(0, 7)).toBe('green');
      expect(getIntervalColorClass(5, 7)).toBe('green');
      expect(getIntervalColorClass(-5, 7)).toBe('green');
      expect(getIntervalColorClass(7, 7)).toBe('green');
    });

    it('should return yellow for interval within extended margin', () => {
      expect(getIntervalColorClass(10, 7)).toBe('yellow'); // 10 <= 14 (7*2)
      expect(getIntervalColorClass(-12, 7)).toBe('yellow');
    });

    it('should return red for interval outside all margins', () => {
      expect(getIntervalColorClass(20, 7)).toBe('red'); // 20 > 14 (7*2)
      expect(getIntervalColorClass(-20, 7)).toBe('red');
    });
  });

  describe('getGestationalSnapshot', () => {
    it('should return a valid snapshot with DUM data', () => {
      const params: SnapshotParams = {
        dumRaw: '01/01/2024',
        dumStatus: 'Sim - Confiavel',
        usgDateRaw: '15/02/2024',
        usgWeeks: '12',
        usgDays: '3',
        igPretendida: '39',
        diagnosticosMaternos: null,
        diagnosticosFetais: null,
        indicacaoProcedimento: 'Desejo materno',
        dataAgendamentoCalculada: '2024-09-15',
        dataAgendamentoManual: null,
        referenceDate: new Date('2024-04-01')
      };

      const result = getGestationalSnapshot(params);

      expect(result).toBeDefined();
      expect(result.igIdeal).toBe('39s0d');
      expect(result.fonteAgendamento).toBe('calculada');
      expect(result.protocolo).toBeDefined();
      expect(typeof result.margemDias).toBe('number');
      expect(typeof result.intervaloDias).toBe('number');
    });

    it('should use manual date when provided', () => {
      const params: SnapshotParams = {
        dumRaw: '01/01/2024',
        dumStatus: 'Sim - Confiavel',
        usgDateRaw: '15/02/2024',
        usgWeeks: '12',
        usgDays: '3',
        igPretendida: '39',
        diagnosticosMaternos: null,
        diagnosticosFetais: null,
        indicacaoProcedimento: null,
        dataAgendamentoCalculada: '2024-09-15',
        dataAgendamentoManual: '2024-09-20',
        referenceDate: new Date('2024-04-01')
      };

      const result = getGestationalSnapshot(params);

      expect(result.fonteAgendamento).toBe('manual');
    });

    it('should return fallback when no valid GA source', () => {
      const params: SnapshotParams = {
        dumRaw: null,
        dumStatus: null,
        usgDateRaw: null,
        usgWeeks: null,
        usgDays: null,
        igPretendida: '39',
        diagnosticosMaternos: null,
        diagnosticosFetais: null,
        indicacaoProcedimento: null,
        dataAgendamentoCalculada: null,
        dataAgendamentoManual: null
      };

      const result = getGestationalSnapshot(params);

      expect(result.igIdeal).toBeDefined();
      expect(result.dataIdeal).toBeNull(); // Can't calculate without valid GA
    });

    it('should identify protocol from diagnoses', () => {
      const params: SnapshotParams = {
        dumRaw: '01/01/2024',
        dumStatus: 'Sim - Confiavel',
        usgDateRaw: '15/02/2024',
        usgWeeks: '12',
        usgDays: '3',
        igPretendida: '39',
        diagnosticosMaternos: 'Diabetes Gestacional',
        diagnosticosFetais: null,
        indicacaoProcedimento: null,
        dataAgendamentoCalculada: '2024-09-15',
        dataAgendamentoManual: null,
        referenceDate: new Date('2024-04-01')
      };

      const result = getGestationalSnapshot(params);

      // Should pick up diabetes protocol
      expect(result.protocolo).toBeDefined();
      expect(result.margemDias).toBeGreaterThan(0);
    });

    it('should calculate interval correctly when within margin', () => {
      // Create a scenario where the scheduled date is exactly at ideal
      const params: SnapshotParams = {
        dumRaw: '01/01/2024',
        dumStatus: 'Sim - Confiavel',
        usgDateRaw: null,
        usgWeeks: null,
        usgDays: null,
        igPretendida: '39',
        diagnosticosMaternos: null,
        diagnosticosFetais: null,
        indicacaoProcedimento: null,
        dataAgendamentoCalculada: '2024-09-23', // 39 weeks from Jan 1 is around Sep 23
        dataAgendamentoManual: null,
        referenceDate: new Date('2024-04-01')
      };

      const result = getGestationalSnapshot(params);

      // Should be close to zero interval
      expect(typeof result.intervaloDias).toBe('number');
      expect(typeof result.dentroMargem).toBe('boolean');
    });

    it('should return correct igNaDataAgendada', () => {
      const params: SnapshotParams = {
        dumRaw: '01/01/2024',
        dumStatus: 'Sim - Confiavel',
        usgDateRaw: null,
        usgWeeks: null,
        usgDays: null,
        igPretendida: '39',
        diagnosticosMaternos: null,
        diagnosticosFetais: null,
        indicacaoProcedimento: null,
        dataAgendamentoCalculada: '2024-09-15',
        dataAgendamentoManual: null,
        referenceDate: new Date('2024-04-01')
      };

      const result = getGestationalSnapshot(params);

      // igNaDataAgendada should be formatted as NNsNd
      expect(result.igNaDataAgendada).toMatch(/^\d+s\d+d$/);
    });

    it('should export igIdealDias for sorting', () => {
      const params: SnapshotParams = {
        dumRaw: '01/01/2024',
        dumStatus: 'Sim - Confiavel',
        usgDateRaw: null,
        usgWeeks: null,
        usgDays: null,
        igPretendida: '39',
        diagnosticosMaternos: null,
        diagnosticosFetais: null,
        indicacaoProcedimento: null,
        dataAgendamentoCalculada: '2024-09-15',
        dataAgendamentoManual: null,
        referenceDate: new Date('2024-04-01')
      };

      const result = getGestationalSnapshot(params);

      expect(result.igIdealDias).toBe(39 * 7); // 273 days
    });

    it('should return sem_diagnostico when no diagnoses are provided', () => {
      const params: SnapshotParams = {
        dumRaw: '01/01/2024',
        dumStatus: 'Sim - Confiavel',
        usgDateRaw: null,
        usgWeeks: null,
        usgDays: null,
        igPretendida: '39',
        diagnosticosMaternos: null,
        diagnosticosFetais: null,
        indicacaoProcedimento: null,
        dataAgendamentoCalculada: '2024-09-15',
        dataAgendamentoManual: null,
        referenceDate: new Date('2024-04-01')
      };

      const result = getGestationalSnapshot(params);

      // Sem diagnósticos, deve indicar que nenhum foi identificado (não "baixo_risco")
      expect(result.protocolo).toBe('sem_diagnostico');
      expect(result.protocoloNome).toContain('Nenhum');
      expect(result.igIdeal).toBe('39s0d');
    });

    it('should return sem_diagnostico when diagnoses are not recognized', () => {
      const params: SnapshotParams = {
        dumRaw: '01/01/2024',
        dumStatus: 'Sim - Confiavel',
        usgDateRaw: null,
        usgWeeks: null,
        usgDays: null,
        igPretendida: '39',
        diagnosticosMaternos: 'Unknown diagnosis XYZ',
        diagnosticosFetais: null,
        indicacaoProcedimento: null,
        dataAgendamentoCalculada: '2024-09-15',
        dataAgendamentoManual: null,
        referenceDate: new Date('2024-04-01')
      };

      const result = getGestationalSnapshot(params);

      // Diagnósticos não reconhecidos devem indicar que nenhum foi identificado (não "baixo_risco")
      expect(result.protocolo).toBe('sem_diagnostico');
      expect(result.protocoloNome).toContain('Nenhum');
    });

    it('should correctly identify HAC protocol', () => {
      const params: SnapshotParams = {
        dumRaw: '01/01/2024',
        dumStatus: 'Sim - Confiavel',
        usgDateRaw: null,
        usgWeeks: null,
        usgDays: null,
        igPretendida: null,
        diagnosticosMaternos: 'HAC',
        diagnosticosFetais: null,
        indicacaoProcedimento: null,
        dataAgendamentoCalculada: '2024-09-15',
        dataAgendamentoManual: null,
        referenceDate: new Date('2024-04-01')
      };

      const result = getGestationalSnapshot(params);

      // Should detect HAC protocol, not desejo_materno
      expect(result.protocolo).not.toBe('desejo_materno');
      expect(result.protocolo).toBe('hac');
    });

    it('should correctly identify DMG com insulina protocol', () => {
      const params: SnapshotParams = {
        dumRaw: '01/01/2024',
        dumStatus: 'Sim - Confiavel',
        usgDateRaw: null,
        usgWeeks: null,
        usgDays: null,
        igPretendida: null,
        diagnosticosMaternos: 'DMG com insulina',
        diagnosticosFetais: null,
        indicacaoProcedimento: null,
        dataAgendamentoCalculada: '2024-09-15',
        dataAgendamentoManual: null,
        referenceDate: new Date('2024-04-01')
      };

      const result = getGestationalSnapshot(params);

      // Should detect DMG insulin protocol, not desejo_materno
      expect(result.protocolo).not.toBe('desejo_materno');
      expect(result.protocolo).toBe('dmg_insulina');
    });

    it('should correctly identify pre-eclampsia protocol', () => {
      const params: SnapshotParams = {
        dumRaw: '01/01/2024',
        dumStatus: 'Sim - Confiavel',
        usgDateRaw: null,
        usgWeeks: null,
        usgDays: null,
        igPretendida: null,
        diagnosticosMaternos: 'pré-eclâmpsia',
        diagnosticosFetais: null,
        indicacaoProcedimento: null,
        dataAgendamentoCalculada: '2024-09-15',
        dataAgendamentoManual: null,
        referenceDate: new Date('2024-04-01')
      };

      const result = getGestationalSnapshot(params);

      // Should detect pre-eclampsia protocol, not desejo_materno
      expect(result.protocolo).not.toBe('desejo_materno');
      expect(result.protocolo).toBe('pre_eclampsia_sem_deterioracao');
    });

    it('should correctly identify gemelar Di/Di protocol', () => {
      const params: SnapshotParams = {
        dumRaw: '01/01/2024',
        dumStatus: 'Sim - Confiavel',
        usgDateRaw: null,
        usgWeeks: null,
        usgDays: null,
        igPretendida: null,
        diagnosticosMaternos: null,
        diagnosticosFetais: 'Gemelar Di/Di',
        indicacaoProcedimento: null,
        dataAgendamentoCalculada: '2024-09-15',
        dataAgendamentoManual: null,
        referenceDate: new Date('2024-04-01')
      };

      const result = getGestationalSnapshot(params);

      // Should detect gemelar protocol, not desejo_materno
      expect(result.protocolo).not.toBe('desejo_materno');
      expect(result.protocolo).toBe('gemelar_bicorionico');
    });

    it('should correctly identify presentation pelvic protocol', () => {
      const params: SnapshotParams = {
        dumRaw: '01/01/2024',
        dumStatus: 'Sim - Confiavel',
        usgDateRaw: null,
        usgWeeks: null,
        usgDays: null,
        igPretendida: null,
        diagnosticosMaternos: null,
        diagnosticosFetais: 'Apresentação pélvica',
        indicacaoProcedimento: null,
        dataAgendamentoCalculada: '2024-09-15',
        dataAgendamentoManual: null,
        referenceDate: new Date('2024-04-01')
      };

      const result = getGestationalSnapshot(params);

      // Should detect pelvic presentation protocol, not desejo_materno
      expect(result.protocolo).not.toBe('desejo_materno');
      expect(result.protocolo).toBe('pelvico');
    });

    it('should choose most restrictive protocol when multiple diagnoses present', () => {
      const params: SnapshotParams = {
        dumRaw: '01/01/2024',
        dumStatus: 'Sim - Confiavel',
        usgDateRaw: null,
        usgWeeks: null,
        usgDays: null,
        igPretendida: null,
        diagnosticosMaternos: 'HAC + pré-eclâmpsia',
        diagnosticosFetais: null,
        indicacaoProcedimento: null,
        dataAgendamentoCalculada: '2024-09-15',
        dataAgendamentoManual: null,
        referenceDate: new Date('2024-04-01')
      };

      const result = getGestationalSnapshot(params);

      // Should identify pre-eclampsia (or the most restrictive), not desejo_materno
      expect(result.protocolo).not.toBe('desejo_materno');
    });

    it('should use protocol from indicacaoProcedimento when provided', () => {
      const params: SnapshotParams = {
        dumRaw: '01/01/2024',
        dumStatus: 'Sim - Confiavel',
        usgDateRaw: null,
        usgWeeks: null,
        usgDays: null,
        igPretendida: null,
        diagnosticosMaternos: null,
        diagnosticosFetais: null,
        indicacaoProcedimento: 'HIPERTENSAO GESTACIONAL',
        dataAgendamentoCalculada: '2024-09-15',
        dataAgendamentoManual: null,
        referenceDate: new Date('2024-04-01')
      };

      const result = getGestationalSnapshot(params);

      // Should detect gestational hypertension protocol, not desejo_materno
      expect(result.protocolo).not.toBe('desejo_materno');
      expect(result.protocolo).toBe('hipertensao_gestacional');
    });
  });
});
