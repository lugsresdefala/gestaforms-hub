/**
 * Unit Tests for Obstetric Protocols Module
 * 
 * Tests cover:
 * - PROTOCOLS object structure
 * - DIAGNOSTIC_CHECKLIST completeness
 * - calculateAutomaticIG function
 * - mapDiagnosisToProtocol function
 * - getAllCategories function
 * - getDiagnosticsByCategory function
 * - identificarPatologias function (with text parsing)
 * - normalizarDiagnosticos helper function
 */

import { describe, it, expect } from 'vitest';

import {
  PROTOCOLS,
  DIAGNOSTIC_CHECKLIST,
  calculateAutomaticIG,
  mapDiagnosisToProtocol,
  getAllCategories,
  getDiagnosticsByCategory,
  type DiagnosticCategory
} from '../src/lib/obstetricProtocols';

import {
  identificarPatologias,
  normalizarDiagnosticos
} from '../src/lib/gestationalCalculations';

describe('obstetricProtocols module', () => {
  describe('PROTOCOLS object', () => {
    it('should have required protocol keys', () => {
      // Test new standardized IDs
      expect(PROTOCOLS.hac_compensada).toBeDefined();
      expect(PROTOCOLS.hac_dificil).toBeDefined();
      expect(PROTOCOLS.hipertensao_gestacional).toBeDefined();
      expect(PROTOCOLS.pre_eclampsia_sem_deterioracao).toBeDefined();
      expect(PROTOCOLS.pre_eclampsia_com_deterioracao).toBeDefined();
      
      // Diabetes
      expect(PROTOCOLS.dmg_sem_insulina_bom_controle).toBeDefined();
      expect(PROTOCOLS.dmg_insulina_bom_controle).toBeDefined();
      expect(PROTOCOLS.dm_pregestacional_bom_controle).toBeDefined();
      
      // Emergency protocols
      expect(PROTOCOLS.eclampsia).toBeDefined();
      expect(PROTOCOLS.sindrome_hellp).toBeDefined();
      expect(PROTOCOLS.dpp).toBeDefined();
    });
    
    it('should maintain backward compatibility with old protocol IDs', () => {
      // Test that old IDs still work
      expect(PROTOCOLS.hac).toBeDefined();
      expect(PROTOCOLS.dmg_sem_insulina).toBeDefined();
      expect(PROTOCOLS.dmg_insulina).toBeDefined();
      expect(PROTOCOLS.dm_pregestacional).toBeDefined();
      expect(PROTOCOLS.rcf).toBeDefined();
      expect(PROTOCOLS.rcf_grave).toBeDefined();
      expect(PROTOCOLS.macrossomia).toBeDefined();
      expect(PROTOCOLS.oligodramnia).toBeDefined();
      expect(PROTOCOLS.polidramnia).toBeDefined();
      expect(PROTOCOLS.gemelar_monocorionico).toBeDefined();
      expect(PROTOCOLS.lupus).toBeDefined();
      expect(PROTOCOLS.cerclagem).toBeDefined();
    });
    
    it('should have valid igIdeal values for all protocols', () => {
      for (const [key, protocol] of Object.entries(PROTOCOLS)) {
        expect(protocol.igIdeal).toBeDefined();
        // igIdeal should be a number string or "Imediato"
        const isValidIg = !isNaN(parseInt(protocol.igIdeal)) || protocol.igIdeal === 'Imediato';
        expect(isValidIg).toBe(true);
      }
    });
    
    it('should have prioridade between 1 and 3', () => {
      for (const [key, protocol] of Object.entries(PROTOCOLS)) {
        expect(protocol.prioridade).toBeGreaterThanOrEqual(1);
        expect(protocol.prioridade).toBeLessThanOrEqual(3);
      }
    });
  });

  describe('DIAGNOSTIC_CHECKLIST', () => {
    it('should have unique IDs', () => {
      const ids = DIAGNOSTIC_CHECKLIST.map(d => d.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
    
    it('should cover all major categories', () => {
      const categories = new Set(DIAGNOSTIC_CHECKLIST.map(d => d.categoria));
      expect(categories.has('hipertensao')).toBe(true);
      expect(categories.has('diabetes')).toBe(true);
      expect(categories.has('outras_maternas')).toBe(true);
      expect(categories.has('liquido_amniotico')).toBe(true);
      expect(categories.has('crescimento_fetal')).toBe(true);
      expect(categories.has('gemelaridade')).toBe(true);
    });
    
    it('should have igIdeal for all diagnostics', () => {
      for (const diag of DIAGNOSTIC_CHECKLIST) {
        expect(diag.igIdeal).toBeDefined();
        expect(parseInt(diag.igIdeal)).toBeGreaterThanOrEqual(28);
        expect(parseInt(diag.igIdeal)).toBeLessThanOrEqual(41);
      }
    });
    
    it('should have at least 5 hypertension conditions', () => {
      const hipertensao = DIAGNOSTIC_CHECKLIST.filter(d => d.categoria === 'hipertensao');
      expect(hipertensao.length).toBeGreaterThanOrEqual(5);
    });
    
    it('should have at least 6 diabetes conditions', () => {
      const diabetes = DIAGNOSTIC_CHECKLIST.filter(d => d.categoria === 'diabetes');
      expect(diabetes.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('calculateAutomaticIG', () => {
    it('should return null for empty diagnostics (no baixo_risco fallback)', () => {
      const result = calculateAutomaticIG([]);
      // Não existe "baixo risco" - deve retornar null quando não há diagnósticos
      expect(result).toBeNull();
    });
    
    it('should return correct IG for single hypertension diagnosis', () => {
      const result = calculateAutomaticIG(['hac_compensada']);
      expect(result).not.toBeNull();
      expect(result!.igPretendida).toBe('39');
      expect(result!.protocoloAplicado).toBe('hac_compensada');
    });
    
    it('should return correct IG for HAC dificil', () => {
      const result = calculateAutomaticIG(['hac_dificil']);
      expect(result.igPretendida).toBe('37');
      expect(result.protocoloAplicado).toBe('hac_dificil');
    });
    
    it('should return most restrictive IG when multiple diagnoses', () => {
      // hac_compensada = 39 weeks, dm_pregestacional_descontrole = 36-37 weeks
      const result = calculateAutomaticIG(['hac_compensada', 'dm_pregestacional_descontrole']);
      expect(parseInt(result.igPretendida)).toBeLessThanOrEqual(37);
    });
    
    it('should prioritize critical protocols', () => {
      const result = calculateAutomaticIG(['desejo_materno', 'pre_eclampsia_com_deterioracao']);
      // pre_eclampsia_com_deterioracao has priority 1
      expect(result.prioridade).toBe(1);
    });
    
    it('should return Imediato for emergency protocols', () => {
      const result = calculateAutomaticIG(['eclampsia']);
      expect(result.igPretendida).toBe('Imediato');
      expect(result.prioridade).toBe(1);
    });
    
    it('should handle gemelar monoamniotico', () => {
      const result = calculateAutomaticIG(['gemelar_monocorionico_monoamniotico']);
      expect(parseInt(result.igPretendida)).toBeLessThanOrEqual(34);
    });
    
    it('should handle old protocol IDs', () => {
      const result = calculateAutomaticIG(['dmg_sem_insulina']);
      expect(result.igPretendida).toBeDefined();
    });
  });

  describe('mapDiagnosisToProtocol', () => {
    it('should return empty array for empty input', () => {
      const result = mapDiagnosisToProtocol([]);
      expect(result).toEqual([]);
    });
    
    it('should map direct protocol IDs', () => {
      const result = mapDiagnosisToProtocol(['hac_compensada', 'dmg_sem_insulina_bom_controle']);
      expect(result).toContain('hac_compensada');
      expect(result).toContain('dmg_sem_insulina_bom_controle');
    });
    
    it('should map text-based diagnoses', () => {
      const result = mapDiagnosisToProtocol(['Hipertensão gestacional']);
      expect(result).toContain('hipertensao_gestacional');
    });
    
    it('should map diabetes text diagnoses', () => {
      const result = mapDiagnosisToProtocol(['DMG com insulina']);
      expect(result).toContain('dmg_insulina');
    });
    
    it('should map pre-eclampsia diagnoses', () => {
      const result = mapDiagnosisToProtocol(['Pré-eclâmpsia']);
      expect(result).toContain('pre_eclampsia_sem_deterioracao');
    });
    
    it('should remove duplicates', () => {
      const result = mapDiagnosisToProtocol(['hac_compensada', 'hac_compensada']);
      expect(result).toHaveLength(1);
    });
    
    it('should handle cerclagem/IIC as critical', () => {
      const result = mapDiagnosisToProtocol(['Cerclagem']);
      expect(result).toContain('cerclagem');
    });
  });

  describe('getAllCategories', () => {
    it('should return all 13 categories', () => {
      const categories = getAllCategories();
      expect(categories.length).toBe(13);
    });
    
    it('should have id and label for each category', () => {
      const categories = getAllCategories();
      for (const cat of categories) {
        expect(cat.id).toBeDefined();
        expect(cat.label).toBeDefined();
        expect(cat.label.length).toBeGreaterThan(0);
      }
    });
    
    it('should include essential categories', () => {
      const categories = getAllCategories();
      const ids = categories.map(c => c.id);
      expect(ids).toContain('hipertensao');
      expect(ids).toContain('diabetes');
      expect(ids).toContain('gemelaridade');
      expect(ids).toContain('eletivos');
    });
  });

  describe('getDiagnosticsByCategory', () => {
    it('should return diagnostics for hipertensao', () => {
      const diagnostics = getDiagnosticsByCategory('hipertensao');
      expect(diagnostics.length).toBeGreaterThan(0);
      expect(diagnostics.every(d => d.categoria === 'hipertensao')).toBe(true);
    });
    
    it('should return diagnostics for diabetes', () => {
      const diagnostics = getDiagnosticsByCategory('diabetes');
      expect(diagnostics.length).toBeGreaterThan(0);
      expect(diagnostics.every(d => d.categoria === 'diabetes')).toBe(true);
    });
    
    it('should return empty array for non-existent category', () => {
      const diagnostics = getDiagnosticsByCategory('non_existent' as DiagnosticCategory);
      expect(diagnostics).toEqual([]);
    });
  });

  describe('Protocol IG values match requirements', () => {
    // Test specific IG requirements from the problem statement
    
    it('HAC compensada should be 39-40 weeks', () => {
      const protocol = PROTOCOLS.hac_compensada;
      expect(protocol.igIdeal).toBe('39');
      expect(protocol.igIdealMax).toBe('40');
    });
    
    it('HAC dificil controle should be 37 weeks', () => {
      const protocol = PROTOCOLS.hac_dificil;
      expect(protocol.igIdeal).toBe('37');
    });
    
    it('Hipertensao gestacional should be 37 weeks', () => {
      const protocol = PROTOCOLS.hipertensao_gestacional;
      expect(protocol.igIdeal).toBe('37');
    });
    
    it('Pre-eclampsia SEM deterioracao should be 37 weeks', () => {
      const protocol = PROTOCOLS.pre_eclampsia_sem_deterioracao;
      expect(protocol.igIdeal).toBe('37');
    });
    
    it('DMG sem insulina bom controle should be 39-40 weeks', () => {
      const protocol = PROTOCOLS.dmg_sem_insulina_bom_controle;
      expect(protocol.igIdeal).toBe('39');
      expect(protocol.igIdealMax).toBe('40');
    });
    
    it('DMG com insulina bom controle should be 38 weeks', () => {
      const protocol = PROTOCOLS.dmg_insulina_bom_controle;
      expect(protocol.igIdeal).toBe('38');
    });
    
    it('DM pregestacional bom controle should be 38 weeks', () => {
      const protocol = PROTOCOLS.dm_pregestacional_bom_controle;
      expect(protocol.igIdeal).toBe('38');
    });
    
    it('DM pregestacional descontrole should be 36-37 weeks', () => {
      const protocol = PROTOCOLS.dm_pregestacional_descontrole;
      expect(protocol.igIdeal).toBe('36');
      expect(protocol.igIdealMax).toBe('37');
    });
    
    it('Polidramnia leve-moderado should be 38-39 weeks', () => {
      const protocol = PROTOCOLS.polidramnia_leve_moderado;
      expect(protocol.igIdeal).toBe('38');
      expect(protocol.igIdealMax).toBe('39');
    });
    
    it('Polidramnia severo should be 35-37 weeks', () => {
      const protocol = PROTOCOLS.polidramnia_severo;
      expect(protocol.igIdeal).toBe('35');
      expect(protocol.igIdealMax).toBe('37');
    });
    
    it('Oligoamnio isolado should be 36-37 weeks', () => {
      const protocol = PROTOCOLS.oligoamnio_isolado;
      expect(protocol.igIdeal).toBe('36');
      expect(protocol.igIdealMax).toBe('37');
    });
  });

  describe('identificarPatologias with text parsing', () => {
    describe('normalizarDiagnosticos helper', () => {
      it('should return empty array for undefined', () => {
        expect(normalizarDiagnosticos(undefined)).toEqual([]);
      });

      it('should return empty array for empty string', () => {
        expect(normalizarDiagnosticos('')).toEqual([]);
      });

      it('should pass through array as-is', () => {
        expect(normalizarDiagnosticos(['dmg_sem_insulina', 'hac_compensada']))
          .toEqual(['dmg_sem_insulina', 'hac_compensada']);
      });

      it('should split comma-separated string', () => {
        expect(normalizarDiagnosticos('DMG, HAC, Oligoâmnio'))
          .toEqual(['DMG', 'HAC', 'Oligoâmnio']);
      });

      it('should split semicolon-separated string', () => {
        expect(normalizarDiagnosticos('DMG; HAC; Oligoâmnio'))
          .toEqual(['DMG', 'HAC', 'Oligoâmnio']);
      });

      it('should split newline-separated string', () => {
        expect(normalizarDiagnosticos('DMG\nHAC\nOligoâmnio'))
          .toEqual(['DMG', 'HAC', 'Oligoâmnio']);
      });

      it('should trim whitespace from each item', () => {
        expect(normalizarDiagnosticos('  DMG  ,  HAC  '))
          .toEqual(['DMG', 'HAC']);
      });

      it('should filter out empty items', () => {
        expect(normalizarDiagnosticos('DMG,,HAC'))
          .toEqual(['DMG', 'HAC']);
      });
    });

    describe('identificarPatologias with free text', () => {
      it('should identify protocol from free text in diagnosticos_maternos', () => {
        const patologias = identificarPatologias({
          procedimentos: ['Cesárea Eletiva'],
          diagnosticosMaternos: 'DMG com insulina descompensada, HAC difícil controle',
          diagnosticosFetais: undefined,
        });
        
        expect(patologias).toContain('dmg_insulina_descomp');
        expect(patologias).toContain('hac_dificil');
      });

      it('should identify protocol from indicacao_procedimento field', () => {
        const patologias = identificarPatologias({
          procedimentos: ['Cesárea Eletiva'],
          indicacaoProcedimento: 'Pré-eclâmpsia grave',
        });
        
        expect(patologias).toContain('pre_eclampsia_grave');
      });

      it('should handle mix of structured IDs and free text', () => {
        const patologias = identificarPatologias({
          procedimentos: [],
          diagnosticosMaternos: ['dmg_sem_insulina'], // ID estruturado
          diagnosticosFetais: 'Restrição de crescimento fetal', // Texto livre
        });
        
        expect(patologias).toContain('dmg_sem_insulina');
        expect(patologias).toContain('rcf');
      });

      it('should split comma-separated diagnoses', () => {
        const patologias = identificarPatologias({
          procedimentos: [],
          diagnosticosMaternos: 'DMG, HAC, Oligoâmnio',
        });
        
        expect(patologias.length).toBeGreaterThanOrEqual(3);
        expect(patologias).toContain('dmg_sem_insulina');
        expect(patologias).toContain('hac');
        expect(patologias).toContain('oligodramnia');
      });

      // NOTE: desejo_materno is no longer added as a fallback - it's not a clinical pathology
      // When no diagnoses are found, the system requires validation (no baixo_risco fallback)
      it('should return empty array for cesarea eletiva without diagnoses (no desejo_materno fallback)', () => {
        const patologias = identificarPatologias({
          procedimentos: ['Cesárea Eletiva'],
          diagnosticosMaternos: undefined,
          diagnosticosFetais: undefined,
        });
        
        // desejo_materno is no longer added as fallback
        expect(patologias).not.toContain('desejo_materno');
        expect(patologias).toEqual([]);
      });

      it('should not add desejo_materno if diagnoses are found', () => {
        const patologias = identificarPatologias({
          procedimentos: ['Cesárea Eletiva'],
          indicacaoProcedimento: 'DMG com insulina',
        });
        
        expect(patologias).toContain('dmg_insulina');
        expect(patologias).not.toContain('desejo_materno');
      });

      // NOTE: laqueadura is no longer included in patologias - it's just a procedure, not a clinical pathology
      it('should not include laqueadura from procedimentos (procedure only, not pathology)', () => {
        const patologias = identificarPatologias({
          procedimentos: ['Cesárea + Laqueadura'],
          diagnosticosMaternos: undefined,
        });
        
        // laqueadura should NOT be in patologias as it doesn't affect IG calculation
        expect(patologias).not.toContain('laqueadura');
        expect(patologias).toEqual([]);
      });

      it('should handle placenta prévia with acretismo', () => {
        const patologias = identificarPatologias({
          procedimentos: [],
          diagnosticosMaternos: 'Placenta acreta',
          placentaPrevia: 'Sim',
        });
        
        expect(patologias).toContain('placenta_acreta');
        expect(patologias).not.toContain('placenta_previa_sem_acretismo');
      });

      it('should add placenta_previa_sem_acretismo when no acretismo', () => {
        const patologias = identificarPatologias({
          procedimentos: [],
          diagnosticosMaternos: undefined,
          placentaPrevia: 'Sim',
        });
        
        expect(patologias).toContain('placenta_previa_sem_acretismo');
      });

      it('should handle cerclagem text', () => {
        const patologias = identificarPatologias({
          procedimentos: [],
          indicacaoProcedimento: 'Paciente com cerclagem prévia',
        });
        
        expect(patologias).toContain('cerclagem');
      });

      it('should handle hipertensão gestacional text', () => {
        const patologias = identificarPatologias({
          procedimentos: [],
          diagnosticosMaternos: 'Hipertensão gestacional',
        });
        
        expect(patologias).toContain('hipertensao_gestacional');
      });

      it('should remove duplicates', () => {
        const patologias = identificarPatologias({
          procedimentos: [],
          diagnosticosMaternos: 'DMG, DMG, diabetes gestacional',
          indicacaoProcedimento: 'DMG',
        });
        
        // Even with multiple mentions, should only appear once
        const dmgCount = patologias.filter(p => p.includes('dmg')).length;
        expect(dmgCount).toBe(1);
      });

      it('should maintain backward compatibility with array of IDs', () => {
        const patologias = identificarPatologias({
          procedimentos: [],
          diagnosticosMaternos: ['hac_compensada', 'dmg_sem_insulina_bom_controle'],
          diagnosticosFetais: ['rcf_pig_sem_comorbidade'],
        });
        
        expect(patologias).toContain('hac_compensada');
        expect(patologias).toContain('dmg_sem_insulina_bom_controle');
        expect(patologias).toContain('rcf_pig_sem_comorbidade');
      });
      
      // NEW TESTS: Real pathologies should take precedence over desejo_materno
      describe('Real pathologies take precedence over desejo_materno', () => {
        it('should NOT classify as desejo_materno when HAC is present', () => {
          const patologias = identificarPatologias({
            procedimentos: ['Cesárea Eletiva'],
            diagnosticosMaternos: 'HAC',
          });
          
          expect(patologias).toContain('hac');
          expect(patologias).not.toContain('desejo_materno');
        });
        
        it('should NOT classify as desejo_materno when HAS crônica is present', () => {
          const patologias = identificarPatologias({
            procedimentos: ['Cesárea Eletiva'],
            diagnosticosMaternos: 'HAS crônica',
          });
          
          expect(patologias).toContain('hac');
          expect(patologias).not.toContain('desejo_materno');
        });
        
        it('should identify sífilis tratada correctly', () => {
          const patologias = identificarPatologias({
            procedimentos: ['Cesárea Eletiva'],
            diagnosticosMaternos: 'sífilis tratada',
          });
          
          expect(patologias).toContain('sifilis_tratada');
          expect(patologias).not.toContain('desejo_materno');
        });
        
        it('should identify toxoplasmose correctly', () => {
          const patologias = identificarPatologias({
            procedimentos: ['Cesárea Eletiva'],
            diagnosticosMaternos: 'Toxoplasmose',
          });
          
          expect(patologias).toContain('toxoplasmose');
          expect(patologias).not.toContain('desejo_materno');
        });
        
        it('should identify trombofilia/SAF correctly', () => {
          const patologias = identificarPatologias({
            procedimentos: [],
            diagnosticosMaternos: 'Trombofilia - SAF',
          });
          
          expect(patologias).toContain('trombofilia');
        });
        
        it('should identify macrossomia correctly', () => {
          const patologias = identificarPatologias({
            procedimentos: ['Cesárea Eletiva'],
            diagnosticosFetais: 'Macrossomia fetal',
          });
          
          expect(patologias).toContain('macrossomia');
          expect(patologias).not.toContain('desejo_materno');
        });
        
        it('should identify IIC/cerclagem correctly', () => {
          const patologias = identificarPatologias({
            procedimentos: [],
            diagnosticosMaternos: 'IIC - Incompetência istmo cervical',
          });
          
          expect(patologias).toContain('cerclagem');
        });
        
        it('should identify cardiopatia materna correctly', () => {
          const patologias = identificarPatologias({
            procedimentos: [],
            diagnosticosMaternos: 'Cardiopatia',
          });
          
          expect(patologias).toContain('cardiopatia_materna');
        });
        
        it('should identify eclâmpsia correctly', () => {
          const patologias = identificarPatologias({
            procedimentos: [],
            diagnosticosMaternos: 'Eclâmpsia',
          });
          
          expect(patologias).toContain('eclampsia');
        });
        
        it('should identify epilepsia correctly', () => {
          const patologias = identificarPatologias({
            procedimentos: [],
            diagnosticosMaternos: 'Epilepsia',
          });
          
          expect(patologias).toContain('epilepsia');
        });
        
        it('should identify miomatose correctly', () => {
          const patologias = identificarPatologias({
            procedimentos: [],
            diagnosticosMaternos: 'Miomatose uterina',
          });
          
          expect(patologias).toContain('miomatose');
        });
        
        it('should handle text with mixed pathologies and desejo materno', () => {
          const patologias = identificarPatologias({
            procedimentos: ['Cesárea Eletiva'],
            indicacaoProcedimento: 'HAC + desejo materno',
          });
          
          expect(patologias).toContain('hac');
          // desejo_materno is not added because HAC is present
          expect(patologias).not.toContain('desejo_materno');
        });
        
        it('should handle multiple pathologies without adding desejo_materno', () => {
          const patologias = identificarPatologias({
            procedimentos: ['Cesárea Eletiva'],
            diagnosticosMaternos: 'DMG, HAC, Oligoâmnio',
          });
          
          expect(patologias.length).toBeGreaterThanOrEqual(3);
          expect(patologias).not.toContain('desejo_materno');
        });
        
        it('should filter out desejo_materno when passed directly along with real pathologies', () => {
          // Edge case: when desejo_materno is passed as protocol ID directly together with real pathologies
          const patologias = identificarPatologias({
            procedimentos: ['Cesárea Eletiva'],
            diagnosticosMaternos: ['desejo_materno', 'HAC'],
          });
          
          expect(patologias).toContain('hac');
          expect(patologias).not.toContain('desejo_materno');
        });
        
        // NOTE: desejo_materno is no longer used as fallback - it's not a clinical pathology
        // When no diagnoses are found, validation requires diagnosis (no baixo_risco fallback)
        it('should return empty array when no pathologies are identified (no desejo_materno)', () => {
          const patologias = identificarPatologias({
            procedimentos: ['Cesárea Eletiva'],
            indicacaoProcedimento: 'Cesárea a pedido',
          });
          
          // desejo_materno is no longer added as fallback
          expect(patologias).not.toContain('desejo_materno');
          expect(patologias).toEqual([]);
        });
        
        it('should return empty array for empty diagnostics (no desejo_materno fallback)', () => {
          const patologias = identificarPatologias({
            procedimentos: ['Cesárea Eletiva'],
            diagnosticosMaternos: '',
            diagnosticosFetais: '',
          });
          
          // desejo_materno is no longer added as fallback
          expect(patologias).not.toContain('desejo_materno');
          expect(patologias).toEqual([]);
        });
      });
      
      describe('mapDiagnosisToProtocol with comprehensive terms', () => {
        it('should map HAS to hac', () => {
          const result = mapDiagnosisToProtocol(['HAS']);
          expect(result).toContain('hac');
        });
        
        it('should map VDRL to sifilis_tratada', () => {
          const result = mapDiagnosisToProtocol(['VDRL tratado']);
          expect(result).toContain('sifilis_tratada');
        });
        
        it('should map SAF to trombofilia', () => {
          const result = mapDiagnosisToProtocol(['SAF']);
          expect(result).toContain('trombofilia');
        });
        
        it('should normalize accents for matching', () => {
          const result = mapDiagnosisToProtocol(['Hipertensão gestacional']);
          expect(result).toContain('hipertensao_gestacional');
        });
        
        it('should identify CIUR as RCF', () => {
          const result = mapDiagnosisToProtocol(['CIUR']);
          expect(result).toContain('rcf');
        });
        
        it('should identify feto GIG as macrossomia', () => {
          const result = mapDiagnosisToProtocol(['Feto GIG']);
          expect(result).toContain('macrossomia');
        });
        
        it('should not add desejo_materno from mapDiagnosisToProtocol', () => {
          // mapDiagnosisToProtocol should NOT add desejo_materno - that's handled by identificarPatologias
          const result = mapDiagnosisToProtocol(['Cesárea eletiva']);
          expect(result).not.toContain('desejo_materno');
        });
      });
    });
  });
});
