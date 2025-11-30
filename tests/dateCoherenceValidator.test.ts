/**
 * Tests for dateCoherenceValidator module
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { validarCoerenciaDatas, temSugestaoDisponivel, getLabelCampo, getLabelTipo } from '../src/lib/validation/dateCoherenceValidator';

describe('dateCoherenceValidator', () => {
  // Fixed reference date for consistent tests: November 30, 2025
  const dataReferencia = new Date(2025, 10, 30); // Month is 0-indexed
  
  describe('validarCoerenciaDatas', () => {
    describe('idade_implausivel - Maternal Age', () => {
      it('should detect implausible age when birth date results in age < 10 years', () => {
        const incoerencias = validarCoerenciaDatas({
          data_nascimento: '15/01/2020', // Would make patient 5 years old
        }, dataReferencia);
        
        expect(incoerencias).toHaveLength(1);
        expect(incoerencias[0].tipo).toBe('idade_implausivel');
        expect(incoerencias[0].campo).toBe('data_nascimento');
        expect(incoerencias[0].detalhes.idadeCalculada).toBeLessThan(10);
      });

      it('should detect implausible age when birth date results in age > 60 years', () => {
        const incoerencias = validarCoerenciaDatas({
          data_nascimento: '15/01/1960', // Would make patient 65 years old
        }, dataReferencia);
        
        expect(incoerencias).toHaveLength(1);
        expect(incoerencias[0].tipo).toBe('idade_implausivel');
        expect(incoerencias[0].campo).toBe('data_nascimento');
        expect(incoerencias[0].detalhes.idadeCalculada).toBeGreaterThan(60);
      });

      it('should not flag normal maternal age (25 years)', () => {
        const incoerencias = validarCoerenciaDatas({
          data_nascimento: '15/01/2000', // Would make patient ~25 years old
        }, dataReferencia);
        
        const idadeIncoerencias = incoerencias.filter(i => i.tipo === 'idade_implausivel');
        expect(idadeIncoerencias).toHaveLength(0);
      });

      it('should suggest correction for young age', () => {
        const incoerencias = validarCoerenciaDatas({
          data_nascimento: '11/01/2025', // Would make patient 0 years old
        }, dataReferencia);
        
        expect(incoerencias).toHaveLength(1);
        expect(incoerencias[0].sugestaoCorrecao).toBeDefined();
        expect(incoerencias[0].sugestaoCorrecao).toContain('1995');
      });
    });

    describe('data_futura - Future Dates', () => {
      it('should detect USG date in the future', () => {
        const incoerencias = validarCoerenciaDatas({
          data_primeiro_usg: '15/12/2025', // Future date
          semanas_usg: '12',
          dias_usg: '0',
        }, dataReferencia);
        
        const futuraIncoerencias = incoerencias.filter(i => i.tipo === 'data_futura');
        expect(futuraIncoerencias).toHaveLength(1);
        expect(futuraIncoerencias[0].campo).toBe('data_primeiro_usg');
      });

      it('should detect DUM date in the future', () => {
        const incoerencias = validarCoerenciaDatas({
          data_dum: '15/12/2025', // Future date
          dum_status: 'Sim - Confiavel',
        }, dataReferencia);
        
        const futuraIncoerencias = incoerencias.filter(i => i.tipo === 'data_futura');
        expect(futuraIncoerencias).toHaveLength(1);
        expect(futuraIncoerencias[0].campo).toBe('data_dum');
      });

      it('should not flag past dates', () => {
        const incoerencias = validarCoerenciaDatas({
          data_primeiro_usg: '15/06/2025', // Past date
          semanas_usg: '12',
          dias_usg: '0',
        }, dataReferencia);
        
        const futuraIncoerencias = incoerencias.filter(i => i.tipo === 'data_futura');
        expect(futuraIncoerencias).toHaveLength(0);
      });
    });

    describe('usg_muito_antigo - Old USG with 2024', () => {
      it('should detect USG > 12 months old with year 2024', () => {
        const incoerencias = validarCoerenciaDatas({
          data_primeiro_usg: '15/05/2024', // > 12 months old
          semanas_usg: '12',
          dias_usg: '0',
        }, dataReferencia);
        
        const antigaIncoerencias = incoerencias.filter(i => i.tipo === 'usg_muito_antigo');
        expect(antigaIncoerencias.length).toBeGreaterThan(0);
        expect(antigaIncoerencias[0].sugestaoCorrecao).toBe('15/05/2025');
      });

      it('should detect DUM > 10 months old with year 2024', () => {
        const incoerencias = validarCoerenciaDatas({
          data_dum: '15/01/2024', // > 10 months old
          dum_status: 'Sim - Confiavel',
        }, dataReferencia);
        
        const antigaIncoerencias = incoerencias.filter(i => i.tipo === 'usg_muito_antigo');
        expect(antigaIncoerencias.length).toBeGreaterThan(0);
        expect(antigaIncoerencias[0].sugestaoCorrecao).toBe('15/01/2025');
      });

      it('should not flag recent USG with year 2025', () => {
        const incoerencias = validarCoerenciaDatas({
          data_primeiro_usg: '15/06/2025', // Recent, 2025
          semanas_usg: '12',
          dias_usg: '0',
        }, dataReferencia);
        
        const antigaIncoerencias = incoerencias.filter(i => i.tipo === 'usg_muito_antigo');
        expect(antigaIncoerencias).toHaveLength(0);
      });
    });

    describe('ig_impossivel - Impossible Gestational Age', () => {
      it('should detect IG > 42 weeks (e.g., 50 weeks)', () => {
        // USG from May 2024 with 12 weeks would result in ~50+ weeks by Nov 2025
        const incoerencias = validarCoerenciaDatas({
          data_primeiro_usg: '05/05/2024', // Very old USG
          semanas_usg: '12',
          dias_usg: '0',
          dum_status: 'Incerta',
        }, dataReferencia);
        
        const igIncoerencias = incoerencias.filter(i => i.tipo === 'ig_impossivel');
        expect(igIncoerencias.length).toBeGreaterThan(0);
        expect(igIncoerencias[0].detalhes.igCalculada).toMatch(/\d+s\d+d/);
      });

      it('should suggest year correction for IG > 42 weeks', () => {
        const incoerencias = validarCoerenciaDatas({
          data_primeiro_usg: '05/05/2024', // Very old USG
          semanas_usg: '12',
          dias_usg: '0',
          dum_status: 'Incerta',
        }, dataReferencia);
        
        const igIncoerencias = incoerencias.filter(i => i.tipo === 'ig_impossivel');
        expect(igIncoerencias.length).toBeGreaterThan(0);
        expect(igIncoerencias[0].sugestaoCorrecao).toContain('2025');
      });

      it('should not flag normal IG (e.g., 30 weeks)', () => {
        // USG from late September 2025 with 10 weeks would be ~18 weeks by Nov 30
        const incoerencias = validarCoerenciaDatas({
          data_primeiro_usg: '20/09/2025',
          semanas_usg: '10',
          dias_usg: '0',
          dum_status: 'Incerta',
        }, dataReferencia);
        
        const igIncoerencias = incoerencias.filter(i => i.tipo === 'ig_impossivel');
        expect(igIncoerencias).toHaveLength(0);
      });
    });

    describe('multiple incoherencies', () => {
      it('should detect multiple incoherencies in same row', () => {
        const incoerencias = validarCoerenciaDatas({
          data_nascimento: '15/01/2020', // Age ~5 years
          data_primeiro_usg: '05/05/2024', // Old USG
          semanas_usg: '12',
          dias_usg: '0',
          dum_status: 'Incerta',
        }, dataReferencia);
        
        expect(incoerencias.length).toBeGreaterThan(1);
        const tipos = incoerencias.map(i => i.tipo);
        expect(tipos).toContain('idade_implausivel');
      });

      it('should add igCalculada to ALL incoherencies when IG is calculated successfully', () => {
        /**
         * Test case: USG from 2024 with 12 weeks results in IG > 42 weeks by Nov 2025
         * This should trigger both usg_muito_antigo AND ig_impossivel
         * BOTH should have igCalculada in their details
         */
        const incoerencias = validarCoerenciaDatas({
          data_primeiro_usg: '05/05/2024', // Old USG with year 2024
          semanas_usg: '12',
          dias_usg: '0',
          dum_status: 'Incerta',
        }, dataReferencia);
        
        expect(incoerencias.length).toBeGreaterThan(0);
        
        // ALL incoherencies should have igCalculada when IG was calculated
        const usgAntigoInco = incoerencias.find(i => i.tipo === 'usg_muito_antigo');
        const igImpossivel = incoerencias.find(i => i.tipo === 'ig_impossivel');
        
        // Both should exist
        expect(usgAntigoInco).toBeDefined();
        expect(igImpossivel).toBeDefined();
        
        // Both should have igCalculada
        expect(usgAntigoInco?.detalhes.igCalculada).toBeDefined();
        expect(usgAntigoInco?.detalhes.igCalculada).toMatch(/\d+s\d+d/);
        expect(igImpossivel?.detalhes.igCalculada).toBeDefined();
        expect(igImpossivel?.detalhes.igCalculada).toMatch(/\d+s\d+d/);
      });
    });

    describe('empty/null data', () => {
      it('should return empty array for empty data', () => {
        const incoerencias = validarCoerenciaDatas({}, dataReferencia);
        expect(incoerencias).toHaveLength(0);
      });

      it('should return empty array for undefined values', () => {
        const incoerencias = validarCoerenciaDatas({
          data_nascimento: undefined,
          data_dum: undefined,
          data_primeiro_usg: undefined,
        }, dataReferencia);
        expect(incoerencias).toHaveLength(0);
      });
    });

    describe('historical data validation with dataReferencia', () => {
      it('should NOT flag valid historical data when using appropriate dataReferencia (Caso 1)', () => {
        /**
         * Caso 1: Dado Histórico Válido (NÃO deve gerar alerta)
         * data_registro: 15/01/2025
         * data_primeiro_usg: 10/12/2024
         * semanas_usg: 12
         * dias_usg: 3
         * Resultado esperado: IG ~16 semanas na data do registro (válida, sem modal)
         */
        const dataRegistro = new Date(2025, 0, 15); // 15/01/2025
        
        const incoerencias = validarCoerenciaDatas({
          data_primeiro_usg: '10/12/2024',
          semanas_usg: '12',
          dias_usg: '3',
          dum_status: 'Incerta',
        }, dataRegistro);
        
        // Should not have any IG-related incoherencies when validated at correct reference date
        const igIncoerencias = incoerencias.filter(i => i.tipo === 'ig_impossivel');
        expect(igIncoerencias).toHaveLength(0);
      });

      it('should flag historical data with real error when using appropriate dataReferencia (Caso 2)', () => {
        /**
         * Caso 2: Dado Histórico com Erro Real (DEVE gerar alerta)
         * data_registro: 15/01/2025
         * data_primeiro_usg: 10/10/2024 (much earlier to get impossible IG)
         * semanas_usg: 35
         * dias_usg: 0
         * Resultado: From Oct 10 to Jan 15 = ~97 days = ~14 weeks
         * IG at Jan 15 = 35 + 14 = 49 weeks (impossible, correct modal shown)
         */
        const dataRegistro = new Date(2025, 0, 15); // 15/01/2025
        
        const incoerencias = validarCoerenciaDatas({
          data_primeiro_usg: '10/10/2024', // Earlier to cause IG > 42 weeks
          semanas_usg: '35',
          dias_usg: '0',
          dum_status: 'Incerta',
        }, dataRegistro);
        
        // Should detect impossible IG even with historical reference date
        const igIncoerencias = incoerencias.filter(i => i.tipo === 'ig_impossivel');
        expect(igIncoerencias.length).toBeGreaterThan(0);
      });

      it('should use today as default when no dataReferencia provided (Caso 3)', () => {
        /**
         * Caso 3: Importação em Tempo Real (comportamento atual)
         * data_registro: [vazio]
         * Resultado esperado: Usa new Date(), comportamento normal mantido
         */
        // This test verifies the function works with current date by default
        const incoerencias = validarCoerenciaDatas({
          data_primeiro_usg: '28/11/2025',
          semanas_usg: '12',
          dias_usg: '0',
          dum_status: 'Incerta',
        }); // No second argument - should use new Date()
        
        // Recent USG should not be flagged as too old
        const antigaIncoerencias = incoerencias.filter(i => i.tipo === 'usg_muito_antigo');
        expect(antigaIncoerencias).toHaveLength(0);
      });

      it('should NOT flag USG from 2024 as too old when validated at January 2025', () => {
        /**
         * USG from December 2024 validated at January 2025 is only 1 month old
         * Should NOT trigger "USG muito antigo" error
         */
        const dataRegistro = new Date(2025, 0, 15); // 15/01/2025
        
        const incoerencias = validarCoerenciaDatas({
          data_primeiro_usg: '10/12/2024', // December 2024
          semanas_usg: '10',
          dias_usg: '0',
          dum_status: 'Incerta',
        }, dataRegistro);
        
        // Should NOT flag as too old (only ~1 month difference)
        const antigaIncoerencias = incoerencias.filter(i => i.tipo === 'usg_muito_antigo');
        expect(antigaIncoerencias).toHaveLength(0);
      });
    });
  });

  describe('temSugestaoDisponivel', () => {
    it('should return true when at least one incoherence has suggestion', () => {
      const incoerencias = validarCoerenciaDatas({
        data_primeiro_usg: '05/05/2024',
        semanas_usg: '12',
        dias_usg: '0',
        dum_status: 'Incerta',
      }, dataReferencia);
      
      expect(temSugestaoDisponivel(incoerencias)).toBe(true);
    });

    it('should return false for empty array', () => {
      expect(temSugestaoDisponivel([])).toBe(false);
    });
  });

  describe('getLabelCampo', () => {
    it('should return Portuguese label for data_nascimento', () => {
      expect(getLabelCampo('data_nascimento')).toBe('Data de Nascimento');
    });

    it('should return Portuguese label for data_dum', () => {
      expect(getLabelCampo('data_dum')).toBe('Data da DUM');
    });

    it('should return Portuguese label for data_primeiro_usg', () => {
      expect(getLabelCampo('data_primeiro_usg')).toBe('Data do Primeiro USG');
    });
  });

  describe('getLabelTipo', () => {
    it('should return Portuguese label for ig_impossivel', () => {
      expect(getLabelTipo('ig_impossivel')).toBe('Idade Gestacional Impossível');
    });

    it('should return Portuguese label for data_futura', () => {
      expect(getLabelTipo('data_futura')).toBe('Data no Futuro');
    });

    it('should return Portuguese label for idade_implausivel', () => {
      expect(getLabelTipo('idade_implausivel')).toBe('Idade Materna Implausível');
    });

    it('should return Portuguese label for usg_muito_antigo', () => {
      expect(getLabelTipo('usg_muito_antigo')).toBe('Data Muito Antiga');
    });
  });
});
