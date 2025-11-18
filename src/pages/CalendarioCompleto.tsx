import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { supabase } from '@/lib/supabase';
import { Calendar as CalendarIcon, Users, AlertCircle, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { format, startOfWeek, endOfWeek, addWeeks, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Appointment {
  nome_completo: string;
  idade_gestacional_calculada: string;
  procedimentos: string[];
  status: string;
}

interface DayOccupation {
  date: string;
  weekDay: string;
  total: number;
  available: number;
  percentage: number;
  appointments: Appointment[];
  urgentes: number;
}

interface MaternityCapacity {
  maternidade: string;
  vagas_dia_util: number;
  vagas_sabado: number;
  vagas_domingo: number;
  vagas_semana_max: number;
}

interface WeekOccupation {
  maternidade: string;
  dias: {
    data: string;
    diaSemana: string;
    total: number;
    capacidade: number;
    urgentes: number;
  }[];
  totalSemana: number;
  capacidadeSemana: number;
}

export default function CalendarioCompleto() {
  const currentYear = new Date().getFullYear();
  const [visualizacao, setVisualizacao] = useState<'mensal' | 'semanal'>('mensal');
  const [selectedMaternidade, setSelectedMaternidade] = useState<string>('Cruzeiro');
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<string>('11');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [occupation, setOccupation] = useState<DayOccupation[]>([]);
  const [weekOccupations, setWeekOccupations] = useState<WeekOccupation[]>([]);
  const [capacities, setCapacities] = useState<MaternityCapacity[]>([]);
  const [capacity, setCapacity] = useState<MaternityCapacity | null>(null);
  const [loading, setLoading] = useState(true);

  const maternidades = ['Cruzeiro', 'Guarulhos', 'Notrecare', 'Salvalus', 'Rosário'];
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  const months = [
    { value: '1', label: 'Janeiro' },
    { value: '2', label: 'Fevereiro' },
    { value: '3', label: 'Março' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Maio' },
    { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' }
  ];

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  useEffect(() => {
    loadCapacities();
  }, []);

  useEffect(() => {
    if (visualizacao === 'mensal') {
      loadMonthlyOccupation();
    } else {
      loadWeeklyOccupation();
    }
  }, [selectedMaternidade, selectedMonth, selectedYear, selectedDate, visualizacao]);

  const loadCapacities = async () => {
    const { data: caps } = await supabase
      .from('capacidade_maternidades')
      .select('*')
      .order('maternidade');
    
    if (caps) {
      setCapacities(caps);
    }
  };

  const loadMonthlyOccupation = async () => {
    setLoading(true);
    try {
      const { data: capacityData } = await supabase
        .from('capacidade_maternidades')
        .select('*')
        .eq('maternidade', selectedMaternidade)
        .single();

      setCapacity(capacityData);

      const monthInt = parseInt(selectedMonth) - 1;
      const startDate = new Date(selectedYear, monthInt, 1);
      const endDate = new Date(selectedYear, monthInt + 1, 0);

      const { data: appointments } = await supabase
        .from('agendamentos_obst')
        .select('data_agendamento_calculada, nome_completo, idade_gestacional_calculada, procedimentos, status, created_at')
        .eq('maternidade', selectedMaternidade)
        .gte('data_agendamento_calculada', startDate.toISOString().split('T')[0])
        .lte('data_agendamento_calculada', endDate.toISOString().split('T')[0])
        .neq('status', 'rejeitado');

      const appointmentsByDay: { [key: string]: Appointment[] } = {};
      const urgentesByDay: { [key: string]: number } = {};

      appointments?.forEach(apt => {
        if (apt.data_agendamento_calculada) {
          if (!appointmentsByDay[apt.data_agendamento_calculada]) {
            appointmentsByDay[apt.data_agendamento_calculada] = [];
            urgentesByDay[apt.data_agendamento_calculada] = 0;
          }
          appointmentsByDay[apt.data_agendamento_calculada].push({
            nome_completo: apt.nome_completo,
            idade_gestacional_calculada: apt.idade_gestacional_calculada,
            procedimentos: apt.procedimentos,
            status: apt.status
          });

          const diasAteAgendamento = Math.floor(
            (parseISO(apt.data_agendamento_calculada as string).getTime() - new Date(apt.created_at).getTime()) / 
            (1000 * 60 * 60 * 24)
          );
          if (diasAteAgendamento <= 7) {
            urgentesByDay[apt.data_agendamento_calculada]++;
          }
        }
      });

      const daysInMonth = endDate.getDate();
      const occupationData: DayOccupation[] = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(selectedYear, monthInt, day);
        const dateStr = date.toISOString().split('T')[0];
        const weekDayIndex = date.getDay();
        const dayAppointments = appointmentsByDay[dateStr] || [];
        const total = dayAppointments.length;
        const urgentes = urgentesByDay[dateStr] || 0;
        
        let maxVagas = 10;
        if (capacityData) {
          if (weekDayIndex === 0) {
            maxVagas = capacityData.vagas_domingo;
          } else if (weekDayIndex === 6) {
            maxVagas = capacityData.vagas_sabado;
          } else {
            maxVagas = capacityData.vagas_dia_util;
          }
        }
        
        const available = Math.max(0, maxVagas - total);
        const percentage = (total / maxVagas) * 100;

        occupationData.push({
          date: dateStr,
          weekDay: weekDays[weekDayIndex],
          total,
          available,
          percentage,
          appointments: dayAppointments,
          urgentes
        });
      }

      setOccupation(occupationData);
    } catch (error) {
      console.error('Error loading occupation:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWeeklyOccupation = async () => {
    setLoading(true);
    try {
      const inicioSemana = startOfWeek(selectedDate, { weekStartsOn: 0 });
      const fimSemana = endOfWeek(selectedDate, { weekStartsOn: 0 });
      const inicioStr = format(inicioSemana, 'yyyy-MM-dd');
      const fimStr = format(fimSemana, 'yyyy-MM-dd');

      const { data: agendamentos } = await supabase
        .from('agendamentos_obst')
        .select('maternidade, data_agendamento_calculada, created_at')
        .gte('data_agendamento_calculada', inicioStr)
        .lte('data_agendamento_calculada', fimStr)
        .neq('status', 'rejeitado');

      const weekOccData: WeekOccupation[] = [];

      capacities.forEach(cap => {
        const dias = [];
        let totalSemana = 0;

        for (let i = 0; i < 7; i++) {
          const dia = new Date(inicioSemana);
          dia.setDate(dia.getDate() + i);
          const dataStr = format(dia, 'yyyy-MM-dd');
          
          const agendamentosDia = agendamentos?.filter(
            a => a.maternidade === cap.maternidade && a.data_agendamento_calculada === dataStr
          ) || [];

          const total = agendamentosDia.length;
          totalSemana += total;

          const urgentes = agendamentosDia.filter(a => {
            const diasAte = Math.floor(
              (parseISO(a.data_agendamento_calculada as string).getTime() - new Date(a.created_at).getTime()) / 
              (1000 * 60 * 60 * 24)
            );
            return diasAte <= 7;
          }).length;

          const diaSemana = dia.getDay();
          let capacidade = cap.vagas_dia_util;
          if (diaSemana === 0) capacidade = cap.vagas_domingo;
          else if (diaSemana === 6) capacidade = cap.vagas_sabado;

          dias.push({
            data: dataStr,
            diaSemana: format(dia, 'EEE', { locale: ptBR }),
            total,
            capacidade,
            urgentes
          });
        }

        weekOccData.push({
          maternidade: cap.maternidade,
          dias,
          totalSemana,
          capacidadeSemana: cap.vagas_semana_max
        });
      });

      setWeekOccupations(weekOccData);
    } catch (error) {
      console.error('Error loading weekly occupation:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOccupationColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getOccupationBadge = (percentage: number) => {
    if (percentage >= 90) return <Badge variant="destructive">Lotado</Badge>;
    if (percentage >= 70) return <Badge className="bg-yellow-500">Ocupado</Badge>;
    return <Badge className="bg-green-500">Disponível</Badge>;
  };

  const getStatusColor = (total: number, max: number) => {
    const percentual = (total / max) * 100;
    if (percentual >= 100) return 'bg-destructive text-destructive-foreground';
    if (percentual >= 80) return 'bg-secondary text-secondary-foreground';
    return 'bg-muted';
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Sistema de Gestão de Ocupação</h1>
        <p className="text-muted-foreground">Visualização completa e inteligente das maternidades</p>
      </div>

      <Tabs value={visualizacao} onValueChange={(v) => setVisualizacao(v as 'mensal' | 'semanal')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="mensal">Visão Mensal Detalhada</TabsTrigger>
          <TabsTrigger value="semanal">Visão Semanal Comparativa</TabsTrigger>
        </TabsList>

        <TabsContent value="mensal" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Maternidade</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedMaternidade} onValueChange={setSelectedMaternidade}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {maternidades.map(mat => (
                      <SelectItem key={mat} value={mat}>{mat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ano</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map(month => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>

          {capacity && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Capacidade Configurada - {selectedMaternidade}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">Dias úteis</p>
                  <p className="text-2xl font-bold">{capacity.vagas_dia_util}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sábados</p>
                  <p className="text-2xl font-bold">{capacity.vagas_sabado}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Domingos</p>
                  <p className="text-2xl font-bold">{capacity.vagas_domingo}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Ocupação Diária Completa
              </CardTitle>
              <CardDescription>
                {selectedMaternidade} - {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {occupation.map(day => (
                    <Card key={day.date} className="hover:shadow-md transition-shadow">
                      <CardContent className="py-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="text-center min-w-[60px]">
                                <p className="text-sm text-muted-foreground">{day.weekDay}</p>
                                <p className="text-xl font-bold">
                                  {new Date(day.date + 'T00:00:00').getDate()}
                                </p>
                              </div>
                              <div>
                                <p className="font-medium">
                                  {day.total} agendamento{day.total !== 1 ? 's' : ''}
                                  {day.urgentes > 0 && (
                                    <Badge variant="destructive" className="ml-2 text-xs">
                                      {day.urgentes} urgente{day.urgentes !== 1 ? 's' : ''}
                                    </Badge>
                                  )}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {day.available} vaga{day.available !== 1 ? 's' : ''} disponível
                                  {day.available !== 1 ? 'is' : ''}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="w-32 bg-gray-200 rounded-full h-2.5">
                                <div
                                  className={`h-2.5 rounded-full ${getOccupationColor(day.percentage)}`}
                                  style={{ width: `${Math.min(100, day.percentage)}%` }}
                                />
                              </div>
                              {getOccupationBadge(day.percentage)}
                            </div>
                          </div>
                          
                          {day.appointments.length > 0 && (
                            <div className="pl-[76px] space-y-2 border-t pt-2">
                              {day.appointments.map((apt, idx) => (
                                <div key={idx} className="text-sm flex items-center justify-between bg-muted/50 p-2 rounded">
                                  <div className="flex-1">
                                    <span className="font-medium">{apt.nome_completo}</span>
                                    <span className="text-muted-foreground ml-2">
                                      IG: {apt.idade_gestacional_calculada}
                                    </span>
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      {apt.status}
                                    </Badge>
                                  </div>
                                  <div className="flex gap-1">
                                    {apt.procedimentos.slice(0, 2).map((proc, i) => (
                                      <Badge key={i} variant="secondary" className="text-xs">{proc}</Badge>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="semanal" className="space-y-6">
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
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                weekOccupations.map((wk) => {
                  const percentualSemana = (wk.totalSemana / wk.capacidadeSemana) * 100;

                  return (
                    <Card key={wk.maternidade}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>{wk.maternidade}</CardTitle>
                            <CardDescription>
                              {wk.totalSemana}/{wk.capacidadeSemana} vagas ocupadas na semana
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
                            <span>{wk.totalSemana}/{wk.capacidadeSemana}</span>
                          </div>
                          <Progress value={percentualSemana} className="h-2" />
                        </div>

                        <div className="grid grid-cols-7 gap-2">
                          {wk.dias.map((dia, i) => (
                            <div key={i} className="text-center space-y-1">
                              <p className="text-xs text-muted-foreground">{dia.diaSemana}</p>
                              <div
                                className={`rounded-lg p-2 text-xs font-semibold ${getStatusColor(dia.total, dia.capacidade)}`}
                              >
                                {dia.total}/{dia.capacidade}
                              </div>
                              {dia.urgentes > 0 && (
                                <p className="text-xs text-destructive">⚠️ {dia.urgentes}</p>
                              )}
                            </div>
                          ))}
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
                })
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
