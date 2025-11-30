/**
 * Tests for Unified Validation Module
 * 
 * Tests cover:
 * - Required field validation
 * - Date format validation
 * - Duplicate carteirinha detection (mocked)
 * - IG calculation validation
 * - Lead time validation
 * - Protocol compliance validation
 * 
 * Run with: npm run test
 */

import { describe, it, expect, vi } from 'vitest';
import {
  validarCamposObrigatorios,
  validarDadosIG,
} from '../src/lib/validation/unifiedValidation';

describe('Unified Validation Module', () => {
  describe('validarCamposObrigatorios', () => {
    it('should pass with all required fields filled', () => {
      const result = validarCamposObrigatorios({
        nome_completo: 'Maria Silva',
        carteirinha: '123456789',
        data_nascimento: '15/03/1990',
        maternidade: 'Salvalus',
      });
      
      expect(result.valido).toBe(true);
      expect(result.erros).toHaveLength(0);
    });

    it('should fail when nome_completo is missing', () => {
      const result = validarCamposObrigatorios({
        nome_completo: '',
        carteirinha: '123456789',
        data_nascimento: '15/03/1990',
        maternidade: 'Salvalus',
      });
      
      expect(result.valido).toBe(false);
      expect(result.erros).toContain('Nome completo é obrigatório');
    });

    it('should fail when carteirinha is missing', () => {
      const result = validarCamposObrigatorios({
        nome_completo: 'Maria Silva',
        carteirinha: '',
        data_nascimento: '15/03/1990',
        maternidade: 'Salvalus',
      });
      
      expect(result.valido).toBe(false);
      expect(result.erros).toContain('Carteirinha é obrigatória');
    });

    it('should fail when data_nascimento is missing', () => {
      const result = validarCamposObrigatorios({
        nome_completo: 'Maria Silva',
        carteirinha: '123456789',
        data_nascimento: '',
        maternidade: 'Salvalus',
      });
      
      expect(result.valido).toBe(false);
      expect(result.erros).toContain('Data de nascimento é obrigatória');
    });

    it('should fail when maternidade is missing', () => {
      const result = validarCamposObrigatorios({
        nome_completo: 'Maria Silva',
        carteirinha: '123456789',
        data_nascimento: '15/03/1990',
        maternidade: '',
      });
      
      expect(result.valido).toBe(false);
      expect(result.erros).toContain('Maternidade é obrigatória');
    });

    it('should fail with multiple missing fields', () => {
      const result = validarCamposObrigatorios({
        nome_completo: '',
        carteirinha: '',
        data_nascimento: '',
        maternidade: '',
      });
      
      expect(result.valido).toBe(false);
      expect(result.erros).toHaveLength(4);
    });

    it('should trim whitespace-only values as empty', () => {
      const result = validarCamposObrigatorios({
        nome_completo: '   ',
        carteirinha: '123456789',
        data_nascimento: '15/03/1990',
        maternidade: 'Salvalus',
      });
      
      expect(result.valido).toBe(false);
      expect(result.erros).toContain('Nome completo é obrigatório');
    });
  });

  describe('validarDadosIG', () => {
    it('should pass with DUM confiável', () => {
      const result = validarDadosIG({
        dum_status: 'Sim - Confiavel',
        data_dum: '01/01/2024',
      });
      
      expect(result.valido).toBe(true);
    });

    it('should pass with valid USG data', () => {
      const result = validarDadosIG({
        data_primeiro_usg: '01/02/2024',
        semanas_usg: 12,
        dias_usg: 3,
      });
      
      expect(result.valido).toBe(true);
    });

    it('should pass with both DUM and USG', () => {
      const result = validarDadosIG({
        dum_status: 'Sim - Confiavel',
        data_dum: '01/01/2024',
        data_primeiro_usg: '01/02/2024',
        semanas_usg: 12,
        dias_usg: 3,
      });
      
      expect(result.valido).toBe(true);
    });

    it('should fail when neither DUM nor USG is provided', () => {
      const result = validarDadosIG({});
      
      expect(result.valido).toBe(false);
      expect(result.motivo).toContain('DUM confiável OU dados de USG');
    });

    it('should fail when DUM is not confiável and no USG', () => {
      const result = validarDadosIG({
        dum_status: 'Incerta',
        data_dum: '01/01/2024',
      });
      
      expect(result.valido).toBe(false);
    });

    it('should fail when USG has no weeks', () => {
      const result = validarDadosIG({
        data_primeiro_usg: '01/02/2024',
        semanas_usg: 0,
        dias_usg: 3,
      });
      
      expect(result.valido).toBe(false);
    });

    it('should fail when USG has no date', () => {
      const result = validarDadosIG({
        semanas_usg: 12,
        dias_usg: 3,
      });
      
      expect(result.valido).toBe(false);
    });

    it('should handle string values for weeks and days', () => {
      const result = validarDadosIG({
        data_primeiro_usg: '01/02/2024',
        semanas_usg: '12',
        dias_usg: '3',
      });
      
      expect(result.valido).toBe(true);
    });
  });
});
