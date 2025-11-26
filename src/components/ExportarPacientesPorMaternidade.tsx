import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FileSpreadsheet,
  Calendar as CalendarIcon,
  Loader2,
  Building2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import * as XLSX from 'xlsx';
import {
  REPORT_COLUMNS,
  SUMMARY_COLUMNS,
  formatDateBR,
  formatDateTimeBR,
  generateFilename,
  sanitizeSheetName,
  formatProcedimentos,
  getStatusLabel,
} from '@/lib/excelExportStyles';

interface ExportarPacientesPorMaternidadeProps {
  trigger?: React.ReactNode;
}

interface AgendamentoRow {
  id: string;
  nome_completo: string;
  carteirinha: string;
  data_nascimento: string;
  telefones: string;
  email_paciente: string;
  maternidade: string;
  centro_clinico: string;
  medico_responsavel: string;
  procedimentos: string[];
  data_agendamento_calculada: string | null;
  idade_gestacional_calculada: string | null;
  ig_pretendida: string;
  diagnosticos_maternos: string | null;
  diagnosticos_fetais: string | null;
  status: string;
  observacoes_agendamento: string | null;
}

interface MaternidadeSummary {
  maternidade: string;
  total: number;
  pendentes: number;
  aprovados: number;
  rejeitados: number;
}

const ExportarPacientesPorMaternidade = ({
  trigger,
}: ExportarPacientesPorMaternidadeProps) => {
  const { isAdmin, isAdminMed } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dataInicio, setDataInicio] = useState<Date>();
  const [dataFim, setDataFim] = useState<Date>();
  const [incluirPendentes, setIncluirPendentes] = useState(true);
  const [incluirAprovados, setIncluirAprovados] = useState(true);
  const [incluirRejeitados, setIncluirRejeitados] = useState(false);

  // Check if user has access
  if (!isAdmin() && !isAdminMed()) {
    return null;
  }

  const handleExport = async () => {
    if (!dataInicio || !dataFim) {
      toast.error('Selecione o período para exportação');
      return;
    }

    if (dataInicio > dataFim) {
      toast.error('A data de início deve ser anterior à data de fim');
      return;
    }

    const selectedStatuses: string[] = [];
    if (incluirPendentes) selectedStatuses.push('pendente');
    if (incluirAprovados) selectedStatuses.push('aprovado');
    if (incluirRejeitados) selectedStatuses.push('rejeitado');

    if (selectedStatuses.length === 0) {
      toast.error('Selecione pelo menos um status para exportar');
      return;
    }

    setLoading(true);

    try {
      // Format dates for query
      const dataInicioStr = format(dataInicio, 'yyyy-MM-dd');
      const dataFimStr = format(dataFim, 'yyyy-MM-dd');

      // Fetch data from database
      const { data, error } = await supabase
        .from('agendamentos_obst')
        .select('*')
        .gte('data_agendamento_calculada', dataInicioStr)
        .lte('data_agendamento_calculada', dataFimStr)
        .in('status', selectedStatuses)
        .order('data_agendamento_calculada', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast.error('Nenhum registro encontrado no período selecionado');
        setLoading(false);
        return;
      }

      // Group by maternidade
      const groupedByMaternidade = data.reduce((acc, patient) => {
        const mat = patient.maternidade || 'Sem Maternidade';
        if (!acc[mat]) acc[mat] = [];
        acc[mat].push(patient as AgendamentoRow);
        return acc;
      }, {} as Record<string, AgendamentoRow[]>);

      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Calculate summary data
      const summaryData: MaternidadeSummary[] = Object.entries(groupedByMaternidade).map(
        ([maternidade, patients]) => ({
          maternidade,
          total: patients.length,
          pendentes: patients.filter((p) => p.status === 'pendente').length,
          aprovados: patients.filter((p) => p.status === 'aprovado').length,
          rejeitados: patients.filter((p) => p.status === 'rejeitado').length,
        })
      );

      // Create Summary sheet first
      const summarySheet = createSummarySheet(
        summaryData,
        dataInicioStr,
        dataFimStr
      );
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo Geral');

      // Create one sheet per maternidade
      Object.entries(groupedByMaternidade).forEach(([maternidade, patients]) => {
        const sheet = createMaternidadeSheet(
          maternidade,
          patients,
          dataInicioStr,
          dataFimStr
        );
        const sheetName = sanitizeSheetName(maternidade);
        XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
      });

      // Generate filename and save
      const filename = generateFilename();
      XLSX.writeFile(workbook, filename);

      toast.success(`Relatório exportado com sucesso! ${data.length} registros`);
      setOpen(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error('Erro ao exportar: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createSummarySheet = (
    summaryData: MaternidadeSummary[],
    dataInicioStr: string,
    dataFimStr: string
  ): XLSX.WorkSheet => {
    const now = new Date();
    const aoa: (string | number)[][] = [];

    // Row 1: Company name
    aoa.push(['HAPVIDA NOTREDAME INTERMÉDICA']);
    // Row 2: Report title
    aoa.push(['RELATÓRIO DE PACIENTES - AGENDAMENTOS OBSTÉTRICOS']);
    // Row 3: Empty
    aoa.push([]);
    // Row 4: Summary title
    aoa.push(['RESUMO POR MATERNIDADE']);
    // Row 5: Period info
    aoa.push([
      `Período: ${formatDateBR(dataInicioStr)} a ${formatDateBR(dataFimStr)}`,
      '',
      '',
      '',
      `Gerado em: ${formatDateTimeBR(now)}`,
    ]);
    // Row 6: Empty
    aoa.push([]);
    // Row 7: Table headers
    aoa.push(SUMMARY_COLUMNS.map((col) => col.header));

    // Data rows
    summaryData.forEach((row) => {
      aoa.push([
        row.maternidade,
        row.total,
        row.pendentes,
        row.aprovados,
        row.rejeitados,
      ]);
    });

    // Total row
    const totalGeral = summaryData.reduce((sum, r) => sum + r.total, 0);
    const totalPendentes = summaryData.reduce((sum, r) => sum + r.pendentes, 0);
    const totalAprovados = summaryData.reduce((sum, r) => sum + r.aprovados, 0);
    const totalRejeitados = summaryData.reduce((sum, r) => sum + r.rejeitados, 0);
    aoa.push([]);
    aoa.push([
      'TOTAL GERAL',
      totalGeral,
      totalPendentes,
      totalAprovados,
      totalRejeitados,
    ]);
    aoa.push([]);
    aoa.push([`Relatório gerado em: ${formatDateTimeBR(now)}`]);

    const sheet = XLSX.utils.aoa_to_sheet(aoa);

    // Set column widths
    sheet['!cols'] = SUMMARY_COLUMNS.map((col) => ({ wch: col.width }));

    // Merge cells for title rows
    sheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // Row 1
      { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }, // Row 2
      { s: { r: 3, c: 0 }, e: { r: 3, c: 4 } }, // Row 4
    ];

    return sheet;
  };

  const createMaternidadeSheet = (
    maternidade: string,
    patients: AgendamentoRow[],
    dataInicioStr: string,
    dataFimStr: string
  ): XLSX.WorkSheet => {
    const now = new Date();
    const aoa: (string | number)[][] = [];
    const numCols = REPORT_COLUMNS.length;

    // Row 1: Company name
    aoa.push(['HAPVIDA NOTREDAME INTERMÉDICA']);
    // Row 2: Report title
    aoa.push(['RELATÓRIO DE PACIENTES - AGENDAMENTOS OBSTÉTRICOS']);
    // Row 3: Empty
    aoa.push([]);
    // Row 4: Maternidade name
    aoa.push([`Maternidade: ${maternidade}`]);
    // Row 5: Period and generation info
    const row5 = new Array(numCols).fill('');
    row5[0] = `Período: ${formatDateBR(dataInicioStr)} a ${formatDateBR(dataFimStr)}`;
    row5[Math.floor(numCols / 2)] = `Gerado em: ${formatDateTimeBR(now)}`;
    aoa.push(row5);
    // Row 6: Empty separator
    aoa.push([]);
    // Row 7: Table headers
    aoa.push(REPORT_COLUMNS.map((col) => col.header));

    // Data rows
    patients.forEach((patient) => {
      aoa.push([
        formatDateBR(patient.data_agendamento_calculada),
        patient.nome_completo || '',
        patient.carteirinha || '',
        formatDateBR(patient.data_nascimento),
        patient.telefones || '',
        patient.email_paciente || '',
        formatProcedimentos(patient.procedimentos),
        patient.medico_responsavel || '',
        patient.centro_clinico || '',
        patient.idade_gestacional_calculada || '',
        patient.ig_pretendida || '',
        patient.diagnosticos_maternos || '',
        patient.diagnosticos_fetais || '',
        getStatusLabel(patient.status),
        patient.observacoes_agendamento || '',
      ]);
    });

    // Footer rows
    aoa.push([]);
    aoa.push([`Total de Pacientes: ${patients.length}`]);

    const sheet = XLSX.utils.aoa_to_sheet(aoa);

    // Set column widths
    sheet['!cols'] = REPORT_COLUMNS.map((col) => ({ wch: col.width }));

    // Merge cells for header rows
    sheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: numCols - 1 } }, // Row 1
      { s: { r: 1, c: 0 }, e: { r: 1, c: numCols - 1 } }, // Row 2
      { s: { r: 3, c: 0 }, e: { r: 3, c: numCols - 1 } }, // Row 4
    ];

    return sheet;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2 font-bold">
            <FileSpreadsheet className="h-4 w-4" />
            Exportar por Maternidade
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Exportar Relatório por Maternidade
          </DialogTitle>
          <DialogDescription>
            Exportar pacientes organizados por maternidade em formato Excel
            profissional
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Date Range Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dataInicio && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataInicio
                      ? format(dataInicio, 'PPP', { locale: ptBR })
                      : 'Selecione'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dataInicio}
                    onSelect={setDataInicio}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dataFim && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataFim
                      ? format(dataFim, 'PPP', { locale: ptBR })
                      : 'Selecione'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dataFim}
                    onSelect={setDataFim}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Status Filters */}
          <div className="space-y-3">
            <Label>Status a Incluir</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pendentes"
                  checked={incluirPendentes}
                  onCheckedChange={(checked) =>
                    setIncluirPendentes(checked as boolean)
                  }
                />
                <label
                  htmlFor="pendentes"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Pendentes
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="aprovados"
                  checked={incluirAprovados}
                  onCheckedChange={(checked) =>
                    setIncluirAprovados(checked as boolean)
                  }
                />
                <label
                  htmlFor="aprovados"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Aprovados
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rejeitados"
                  checked={incluirRejeitados}
                  onCheckedChange={(checked) =>
                    setIncluirRejeitados(checked as boolean)
                  }
                />
                <label
                  htmlFor="rejeitados"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Rejeitados
                </label>
              </div>
            </div>
          </div>

          {/* Info box */}
          <div className="rounded-lg bg-muted p-4 text-sm">
            <p className="font-medium mb-2">O relatório irá conter:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Uma aba &quot;Resumo Geral&quot; com totais por maternidade</li>
              <li>Uma aba separada para cada maternidade</li>
              <li>Dados organizados por data de agendamento</li>
              <li>Formatação profissional com cores corporativas</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={loading} className="gap-2">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <FileSpreadsheet className="h-4 w-4" />
                Exportar Excel
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportarPacientesPorMaternidade;
