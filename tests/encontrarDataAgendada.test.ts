/**
 * Unit Tests for encontrarDataAgendada module
 *
 * Tests cover:
 * - Sunday adjustment (skip to next day)
 * - Capacity adjustment (find next available slot)
 * - Lead time minimum adjustment (ensure >= 10 days)
 * - 'needs_review' status when no valid slot found within +7 days
 *
 * Run with: npm run test
 */

import { describe, it, expect } from 'vitest';
import {
  encontrarDataAgendada,
  formatIGCurta,
  calcularIGNaData,
  getIntervaloColor,
  getCapacidadeDia,
  temVagaDisponivel,
  isDomingo,
  isSabado,
  CAPACIDADE_MATERNIDADES,
  LEAD_TIME_MINIMO,
} from '../src/lib/scheduling/encontrarDataAgendada';

describe('encontrarDataAgendada module', () => {
  describe('isDomingo', () => {
    it('should return true for Sunday', () => {
      // 2024-01-07 is a Sunday
      expect(isDomingo(new Date('2024-01-07'))).toBe(true);
    });

    it('should return false for Monday', () => {
      // 2024-01-08 is a Monday
      expect(isDomingo(new Date('2024-01-08'))).toBe(false);
    });

    it('should return false for Saturday', () => {
      // 2024-01-06 is a Saturday
      expect(isDomingo(new Date('2024-01-06'))).toBe(false);
    });
  });

  describe('isSabado', () => {
    it('should return true for Saturday', () => {
      // 2024-01-06 is a Saturday
      expect(isSabado(new Date('2024-01-06'))).toBe(true);
    });

    it('should return false for Sunday', () => {
      expect(isSabado(new Date('2024-01-07'))).toBe(false);
    });
  });

  describe('getCapacidadeDia', () => {
    it('should return weekday capacity for Salvalus', () => {
      // 2024-01-08 is a Monday
      expect(getCapacidadeDia('Salvalus', new Date('2024-01-08'))).toBe(9);
    });

    it('should return Saturday capacity for Salvalus', () => {
      // 2024-01-06 is a Saturday
      expect(getCapacidadeDia('Salvalus', new Date('2024-01-06'))).toBe(7);
    });

    it('should return Sunday capacity (0) for all maternities', () => {
      // 2024-01-07 is a Sunday
      expect(getCapacidadeDia('Salvalus', new Date('2024-01-07'))).toBe(0);
      expect(getCapacidadeDia('Guarulhos', new Date('2024-01-07'))).toBe(0);
      expect(getCapacidadeDia('NotreCare', new Date('2024-01-07'))).toBe(0);
      expect(getCapacidadeDia('Cruzeiro', new Date('2024-01-07'))).toBe(0);
    });

    it('should return correct capacities for all maternities on weekdays', () => {
      const monday = new Date('2024-01-08');
      expect(getCapacidadeDia('Guarulhos', monday)).toBe(2);
      expect(getCapacidadeDia('NotreCare', monday)).toBe(6);
      expect(getCapacidadeDia('Salvalus', monday)).toBe(9);
      expect(getCapacidadeDia('Cruzeiro', monday)).toBe(3);
    });

    it('should return default capacity for unknown maternity', () => {
      expect(getCapacidadeDia('Unknown', new Date('2024-01-08'))).toBe(5);
    });
  });

  describe('temVagaDisponivel', () => {
    it('should return true when there is available capacity', () => {
      const ocupacao = new Map<string, number>();
      ocupacao.set('2024-01-08', 1); // 1 occupied
      
      expect(temVagaDisponivel('Salvalus', new Date('2024-01-08'), ocupacao)).toBe(true);
    });

    it('should return false when capacity is full', () => {
      const ocupacao = new Map<string, number>();
      ocupacao.set('2024-01-08', 9); // 9 occupied (Salvalus weekday max)
      
      expect(temVagaDisponivel('Salvalus', new Date('2024-01-08'), ocupacao)).toBe(false);
    });

    it('should return true when no occupation data exists', () => {
      const ocupacao = new Map<string, number>();
      expect(temVagaDisponivel('Salvalus', new Date('2024-01-08'), ocupacao)).toBe(true);
    });
  });

  describe('encontrarDataAgendada - Sunday adjustment', () => {
    it('should skip Sunday and use next Monday', () => {
      // 2024-01-07 is a Sunday, reference is 15 days before
      const dataIdeal = new Date('2024-01-07');
      const dataReferencia = new Date('2023-12-23'); // 15 days before
      
      const result = encontrarDataAgendada({
        dataIdeal,
        maternidade: 'Salvalus',
        dataReferencia,
      });
      
      expect(result.status).toBe('calculado');
      expect(result.dataAgendada).not.toBeNull();
      // Should be Monday 2024-01-08
      expect(result.dataAgendada!.getDay()).not.toBe(0); // Not Sunday
      expect(result.ajustadoPorDomingo).toBe(true);
    });
  });

  describe('encontrarDataAgendada - Capacity adjustment', () => {
    it('should find next available day when capacity is full', () => {
      const dataIdeal = new Date('2024-01-08'); // Monday
      const dataReferencia = new Date('2023-12-25'); // 14 days before
      
      // Fill up Monday capacity
      const ocupacao = new Map<string, number>();
      ocupacao.set('2024-01-08', 9); // Salvalus weekday max
      
      const result = encontrarDataAgendada({
        dataIdeal,
        maternidade: 'Salvalus',
        dataReferencia,
        ocupacaoAtual: ocupacao,
      });
      
      expect(result.status).toBe('calculado');
      expect(result.dataAgendada).not.toBeNull();
      // Should be Tuesday 2024-01-09 or later
      expect(result.dataAgendada!.getTime()).toBeGreaterThan(dataIdeal.getTime());
      expect(result.ajustadoPorCapacidade).toBe(true);
    });

    it('should respect Saturday capacity limits', () => {
      const dataIdeal = new Date('2024-01-13'); // Saturday
      const dataReferencia = new Date('2023-12-30'); // 14 days before
      
      // Fill up Saturday capacity
      const ocupacao = new Map<string, number>();
      ocupacao.set('2024-01-13', 7); // Salvalus Saturday max
      
      const result = encontrarDataAgendada({
        dataIdeal,
        maternidade: 'Salvalus',
        dataReferencia,
        ocupacaoAtual: ocupacao,
      });
      
      expect(result.status).toBe('calculado');
      // Should skip to next available day (Monday since Sunday has 0 capacity)
      expect(result.dataAgendada!.getTime()).toBeGreaterThan(dataIdeal.getTime());
    });
  });

  describe('encontrarDataAgendada - Lead time adjustment', () => {
    it('should adjust date when lead time is less than 10 days', () => {
      const dataIdeal = new Date('2024-01-10');
      const dataReferencia = new Date('2024-01-05'); // Only 5 days before
      
      const result = encontrarDataAgendada({
        dataIdeal,
        maternidade: 'Salvalus',
        dataReferencia,
        margemDias: 7, // Give enough margin
      });
      
      expect(result.leadTimeDias).toBeGreaterThanOrEqual(LEAD_TIME_MINIMO);
      expect(result.ajustadoPorLeadTime).toBe(true);
    });

    it('should not adjust when lead time is already >= 10 days', () => {
      const dataIdeal = new Date('2024-01-20');
      const dataReferencia = new Date('2024-01-05'); // 15 days before
      
      const result = encontrarDataAgendada({
        dataIdeal,
        maternidade: 'Salvalus',
        dataReferencia,
      });
      
      expect(result.status).toBe('calculado');
      expect(result.ajustadoPorLeadTime).toBe(false);
      expect(result.leadTimeDias).toBeGreaterThanOrEqual(LEAD_TIME_MINIMO);
    });
  });

  describe('encontrarDataAgendada - needs_review when no valid slot', () => {
    it('should return needs_review when all days in window are full', () => {
      const dataIdeal = new Date('2024-01-08'); // Monday
      const dataReferencia = new Date('2023-12-25'); // 14 days before
      // dataMinima = Dec 25 + 10 = Jan 4
      // dataLimite = Jan 8 + 2 = Jan 10
      
      // Fill up all days from Jan 4 to Jan 10 (window limit)
      const ocupacao = new Map<string, number>();
      ocupacao.set('2024-01-04', 100);
      ocupacao.set('2024-01-05', 100);
      ocupacao.set('2024-01-06', 100); // Saturday
      // 2024-01-07 is Sunday - skipped by algorithm
      ocupacao.set('2024-01-08', 100);
      ocupacao.set('2024-01-09', 100);
      ocupacao.set('2024-01-10', 100);
      
      const result = encontrarDataAgendada({
        dataIdeal,
        maternidade: 'Salvalus',
        dataReferencia,
        margemDias: 2, // Small margin - only allows up to Jan 10
        ocupacaoAtual: ocupacao,
      });
      
      expect(result.status).toBe('needs_review');
      expect(result.dataAgendada).toBeNull();
    });

    it('should return needs_review when lead time cannot be satisfied within window', () => {
      const dataIdeal = new Date('2024-01-08');
      const dataReferencia = new Date('2024-01-07'); // Only 1 day before
      // dataMinima = Jan 7 + 10 = Jan 17
      // dataLimite = Jan 8 + 2 = Jan 10
      // dataMinima > dataLimite, so no valid dates possible
      
      const result = encontrarDataAgendada({
        dataIdeal,
        maternidade: 'Salvalus',
        dataReferencia,
        margemDias: 2, // Small margin - can't reach 10 days lead time
      });
      
      expect(result.status).toBe('needs_review');
      expect(result.dataAgendada).toBeNull();
    });
  });

  describe('encontrarDataAgendada - respects IG window', () => {
    it('should not schedule beyond IG window limit', () => {
      const dataIdeal = new Date('2024-01-08'); // Monday
      const dataReferencia = new Date('2023-12-25'); // 14 days before
      // dataMinima = Dec 25 + 10 = Jan 4
      // dataLimite = Jan 8 + 2 = Jan 10
      
      // Fill up all days from Jan 4 to Jan 10 (within window)
      const ocupacao = new Map<string, number>();
      ocupacao.set('2024-01-04', 100);
      ocupacao.set('2024-01-05', 100);
      ocupacao.set('2024-01-06', 100); // Saturday
      // Jan 7 is Sunday - skipped by algorithm
      ocupacao.set('2024-01-08', 100);
      ocupacao.set('2024-01-09', 100);
      ocupacao.set('2024-01-10', 100);
      // Jan 11 is beyond window (margemDias=2), should not be considered
      
      const result = encontrarDataAgendada({
        dataIdeal,
        maternidade: 'Salvalus',
        dataReferencia,
        margemDias: 2, // Only allow +2 days from ideal (up to Jan 10)
        ocupacaoAtual: ocupacao,
      });
      
      expect(result.status).toBe('needs_review');
    });
  });

  describe('formatIGCurta', () => {
    it('should format IG correctly', () => {
      expect(formatIGCurta(39, 2)).toBe('39s2d');
      expect(formatIGCurta(40, 0)).toBe('40s0d');
      expect(formatIGCurta(37, 6)).toBe('37s6d');
    });
  });

  describe('calcularIGNaData', () => {
    it('should calculate IG at future date correctly', () => {
      const igAtual = 273; // 39 weeks
      const dataRef = new Date('2024-01-01');
      const dataAlvo = new Date('2024-01-08'); // 7 days later
      
      const result = calcularIGNaData(igAtual, dataRef, dataAlvo);
      
      expect(result.totalDias).toBe(280); // 40 weeks
      expect(result.semanas).toBe(40);
      expect(result.dias).toBe(0);
    });

    it('should handle partial weeks correctly', () => {
      const igAtual = 270; // 38 weeks 4 days
      const dataRef = new Date('2024-01-01');
      const dataAlvo = new Date('2024-01-05'); // 4 days later
      
      const result = calcularIGNaData(igAtual, dataRef, dataAlvo);
      
      expect(result.totalDias).toBe(274);
      expect(result.semanas).toBe(39);
      expect(result.dias).toBe(1);
    });
  });

  describe('getIntervaloColor', () => {
    it('should return green for interval within margin', () => {
      expect(getIntervaloColor(0, 7)).toBe('green');
      expect(getIntervaloColor(7, 7)).toBe('green');
      expect(getIntervaloColor(-7, 7)).toBe('green');
    });

    it('should return yellow for interval within 2x margin', () => {
      expect(getIntervaloColor(8, 7)).toBe('yellow');
      expect(getIntervaloColor(14, 7)).toBe('yellow');
      expect(getIntervaloColor(-10, 7)).toBe('yellow');
    });

    it('should return red for interval beyond 2x margin', () => {
      expect(getIntervaloColor(15, 7)).toBe('red');
      expect(getIntervaloColor(-15, 7)).toBe('red');
    });
  });

  describe('CAPACIDADE_MATERNIDADES constant', () => {
    it('should have correct configuration for all maternities', () => {
      expect(CAPACIDADE_MATERNIDADES['Guarulhos']).toEqual([2, 1, 0]);
      expect(CAPACIDADE_MATERNIDADES['NotreCare']).toEqual([6, 2, 0]);
      expect(CAPACIDADE_MATERNIDADES['Salvalus']).toEqual([9, 7, 0]);
      expect(CAPACIDADE_MATERNIDADES['Cruzeiro']).toEqual([3, 1, 0]);
    });
  });
});
