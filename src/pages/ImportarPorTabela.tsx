import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Trash2, ClipboardPaste, Calculator, Save, AlertCircle, CheckCircle2, Loader2, Info, Filter } from "lucide-react";
import type { GestationalSnapshotResult } from "@/lib/import/gestationalSnapshot";

const MS_PER_DAY = 86400000;
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { chooseAndComputeExtended } from "@/lib/import/gestationalCalculator";
import { parseDateSafe } from "@/lib/import/dateParser";
import { addDays, differenceInDays } from "date-fns";
import { PROTOCOLS } from "@/lib/obstetricProtocols";
import {
  encontrarDataAgendada,
  formatIGCurta,
  calcularIGNaData,
  getIntervaloColor,
  validarIG,
  type StatusAgendamento,
  LEAD_TIME_MINIMO,
} from "@/lib/scheduling";
import { validarAgendamento } from "@/lib/validation";
import { ModalCorrecaoDatas } from "@/components/ModalCorrecaoDatas";
import { validarCoerenciaDatas, type IncoerenciaData } from "@/lib/validation/dateCoherenceValidator";

// Tipos
interface PacienteRow {
  id: string;
  data_registro: string; // Data original da solicitação de agendamento
  nome_completo: string;
  data_nascimento: string;
  carteirinha: string;
  numero_gestacoes: string;
  numero_partos_cesareas: string;
  numero_partos_normais: string;
  numero_abortos: string;
  telefones: string;
  procedimentos: string;
  dum_status: string;
  data_dum: string;
  data_primeiro_usg: string;
  semanas_usg: string;
  dias_usg: string;
  usg_recente: string;
  ig_pretendida: string;
  indicacao_procedimento: string;
  medicacao: string;
  diagnosticos_maternos: string;
  placenta_previa: string;
  diagnosticos_fetais: string;
  historia_obstetrica: string;
  necessidade_uti_materna: string;
  necessidade_reserva_sangue: string;
  maternidade: string;
  medico_responsavel: string;
  email_paciente: string;
  centro_clinico: string;
  // Campos calculados
  ig_no_registro?: string; // IG calculada na data do registro
  data_ideal?: string;
  ig_ideal?: string;
  delta_dias?: number;
  protocolo?: string;
  status?: "pendente" | "valido" | "erro" | "salvo";
  erro?: string;
  // Snapshot de agendamento
  snapshot?: GestationalSnapshotResult;
  // Campos de agendamento
  data_agendada?: string;
  status_agendamento?: StatusAgendamento;
  ig_na_data_agendada?: string;
  intervalo_dias?: number; // Intervalo entre data registro e data agendada
  lead_time_dias?: number;
  margem_protocolo?: number;
  protocolo_aplicado?: string;
  motivo_calculo?: string;
}

type SortField = 'data_agendada' | 'ig_ideal' | 'intervalo' | null;
type SortDirection = 'asc' | 'desc';

const EMPTY_ROW: Omit<PacienteRow, "id"> = {
  data_registro: "", // Data original da solicitação
  nome_completo: "",
  data_nascimento: "",
  carteirinha: "",
  numero_gestacoes: "1",
  numero_partos_cesareas: "0",
  numero_partos_normais: "0",
  numero_abortos: "0",
  telefones: "",
  procedimentos: "Cesárea",
  dum_status: "Incerta",
  data_dum: "",
  data_primeiro_usg: "",
  semanas_usg: "",
  dias_usg: "0",
  usg_recente: "",
  ig_pretendida: "39",
  indicacao_procedimento: "Desejo materno",
  medicacao: "",
  diagnosticos_maternos: "",
  placenta_previa: "Não",
  diagnosticos_fetais: "",
  historia_obstetrica: "",
  necessidade_uti_materna: "Não",
  necessidade_reserva_sangue: "Não",
  maternidade: "Salvalus",
  medico_responsavel: "",
  email_paciente: "",
  centro_clinico: "Centro Clínico Hapvida",
  status: "pendente",
};

// Funções de normalização
const normalizarDumStatus = (valor: string): string => {
  const v = (valor || "").toLowerCase().trim();
  if (v.includes("confiavel") || v.includes("confiável") || v === "sim") return "Sim - Confiavel";
  if (v.includes("incerta")) return "Incerta";
  return "Não sabe";
};

const normalizarDiasUsg = (valor: string): number => {
  const num = parseInt(valor) || 0;
  return Math.min(6, Math.max(0, num % 7));
};

const normalizarSemanasUsg = (valor: string): number => {
  const match = valor?.match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
};

const normalizarSimNao = (valor: string): string => {
  const v = (valor || "").toLowerCase().trim();
  return v === "sim" || v === "s" || v === "yes" ? "Sim" : "Não";
};

const normalizarNumero = (valor: string): number => {
  const num = parseInt(valor);
  return isNaN(num) ? 0 : Math.max(0, num);
};

/**
 * Obtém a data de referência para cálculos de IG em dados históricos.
 * Para dados históricos: usa data_registro como referência (quando disponível)
 * Para importação em tempo real: usa a data atual
 * 
 * @param dataRegistro - String da data de registro do formulário
 * @param fallback - Data de fallback caso data_registro seja inválida/ausente
 * @returns Data de referência normalizada (00:00:00)
 */
const obterDataReferencia = (dataRegistro: string | undefined, fallback: Date): Date => {
  if (dataRegistro) {
    const parsedData = parseDateSafe(dataRegistro);
    if (parsedData) {
      parsedData.setHours(0, 0, 0, 0);
      return parsedData;
    }
  }
  return fallback;
};

// Table minimum width to accommodate all columns
const TABLE_MIN_WIDTH = "3200px";

export default function ImportarPorTabela() {
  const { user } = useAuth();
  const [rows, setRows] = useState<PacienteRow[]>(
    Array.from({ length: 65 }, () => ({ ...EMPTY_ROW, id: crypto.randomUUID() })),
  );
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [focusedCell, setFocusedCell] = useState<{ rowIndex: number; field: keyof PacienteRow } | null>(null);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterForaMargem, setFilterForaMargem] = useState(false);
  
  // State for date correction modal
  const [modalCorrecao, setModalCorrecao] = useState<{
    isOpen: boolean;
    paciente: {
      nome: string;
      carteirinha: string;
      rowId: string;
      data_registro?: string;
      dum_status?: string;
      data_dum?: string;
      data_primeiro_usg?: string;
      semanas_usg?: string;
      dias_usg?: string;
    };
    incoerencias: IncoerenciaData[];
  } | null>(null);
  
  // Review queue for rows with incoherencies
  const [filaRevisao, setFilaRevisao] = useState<Array<{
    rowId: string;
    incoerencias: IncoerenciaData[];
  }>>([]);
  
  // Counter for corrected rows
  const [corrigidos, setCorrigidos] = useState(0);

  // Computed/sorted/filtered rows
  const displayRows = useMemo(() => {
    let result = [...rows];
    
    // Filter: somente fora da margem
    if (filterForaMargem) {
      result = result.filter(row => row.snapshot && !row.snapshot.dentroMargem);
    }
    
    // Sort
    if (sortField) {
      result.sort((a, b) => {
        let aVal: number | Date | null = null;
        let bVal: number | Date | null = null;
        
        switch (sortField) {
          case 'data_agendada':
            aVal = a.snapshot?.dataAgendada || null;
            bVal = b.snapshot?.dataAgendada || null;
            break;
          case 'ig_ideal':
            aVal = a.snapshot?.igIdealDias || 0;
            bVal = b.snapshot?.igIdealDias || 0;
            break;
          case 'intervalo':
            aVal = a.snapshot?.intervaloDias || 0;
            bVal = b.snapshot?.intervaloDias || 0;
            break;
        }
        
        if (aVal === null && bVal === null) return 0;
        if (aVal === null) return sortDirection === 'asc' ? 1 : -1;
        if (bVal === null) return sortDirection === 'asc' ? -1 : 1;
        
        if (aVal instanceof Date && bVal instanceof Date) {
          return sortDirection === 'asc' 
            ? aVal.getTime() - bVal.getTime() 
            : bVal.getTime() - aVal.getTime();
        }
        
        const numA = typeof aVal === 'number' ? aVal : 0;
        const numB = typeof bVal === 'number' ? bVal : 0;
        return sortDirection === 'asc' ? numA - numB : numB - numA;
      });
    }
    
    return result;
  }, [rows, sortField, sortDirection, filterForaMargem]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const addRow = () => {
    setRows([...rows, { ...EMPTY_ROW, id: crypto.randomUUID() }]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter((r) => r.id !== id));
    }
  };

  const updateRow = (id: string, field: keyof PacienteRow, value: string) => {
    setRows(rows.map((r) => (r.id === id ? { ...r, [field]: value, status: "pendente" } : r)));
  };

  const handleCellFocus = (rowIndex: number, field: keyof PacienteRow) => {
    setFocusedCell({ rowIndex, field });
  };

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const text = e.clipboardData.getData("text");
      if (!text.trim()) return;

      const lines = text
        .trim()
        .split("\n")
        .filter((l) => l.trim());
      if (lines.length === 0) return;

      const isSingleColumn = !text.includes("\t");

      // ORDEM COMPLETA DAS COLUNAS EDITÁVEIS (seguindo a tabela)
      const pasteFieldOrder: (keyof PacienteRow)[] = [
        "data_registro",
        "nome_completo",
        "data_nascimento",
        "carteirinha",
        "numero_gestacoes",
        "numero_partos_cesareas",
        "numero_partos_normais",
        "numero_abortos",
        "telefones",
        "procedimentos",
        "dum_status",
        "data_dum",
        "data_primeiro_usg",
        "semanas_usg",
        "dias_usg",
        "usg_recente",
        "ig_pretendida",
        "indicacao_procedimento",
        "medicacao",
        "diagnosticos_maternos",
        "placenta_previa",
        "diagnosticos_fetais",
        "historia_obstetrica",
        "necessidade_uti_materna",
        "necessidade_reserva_sangue",
        "maternidade",
        "medico_responsavel",
        "email_paciente",
      ];

      // Multi-coluna a partir da célula focada
      if (!isSingleColumn && focusedCell) {
        const { rowIndex, field } = focusedCell;
        const startFieldIndex = pasteFieldOrder.indexOf(field);

        if (startFieldIndex !== -1) {
          e.preventDefault();
          const grid = lines.map((line) => line.split("\t"));

          setRows((prev) => {
            const updated = [...prev];

            grid.forEach((cols, rowOffset) => {
              const targetRowIndex = rowIndex + rowOffset;
              
              // Auto-create additional rows if needed
              while (targetRowIndex >= updated.length) {
                updated.push({ ...EMPTY_ROW, id: crypto.randomUUID() });
              }

              const current = updated[targetRowIndex];
              const newRow: PacienteRow = { ...current, status: "pendente" };

              cols.forEach((value, colOffset) => {
                const fieldIndex = startFieldIndex + colOffset;
                const targetField = pasteFieldOrder[fieldIndex];
                if (!targetField) return;
                (newRow as any)[targetField] = value.trim();
              });

              updated[targetRowIndex] = newRow;
            });

            return updated;
          });

          toast.success(`Dados colados em múltiplas colunas (${lines.length} linha(s)).`);
          return;
        }
      }

      // Coluna única: preenche para baixo na coluna focada
      if (isSingleColumn && focusedCell) {
        e.preventDefault();
        const { rowIndex, field } = focusedCell;

        setRows((prev) => {
          const updated = [...prev];
          lines.forEach((line, idx) => {
            const targetIdx = rowIndex + idx;
            
            // Auto-create additional rows if needed
            while (targetIdx >= updated.length) {
              updated.push({ ...EMPTY_ROW, id: crypto.randomUUID() });
            }
            
            updated[targetIdx] = {
              ...updated[targetIdx],
              [field]: line.trim(),
              status: "pendente",
            };
          });
          return updated;
        });

        toast.success(`${lines.length} valores colados na coluna!`);
        return;
      }

      // Fallback: colagem multi-coluna criando novas linhas (com mapeamento padrão)
      if (!text.includes("\t")) return;

      e.preventDefault();

      const firstLine = lines[0].toLowerCase();
      const hasHeader = firstLine.includes("nome") || firstLine.includes("carteirinha");
      const dataLines = hasHeader ? lines.slice(1) : lines;

      const newRows: PacienteRow[] = dataLines.map((line) => {
        const cols = line.split("\t");
        return {
          id: crypto.randomUUID(),
          data_registro: cols[0]?.trim() || "", // Data original da solicitação
          nome_completo: cols[1]?.trim() || cols[0]?.trim() || "",
          data_nascimento: cols[2]?.trim() || cols[1]?.trim() || "",
          carteirinha: cols[3]?.trim() || cols[2]?.trim() || "",
          numero_gestacoes: cols[4]?.trim() || "1",
          numero_partos_cesareas: cols[5]?.trim() || "0",
          numero_partos_normais: cols[6]?.trim() || "0",
          numero_abortos: cols[7]?.trim() || "0",
          telefones: cols[8]?.trim() || "",
          procedimentos: cols[9]?.trim() || "Cesárea",
          dum_status: normalizarDumStatus(cols[10]?.trim() || ""),
          data_dum: cols[11]?.trim() || "",
          data_primeiro_usg: cols[12]?.trim() || "",
          semanas_usg: cols[13]?.trim() || "",
          dias_usg: cols[14]?.trim() || "0",
          usg_recente: cols[15]?.trim() || "",
          ig_pretendida: cols[16]?.trim() || "39",
          indicacao_procedimento: cols[18]?.trim() || "Desejo materno",
          medicacao: cols[19]?.trim() || "",
          diagnosticos_maternos: cols[20]?.trim() || "",
          placenta_previa: cols[21]?.trim() || "Não",
          diagnosticos_fetais: cols[22]?.trim() || "",
          historia_obstetrica: cols[23]?.trim() || "",
          necessidade_uti_materna: cols[24]?.trim() || "Não",
          necessidade_reserva_sangue: cols[25]?.trim() || "Não",
          maternidade: cols[26]?.trim() || "Salvalus",
          medico_responsavel: cols[27]?.trim() || "",
          email_paciente: (cols[28]?.trim() || "").toLowerCase(),
          centro_clinico: "Centro Clínico Hapvida",
          status: "pendente",
        };
      });

      setRows((prev) => [...prev.filter((r) => r.nome_completo), ...newRows]);
      toast.success(`${newRows.length} linhas coladas com sucesso!`);
    },
    [focusedCell],
  );

  // Open modal for the first item in the review queue
  const abrirModalParaPrimeira = (fila: Array<{ rowId: string; incoerencias: IncoerenciaData[] }>) => {
    if (fila.length === 0) return;
    
    const primeiro = fila[0];
    const row = rows.find(r => r.id === primeiro.rowId);
    if (!row) return;
    
    setModalCorrecao({
      isOpen: true,
      paciente: {
        nome: row.nome_completo,
        carteirinha: row.carteirinha,
        rowId: primeiro.rowId,
        // Dados obstétricos para recálculo de IG no modal
        data_registro: row.data_registro,
        dum_status: row.dum_status,
        data_dum: row.data_dum,
        data_primeiro_usg: row.data_primeiro_usg,
        semanas_usg: row.semanas_usg,
        dias_usg: row.dias_usg,
      },
      incoerencias: primeiro.incoerencias,
    });
  };

  // Handle corrections from modal
  const handleCorrigirDatas = (correcoes: Record<string, string>) => {
    if (!modalCorrecao) return;
    
    // Apply corrections to the row
    if (Object.keys(correcoes).length > 0) {
      setRows(prev => prev.map(row => {
        if (row.id === modalCorrecao.paciente.rowId) {
          return { ...row, ...correcoes, status: 'pendente' as const };
        }
        return row;
      }));
      setCorrigidos(prev => prev + 1);
    }
    
    processarProximaIncoerencia();
  };

  // Handle keeping current values
  const handleManterValores = () => {
    processarProximaIncoerencia();
  };

  // Handle skipping a patient
  const handlePularPaciente = () => {
    if (!modalCorrecao) return;
    
    // Remove row from the list
    setRows(prev => prev.filter(r => r.id !== modalCorrecao.paciente.rowId));
    
    processarProximaIncoerencia();
  };

  // Process next incoherence in queue
  const processarProximaIncoerencia = async () => {
    const novaFila = filaRevisao.slice(1);
    setFilaRevisao(novaFila);
    
    if (novaFila.length > 0) {
      // Open modal for next row
      abrirModalParaPrimeira(novaFila);
    } else {
      // All resolved, continue processing
      setModalCorrecao(null);
      await processarDadosNormalmente();
    }
  };

  // Normal processing (after incoherence resolution)
  const processarDadosNormalmente = async () => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const processedRows = rows.map((row) => {
      try {
        if (!row.nome_completo || !row.carteirinha) {
          return { ...row, status: "erro" as const, erro: "Nome e carteirinha são obrigatórios" };
        }

        // Usar data_registro como referência, ou hoje se não informada
        let dataReferencia = hoje;
        if (row.data_registro) {
          const parsedDataRegistro = parseDateSafe(row.data_registro);
          if (parsedDataRegistro) {
            dataReferencia = parsedDataRegistro;
            dataReferencia.setHours(0, 0, 0, 0);
          }
        }

        const result = chooseAndComputeExtended({
          dumStatus: row.dum_status,
          dumRaw: row.data_dum,
          usgDateRaw: row.data_primeiro_usg,
          usgWeeks: normalizarSemanasUsg(row.semanas_usg),
          usgDays: normalizarDiasUsg(row.dias_usg),
          diagnostico: row.diagnosticos_maternos,
          indicacao: row.indicacao_procedimento,
          referenceDate: dataReferencia,
        });

        if (!result || result.source === "INVALID") {
          return { ...row, status: "erro" as const, erro: result?.reason || "Não foi possível calcular IG" };
        }

        // Determinar protocolo com base na IG pretendida ou diagnósticos
        const igPretendidaSemanas = parseInt(row.ig_pretendida) || 39;
        const igIdealSemanas = igPretendidaSemanas;
        const igIdealDias = 0;
        
        // Usar protocolo padrão desejo_materno ou buscar por diagnóstico
        let protocolo = PROTOCOLS['desejo_materno'];
        let protocoloNome = 'desejo_materno';
        
        // Tentar encontrar protocolo baseado em diagnósticos
        const diagnosticos = (row.diagnosticos_maternos || "").toLowerCase();
        if (diagnosticos.trim()) {
          const sortedProtocolKeys = Object.keys(PROTOCOLS).sort((a, b) => b.length - a.length);
          for (const key of sortedProtocolKeys) {
            const keyPattern = key.replace(/_/g, ' ');
            const regex = new RegExp(`\\b${keyPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
            if (regex.test(diagnosticos)) {
              protocolo = PROTOCOLS[key];
              protocoloNome = key;
              break;
            }
          }
        }
        
        const margemDias = protocolo?.margemDias || 7;

        // Calcular data ideal baseada na IG pretendida
        const diasRestantes = igIdealSemanas * 7 + igIdealDias - result.gaDays;
        const dataIdeal = addDays(dataReferencia, diasRestantes);
        
        // Usar a função de agendamento para encontrar data válida
        const scheduleResult = encontrarDataAgendada({
          dataIdeal,
          maternidade: row.maternidade || 'Salvalus',
          dataReferencia,
          margemDias,
        });

        // Calcular IG na data agendada
        let igNaDataAgendada = "";
        if (scheduleResult.dataAgendada) {
          const igNaData = calcularIGNaData(result.gaDays, dataReferencia, scheduleResult.dataAgendada);
          igNaDataAgendada = formatIGCurta(igNaData.semanas, igNaData.dias);
        }

        // Calcular intervalo entre data de registro e data agendada
        let intervaloRegistroAgendamento: number | undefined;
        if (scheduleResult.dataAgendada) {
          intervaloRegistroAgendamento = differenceInDays(scheduleResult.dataAgendada, dataReferencia);
        }

        // Validar IG
        const validacao = validarIG({
          igIdealSemanas,
          igIdealDias,
          igPretendidaSemanas,
          igAtualDias: result.gaDays,
          dataReferencia,
          dataAgendada: scheduleResult.dataAgendada,
        });

        // Determinar status final
        const requerRevisao = scheduleResult.status === 'needs_review' || validacao.requerRevisao;
        const motivos: string[] = [];
        if (scheduleResult.status === 'needs_review') {
          motivos.push(scheduleResult.motivo);
        }
        if (validacao.alertas.length > 0) {
          motivos.push(...validacao.alertas);
        }

        return {
          ...row,
          ig_no_registro: result.gaFormatted,
          data_ideal: dataIdeal.toLocaleDateString("pt-BR"),
          ig_ideal: formatIGCurta(igIdealSemanas, igIdealDias),
          data_agendada: scheduleResult.dataAgendada?.toLocaleDateString("pt-BR") || "-",
          status_agendamento: requerRevisao ? 'needs_review' : scheduleResult.status,
          ig_na_data_agendada: igNaDataAgendada || "-",
          intervalo_dias: intervaloRegistroAgendamento,
          lead_time_dias: scheduleResult.leadTimeDias,
          margem_protocolo: margemDias,
          protocolo_aplicado: protocoloNome,
          motivo_calculo: motivos.join(' | ') || scheduleResult.motivo,
          status: requerRevisao ? "erro" as const : "valido" as const,
          erro: requerRevisao ? 'Revisão necessária: ' + motivos.join(' | ') : undefined,
        };
      } catch {
        return { ...row, status: "erro" as const, erro: "Erro no processamento" };
      }
    });

    setRows(processedRows);
    setProcessing(false);

    const validos = processedRows.filter((r) => r.status === "valido").length;
    const erros = processedRows.filter((r) => r.status === "erro").length;
    const needsReview = processedRows.filter((r) => r.status_agendamento === "needs_review").length;
    const msgCorrigidos = corrigidos > 0 ? `, ${corrigidos} corrigidos` : '';
    toast.info(`Processados: ${validos} válidos, ${erros} com erros${needsReview > 0 ? `, ${needsReview} necessitam revisão` : ''}${msgCorrigidos}`);
    setCorrigidos(0); // Reset counter
  };

  const processarDados = async () => {
    setProcessing(true);
    setCorrigidos(0);

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // First pass: detect incoherencies
    const rowsComIncoerencias: Array<{ rowId: string; incoerencias: IncoerenciaData[] }> = [];

    for (const row of rows) {
      if (!row.nome_completo || !row.carteirinha) continue;

      // Para dados históricos: usar data_registro como referência se disponível
      const dataReferencia = obterDataReferencia(row.data_registro, hoje);

      const incoerencias = validarCoerenciaDatas({
        data_nascimento: row.data_nascimento,
        data_dum: row.data_dum,
        dum_status: row.dum_status,
        data_primeiro_usg: row.data_primeiro_usg,
        semanas_usg: row.semanas_usg,
        dias_usg: row.dias_usg,
      }, dataReferencia);

      if (incoerencias.length > 0) {
        rowsComIncoerencias.push({ rowId: row.id, incoerencias });
      }
    }

    // If there are incoherencies, start review queue
    if (rowsComIncoerencias.length > 0) {
      setFilaRevisao(rowsComIncoerencias);
      abrirModalParaPrimeira(rowsComIncoerencias);
      toast.warning(`${rowsComIncoerencias.length} registro(s) com datas incoerentes. Revise antes de processar.`);
      setProcessing(false);
      return;
    }

    // No incoherencies, process normally
    await processarDadosNormalmente();
  };

  const salvarNoBanco = async () => {
    if (!user) {
      toast.error("Usuário não autenticado");
      return;
    }

    const validRows = rows.filter((r) => r.status === "valido");
    if (validRows.length === 0) {
      toast.error("Nenhum registro válido para salvar. Processe os dados primeiro.");
      return;
    }

    setSaving(true);
    let salvos = 0;
    let erros = 0;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    for (const row of validRows) {
      try {
        // Use unified validation for consistent checks
        const validacao = await validarAgendamento({
          nome_completo: row.nome_completo,
          carteirinha: row.carteirinha,
          data_nascimento: row.data_nascimento,
          maternidade: row.maternidade || "Salvalus",
          dum_status: row.dum_status,
          data_dum: row.data_dum,
          data_primeiro_usg: row.data_primeiro_usg,
          semanas_usg: normalizarSemanasUsg(row.semanas_usg),
          dias_usg: normalizarDiasUsg(row.dias_usg),
          ig_pretendida: row.ig_pretendida,
          indicacao_procedimento: row.indicacao_procedimento,
          diagnosticos_maternos: row.diagnosticos_maternos,
          diagnosticos_fetais: row.diagnosticos_fetais,
          data_agendamento_calculada: row.data_agendada,
        }, { supabase, userId: user.id });

        if (!validacao.valido) {
          setRows((prev) =>
            prev.map((r) => (r.id === row.id ? { 
              ...r, 
              status: "erro" as const, 
              erro: validacao.errosCriticos.join('; ') 
            } : r)),
          );
          erros++;
          continue;
        }

        // Log warnings if any
        if (validacao.avisos.length > 0) {
          console.log(`Avisos para ${row.nome_completo}:`, validacao.avisos);
        }

        // Para dados históricos: usar data_registro como referência se disponível
        const dataReferencia = obterDataReferencia(row.data_registro, hoje);

        const result = chooseAndComputeExtended({
          dumStatus: row.dum_status,
          dumRaw: row.data_dum,
          usgDateRaw: row.data_primeiro_usg,
          usgWeeks: normalizarSemanasUsg(row.semanas_usg),
          usgDays: normalizarDiasUsg(row.dias_usg),
          diagnostico: row.diagnosticos_maternos,
          indicacao: row.indicacao_procedimento,
          referenceDate: dataReferencia,
        });

        // Use protocol-based ideal date
        const dataAgendamento = result?.dataIdeal || new Date();
        
        // Only persist IG if scheduled date is in future
        const isFutureDate = dataAgendamento > hoje;
        const igCalculadaParaSalvar = isFutureDate ? result?.gaFormatted : null;

        const dataNascimento = parseDateSafe(row.data_nascimento);
        const dataDum = parseDateSafe(row.data_dum);
        const dataPrimeiroUsg = parseDateSafe(row.data_primeiro_usg);

        const { error } = await supabase.from("agendamentos_obst").insert({
          nome_completo: row.nome_completo.trim(),
          data_nascimento: dataNascimento?.toISOString().split("T")[0] || new Date().toISOString().split("T")[0],
          carteirinha: row.carteirinha.trim(),
          numero_gestacoes: normalizarNumero(row.numero_gestacoes),
          numero_partos_cesareas: normalizarNumero(row.numero_partos_cesareas),
          numero_partos_normais: normalizarNumero(row.numero_partos_normais),
          numero_abortos: normalizarNumero(row.numero_abortos),
          telefones: row.telefones || "Não informado",
          procedimentos: row.procedimentos ? [row.procedimentos] : ["Cesárea"],
          dum_status: normalizarDumStatus(row.dum_status),
          data_dum: dataDum?.toISOString().split("T")[0] || null,
          data_primeiro_usg: dataPrimeiroUsg?.toISOString().split("T")[0] || new Date().toISOString().split("T")[0],
          semanas_usg: normalizarSemanasUsg(row.semanas_usg),
          dias_usg: normalizarDiasUsg(row.dias_usg),
          usg_recente: row.usg_recente || "Não informado",
          ig_pretendida: row.ig_pretendida || "39",
          indicacao_procedimento: row.indicacao_procedimento || "Desejo materno",
          medicacao: row.medicacao || null,
          diagnosticos_maternos: row.diagnosticos_maternos || null,
          placenta_previa: normalizarSimNao(row.placenta_previa),
          diagnosticos_fetais: row.diagnosticos_fetais || null,
          historia_obstetrica: row.historia_obstetrica || null,
          necessidade_uti_materna: normalizarSimNao(row.necessidade_uti_materna),
          necessidade_reserva_sangue: normalizarSimNao(row.necessidade_reserva_sangue),
          maternidade: row.maternidade || "Salvalus",
          medico_responsavel: row.medico_responsavel || "Não informado",
          email_paciente: row.email_paciente.toLowerCase().trim() || "nao-informado@sistema.local",
          centro_clinico: row.centro_clinico || "Centro Clínico Hapvida",
          idade_gestacional_calculada: igCalculadaParaSalvar,
          data_agendamento_calculada: dataAgendamento.toISOString().split("T")[0],
          created_by: user.id,
          status: "pendente",
        });

        if (error) {
          console.error("Erro ao salvar:", error);
          setRows((prev) =>
            prev.map((r) => (r.id === row.id ? { ...r, status: "erro" as const, erro: error.message } : r)),
          );
          erros++;
        } else {
          setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: "salvo" as const } : r)));
          salvos++;
        }
      } catch (error) {
        console.error(error);
        erros++;
      }
    }

    setSaving(false);
    toast.success(`Salvos: ${salvos}, Erros: ${erros}`);
  };

  const exportarResultados = () => {
    const linhasParaExportar = rows.filter(r => r.status === 'valido' || r.status === 'salvo');
    
    if (linhasParaExportar.length === 0) {
      toast.error('Nenhum resultado válido para exportar');
      return;
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // CSV headers
    const headers = [
      'Data Registro', 'Nome Completo', 'Data Nascimento', 'Carteirinha', 
      'Gestações', 'Partos Cesárea', 'Partos Normal', 'Abortos',
      'Telefones', 'Procedimentos', 'Status DUM', 'Data DUM',
      'Data 1º USG', 'Semanas USG', 'Dias USG', 'USG Recente',
      'IG Pretendida', 'Indicação', 'Medicação', 'Diag Maternos',
      'Placenta Prévia', 'Diag Fetais', 'História Obstétrica',
      'Necessidade UTI', 'Necessidade Sangue', 'Maternidade',
      'Médico Responsável', 'Email Paciente', 'Centro Clínico',
      // Calculated columns
      'IG no Registro', 'IG Ideal', 'Protocolo', 'Data Agendada',
      'IG na Data Agendada', 'Intervalo (dias)', 'Status', 'Erro'
    ];

    const linhas = linhasParaExportar.map(row => {
      // Calculate interval in days between registro and scheduled date
      let intervalo = '';
      if (row.intervalo_dias !== undefined) {
        intervalo = row.intervalo_dias >= 0 ? `+${row.intervalo_dias}` : `${row.intervalo_dias}`;
      }

      return [
        row.data_registro || '', row.nome_completo, row.data_nascimento, row.carteirinha,
        row.numero_gestacoes, row.numero_partos_cesareas, 
        row.numero_partos_normais, row.numero_abortos,
        row.telefones, row.procedimentos, row.dum_status, row.data_dum,
        row.data_primeiro_usg, row.semanas_usg, row.dias_usg, row.usg_recente,
        row.ig_pretendida, row.indicacao_procedimento, row.medicacao,
        row.diagnosticos_maternos, row.placenta_previa, row.diagnosticos_fetais,
        row.historia_obstetrica, row.necessidade_uti_materna,
        row.necessidade_reserva_sangue, row.maternidade,
        row.medico_responsavel, row.email_paciente, row.centro_clinico,
        // Calculated columns
        row.ig_no_registro || '', 
        row.snapshot?.igIdeal || '',
        row.snapshot?.protocoloNome || '',
        row.snapshot?.dataAgendada?.toLocaleDateString('pt-BR') || row.data_ideal || '',
        row.snapshot?.igNaDataAgendada || '',
        intervalo,
        row.status || '',
        row.erro || ''
      ];
    });

    // Generate CSV content with proper escaping
    const csvContent = [
      headers.join(','),
      ...linhas.map(linha => linha.map(campo => {
        const str = String(campo ?? '');
        // Escape commas, quotes and newlines
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(','))
    ].join('\n');

    // Create download with BOM for UTF-8 Excel compatibility
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `agendamentos-processados-${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`${linhasParaExportar.length} registros exportados!`);
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "valido":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-600">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Válido
          </Badge>
        );
      case "erro":
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Erro
          </Badge>
        );
      case "salvo":
        return (
          <Badge className="bg-blue-500">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Salvo
          </Badge>
        );
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardPaste className="w-6 h-6" />
            Importar Pacientes via Tabela
          </CardTitle>
          <CardDescription>
            Insira os dados manualmente ou cole do Excel/TSV. Pressione Ctrl+V para colar múltiplas linhas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <Button onClick={addRow} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-1" /> Adicionar Linha
            </Button>
            <Button onClick={processarDados} variant="outline" size="sm" disabled={processing}>
              {processing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Calculator className="w-4 h-4 mr-1" />}
              Processar Dados
            </Button>
            <Button onClick={salvarNoBanco} size="sm" disabled={saving || rows.every((r) => r.status !== "valido")}> 
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              Salvar no Banco ({rows.filter((r) => r.status === "valido").length})
            </Button>
            <div className="flex items-center gap-2 ml-4 border-l pl-4">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Checkbox 
                id="filter-fora-margem" 
                checked={filterForaMargem}
                onCheckedChange={(checked) => setFilterForaMargem(checked === true)}
              />
              <label htmlFor="filter-fora-margem" className="text-sm text-muted-foreground cursor-pointer">
                Somente fora da margem
              </label>
            </div>
          </div>

          {/* Rolagem vertical + rolagem lateral */}
          {/* Table min-width accommodates ~35 columns with varying widths */}
          <TooltipProvider>
          <ScrollArea className="h-[600px] border rounded-lg" onPaste={handlePaste}>
            <div style={{ minWidth: TABLE_MIN_WIDTH }}>
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead className="w-12">Ações</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                    <TableHead className="w-32">Registro</TableHead>
                    <TableHead className="min-w-[200px]">Nome Completo*</TableHead>
                    <TableHead className="w-32">Nascimento</TableHead>
                    <TableHead className="min-w-[150px]">Carteirinha*</TableHead>
                    <TableHead className="w-16">G</TableHead>
                    <TableHead className="w-16">PC</TableHead>
                    <TableHead className="w-16">PN</TableHead>
                    <TableHead className="w-16">A</TableHead>
                    <TableHead className="min-w-[150px]">Telefones</TableHead>
                    <TableHead className="min-w-[180px]">Procedimentos</TableHead>
                    <TableHead className="w-40">Status DUM</TableHead>
                    <TableHead className="w-32">Data DUM</TableHead>
                    <TableHead className="w-32">Data 1º USG</TableHead>
                    <TableHead className="w-20">Sem</TableHead>
                    <TableHead className="w-20">Dias</TableHead>
                    <TableHead className="min-w-[200px]">USG Recente</TableHead>
                    <TableHead className="w-24">IG Pret.</TableHead>
                    <TableHead className="min-w-[150px]">Indicação</TableHead>
                    <TableHead className="min-w-[150px]">Medicação</TableHead>
                    <TableHead className="min-w-[200px]">Diag. Maternos</TableHead>
                    <TableHead className="w-32">Placenta</TableHead>
                    <TableHead className="min-w-[200px]">Diag. Fetais</TableHead>
                    <TableHead className="min-w-[200px]">Hist. Obstétrica</TableHead>
                    <TableHead className="w-24">UTI</TableHead>
                    <TableHead className="w-24">Sangue</TableHead>
                    <TableHead className="w-32">Maternidade</TableHead>
                    <TableHead className="min-w-[150px]">Médico</TableHead>
                    <TableHead className="min-w-[200px]">Email</TableHead>
                    <TableHead className="min-w-[100px]">IG no Registro</TableHead>
                    <TableHead className="w-28">IG Ideal</TableHead>
                    <TableHead className="w-32">Data Ideal</TableHead>
                    <TableHead className="w-40">Data Agendada</TableHead>
                    <TableHead className="w-28">IG na Data</TableHead>
                    <TableHead className="w-24">Intervalo</TableHead>
                    <TableHead className="w-24">Lead Time</TableHead>
                    <TableHead className="w-16">Info</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayRows.map((row, idx) => (
                    <TableRow
                      key={row.id}
                      className={
                        row.status === "erro" ? "bg-destructive/5" : row.status === "salvo" ? "bg-green-500/5" : ""
                      }
                    >
                      <TableCell className="font-mono text-xs">{idx + 1}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRow(row.id)}
                          disabled={rows.length <= 1}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(row.status)}
                          {row.erro && <span className="text-xs text-destructive">{row.erro}</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          value={row.data_registro}
                          onChange={(e) => updateRow(row.id, "data_registro", e.target.value)}
                          onFocus={() => handleCellFocus(idx, "data_registro")}
                          placeholder="DD/MM/YYYY"
                          className="w-28"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={row.nome_completo}
                          onChange={(e) => updateRow(row.id, "nome_completo", e.target.value)}
                          onFocus={() => handleCellFocus(idx, "nome_completo")}
                          className="min-w-[180px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          value={row.data_nascimento}
                          onChange={(e) => updateRow(row.id, "data_nascimento", e.target.value)}
                          onFocus={() => handleCellFocus(idx, "data_nascimento")}
                          placeholder="DD/MM/YYYY"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={row.carteirinha}
                          onChange={(e) => updateRow(row.id, "carteirinha", e.target.value)}
                          onFocus={() => handleCellFocus(idx, "carteirinha")}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={row.numero_gestacoes}
                          onChange={(e) => updateRow(row.id, "numero_gestacoes", e.target.value)}
                          onFocus={() => handleCellFocus(idx, "numero_gestacoes")}
                          className="w-16"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={row.numero_partos_cesareas}
                          onChange={(e) => updateRow(row.id, "numero_partos_cesareas", e.target.value)}
                          onFocus={() => handleCellFocus(idx, "numero_partos_cesareas")}
                          className="w-16"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={row.numero_partos_normais}
                          onChange={(e) => updateRow(row.id, "numero_partos_normais", e.target.value)}
                          onFocus={() => handleCellFocus(idx, "numero_partos_normais")}
                          className="w-16"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={row.numero_abortos}
                          onChange={(e) => updateRow(row.id, "numero_abortos", e.target.value)}
                          onFocus={() => handleCellFocus(idx, "numero_abortos")}
                          className="w-16"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={row.telefones}
                          onChange={(e) => updateRow(row.id, "telefones", e.target.value)}
                          onFocus={() => handleCellFocus(idx, "telefones")}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={row.procedimentos}
                          onChange={(e) => updateRow(row.id, "procedimentos", e.target.value)}
                          onFocus={() => handleCellFocus(idx, "procedimentos")}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={row.dum_status}
                          onChange={(e) => updateRow(row.id, "dum_status", e.target.value)}
                          onFocus={() => handleCellFocus(idx, "dum_status")}
                          placeholder="Sim - Confiavel / Incerta / Não sabe"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          value={row.data_dum}
                          onChange={(e) => updateRow(row.id, "data_dum", e.target.value)}
                          onFocus={() => handleCellFocus(idx, "data_dum")}
                          placeholder="DD/MM/YYYY"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          value={row.data_primeiro_usg}
                          onChange={(e) => updateRow(row.id, "data_primeiro_usg", e.target.value)}
                          onFocus={() => handleCellFocus(idx, "data_primeiro_usg")}
                          placeholder="DD/MM/YYYY"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max="42"
                          value={row.semanas_usg}
                          onChange={(e) => updateRow(row.id, "semanas_usg", e.target.value)}
                          onFocus={() => handleCellFocus(idx, "semanas_usg")}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max="6"
                          value={row.dias_usg}
                          onChange={(e) => updateRow(row.id, "dias_usg", e.target.value)}
                          onFocus={() => handleCellFocus(idx, "dias_usg")}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={row.usg_recente}
                          onChange={(e) => updateRow(row.id, "usg_recente", e.target.value)}
                          onFocus={() => handleCellFocus(idx, "usg_recente")}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={row.ig_pretendida}
                          onChange={(e) => updateRow(row.id, "ig_pretendida", e.target.value)}
                          onFocus={() => handleCellFocus(idx, "ig_pretendida")}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={row.indicacao_procedimento}
                          onChange={(e) => updateRow(row.id, "indicacao_procedimento", e.target.value)}
                          onFocus={() => handleCellFocus(idx, "indicacao_procedimento")}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={row.medicacao}
                          onChange={(e) => updateRow(row.id, "medicacao", e.target.value)}
                          onFocus={() => handleCellFocus(idx, "medicacao")}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={row.diagnosticos_maternos}
                          onChange={(e) => updateRow(row.id, "diagnosticos_maternos", e.target.value)}
                          onFocus={() => handleCellFocus(idx, "diagnosticos_maternos")}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={row.placenta_previa}
                          onChange={(e) => updateRow(row.id, "placenta_previa", e.target.value)}
                          onFocus={() => handleCellFocus(idx, "placenta_previa")}
                          placeholder="Sim / Não"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={row.diagnosticos_fetais}
                          onChange={(e) => updateRow(row.id, "diagnosticos_fetais", e.target.value)}
                          onFocus={() => handleCellFocus(idx, "diagnosticos_fetais")}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={row.historia_obstetrica}
                          onChange={(e) => updateRow(row.id, "historia_obstetrica", e.target.value)}
                          onFocus={() => handleCellFocus(idx, "historia_obstetrica")}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={row.necessidade_uti_materna}
                          onChange={(e) => updateRow(row.id, "necessidade_uti_materna", e.target.value)}
                          onFocus={() => handleCellFocus(idx, "necessidade_uti_materna")}
                          placeholder="Sim / Não"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={row.necessidade_reserva_sangue}
                          onChange={(e) => updateRow(row.id, "necessidade_reserva_sangue", e.target.value)}
                          onFocus={() => handleCellFocus(idx, "necessidade_reserva_sangue")}
                          placeholder="Sim / Não"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={row.maternidade}
                          onChange={(e) => updateRow(row.id, "maternidade", e.target.value)}
                          onFocus={() => handleCellFocus(idx, "maternidade")}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={row.medico_responsavel}
                          onChange={(e) => updateRow(row.id, "medico_responsavel", e.target.value)}
                          onFocus={() => handleCellFocus(idx, "medico_responsavel")}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="email"
                          value={row.email_paciente}
                          onChange={(e) => updateRow(row.id, "email_paciente", e.target.value)}
                          onFocus={() => handleCellFocus(idx, "email_paciente")}
                        />
                      </TableCell>
                      {/* IG na data do registro */}
                      <TableCell className="font-mono text-sm text-primary">{row.ig_no_registro || "-"}</TableCell>
                      <TableCell className="font-mono text-sm text-primary">{row.ig_ideal || "-"}</TableCell>
                      <TableCell className="font-mono text-sm">{row.data_ideal || "-"}</TableCell>
                      <TableCell>
                        {row.data_agendada && row.data_agendada !== "-" ? (
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-sm">{row.data_agendada}</span>
                            <Badge variant={row.status_agendamento === 'calculado' ? 'outline' : 'destructive'} className="text-xs">
                              {row.status_agendamento === 'calculado' ? 'Calc' : row.status_agendamento === 'needs_review' ? 'Rev' : 'Man'}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{row.ig_na_data_agendada || "-"}</TableCell>
                      <TableCell>
                        {row.intervalo_dias !== undefined && row.margem_protocolo !== undefined ? (
                          <Badge 
                            variant="outline" 
                            className={
                              getIntervaloColor(row.intervalo_dias, row.margem_protocolo) === 'green' 
                                ? 'bg-green-500/10 text-green-600 border-green-500/30' 
                                : getIntervaloColor(row.intervalo_dias, row.margem_protocolo) === 'yellow'
                                ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30'
                                : 'bg-red-500/10 text-red-600 border-red-500/30'
                            }
                          >
                            {row.intervalo_dias > 0 ? '+' : ''}{row.intervalo_dias}d
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {row.lead_time_dias !== undefined ? (
                          <Badge 
                            variant="outline" 
                            className={
                              row.lead_time_dias >= LEAD_TIME_MINIMO 
                                ? 'bg-green-500/10 text-green-600 border-green-500/30' 
                                : 'bg-red-500/10 text-red-600 border-red-500/30'
                            }
                          >
                            {row.lead_time_dias}d
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {row.motivo_calculo && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                  <Info className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-sm">
                                <div className="space-y-1 text-sm">
                                  <p><strong>Protocolo:</strong> {row.protocolo_aplicado || 'N/A'}</p>
                                  <p><strong>Margem:</strong> {row.margem_protocolo} dias</p>
                                  <p><strong>Cálculo:</strong> {row.motivo_calculo}</p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <ScrollBar orientation="vertical" />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
          </TooltipProvider>

          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Total: {rows.length} linhas{filterForaMargem ? ` (Exibindo ${displayRows.length} fora da margem)` : ''}</span>
            <span>
              Válidos: {rows.filter((r) => r.status === "valido").length} | Erros:{" "}
              {rows.filter((r) => r.status === "erro").length} | Revisão:{" "}
              {rows.filter((r) => r.status_agendamento === "needs_review").length} | Salvos:{" "}
              {rows.filter((r) => r.status === "salvo").length}
            </span>
          </div>
        </CardContent>
      </Card>
      
      {/* Modal de Correção de Datas */}
      {modalCorrecao && (
        <ModalCorrecaoDatas
          isOpen={modalCorrecao.isOpen}
          paciente={modalCorrecao.paciente}
          incoerencias={modalCorrecao.incoerencias}
          onCorrigir={handleCorrigirDatas}
          onManter={handleManterValores}
          onPular={handlePularPaciente}
          posicaoFila={{
            atual: filaRevisao.length > 0 ? 1 : 0,
            total: filaRevisao.length,
          }}
        />
      )}
    </div>
  );
}