import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfWeek, endOfWeek, addWeeks, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Progress } from '@/components/ui/progress';

interface OcupacaoDia {
  data: string;
  total: number;
  urgentes: number;
}

interface CapacidadeMaternidade {
  maternidade: string;
  vagas_dia_max: number;
  vagas_dia_util: number;
  vagas_sabado: number;
  vagas_domingo: number;
  vagas_semana_max: number;
}

const OcupacaoMaternidades = () => {
  const [capacidades, setCapacidades] = useState<CapacidadeMaternidade[]>([]);
  const [ocupacoes, setOcupacoes] = useState<Record<string, OcupacaoDia[]>>({});
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);

    // Buscar capacidades
    const { data: caps } = await supabase
      .from('capacidade_maternidades')
      .select('*')
      .order('maternidade');

    if (caps) {
      setCapacidades(caps);
    }

    // Buscar ocupações da semana
    const inicioSemana = startOfWeek(selectedDate, { weekStartsOn: 0 });
    const fimSemana = endOfWeek(selectedDate, { weekStartsOn: 0 });
    const inicioStr = format(inicioSemana, 'yyyy-MM-dd');
    const fimStr = format(fimSemana, 'yyyy-MM-dd');

    const { data: agendamentos } = await supabase
      .from('agendamentos_obst')
      .select('maternidade, data_agendamento_calculada, created_at, status')
      .gte('data_agendamento_calculada', inicioStr)
      .lte('data_agendamento_calculada', fimStr)
      .neq('status', 'rejeitado');

    // Agrupar por maternidade e data
    const ocupacoesPorMaternidade: Record<string, OcupacaoDia[]> = {};

    caps?.forEach(cap => {
      ocupacoesPorMaternidade[cap.maternidade] = [];
    });

    agendamentos?.forEach(ag => {
      if (!ocupacoesPorMaternidade[ag.maternidade]) {
        ocupacoesPorMaternidade[ag.maternidade] = [];
      }

      const existente = ocupacoesPorMaternidade[ag.maternidade].find(
        o => o.data === ag.data_agendamento_calculada
      );

      const diasAteAgendamento = Math.floor(
        (parseISO(ag.data_agendamento_calculada as string).getTime() - new Date(ag.created_at).getTime()) / 
        (1000 * 60 * 60 * 24)
      );
      const isUrgente = ag.status === 'pendente' && diasAteAgendamento <= 7;

      if (existente) {
        existente.total += 1;
        if (isUrgente) existente.urgentes += 1;
      } else {
        ocupacoesPorMaternidade[ag.maternidade].push({
          data: ag.data_agendamento_calculada as string,
          total: 1,
          urgentes: isUrgente ? 1 : 0,
        });
      }
    });

    setOcupacoes(ocupacoesPorMaternidade);
    setLoading(false);
  };

  const getCapacidadeDia = (cap: CapacidadeMaternidade, dia: Date) => {
    const diaSemana = dia.getDay(); // 0 = domingo, 6 = sábado
    if (diaSemana === 0) return cap.vagas_domingo;
    if (diaSemana === 6) return cap.vagas_sabado;
    return cap.vagas_dia_util;
  };

  const getOcupacaoStatus = (total: number, max: number) => {
    const percentual = (total / max) * 100;
    if (percentual >= 100) return { color: 'destructive', label: 'Lotado' };
    if (percentual >= 80) return { color: 'warning', label: 'Quase lotado' };
    return { color: 'default', label: 'Disponível' };
  };

  const getOcupacaoSemana = (maternidade: string) => {
    const ocupacao = ocupacoes[maternidade] || [];
    return ocupacao.reduce((sum, o) => sum + o.total, 0);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ocupação das Maternidades</h1>
        <p className="text-muted-foreground">
          Visualize a disponibilidade e ocupação de cada maternidade
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Selecionar Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={ptBR}
              className="rounded-md border"
            />
            <div className="mt-4 space-y-2 text-sm">
              <p className="font-semibold">Semana selecionada:</p>
              <p>
                {format(startOfWeek(selectedDate, { weekStartsOn: 0 }), "dd 'de' MMMM", { locale: ptBR })} -{' '}
                {format(endOfWeek(selectedDate, { weekStartsOn: 0 }), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          {capacidades.map((cap) => {
            const ocupacaoSemana = getOcupacaoSemana(cap.maternidade);
            const percentualSemana = (ocupacaoSemana / cap.vagas_semana_max) * 100;

            return (
              <Card key={cap.maternidade}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{cap.maternidade}</CardTitle>
                      <CardDescription>
                        {ocupacaoSemana}/{cap.vagas_semana_max} vagas ocupadas na semana
                      </CardDescription>
                    </div>
                    <Badge variant={percentualSemana >= 90 ? 'destructive' : percentualSemana >= 70 ? 'secondary' : 'default'}>
                      {percentualSemana.toFixed(0)}% ocupado
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Ocupação Semanal</span>
                      <span>{ocupacaoSemana}/{cap.vagas_semana_max}</span>
                    </div>
                    <Progress value={percentualSemana} className="h-2" />
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 7 }).map((_, i) => {
                      const dia = addWeeks(startOfWeek(selectedDate, { weekStartsOn: 0 }), 0);
                      dia.setDate(dia.getDate() + i);
                      const dataStr = format(dia, 'yyyy-MM-dd');
                      const ocupacaoDia = ocupacoes[cap.maternidade]?.find(o => o.data === dataStr);
                      const total = ocupacaoDia?.total || 0;
                      const capacidadeDia = getCapacidadeDia(cap, dia);
                      const status = getOcupacaoStatus(total, capacidadeDia);

                      return (
                        <div key={i} className="text-center space-y-1">
                          <p className="text-xs text-muted-foreground">
                            {format(dia, 'EEE', { locale: ptBR })}
                          </p>
                          <div
                            className={`rounded-lg p-2 text-xs font-semibold ${
                              status.color === 'destructive'
                                ? 'bg-destructive text-destructive-foreground'
                                : status.color === 'warning'
                                ? 'bg-secondary text-secondary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            {total}/{capacidadeDia}
                          </div>
                          {ocupacaoDia && ocupacaoDia.urgentes > 0 && (
                            <p className="text-xs text-destructive">⚠️ {ocupacaoDia.urgentes} urgente(s)</p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-muted" />
                      <span>Disponível</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-secondary" />
                      <span>Quase lotado</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-destructive" />
                      <span>Lotado</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OcupacaoMaternidades;
