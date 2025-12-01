/**
 * Unit Tests for processar-csv-agendamentos.ts
 * 
 * Tests cover:
 * - Encoding conversion (Windows-1252 to UTF-8)
 * - USG text parsing (parseUsgRecente)
 * - CSV content parsing
 * - Date format parsing
 * - Duplicate detection
 * - Report generation
 * 
 * Run with: npm run test
 */

import { describe, it, expect } from 'vitest';
import {
  parseUsgRecente,
  convertFromWindows1252,
  parseCSVContent,
  gerarCSVDuplicidades,
  gerarCSVOverbooking,
  gerarEstatisticas,
  type UsgRecenteData,
  type RegistroBancoExtendido,
} from '../processar-csv-agendamentos';
import type { ResultadoProcessamento, RegistroAgendamento } from '../processarAgendas';

describe('parseUsgRecente', () => {
  describe('Date extraction', () => {
    it('should extract date in DD/MM/YYYY format', () => {
      const result = parseUsgRecente('USG em 15/03/2025');
      expect(result.data).toBe('15/03/2025');
    });

    it('should extract date in D/M/YYYY format', () => {
      const result = parseUsgRecente('5/3/2025 - 32 semanas');
      expect(result.data).toBe('05/03/2025');
    });

    it('should extract date with 2-digit year', () => {
      const result = parseUsgRecente('USG 15/03/25');
      expect(result.data).toBe('15/03/2025');
    });

    it('should handle old years correctly', () => {
      const result = parseUsgRecente('15/03/99');
      expect(result.data).toBe('15/03/1999');
    });
  });

  describe('Gestational age extraction', () => {
    it('should extract GA in format "32+5"', () => {
      const result = parseUsgRecente('IG: 32+5');
      expect(result.semanas).toBe(32);
      expect(result.dias).toBe(5);
    });

    it('should extract GA in format "32/5"', () => {
      const result = parseUsgRecente('32/5 semanas');
      expect(result.semanas).toBe(32);
      expect(result.dias).toBe(5);
    });

    it('should extract GA in format "32 semanas e 5 dias"', () => {
      const result = parseUsgRecente('Gestação de 32 semanas e 5 dias');
      expect(result.semanas).toBe(32);
      expect(result.dias).toBe(5);
    });

    it('should extract GA in format "32s5d"', () => {
      const result = parseUsgRecente('IG 32s5d');
      expect(result.semanas).toBe(32);
      expect(result.dias).toBe(5);
    });

    it('should extract weeks only when no days specified', () => {
      const result = parseUsgRecente('32 semanas');
      expect(result.semanas).toBe(32);
      expect(result.dias).toBe(0);
    });

    it('should extract GA with "IG de" prefix', () => {
      const result = parseUsgRecente('IG de 30 semanas');
      expect(result.semanas).toBe(30);
    });
  });

  describe('Weight extraction', () => {
    it('should extract weight in grams', () => {
      const result = parseUsgRecente('Peso 1500g');
      expect(result.peso).toBe(1500);
    });

    it('should extract weight with "gramas"', () => {
      const result = parseUsgRecente('Peso estimado: 2300 gramas');
      expect(result.peso).toBe(2300);
    });

    it('should extract weight with thousands separator', () => {
      const result = parseUsgRecente('PF 2.500g');
      expect(result.peso).toBe(2500);
    });

    it('should ignore unrealistic weights', () => {
      const result = parseUsgRecente('peso 50g'); // Too low
      expect(result.peso).toBeUndefined();
    });
  });

  describe('Percentile extraction', () => {
    it('should extract percentile with "p" prefix', () => {
      const result = parseUsgRecente('p25');
      expect(result.percentil).toBe(25);
    });

    it('should extract percentile with "P" prefix', () => {
      const result = parseUsgRecente('P50');
      expect(result.percentil).toBe(50);
    });

    it('should extract percentile with "percentil" word', () => {
      const result = parseUsgRecente('percentil 75');
      expect(result.percentil).toBe(75);
    });

    it('should ignore invalid percentiles', () => {
      const result = parseUsgRecente('p150'); // Over 100
      expect(result.percentil).toBeUndefined();
    });
  });

  describe('ILA extraction', () => {
    it('should extract ILA normal', () => {
      const result = parseUsgRecente('ILA normal');
      expect(result.ila).toBe('normal');
    });

    it('should extract ILA nl', () => {
      const result = parseUsgRecente('ILA nl');
      expect(result.ila).toBe('normal');
    });

    it('should extract ILA aumentado', () => {
      const result = parseUsgRecente('ILA aumentado');
      expect(result.ila).toBe('aumentado');
    });

    it('should extract ILA diminuído', () => {
      const result = parseUsgRecente('ILA diminuído');
      expect(result.ila).toBe('diminuido');
    });

    it('should detect oligodramnia as diminuido', () => {
      const result = parseUsgRecente('oligodramnia');
      expect(result.ila).toBe('diminuido');
    });

    it('should interpret numeric ILA values', () => {
      const resultLow = parseUsgRecente('ILA 4,5');
      expect(resultLow.ila).toBe('diminuido');
      
      const resultNormal = parseUsgRecente('ILA 15');
      expect(resultNormal.ila).toBe('normal');
      
      const resultHigh = parseUsgRecente('ILA 28');
      expect(resultHigh.ila).toBe('aumentado');
    });
  });

  describe('Doppler extraction', () => {
    it('should extract Doppler normal', () => {
      const result = parseUsgRecente('Doppler normal');
      expect(result.doppler).toBe('normal');
    });

    it('should extract Doppler alterado', () => {
      const result = parseUsgRecente('Doppler alterado');
      expect(result.doppler).toBe('alterado');
    });

    it('should extract fluxo normal as Doppler normal', () => {
      const result = parseUsgRecente('fluxo normal');
      expect(result.doppler).toBe('normal');
    });

    it('should extract fluxo centralizado as Doppler alterado', () => {
      const result = parseUsgRecente('fluxo centralizado');
      expect(result.doppler).toBe('alterado');
    });
  });

  describe('Combined extraction', () => {
    it('should extract multiple fields from complex text', () => {
      const texto = '15/03/2025 32+5 sem, peso 2300g, p50, ILA normal, Doppler nl';
      const result = parseUsgRecente(texto);
      
      expect(result.data).toBe('15/03/2025');
      expect(result.semanas).toBe(32);
      expect(result.dias).toBe(5);
      expect(result.peso).toBe(2300);
      expect(result.percentil).toBe(50);
      expect(result.ila).toBe('normal');
      expect(result.doppler).toBe('normal');
    });

    it('should handle empty input', () => {
      expect(parseUsgRecente('')).toEqual({});
      expect(parseUsgRecente(null)).toEqual({});
      expect(parseUsgRecente(undefined)).toEqual({});
    });
  });
});

describe('convertFromWindows1252', () => {
  it('should handle UTF-8 content correctly', () => {
    // For pure ASCII content, should work fine
    const content = Buffer.from('Maria da Silva', 'utf-8');
    const result = convertFromWindows1252(content);
    expect(result).toBe('Maria da Silva');
  });

  it('should fix common encoding corruptions', () => {
    // Simulated corruption pattern
    const corruptedContent = Buffer.from('JosÃ©', 'utf-8');
    const result = convertFromWindows1252(corruptedContent);
    expect(result).toBe('José');
  });
});

describe('parseCSVContent', () => {
  it('should parse semicolon-delimited CSV', () => {
    const csv = `nome;carteirinha;maternidade;data_agendamento
Maria Silva;12345;Guarulhos;2025-11-03
João Santos;67890;NotreCare;2025-11-04`;
    
    const result = parseCSVContent(csv);
    
    expect(result.length).toBe(2);
    expect(result[0].nome).toBe('Maria Silva');
    expect(result[0].carteirinha).toBe('12345');
    expect(result[0].maternidade).toBe('Guarulhos');
    expect(result[0].data_agendamento).toBe('2025-11-03');
  });

  it('should parse comma-delimited CSV', () => {
    const csv = `nome,carteirinha,maternidade,data_agendamento
Maria Silva,12345,Guarulhos,2025-11-03`;
    
    const result = parseCSVContent(csv);
    
    expect(result.length).toBe(1);
    expect(result[0].nome).toBe('Maria Silva');
  });

  it('should normalize column names', () => {
    const csv = `Nome Completo;Cartão;Data_Agendada
Maria Silva;12345;2025-11-03`;
    
    const result = parseCSVContent(csv);
    
    expect(result.length).toBe(1);
    expect(result[0].nome).toBe('Maria Silva');
  });

  it('should parse dates in Brazilian format', () => {
    const csv = `nome;carteirinha;maternidade;data_agendamento
Maria Silva;12345;Guarulhos;03/11/2025`;
    
    const result = parseCSVContent(csv);
    
    expect(result[0].data_agendamento).toBe('2025-11-03');
  });

  it('should handle USG recente field', () => {
    const csv = `nome;carteirinha;maternidade;data_agendamento;usg_recente
Maria Silva;12345;Guarulhos;2025-11-03;15/10/2025 32+5 peso 2300g`;
    
    const result = parseCSVContent(csv);
    
    expect(result[0].usg_recente_semanas).toBe(32);
    expect(result[0].usg_recente_dias).toBe(5);
    expect(result[0].usg_recente_peso).toBe(2300);
  });

  it('should skip empty records', () => {
    const csv = `nome;carteirinha;maternidade;data_agendamento
Maria Silva;12345;Guarulhos;2025-11-03
;;; 
João Santos;67890;NotreCare;2025-11-04`;
    
    const result = parseCSVContent(csv);
    
    expect(result.length).toBe(2);
  });

  it('should validate and normalize maternidade names', () => {
    const csv = `nome;carteirinha;maternidade;data_agendamento
Maria Silva;12345;guarulhos;2025-11-03`;
    
    const result = parseCSVContent(csv);
    
    expect(result[0].maternidade).toBe('Guarulhos');
  });
});

describe('Report generation', () => {
  describe('gerarCSVDuplicidades', () => {
    it('should generate CSV for duplicates', () => {
      const duplicidades = [
        {
          carteirinha: '12345',
          nome: 'Maria Silva',
          registros_antes: ['2025-11-03', '2025-11-03'],
          registros_depois: ['2025-11-03', '2025-11-04'],
        },
      ];
      
      const csv = gerarCSVDuplicidades(duplicidades);
      
      expect(csv).toContain('carteirinha,nome,registros_antes,registros_depois');
      expect(csv).toContain('"12345"');
      expect(csv).toContain('"Maria Silva"');
    });
  });

  describe('gerarCSVOverbooking', () => {
    it('should generate CSV for overbooking', () => {
      const overbooking = [
        {
          data: '2025-11-03',
          maternidade: 'Guarulhos',
          capacidade: 2,
          total: 5,
          excedente: 3,
        },
      ];
      
      const csv = gerarCSVOverbooking(overbooking);
      
      expect(csv).toContain('data,maternidade,capacidade,total,excedente');
      expect(csv).toContain('"2025-11-03"');
      expect(csv).toContain('"Guarulhos"');
      expect(csv).toContain('2,5,3');
    });
  });

  describe('gerarEstatisticas', () => {
    it('should calculate statistics correctly', () => {
      const registros: RegistroBancoExtendido[] = [
        { nome: 'Maria', carteirinha: '123', maternidade: 'Guarulhos', data_agendamento: '2025-11-03', procedimento: 'Cesárea' },
        { nome: 'João', carteirinha: '456', maternidade: 'Guarulhos', data_agendamento: '2025-11-03', procedimento: 'Cesárea' },
        { nome: 'Ana', carteirinha: '789', maternidade: 'NotreCare', data_agendamento: '2025-11-04', procedimento: 'Parto Normal' },
      ];
      
      const resultado: ResultadoProcessamento = {
        registros: [
          { id_interno: 1, carteirinha: '123', nome_original: 'Maria', nome_normalizado: 'MARIA', maternidade: 'Guarulhos', data_original: '2025-11-03', data_final: '2025-11-03', motivo_alteracao: 'nenhum', status: 'mantido' },
          { id_interno: 2, carteirinha: '456', nome_original: 'João', nome_normalizado: 'JOAO', maternidade: 'Guarulhos', data_original: '2025-11-03', data_final: '2025-11-04', motivo_alteracao: 'overbooking_resolvido', status: 'ajustado' },
          { id_interno: 3, carteirinha: '789', nome_original: 'Ana', nome_normalizado: 'ANA', maternidade: 'NotreCare', data_original: '2025-11-04', data_final: '2025-11-04', motivo_alteracao: 'nenhum', status: 'mantido' },
        ],
        duplicidades: [],
        ajustes_domingo: [],
        overbooking: [],
        problemas: [],
      };
      
      const stats = gerarEstatisticas(registros, resultado);
      
      expect(stats.total_registros).toBe(3);
      expect(stats.registros_mantidos).toBe(2);
      expect(stats.registros_ajustados).toBe(1);
      expect(stats.por_maternidade['Guarulhos'].total).toBe(2);
      expect(stats.por_maternidade['NotreCare'].total).toBe(1);
      expect(stats.por_procedimento['Cesárea']).toBe(2);
      expect(stats.por_procedimento['Parto Normal']).toBe(1);
    });
  });
});

describe('Date format support', () => {
  it('should handle DD/MM/YYYY format', () => {
    const csv = `nome;carteirinha;maternidade;data_agendamento
Maria Silva;12345;Guarulhos;03/11/2025`;
    
    const result = parseCSVContent(csv);
    expect(result[0].data_agendamento).toBe('2025-11-03');
  });

  it('should handle YYYY-MM-DD format', () => {
    const csv = `nome;carteirinha;maternidade;data_agendamento
Maria Silva;12345;Guarulhos;2025-11-03`;
    
    const result = parseCSVContent(csv);
    expect(result[0].data_agendamento).toBe('2025-11-03');
  });

  it('should handle DD/MM/YY format', () => {
    const csv = `nome;carteirinha;maternidade;data_agendamento
Maria Silva;12345;Guarulhos;03/11/25`;
    
    const result = parseCSVContent(csv);
    expect(result[0].data_agendamento).toBe('2025-11-03');
  });
});
