import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Agendamento {
  id: string;
  nome_completo: string;
  data_agendamento_calculada: string | null;
  maternidade: string;
  status: string;
}

export default function ListaAgendamentos() {
  const { user } = useAuth();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAgendamentos();
    }
  }, [user]);

  const fetchAgendamentos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('agendamentos_obst')
        .select('id, nome_completo, data_agendamento_calculada, maternidade, status')
        .order('data_agendamento_calculada', { ascending: true, nullsFirst: false });

      if (error) throw error;
      setAgendamentos(data || []);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pendente: 'outline',
      aprovado: 'default',
      rejeitado: 'destructive',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Lista de Agendamentos</CardTitle>
          <p className="text-sm text-muted-foreground">
            Total: {agendamentos.length} registros
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Data Agendada</TableHead>
                <TableHead>Maternidade</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agendamentos.map((agendamento) => (
                <TableRow key={agendamento.id}>
                  <TableCell className="font-medium">
                    {agendamento.nome_completo}
                  </TableCell>
                  <TableCell>
                    {agendamento.data_agendamento_calculada
                      ? format(new Date(agendamento.data_agendamento_calculada), 'dd/MM/yyyy', {
                          locale: ptBR,
                        })
                      : 'Não calculada'}
                  </TableCell>
                  <TableCell>{agendamento.maternidade}</TableCell>
                  <TableCell>{getStatusBadge(agendamento.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
