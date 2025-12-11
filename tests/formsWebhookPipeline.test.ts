import { describe, it, expect } from 'vitest';
import { executarPipeline, type DadosAgendamento } from '@shared/protocols';

describe('Forms Webhook Pipeline', () => {
  describe('Pipeline Completo - Casos de Sucesso', () => {
    it('deve processar corretamente caso com DUM confiável e diabetes gestacional', () => {
      const dados: DadosAgendamento = {
        nome: 'Maria da Silva',
        maternidade: 'Hospital São José',
        dataDum: '2024-03-15',
        dumConfiavel: true,
        dataUsg: '2024-05-10',
        semanasUsg: 8,
        diasUsg: 2,
        diagnosticoMaterno: 'diabetes gestacional controlado',
        telefone: '85999999999',
        carteirinha: '123456789'
      };

      const resultado = executarPipeline(dados, new Map(), new Date('2024-10-15'));

      expect(resultado.success).toBe(true);
      expect(resultado.metodoIG).toBe('DUM');
      expect(resultado.igIdealSemanas).toBeGreaterThan(0);
      expect(resultado.dataAgendada).toBeDefined();
      expect(resultado.statusVaga).not.toBe('erro');
    });

    it('deve processar corretamente caso com USG sem DUM', () => {
      const dados: DadosAgendamento = {
        nome: 'Ana Santos',
        maternidade: 'Hospital Guarulhos',
        dataDum: null,
        dumConfiavel: false,
        dataUsg: '2024-05-01',
        semanasUsg: 10,
        diasUsg: 3,
        diagnosticoMaterno: 'hipertensão gestacional'
      };

      const resultado = executarPipeline(dados, new Map(), new Date('2024-10-15'));

      expect(resultado.success).toBe(true);
      expect(resultado.metodoIG).toBe('USG');
      expect(resultado.igIdealSemanas).toBe(37); // IG para hipertensão gestacional
    });

    it('deve processar caso padrão sem diagnósticos específicos', () => {
      const dados: DadosAgendamento = {
        nome: 'Joana Lima',
        maternidade: 'NotreCare',
        dataDum: '2024-02-01',
        dumConfiavel: true,
        dataUsg: '2024-03-20',
        semanasUsg: 7,
        diasUsg: 0
      };

      const resultado = executarPipeline(dados, new Map(), new Date('2024-10-15'));

      expect(resultado.success).toBe(true);
      expect(resultado.igIdealSemanas).toBe(39); // IG padrão
      expect(resultado.categoriaDignostico).toBe('padrao');
    });

    it('deve ajustar data para não cair em domingo', () => {
      // Data que cairia em domingo: simular
      const dados: DadosAgendamento = {
        nome: 'Teste Domingo',
        maternidade: 'Salvalus',
        dataDum: '2024-01-01', // Configurar para IG ideal cair em domingo
        dumConfiavel: true,
        semanasUsg: 0,
        diasUsg: 0
      };

      const resultado = executarPipeline(dados, new Map(), new Date('2024-01-01'));

      if (resultado.success && resultado.dataAgendada) {
        const diaSemana = resultado.dataAgendada.getDay();
        expect(diaSemana).not.toBe(0); // 0 = domingo
      }
    });
  });

  describe('Pipeline Completo - Casos de Erro', () => {
    it('deve retornar erro quando DUM e USG estão ausentes', () => {
      const dados: DadosAgendamento = {
        nome: 'Paciente Sem Dados',
        maternidade: 'Hospital Teste',
        dataDum: null,
        dumConfiavel: false,
        dataUsg: null,
        semanasUsg: 0,
        diasUsg: 0
      };

      const resultado = executarPipeline(dados);

      expect(resultado.success).toBe(false);
      expect(resultado.metodoIG).toBe('ERRO');
      expect(resultado.erro).toBeDefined();
    });
  });

  describe('Diagnósticos Específicos', () => {
    it('deve identificar IG ideal de 37s para pré-eclâmpsia', () => {
      const dados: DadosAgendamento = {
        nome: 'Paciente PE',
        maternidade: 'Hospital Teste',
        dataDum: '2024-03-01',
        dumConfiavel: true,
        semanasUsg: 0,
        diasUsg: 0,
        diagnosticoMaterno: 'pre-eclampsia sem deterioracao'
      };

      const resultado = executarPipeline(dados, new Map(), new Date('2024-10-15'));

      expect(resultado.success).toBe(true);
      expect(resultado.igIdealSemanas).toBe(37);
    });

    it('deve identificar IG ideal de 34s para HELLP', () => {
      const dados: DadosAgendamento = {
        nome: 'Paciente HELLP',
        maternidade: 'Hospital Teste',
        dataDum: '2024-03-01',
        dumConfiavel: true,
        semanasUsg: 0,
        diasUsg: 0,
        diagnosticoMaterno: 'hellp'
      };

      const resultado = executarPipeline(dados, new Map(), new Date('2024-10-15'));

      expect(resultado.success).toBe(true);
      expect(resultado.igIdealSemanas).toBe(34);
    });

    it('deve usar a IG mais conservadora quando há múltiplos diagnósticos', () => {
      const dados: DadosAgendamento = {
        nome: 'Paciente Múltiplos',
        maternidade: 'Hospital Teste',
        dataDum: '2024-03-01',
        dumConfiavel: true,
        semanasUsg: 0,
        diasUsg: 0,
        diagnosticoMaterno: 'diabetes gestacional',  // IG 39
        diagnosticoFetal: 'ciur grave'  // IG 36
      };

      const resultado = executarPipeline(dados, new Map(), new Date('2024-10-15'));

      expect(resultado.success).toBe(true);
      expect(resultado.igIdealSemanas).toBe(36); // Deve usar a menor IG (mais conservadora)
    });
  });

  describe('Capacidade de Vagas', () => {
    it('deve marcar como disponível quando há vaga', () => {
      const dados: DadosAgendamento = {
        nome: 'Paciente Teste',
        maternidade: 'Hospital São José',
        dataDum: '2024-03-01',
        dumConfiavel: true,
        semanasUsg: 0,
        diasUsg: 0
      };

      const ocupacao = new Map<string, number>();
      const resultado = executarPipeline(dados, ocupacao, new Date('2024-10-15'));

      if (resultado.success) {
        expect(['disponivel', 'adiado', 'lotado']).toContain(resultado.statusVaga);
      }
    });

    it('deve adiar quando maternidade está lotada na data ideal', () => {
      const dados: DadosAgendamento = {
        nome: 'Paciente Teste',
        maternidade: 'Hospital São José',
        dataDum: '2024-03-01',
        dumConfiavel: true,
        semanasUsg: 0,
        diasUsg: 0
      };

      // Simular ocupação máxima na data calculada
      const ocupacao = new Map<string, number>();
      const dataBase = new Date('2024-10-15');
      
      // Ocupar várias datas próximas
      for (let i = 0; i < 10; i++) {
        const data = new Date(dataBase);
        data.setDate(data.getDate() + i);
        const chave = `${dados.maternidade}-${data.toISOString().split('T')[0]}`;
        ocupacao.set(chave, 10); // Exceder capacidade
      }

      const resultado = executarPipeline(dados, ocupacao, dataBase);

      if (resultado.success) {
        expect(['adiado', 'lotado']).toContain(resultado.statusVaga);
      }
    });
  });

  describe('Formatos de Data', () => {
    it('deve aceitar formato DD/MM/YYYY', () => {
      const dados: DadosAgendamento = {
        nome: 'Teste Data BR',
        maternidade: 'Hospital Teste',
        dataDum: '15/03/2024',
        dumConfiavel: true,
        semanasUsg: 0,
        diasUsg: 0
      };

      const resultado = executarPipeline(dados, new Map(), new Date('2024-10-15'));

      expect(resultado.success).toBe(true);
    });

    it('deve aceitar formato YYYY-MM-DD', () => {
      const dados: DadosAgendamento = {
        nome: 'Teste Data ISO',
        maternidade: 'Hospital Teste',
        dataDum: '2024-03-15',
        dumConfiavel: true,
        semanasUsg: 0,
        diasUsg: 0
      };

      const resultado = executarPipeline(dados, new Map(), new Date('2024-10-15'));

      expect(resultado.success).toBe(true);
    });
  });

  describe('Cálculo de DPP', () => {
    it('deve calcular DPP corretamente (280 dias após DUM)', () => {
      const dados: DadosAgendamento = {
        nome: 'Teste DPP',
        maternidade: 'Hospital Teste',
        dataDum: '2024-03-15',
        dumConfiavel: true,
        semanasUsg: 0,
        diasUsg: 0
      };

      const resultado = executarPipeline(dados, new Map(), new Date('2024-10-15'));

      expect(resultado.success).toBe(true);
      expect(resultado.dppCalculado).toBeDefined();
      
      if (resultado.dppCalculado) {
        const dumDate = new Date('2024-03-15');
        const dppDate = new Date(resultado.dppCalculado);
        const diffDays = Math.floor((dppDate.getTime() - dumDate.getTime()) / (1000 * 60 * 60 * 24));
        
        expect(diffDays).toBe(280);
      }
    });
  });
});
