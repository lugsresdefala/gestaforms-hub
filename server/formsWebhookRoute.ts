import type { Router } from "express";
import { storage } from "./storage";
import { executarPipeline, formatarRespostaWebhook, type DadosAgendamento } from "@shared/protocols";
import type { InsertAgendamentoPendente } from "@shared/schema";

/**
 * Normaliza datas de vários formatos (DD/MM/YYYY, YYYY-MM-DD) para YYYY-MM-DD
 */
function normalizarData(valor: string | null | undefined): string | null {
  if (!valor) return null;
  
  // DD/MM/YYYY
  const matchBR = valor.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (matchBR) {
    return `${matchBR[3]}-${matchBR[2]}-${matchBR[1]}`;
  }
  
  // YYYY-MM-DD já está normalizado
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return valor;
  }
  
  return valor;
}

/**
 * Converte data string para objeto Date
 */
function parseDate(valor: string | null | undefined): Date | null {
  if (!valor) return null;
  const normalized = normalizarData(valor);
  if (!normalized) return null;
  
  const parsed = new Date(normalized);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Calcula DPP (Data Provável do Parto) - 280 dias após data referência
 */
function calcularDpp(dataReferencia: Date | null): string | null {
  if (!dataReferencia) return null;
  const dpp = new Date(dataReferencia);
  dpp.setDate(dpp.getDate() + 280);
  return dpp.toISOString().split('T')[0];
}

/**
 * Registra rotas do webhook de Forms
 */
export function registerFormsWebhookRoute(router: Router) {
  
  /**
   * POST /api/webhook/forms
   * Recebe dados do Microsoft Forms via Power Automate
   * Processa através do pipeline obstétrico
   * Armazena em agendamentos_pendentes
   */
  router.post("/api/webhook/forms", async (req, res) => {
    try {
      console.log("[Forms Webhook] Recebido:", JSON.stringify(req.body).substring(0, 500));
      
      const body = req.body;
      
      // Normalizar campos de entrada (Power Automate pode enviar com nomes variados)
      const paciente = body.paciente || body.nome_paciente || body.nome || body.nomeCompleto;
      const maternidade = body.maternidade || body.hospital;
      const dataDum = normalizarData(body.data_dum || body.dum || body.dataDum);
      const dumConfiavel = body.dum_confiavel !== false; // default true
      const dataUsg = normalizarData(body.data_primeiro_usg || body.data_usg || body.usg || body.dataUsg);
      const semanasUsg = parseInt(body.semanas_usg || body.semanasUsg || "0") || 0;
      const diasUsg = parseInt(body.dias_usg || body.diasUsg || "0") || 0;
      const diagnosticoMaterno = body.diagnostico_materno || body.comorbidades;
      const diagnosticoFetal = body.diagnostico_fetal || body.malformacao;
      const telefone = body.telefone || body.telefones;
      const carteirinha = body.carteirinha;
      const indicacao = body.indicacao;
      const procedimento = body.procedimento;
      const medico = body.medico;
      const formsRowId = body.forms_row_id;
      
      // Validar campos obrigatórios
      if (!paciente || !maternidade) {
        console.log("[Forms Webhook] Campos obrigatórios ausentes");
        return res.status(400).json({
          success: false,
          error: "Campos obrigatórios ausentes: paciente, maternidade"
        });
      }
      
      // Construir dados para o pipeline
      const dadosAgendamento: DadosAgendamento = {
        nome: paciente,
        maternidade,
        dataDum,
        dumConfiavel,
        dataUsg,
        semanasUsg,
        diasUsg,
        diagnosticoMaterno,
        diagnosticoFetal,
        indicacao,
        procedimento,
        telefone,
        carteirinha,
        medico,
        excelRowId: formsRowId
      };
      
      // Executar pipeline obstétrico
      const resultado = executarPipeline(dadosAgendamento);
      
      console.log("[Forms Webhook] Pipeline executado:", {
        success: resultado.success,
        metodo: resultado.metodoIG,
        igIdeal: resultado.igIdeal,
        dataAgendada: resultado.dataAgendada?.toISOString().split('T')[0]
      });
      
      // Calcular DPP
      const dataReferencia = resultado.success && resultado.dataAgendada
        ? parseDate(dataDum || dataUsg)
        : null;
      const dppCalculado = calcularDpp(dataReferencia);
      
      // Preparar dados para inserção
      const pendenteData: InsertAgendamentoPendente = {
        // Dados brutos
        paciente,
        maternidade,
        procedimento: procedimento || null,
        telefones: telefone || null,
        carteirinha: carteirinha || null,
        medico: medico || null,
        
        // Dados obstétricos
        dataDum,
        dumConfiavel,
        dataUsg,
        semanasUsg: semanasUsg || null,
        diasUsg: diasUsg || null,
        
        // Diagnósticos
        diagnosticoMaterno: diagnosticoMaterno || null,
        diagnosticoFetal: diagnosticoFetal || null,
        indicacao: indicacao || null,
        
        // Resultados do pipeline
        metodoIg: resultado.metodoIG,
        justificativaMetodo: resultado.justificativaMetodo,
        igIdeal: resultado.igIdeal,
        igIdealSemanas: resultado.igIdealSemanas || null,
        categoriaDiagnostico: resultado.categoriaDignostico || null,
        diagnosticoEncontrado: resultado.diagnosticoEncontrado || null,
        dataAgendada: resultado.dataAgendada?.toISOString().split('T')[0] || null,
        igNaData: resultado.igNaData || null,
        diasAdiados: resultado.diasAdiados || null,
        statusVaga: resultado.statusVaga,
        dppCalculado,
        
        // Metadados
        status: "pendente",
        formsRowId: formsRowId || null
      };
      
      // Inserir no banco
      const pendente = await storage.createAgendamentoPendente(pendenteData);
      
      console.log("[Forms Webhook] Agendamento pendente criado:", pendente.id);
      
      // Responder com formato esperado pelo Power Automate
      const resposta = {
        success: resultado.success,
        id: pendente.id,
        paciente,
        maternidade,
        source_type: 'forms',
        forms_row_id: formsRowId,
        pipeline: {
          metodo_ig: resultado.metodoIG,
          justificativa: resultado.justificativaMetodo,
          ig_ideal: resultado.igIdeal,
          ig_ideal_semanas: resultado.igIdealSemanas,
          categoria_diagnostico: resultado.categoriaDignostico,
          diagnostico_encontrado: resultado.diagnosticoEncontrado,
          data_agendada: resultado.dataAgendada?.toISOString().split('T')[0] || null,
          ig_na_data: resultado.igNaData,
          dias_adiados: resultado.diasAdiados,
          status_vaga: resultado.statusVaga,
          dia_semana: resultado.diaSemana,
          dpp_calculado: dppCalculado
        },
        error: resultado.erro || null
      };
      
      res.status(resultado.success ? 201 : 200).json(resposta);
      
    } catch (error: any) {
      console.error("[Forms Webhook] Erro ao processar:", error);
      res.status(500).json({
        success: false,
        error: "Erro interno ao processar agendamento",
        message: error.message
      });
    }
  });
  
  /**
   * GET /api/pendentes
   * Lista agendamentos pendentes para aprovação
   */
  router.get("/api/pendentes", async (req, res) => {
    try {
      const { status, maternidade, startDate, endDate } = req.query;
      
      const pendentes = await storage.getAgendamentosPendentes({
        status: (status as string) || 'pendente',
        maternidade: maternidade as string,
        startDate: startDate as string,
        endDate: endDate as string
      });
      
      console.log(`[Pendentes] Retornando ${pendentes.length} agendamentos`);
      
      res.json(pendentes);
    } catch (error: any) {
      console.error("[Pendentes] Erro ao listar:", error);
      res.status(500).json({
        error: "Erro ao listar agendamentos pendentes",
        message: error.message
      });
    }
  });
  
  /**
   * GET /api/pendentes/:id
   * Obtém detalhes de um agendamento pendente específico
   */
  router.get("/api/pendentes/:id", async (req, res) => {
    try {
      const pendente = await storage.getAgendamentoPendente(req.params.id);
      
      if (!pendente) {
        return res.status(404).json({
          error: "Agendamento pendente não encontrado"
        });
      }
      
      res.json(pendente);
    } catch (error: any) {
      console.error("[Pendentes] Erro ao buscar:", error);
      res.status(500).json({
        error: "Erro ao buscar agendamento pendente",
        message: error.message
      });
    }
  });
  
  /**
   * PATCH /api/pendentes/:id
   * Atualiza status de um agendamento pendente (aprovar/rejeitar)
   */
  router.patch("/api/pendentes/:id", async (req, res) => {
    try {
      const { status, aprovadoPor } = req.body;
      
      const pendente = await storage.updateAgendamentoPendente(req.params.id, {
        status,
        aprovadoPor,
        aprovadoEm: new Date() as any
      });
      
      if (!pendente) {
        return res.status(404).json({
          error: "Agendamento pendente não encontrado"
        });
      }
      
      res.json(pendente);
    } catch (error: any) {
      console.error("[Pendentes] Erro ao atualizar:", error);
      res.status(500).json({
        error: "Erro ao atualizar agendamento pendente",
        message: error.message
      });
    }
  });
}
