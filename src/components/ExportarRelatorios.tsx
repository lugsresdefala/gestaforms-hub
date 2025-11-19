import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileSpreadsheet, FileText, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
interface ExportarRelatoriosProps {
  trigger?: React.ReactNode;
}
const ExportarRelatorios = ({
  trigger
}: ExportarRelatoriosProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formato, setFormato] = useState<'csv' | 'excel'>('csv');
  const [tipoRelatorio, setTipoRelatorio] = useState('agendamentos');
  const [dataInicio, setDataInicio] = useState<Date>();
  const [dataFim, setDataFim] = useState<Date>();
  const [incluirCancelados, setIncluirCancelados] = useState(false);
  const [incluirRejeitados, setIncluirRejeitados] = useState(false);
  const handleExport = async () => {
    if (!dataInicio || !dataFim) {
      toast.error('Selecione o período para exportação');
      return;
    }
    setLoading(true);
    try {
      let query = supabase.from('agendamentos_obst').select('*').gte('created_at', dataInicio.toISOString()).lte('created_at', dataFim.toISOString());

      // Filtros de status
      const statusFiltros = ['pendente', 'aprovado'];
      if (incluirCancelados) statusFiltros.push('cancelado');
      if (incluirRejeitados) statusFiltros.push('rejeitado');
      query = query.in('status', statusFiltros);
      const {
        data,
        error
      } = await query;
      if (error) throw error;
      if (!data || data.length === 0) {
        toast.error('Nenhum registro encontrado no período selecionado');
        return;
      }
      if (formato === 'csv') {
        exportarCSV(data);
      } else {
        exportarExcel(data);
      }
      toast.success(`Relatório exportado com sucesso! ${data.length} registros`);
      setOpen(false);
    } catch (error: any) {
      toast.error('Erro ao exportar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  const exportarCSV = (data: any[]) => {
    const headers = ['ID', 'Nome Completo', 'Carteirinha', 'Data Nascimento', 'Telefones', 'Email', 'Maternidade', 'Centro Clínico', 'Médico Responsável', 'Status', 'Data Agendamento', 'IG Calculada', 'IG Pretendida', 'Procedimentos', 'Diagnósticos Maternos', 'Diagnósticos Fetais', 'DUM', 'Data DUM', 'Semanas USG', 'Dias USG', 'USG Recente', 'Número Gestações', 'Partos Cesáreas', 'Partos Normais', 'Abortos', 'História Obstétrica', 'Indicação', 'Medicação', 'Placenta Prévia', 'UTI Materna', 'Reserva Sangue', 'Observações', 'Criado em', 'Aprovado em', 'Observações Aprovação'];
    const rows = data.map(item => [item.id, item.nome_completo, item.carteirinha, item.data_nascimento, item.telefones, item.email_paciente, item.maternidade, item.centro_clinico, item.medico_responsavel, item.status, item.data_agendamento_calculada || '', item.idade_gestacional_calculada || '', item.ig_pretendida, Array.isArray(item.procedimentos) ? item.procedimentos.join('; ') : '', item.diagnosticos_maternos || '', item.diagnosticos_fetais || '', item.dum_status, item.data_dum || '', item.semanas_usg, item.dias_usg, item.usg_recente, item.numero_gestacoes, item.numero_partos_cesareas, item.numero_partos_normais, item.numero_abortos, item.historia_obstetrica || '', item.indicacao_procedimento, item.medicacao || '', item.placenta_previa || '', item.necessidade_uti_materna || '', item.necessidade_reserva_sangue || '', item.observacoes_agendamento || '', format(new Date(item.created_at), 'dd/MM/yyyy HH:mm', {
      locale: ptBR
    }), item.aprovado_em ? format(new Date(item.aprovado_em), 'dd/MM/yyyy HH:mm', {
      locale: ptBR
    }) : '', item.observacoes_aprovacao || ''].map(cell => `"${String(cell).replace(/"/g, '""')}"`));
    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], {
      type: 'text/csv;charset=utf-8;'
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio_agendamentos_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.csv`;
    link.click();
  };
  const exportarExcel = (data: any[]) => {
    // Para Excel, usamos o mesmo formato CSV mas com extensão diferente
    // Em produção, seria ideal usar uma biblioteca como SheetJS (xlsx)
    exportarCSV(data);
    toast.info('Formato Excel será implementado em breve. Exportado como CSV.');
  };
  return <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button className="gap-2 font-bold">
            <Download className="h-4 w-4" />
            Exportar Relatórios
          </Button>}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Exportar Relatório
          </DialogTitle>
          <DialogDescription>
            Configure os parâmetros de exportação do relatório
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Tipo de Relatório */}
          <div className="space-y-2">
            <Label>Tipo de Relatório</Label>
            <Select value={tipoRelatorio} onValueChange={setTipoRelatorio}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="agendamentos">Agendamentos</SelectItem>
                <SelectItem value="estatisticas">Estatísticas (em breve)</SelectItem>
                <SelectItem value="ocupacao">Ocupação (em breve)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Formato */}
          <div className="space-y-2">
            <Label>Formato de Exportação</Label>
            <div className="grid grid-cols-2 gap-4">
              <Card className={cn("cursor-pointer transition-all hover:border-primary", formato === 'csv' && "border-primary bg-primary/5")} onClick={() => setFormato('csv')}>
                <CardContent className="pt-6 text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="font-medium">CSV</p>
                  <p className="text-xs text-muted-foreground">Excel, Numbers, etc</p>
                </CardContent>
              </Card>
              <Card className={cn("cursor-pointer transition-all hover:border-primary opacity-50", formato === 'excel' && "border-primary bg-primary/5")} onClick={() => toast.info('Excel nativo em breve')}>
                <CardContent className="pt-6 text-center">
                  <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="font-medium">Excel</p>
                  <p className="text-xs text-muted-foreground">Em breve</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Período */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dataInicio && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataInicio ? format(dataInicio, "PPP", {
                    locale: ptBR
                  }) : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dataInicio} onSelect={setDataInicio} initialFocus locale={ptBR} />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dataFim && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataFim ? format(dataFim, "PPP", {
                    locale: ptBR
                  }) : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dataFim} onSelect={setDataFim} initialFocus locale={ptBR} />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Filtros */}
          <div className="space-y-3">
            <Label>Incluir no Relatório</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="cancelados" checked={incluirCancelados} onCheckedChange={checked => setIncluirCancelados(checked as boolean)} />
                <label htmlFor="cancelados" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Agendamentos cancelados
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="rejeitados" checked={incluirRejeitados} onCheckedChange={checked => setIncluirRejeitados(checked as boolean)} />
                <label htmlFor="rejeitados" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Agendamentos rejeitados
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={loading} className="gap-2">
            {loading ? <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exportando...
              </> : <>
                <Download className="h-4 w-4" />
                Exportar
              </>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>;
};
export default ExportarRelatorios;