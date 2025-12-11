/**
 * Unit tests for CSV header normalization used in ImportarPorTabela
 * 
 * This test suite verifies that the header normalization function properly handles:
 * - Accent removal (á, é, í, ó, ú → a, e, i, o, u)
 * - Case conversion (uppercase → lowercase)
 * - Whitespace normalization
 * - Quote removal
 * 
 * This ensures that Google Forms exports and other CSV sources with various
 * formatting are properly mapped to the internal field names.
 */

import { describe, it, expect } from 'vitest';
import { normalizeHeader } from '../client/src/lib/csvUtils';

describe('CSV Header Normalization', () => {
  describe('Accent Removal', () => {
    it('should remove accents from Portuguese characters', () => {
      expect(normalizeHeader('Número de Gestações')).toBe('numero de gestacoes');
      expect(normalizeHeader('História Obstétrica')).toBe('historia obstetrica');
      expect(normalizeHeader('Indicação')).toBe('indicacao');
      expect(normalizeHeader('Médico responsável')).toBe('medico responsavel');
    });

    it('should handle mixed accented and non-accented characters', () => {
      expect(normalizeHeader('Diagnósticos Maternos ATUAIS')).toBe('diagnosticos maternos atuais');
    });
  });

  describe('Case Conversion', () => {
    it('should convert uppercase to lowercase', () => {
      expect(normalizeHeader('CARTEIRINHA')).toBe('carteirinha');
      expect(normalizeHeader('Nome Completo')).toBe('nome completo');
      expect(normalizeHeader('DUM')).toBe('dum');
    });

    it('should handle mixed case', () => {
      expect(normalizeHeader('Hora de Início')).toBe('hora de inicio');
    });
  });

  describe('Whitespace Normalization', () => {
    it('should trim leading and trailing whitespace', () => {
      expect(normalizeHeader('  Nome completo  ')).toBe('nome completo');
      expect(normalizeHeader('\tCarteirinha\t')).toBe('carteirinha');
    });

    it('should normalize multiple spaces to single space', () => {
      expect(normalizeHeader('Nome    completo    da    paciente')).toBe('nome completo da paciente');
    });
  });

  describe('Quote Removal', () => {
    it('should remove double quotes', () => {
      expect(normalizeHeader('"Nome completo"')).toBe('nome completo');
      expect(normalizeHeader('"Carteirinha"')).toBe('carteirinha');
    });
  });

  describe('Special Characters in Parentheses', () => {
    it('should preserve parentheses but normalize content', () => {
      expect(normalizeHeader('CARTEIRINHA (tem na guia que sai do sistema - não inserir CPF)'))
        .toBe('carteirinha (tem na guia que sai do sistema - nao inserir cpf)');
    });
  });

  describe('Google Forms Headers', () => {
    it('should normalize common Google Forms timestamp headers', () => {
      expect(normalizeHeader('Hora de início')).toBe('hora de inicio');
      expect(normalizeHeader('Carimbo de data/hora')).toBe('carimbo de data/hora');
    });

    it('should normalize long descriptive headers from Google Forms', () => {
      expect(normalizeHeader('Numero de semanas no primeiro USG (inserir apenas o numero) - considerar o exame entre 8 e 12 semanas, embrião com BCF'))
        .toBe('numero de semanas no primeiro usg (inserir apenas o numero) - considerar o exame entre 8 e 12 semanas, embriao com bcf');
      
      expect(normalizeHeader('Informe o procedimento(s) que será(ão) realizado(s)'))
        .toBe('informe o procedimento(s) que sera(ao) realizado(s)');
    });
  });

  describe('Colon and Punctuation', () => {
    it('should preserve colons but normalize surrounding text', () => {
      expect(normalizeHeader('Indicação do Procedimento:')).toBe('indicacao do procedimento:');
      expect(normalizeHeader('Indique os Diagnósticos Fetais :')).toBe('indique os diagnosticos fetais :');
    });
  });

  describe('Real-world Examples', () => {
    const examples = [
      { input: 'Nome completo da paciente', expected: 'nome completo da paciente' },
      { input: 'Data de nascimento da gestante ', expected: 'data de nascimento da gestante' },
      { input: 'Número de Partos Cesáreas', expected: 'numero de partos cesareas' },
      { input: 'Informe dois telefones de contato com o paciente para que ele seja contato pelo hospital', 
        expected: 'informe dois telefones de contato com o paciente para que ele seja contato pelo hospital' },
      { input: 'Maternidade que a paciente deseja', expected: 'maternidade que a paciente deseja' },
      { input: 'Médico responsável pelo agendamento ', expected: 'medico responsavel pelo agendamento' },
      { input: 'E-mail da paciente', expected: 'e-mail da paciente' },
    ];

    examples.forEach(({ input, expected }) => {
      it(`should normalize "${input}" to "${expected}"`, () => {
        expect(normalizeHeader(input)).toBe(expected);
      });
    });
  });
});
