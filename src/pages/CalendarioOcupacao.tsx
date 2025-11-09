import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { Calendar, Users, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface DayOccupation {
  date: string;
  weekDay: string;
  total: number;
  available: number;
  percentage: number;
}

interface MaternityCapacity {
  vagas_dia_max: number;
  vagas_emergencia: number;
}

export default function CalendarioOcupacao() {
  const [selectedMaternidade, setSelectedMaternidade] = useState<string>('Cruzeiro');
  const [selectedMonth, setSelectedMonth] = useState<string>('11'); // November
  const [occupation, setOccupation] = useState<DayOccupation[]>([]);
  const [capacity, setCapacity] = useState<MaternityCapacity | null>(null);
  const [loading, setLoading] = useState(true);

  const maternidades = ['Cruzeiro', 'Guarulhos', 'Notrecare', 'Salvalus', 'Rosário'];
  const months = [
    { value: '11', label: 'Novembro 2024' },
    { value: '12', label: 'Dezembro 2024' }
  ];

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  useEffect(() => {
    loadOccupation();
  }, [selectedMaternidade, selectedMonth]);

  const loadOccupation = async () => {
    setLoading(true);
    try {
      // Load capacity
      const { data: capacityData } = await supabase
        .from('capacidade_maternidades')
        .select('vagas_dia_max, vagas_emergencia')
        .eq('maternidade', selectedMaternidade)
        .single();

      setCapacity(capacityData);

      // Load appointments
      const monthInt = parseInt(selectedMonth);
      const year = 2024;
      const startDate = new Date(year, monthInt, 1);
      const endDate = new Date(year, monthInt + 1, 0);

      const { data: appointments } = await supabase
        .from('agendamentos_obst')
        .select('data_agendamento_calculada')
        .eq('maternidade', selectedMaternidade)
        .gte('data_agendamento_calculada', startDate.toISOString().split('T')[0])
        .lte('data_agendamento_calculada', endDate.toISOString().split('T')[0]);

      // Count appointments per day
      const appointmentCounts: { [key: string]: number } = {};
      appointments?.forEach(apt => {
        if (apt.data_agendamento_calculada) {
          appointmentCounts[apt.data_agendamento_calculada] = 
            (appointmentCounts[apt.data_agendamento_calculada] || 0) + 1;
        }
      });

      // Generate calendar
      const daysInMonth = endDate.getDate();
      const occupationData: DayOccupation[] = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, monthInt, day);
        const dateStr = date.toISOString().split('T')[0];
        const weekDayIndex = date.getDay();
        const total = appointmentCounts[dateStr] || 0;
        const maxVagas = capacityData?.vagas_dia_max || 10;
        const available = Math.max(0, maxVagas - total);
        const percentage = (total / maxVagas) * 100;

        occupationData.push({
          date: dateStr,
          weekDay: weekDays[weekDayIndex],
          total,
          available,
          percentage
        });
      }

      setOccupation(occupationData);
    } catch (error) {
      console.error('Error loading occupation:', error);
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

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Calendário de Ocupação</h1>
        <p className="text-muted-foreground">Visualize a ocupação das maternidades por dia</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
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
              Capacidade da Maternidade
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Vagas por dia</p>
              <p className="text-2xl font-bold">{capacity.vagas_dia_max}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Vagas de emergência</p>
              <p className="text-2xl font-bold">{capacity.vagas_emergencia}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Ocupação Diária
          </CardTitle>
          <CardDescription>
            {selectedMaternidade} - {months.find(m => m.value === selectedMonth)?.label}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {occupation.map(day => (
                <Card key={day.date} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-4">
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
