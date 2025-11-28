/**
 * Unit Tests for processarAgendas.ts
 * 
 * Tests cover:
 * - Encoding correction (fixEncoding)
 * - Name normalization (normalizeName)
 * - Calendar parsing with day inheritance (parseCalendario)
 * - Sunday avoidance (avoidSundayForward)
 * - Duplicate redistribution
 * - Overbooking handling
 * - Capacity calculation
 * 
 * Run with: npm run test
 */

import { describe, it, expect } from 'vitest';
import {
  fixEncoding,
  normalizeName,
  parseCalendario,
  avoidSundayForward,
  capacityFor,
  isDateInWindow,
  parseBanco,
  redistribuirDuplicados,
  ajustarOverbooking,
  processarRegistros,
  gerarCSVAgendaFinal,
  gerarCSVProblemas,
  JANELA_INICIO,
  JANELA_FIM,
  normalizeMaternidade,
  parseDate,
} from '../processarAgendas';
import type { RegistroAgendamento, RegistroBanco } from '../processarAgendas';

describe('fixEncoding', () => {
  it('should fix common UTF-8 encoding issues', () => {
    expect(fixEncoding('JosÃ©')).toBe('José');
  });

  it('should fix individual accented characters', () => {
    expect(fixEncoding('Ã¡')).toBe('á');
    expect(fixEncoding('Ã©')).toBe('é');
    expect(fixEncoding('Ã­')).toBe('í');
    expect(fixEncoding('Ã³')).toBe('ó');
    expect(fixEncoding('Ãº')).toBe('ú');
    expect(fixEncoding('Ã§')).toBe('ç');
  });

  it('should handle null/empty strings', () => {
    expect(fixEncoding('')).toBe('');
    expect(fixEncoding(null as unknown as string)).toBe(null);
  });

  it('should preserve already correct text', () => {
    expect(fixEncoding('Maria José')).toBe('Maria José');
    expect(fixEncoding('Ana Paula')).toBe('Ana Paula');
  });
});

describe('normalizeName', () => {
  it('should remove diacritics and uppercase', () => {
    expect(normalizeName('Maria José')).toBe('MARIA JOSE');
    expect(normalizeName('João da Silva')).toBe('JOAO DA SILVA');
    expect(normalizeName('André Luís')).toBe('ANDRE LUIS');
  });

  it('should handle empty string', () => {
    expect(normalizeName('')).toBe('');
  });

  it('should trim and normalize spaces', () => {
    expect(normalizeName('  Maria   José  ')).toBe('MARIA JOSE');
  });
});

describe('parseCalendario - day inheritance', () => {
  it('should parse calendar with day numbers followed by names', () => {
    const texto = `
1
Maria Silva
João Santos
2
Ana Paula
3
Pedro Costa
    `;
    
    const result = parseCalendario(texto, 11, 2025, 'Guarulhos');
    
    expect(result.length).toBe(4);
    expect(result[0]).toEqual({
      dia: 1,
      mes: 11,
      ano: 2025,
      maternidade: 'Guarulhos',
      nome: 'Maria Silva',
    });
    expect(result[1]).toEqual({
      dia: 1,
      mes: 11,
      ano: 2025,
      maternidade: 'Guarulhos',
      nome: 'João Santos',
    });
    expect(result[2]).toEqual({
      dia: 2,
      mes: 11,
      ano: 2025,
      maternidade: 'Guarulhos',
      nome: 'Ana Paula',
    });
    expect(result[3]).toEqual({
      dia: 3,
      mes: 11,
      ano: 2025,
      maternidade: 'Guarulhos',
      nome: 'Pedro Costa',
    });
  });

  it('should handle day followed by name on same line', () => {
    const texto = `
1 Maria Silva
2 João Santos
    `;
    
    const result = parseCalendario(texto, 12, 2025, 'NotreCare');
    
    expect(result.length).toBe(2);
    expect(result[0].dia).toBe(1);
    expect(result[0].nome).toBe('Maria Silva');
    expect(result[1].dia).toBe(2);
    expect(result[1].nome).toBe('João Santos');
  });
});

describe('avoidSundayForward', () => {
  it('should return same date if not Sunday', () => {
    // 2025-11-03 is a Monday
    const monday = new Date('2025-11-03');
    const result = avoidSundayForward(monday);
    
    expect(result).not.toBeNull();
    expect(result!.getDate()).toBe(3);
    expect(result!.getMonth()).toBe(10); // November = 10
  });

  it('should move Sunday forward to Monday', () => {
    // 2025-11-02 is a Sunday
    const sunday = new Date('2025-11-02');
    const result = avoidSundayForward(sunday, 1);
    
    expect(result).not.toBeNull();
    expect(result!.getDay()).not.toBe(0); // Not Sunday
    expect(result!.getDate()).toBe(3); // Should be Monday 2025-11-03
  });

  it('should move backward when direction is -1', () => {
    // 2025-11-09 is a Sunday
    const sunday = new Date('2025-11-09');
    const result = avoidSundayForward(sunday, -1);
    
    expect(result).not.toBeNull();
    expect(result!.getDay()).not.toBe(0); // Not Sunday
    expect(result!.getDate()).toBe(8); // Should be Saturday 2025-11-08
  });
});

describe('capacityFor', () => {
  it('should return correct weekday capacity for Guarulhos', () => {
    // 2025-11-03 is Monday
    const monday = new Date('2025-11-03');
    expect(capacityFor('Guarulhos', monday)).toBe(2);
  });

  it('should return correct Saturday capacity for Guarulhos', () => {
    // 2025-11-08 is Saturday
    const saturday = new Date('2025-11-08');
    expect(capacityFor('Guarulhos', saturday)).toBe(1);
  });

  it('should return 0 for Sunday for all maternities', () => {
    // 2025-11-09 is Sunday
    const sunday = new Date('2025-11-09');
    expect(capacityFor('Guarulhos', sunday)).toBe(0);
    expect(capacityFor('NotreCare', sunday)).toBe(0);
    expect(capacityFor('Salvalus', sunday)).toBe(0);
    expect(capacityFor('Cruzeiro', sunday)).toBe(0);
  });

  it('should return correct capacities for NotreCare', () => {
    const monday = new Date('2025-11-03');
    const saturday = new Date('2025-11-08');
    expect(capacityFor('NotreCare', monday)).toBe(6);
    expect(capacityFor('NotreCare', saturday)).toBe(2);
  });

  it('should return correct capacities for Salvalus', () => {
    const monday = new Date('2025-11-03');
    const saturday = new Date('2025-11-08');
    expect(capacityFor('Salvalus', monday)).toBe(9);
    expect(capacityFor('Salvalus', saturday)).toBe(7);
  });

  it('should return correct capacities for Cruzeiro', () => {
    const monday = new Date('2025-11-03');
    const saturday = new Date('2025-11-08');
    expect(capacityFor('Cruzeiro', monday)).toBe(3);
    expect(capacityFor('Cruzeiro', saturday)).toBe(1);
  });
});

describe('isDateInWindow', () => {
  it('should return true for dates within the window', () => {
    expect(isDateInWindow(new Date('2025-11-01'))).toBe(true);
    expect(isDateInWindow(new Date('2025-12-15'))).toBe(true);
    expect(isDateInWindow(new Date('2026-01-31'))).toBe(true);
  });

  it('should return false for dates outside the window', () => {
    expect(isDateInWindow(new Date('2025-10-31'))).toBe(false);
    expect(isDateInWindow(new Date('2026-02-01'))).toBe(false);
  });
});

describe('parseBanco', () => {
  it('should parse tab-separated values', () => {
    const texto = 'Maria Silva\t12345\tGuarulhos\t2025-11-03\nJoão Santos\t67890\tNotreCare\t2025-11-04';
    
    const result = parseBanco(texto);
    
    expect(result.length).toBe(2);
    expect(result[0]).toEqual({
      nome: 'Maria Silva',
      carteirinha: '12345',
      maternidade: 'Guarulhos',
      data_agendamento: '2025-11-03',
    });
  });

  it('should parse comma-separated values', () => {
    const texto = 'Maria Silva, 12345, Guarulhos, 2025-11-03';
    
    const result = parseBanco(texto);
    
    expect(result.length).toBe(1);
    expect(result[0].nome).toBe('Maria Silva');
    expect(result[0].carteirinha).toBe('12345');
  });
});

describe('redistribuirDuplicados', () => {
  it('should redistribute duplicates to different days', () => {
    const registros: RegistroAgendamento[] = [
      {
        id_interno: 1,
        carteirinha: '12345',
        nome_original: 'Maria Silva',
        nome_normalizado: 'MARIA SILVA',
        maternidade: 'Guarulhos',
        data_original: '2025-11-03',
        data_final: '2025-11-03',
        motivo_alteracao: 'nenhum',
        status: 'mantido',
      },
      {
        id_interno: 2,
        carteirinha: '12345', // Same carteirinha - duplicate!
        nome_original: 'Maria Silva',
        nome_normalizado: 'MARIA SILVA',
        maternidade: 'Guarulhos',
        data_original: '2025-11-03',
        data_final: '2025-11-03',
        motivo_alteracao: 'nenhum',
        status: 'mantido',
      },
    ];
    
    const result = redistribuirDuplicados(registros);
    
    // First record should stay
    expect(result[0].data_final).toBe('2025-11-03');
    expect(result[0].status).toBe('mantido');
    
    // Second record should be moved
    expect(result[1].data_final).not.toBe('2025-11-03');
    expect(result[1].status).toBe('ajustado');
    expect(result[1].motivo_alteracao).toBe('duplicado_redistribuido');
  });
});

describe('ajustarOverbooking', () => {
  it('should move excess appointments when capacity exceeded', () => {
    // Guarulhos has capacity 2 on weekdays
    // Create 3 appointments on the same day
    const registros: RegistroAgendamento[] = [
      {
        id_interno: 1,
        carteirinha: '111',
        nome_original: 'Paciente 1',
        nome_normalizado: 'PACIENTE 1',
        maternidade: 'Guarulhos',
        data_original: '2025-11-03',
        data_final: '2025-11-03',
        motivo_alteracao: 'nenhum',
        status: 'mantido',
      },
      {
        id_interno: 2,
        carteirinha: '222',
        nome_original: 'Paciente 2',
        nome_normalizado: 'PACIENTE 2',
        maternidade: 'Guarulhos',
        data_original: '2025-11-03',
        data_final: '2025-11-03',
        motivo_alteracao: 'nenhum',
        status: 'mantido',
      },
      {
        id_interno: 3,
        carteirinha: '333',
        nome_original: 'Paciente 3',
        nome_normalizado: 'PACIENTE 3',
        maternidade: 'Guarulhos',
        data_original: '2025-11-03',
        data_final: '2025-11-03',
        motivo_alteracao: 'nenhum',
        status: 'mantido',
      },
    ];
    
    const result = ajustarOverbooking(registros);
    
    // Count how many are still on 2025-11-03
    const onOriginalDate = result.filter(r => r.data_final === '2025-11-03');
    expect(onOriginalDate.length).toBeLessThanOrEqual(2); // Capacity is 2
    
    // Third one should have been moved
    const moved = result.filter(r => r.status === 'ajustado' && r.motivo_alteracao === 'overbooking_resolvido');
    expect(moved.length).toBeGreaterThanOrEqual(1);
  });
});

describe('processarRegistros integration', () => {
  it('should handle Sunday appointments', () => {
    const registrosBanco: RegistroBanco[] = [
      {
        nome: 'Maria Silva',
        carteirinha: '12345',
        maternidade: 'Guarulhos',
        data_agendamento: '2025-11-02', // Sunday
      },
    ];
    
    const result = processarRegistros(registrosBanco);
    
    expect(result.registros.length).toBe(1);
    expect(result.registros[0].status).toBe('ajustado');
    expect(result.registros[0].motivo_alteracao).toBe('domingo_remapeado');
    expect(result.ajustes_domingo.length).toBe(1);
  });

  it('should keep valid appointments unchanged', () => {
    const registrosBanco: RegistroBanco[] = [
      {
        nome: 'Maria Silva',
        carteirinha: '12345',
        maternidade: 'Guarulhos',
        data_agendamento: '2025-11-03', // Monday
      },
    ];
    
    const result = processarRegistros(registrosBanco);
    
    expect(result.registros.length).toBe(1);
    expect(result.registros[0].status).toBe('mantido');
    expect(result.registros[0].data_final).toBe('2025-11-03');
  });
});

describe('normalizeMaternidade', () => {
  it('should normalize maternity names', () => {
    expect(normalizeMaternidade('guarulhos')).toBe('Guarulhos');
    expect(normalizeMaternidade('NOTRECARE')).toBe('NotreCare');
    expect(normalizeMaternidade('Salvalus')).toBe('Salvalus');
    expect(normalizeMaternidade('cruzeiro')).toBe('Cruzeiro');
  });

  it('should handle partial matches', () => {
    expect(normalizeMaternidade('Maternidade Guarulhos')).toBe('Guarulhos');
  });

  it('should return null for unknown maternities', () => {
    expect(normalizeMaternidade('Unknown')).toBeNull();
  });
});

describe('parseDate', () => {
  it('should parse ISO format', () => {
    const result = parseDate('2025-11-03');
    expect(result).not.toBeNull();
    expect(result!.getFullYear()).toBe(2025);
    expect(result!.getMonth()).toBe(10); // November = 10
    expect(result!.getDate()).toBe(3);
  });

  it('should parse Brazilian format', () => {
    const result = parseDate('03/11/2025');
    expect(result).not.toBeNull();
    expect(result!.getFullYear()).toBe(2025);
    expect(result!.getMonth()).toBe(10); // November = 10
    expect(result!.getDate()).toBe(3);
  });

  it('should return null for invalid dates', () => {
    expect(parseDate('')).toBeNull();
    expect(parseDate('invalid')).toBeNull();
  });
});

describe('CSV generation', () => {
  it('should generate valid CSV for agenda final', () => {
    const registros: RegistroAgendamento[] = [
      {
        id_interno: 1,
        carteirinha: '12345',
        nome_original: 'Maria Silva',
        nome_normalizado: 'MARIA SILVA',
        maternidade: 'Guarulhos',
        data_original: '2025-11-03',
        data_final: '2025-11-03',
        motivo_alteracao: 'nenhum',
        status: 'mantido',
      },
    ];
    
    const csv = gerarCSVAgendaFinal(registros);
    
    expect(csv).toContain('id_interno,carteirinha,nome_original');
    expect(csv).toContain('1,"12345","Maria Silva"');
  });

  it('should generate valid CSV for problems', () => {
    const problemas: RegistroAgendamento[] = [
      {
        id_interno: 1,
        carteirinha: '12345',
        nome_original: 'Maria Silva',
        nome_normalizado: 'MARIA SILVA',
        maternidade: 'Guarulhos',
        data_original: '2025-11-03',
        data_final: '2025-11-03',
        motivo_alteracao: 'sem_vaga_disponivel',
        status: 'needs_review',
      },
    ];
    
    const csv = gerarCSVProblemas(problemas);
    
    expect(csv).toContain('id_interno,carteirinha,nome_original');
    expect(csv).toContain('sem_vaga_disponivel');
  });
});
