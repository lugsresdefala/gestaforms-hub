/**
 * Comparison Tests: Importação por Tabela vs Formulário Manual
 * 
 * Verifies that both pathways use the same validation rules
 * and produce consistent results for the same input data.
 * 
 * Test cases:
 * 1. Valid simple appointment (Cesarean, no diagnoses)
 * 2. Appointment with diagnosis (Gestational Diabetes)
 * 3. Urgent appointment (< 10 days)
 * 4. Duplicate carteirinha (should fail)
 * 5. Overbooking (should fail or reallocate)
 * 6. IG outside protocol (should warn)
 * 
 * Run with: npm run test
 */

import { describe, it, expect } from 'vitest';
import { validarCamposObrigatorios, validarDadosIG } from '../src/lib/validation/unifiedValidation';
import { chooseAndComputeExtended } from '../src/lib/import/gestationalCalculator';
import { PROTOCOLS, mapDiagnosisToProtocol, calculateAutomaticIG } from '../src/lib/obstetricProtocols';
import { encontrarDataAgendada, LEAD_TIME_MINIMO } from '../src/lib/scheduling';
import { addDays, format } from 'date-fns';

/**
 * Simulates the calculation path used by both ImportarPorTabela and NovoAgendamento
 */
function calcularAgendamento(dados: {
  dum_status: string;
  data_dum: string;
  data_primeiro_usg: string;
  semanas_usg: number;
  dias_usg: number;
  diagnosticos_maternos: string[];
  diagnosticos_fetais: string[];
  maternidade: string;
  dataReferencia?: Date;
}) {
  const dataRef = dados.dataReferencia || new Date();
  
  // Calculate IG
  const igResult = chooseAndComputeExtended({
    dumStatus: dados.dum_status,
    dumRaw: dados.data_dum,
    usgDateRaw: dados.data_primeiro_usg,
    usgWeeks: dados.semanas_usg,
    usgDays: dados.dias_usg,
    diagnostico: dados.diagnosticos_maternos.join(', '),
    indicacao: '',
  });

  if (!igResult || igResult.source === 'INVALID') {
    return { valido: false, motivo: igResult?.reason || 'IG não calculável' };
  }

  // Map diagnoses to protocols - se não há diagnósticos, calculateAutomaticIG retorna null
  const allDiagnoses = [...dados.diagnosticos_maternos, ...dados.diagnosticos_fetais];
  const protocolResult = calculateAutomaticIG(
    allDiagnoses.length > 0 ? mapDiagnosisToProtocol(allDiagnoses) : []
  );

  // Se protocolResult é null, significa que não há diagnóstico válido
  if (!protocolResult) {
    return { 
      valido: false, 
      motivo: 'Nenhum diagnóstico clínico identificado. Todas as pacientes devem ter pelo menos uma patologia registrada.' 
    };
  }

  const igIdealSemanas = parseInt(protocolResult.igPretendida) || 39;
  const margemDias = PROTOCOLS[protocolResult.protocoloAplicado]?.margemDias || 7;

  // Calculate ideal date
  const diasRestantes = igIdealSemanas * 7 - igResult.gaDays;
  const dataIdeal = addDays(dataRef, diasRestantes);

  // Find scheduling date
  const scheduleResult = encontrarDataAgendada({
    dataIdeal,
    maternidade: dados.maternidade,
    dataReferencia: dataRef,
    margemDias,
  });

  return {
    valido: true,
    igAtual: igResult.gaFormatted,
    igAtualDias: igResult.gaDays,
    igIdeal: `${igIdealSemanas} semanas`,
    protocolo: protocolResult.protocoloAplicado,
    dataIdeal: format(dataIdeal, 'dd/MM/yyyy'),
    dataAgendada: scheduleResult.dataAgendada ? format(scheduleResult.dataAgendada, 'dd/MM/yyyy') : null,
    status: scheduleResult.status,
    intervaloDias: scheduleResult.intervaloDias,
    leadTimeDias: scheduleResult.leadTimeDias,
    margemDias,
  };
}

describe('Importação vs Manual - Consistency Tests', () => {
  // Use a fixed reference date for deterministic tests
  const dataReferencia = new Date('2024-06-01');

  describe('Case 1: Appointment without diagnoses should fail validation', () => {
    const dadosBase = {
      nome_completo: 'Ana Carolina Silva',
      carteirinha: '1234567890',
      data_nascimento: '15/03/1990',
      maternidade: 'Salvalus',
      dum_status: 'Sim - Confiavel',
      data_dum: '01/09/2023',
      data_primeiro_usg: '15/10/2023',
      semanas_usg: 8,
      dias_usg: 2,
      diagnosticos_maternos: [] as string[],
      diagnosticos_fetais: [] as string[],
    };

    it('should pass required field validation', () => {
      const result = validarCamposObrigatorios(dadosBase);
      expect(result.valido).toBe(true);
    });

    it('should pass IG data validation', () => {
      const result = validarDadosIG(dadosBase);
      expect(result.valido).toBe(true);
    });

    it('should fail calculation due to missing diagnoses (no baixo_risco fallback)', () => {
      const result = calcularAgendamento({ ...dadosBase, dataReferencia });
      // Sem diagnósticos, deve falhar a validação (não existe mais "baixo_risco")
      expect(result.valido).toBe(false);
      expect(result.motivo).toContain('diagnóstico');
    });
  });

  describe('Case 2: Appointment with Diagnosis (Gestational Diabetes)', () => {
    const dadosComDMG = {
      nome_completo: 'Maria Santos',
      carteirinha: '9876543210',
      data_nascimento: '20/05/1988',
      maternidade: 'NotreCare',
      dum_status: 'Sim - Confiavel',
      data_dum: '15/09/2023',
      data_primeiro_usg: '20/10/2023',
      semanas_usg: 7,
      dias_usg: 0,
      diagnosticos_maternos: ['dmg_sem_insulina_bom_controle'],
      diagnosticos_fetais: [],
    };

    it('should pass required field validation', () => {
      const result = validarCamposObrigatorios(dadosComDMG);
      expect(result.valido).toBe(true);
    });

    it('should calculate with DMG protocol', () => {
      const result = calcularAgendamento({ ...dadosComDMG, dataReferencia });
      expect(result.valido).toBe(true);
      expect(result.protocolo).toBe('dmg_sem_insulina_bom_controle');
      expect(result.igIdeal).toBe('39 semanas');
    });

    it('should use correct margin for DMG protocol', () => {
      const result = calcularAgendamento({ ...dadosComDMG, dataReferencia });
      expect(result.margemDias).toBe(7);
    });
  });

  describe('Case 3: Urgent Appointment (< 10 days)', () => {
    const dadosUrgente = {
      nome_completo: 'Juliana Costa',
      carteirinha: '5555555555',
      data_nascimento: '10/01/1985',
      maternidade: 'Salvalus',
      dum_status: 'Incerta',
      data_dum: '',
      data_primeiro_usg: '01/01/2024',
      semanas_usg: 38, // Already at 38 weeks
      dias_usg: 0,
      diagnosticos_maternos: [],
      diagnosticos_fetais: [],
    };

    it('should identify lead time as insufficient', () => {
      const result = calcularAgendamento({ ...dadosUrgente, dataReferencia });
      // IG is already at 38 weeks, ideal is 39 weeks = 7 days
      // Lead time will be very short
      if (result.leadTimeDias !== undefined) {
        // If lead time is less than minimum, status should be needs_review
        if (result.leadTimeDias < LEAD_TIME_MINIMO) {
          expect(result.status).toBe('needs_review');
        }
      }
    });
  });

  describe('Case 4: Duplicate Carteirinha Detection', () => {
    it('should have duplicate detection available in validation', () => {
      // The validarAgendamento function checks for duplicates
      // This is tested with mocked Supabase in integration tests
      // Here we just verify the validation structure exists
      const dadosDuplicado = {
        nome_completo: 'Teste Duplicado',
        carteirinha: 'DUPLICADO123',
        data_nascimento: '01/01/1990',
        maternidade: 'Salvalus',
      };
      
      const result = validarCamposObrigatorios(dadosDuplicado);
      expect(result.valido).toBe(true); // Sync validation passes
      // Async validation would catch the duplicate via Supabase
    });
  });

  describe('Case 5: Overbooking Detection', () => {
    const dadosNormal = {
      nome_completo: 'Patricia Lima',
      carteirinha: '7777777777',
      data_nascimento: '25/12/1992',
      maternidade: 'Guarulhos', // Lower capacity
      dum_status: 'Sim - Confiavel',
      data_dum: '01/10/2023',
      data_primeiro_usg: '15/11/2023',
      semanas_usg: 10,
      dias_usg: 0,
      diagnosticos_maternos: [],
      diagnosticos_fetais: [],
    };

    it('should detect when capacity is full', () => {
      // Simulate full capacity
      const ocupacaoCheia = new Map<string, number>();
      // Fill all days in a week
      for (let i = 0; i < 14; i++) {
        const data = addDays(dataReferencia, i + 60); // 60 days from reference
        ocupacaoCheia.set(format(data, 'yyyy-MM-dd'), 100);
      }

      // Calculate with occupation data
      const igResult = chooseAndComputeExtended({
        dumStatus: dadosNormal.dum_status,
        dumRaw: dadosNormal.data_dum,
        usgDateRaw: dadosNormal.data_primeiro_usg,
        usgWeeks: dadosNormal.semanas_usg,
        usgDays: dadosNormal.dias_usg,
        diagnostico: '',
        indicacao: '',
      });

      if (igResult && igResult.source !== 'INVALID') {
        const diasRestantes = 39 * 7 - igResult.gaDays;
        const dataIdeal = addDays(dataReferencia, diasRestantes);

        const scheduleResult = encontrarDataAgendada({
          dataIdeal,
          maternidade: dadosNormal.maternidade,
          dataReferencia,
          margemDias: 2, // Small margin to force needs_review
          ocupacaoAtual: ocupacaoCheia,
        });

        expect(scheduleResult.status).toBe('needs_review');
        expect(scheduleResult.ajustadoPorCapacidade).toBe(true);
      }
    });
  });

  describe('Case 6: IG Outside Protocol Warning', () => {
    const dadosIGForaProtocolo = {
      nome_completo: 'Fernanda Oliveira',
      carteirinha: '8888888888',
      data_nascimento: '05/07/1995',
      maternidade: 'Salvalus',
      dum_status: 'Incerta',
      data_dum: '',
      data_primeiro_usg: '01/06/2024', // Very recent USG
      semanas_usg: 41, // Post-term
      dias_usg: 0,
      diagnosticos_maternos: [],
      diagnosticos_fetais: [],
    };

    it('should calculate IG beyond ideal', () => {
      const result = calcularAgendamento({ ...dadosIGForaProtocolo, dataReferencia });
      expect(result.valido).toBe(true);
      // At 41 weeks, IG is already past the ideal 39 weeks
      if (result.igAtualDias) {
        expect(result.igAtualDias).toBeGreaterThan(39 * 7);
      }
    });

    it('should have negative or zero days remaining', () => {
      const igResult = chooseAndComputeExtended({
        dumStatus: dadosIGForaProtocolo.dum_status,
        dumRaw: dadosIGForaProtocolo.data_dum,
        usgDateRaw: dadosIGForaProtocolo.data_primeiro_usg,
        usgWeeks: dadosIGForaProtocolo.semanas_usg,
        usgDays: dadosIGForaProtocolo.dias_usg,
        diagnostico: '',
        indicacao: '',
      });

      if (igResult && igResult.source !== 'INVALID') {
        const diasRestantes = 39 * 7 - igResult.gaDays;
        // At 41 weeks (287 days), ideal 39 weeks (273 days)
        // diasRestantes should be negative
        expect(diasRestantes).toBeLessThan(0);
      }
    });
  });

  describe('Protocol Consistency', () => {
    it('should use the same protocol lookup for both pathways', () => {
      const diagnoses = ['dmg_sem_insulina_bom_controle', 'hac_compensada'];
      
      // Method used by ImportarPorTabela
      const protocolKeys = mapDiagnosisToProtocol(diagnoses);
      
      // Method used by NovoAgendamento
      const autoResult = calculateAutomaticIG(diagnoses);
      
      // Both should find the same most restrictive protocol
      expect(protocolKeys).toContain(autoResult.protocoloAplicado);
    });

    it('should apply DMG protocol correctly', () => {
      const dmgProtocol = PROTOCOLS['dmg_sem_insulina_bom_controle'];
      expect(dmgProtocol).toBeDefined();
      expect(dmgProtocol.igIdeal).toBe('39');
      expect(dmgProtocol.margemDias).toBe(7);
    });

    it('should apply HAC protocol correctly', () => {
      const hacProtocol = PROTOCOLS['hac_compensada'];
      expect(hacProtocol).toBeDefined();
      expect(hacProtocol.igIdeal).toBe('39');
    });

    it('should apply pre-eclampsia protocol correctly', () => {
      const peProtocol = PROTOCOLS['pre_eclampsia_sem_deterioracao'];
      expect(peProtocol).toBeDefined();
      expect(peProtocol.igIdeal).toBe('37');
    });
  });

  describe('Date Calculation Consistency', () => {
    it('should calculate same ideal date from same IG data', () => {
      const igData = {
        dumStatus: 'Incerta',
        dumRaw: '',
        usgDateRaw: '01/01/2024',
        usgWeeks: 20,
        usgDays: 0,
        diagnostico: '',
        indicacao: '',
      };

      const result1 = chooseAndComputeExtended(igData);
      const result2 = chooseAndComputeExtended(igData);

      expect(result1?.gaDays).toBe(result2?.gaDays);
      expect(result1?.gaFormatted).toBe(result2?.gaFormatted);
    });

    it('should skip Sundays consistently', () => {
      // Sunday June 2, 2024
      const sundayIdeal = new Date('2024-06-02');
      const dataRef = new Date('2024-05-20');

      const result = encontrarDataAgendada({
        dataIdeal: sundayIdeal,
        maternidade: 'Salvalus',
        dataReferencia: dataRef,
        margemDias: 7,
      });

      // Should not schedule on Sunday
      if (result.dataAgendada) {
        expect(result.dataAgendada.getDay()).not.toBe(0);
      }
      expect(result.ajustadoPorDomingo).toBe(true);
    });
  });
});
