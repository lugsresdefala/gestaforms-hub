import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Trash2, Upload, FileCheck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PacienteComparacao {
  id: string;
  nome_completo: string;
  carteirinha: string;
  maternidade: string;
  created_at: string;
  status: 'original' | 'inventado';
}

export default function CompararPacientes() {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [processando, setProcessando] = useState(false);
  const [pacientes, setPacientes] = useState<PacienteComparacao[]>([]);
  const [inventados, setInventados] = useState<PacienteComparacao[]>([]);
  const [deletando, setDeletando] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setArquivo(e.target.files[0]);
    }
  };

  const compararPacientes = async () => {
    if (!arquivo) {
      toast.error('Selecione um arquivo CSV');
      return;
    }

    setProcessando(true);

    try {
      // Ler CSV original
      const textoCSV = await arquivo.text();
      const linhas = textoCSV.split('\n').filter(l => l.trim());
      
      // Extrair carteirinhas e nomes do CSV original (normalizado)
      const pacientesOriginais = new Set<string>();
      linhas.slice(1).forEach(linha => {
        const partes = linha.split(';').map(p => p.trim());
        if (partes.length >= 2) {
          const carteirinha = partes[0]?.toLowerCase().replace(/[^a-z0-9]/g, '');
          const nome = partes[1]?.toLowerCase().replace(/\s+/g, ' ').trim();
          if (carteirinha && nome) {
            pacientesOriginais.add(`${carteirinha}|${nome}`);
          }
        }
      });

      // Buscar todos os pacientes do banco
      const { data: pacientesBanco, error } = await supabase
        .from('agendamentos_obst')
        .select('id, nome_completo, carteirinha, maternidade, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Comparar
      const comparacao: PacienteComparacao[] = (pacientesBanco || []).map(p => {
        const carteirinhaNorm = p.carteirinha.toLowerCase().replace(/[^a-z0-9]/g, '');
        const nomeNorm = p.nome_completo.toLowerCase().replace(/\s+/g, ' ').trim();
        const chave = `${carteirinhaNorm}|${nomeNorm}`;
        
        return {
          ...p,
          status: pacientesOriginais.has(chave) ? 'original' : 'inventado'
        };
      });

      const inventadosEncontrados = comparacao.filter(p => p.status === 'inventado');

      setPacientes(comparacao);
      setInventados(inventadosEncontrados);

      toast.success(`Encontrados ${inventadosEncontrados.length} pacientes inventados`);
    } catch (error) {
      console.error('Erro ao comparar:', error);
      toast.error('Erro ao processar comparação');
    } finally {
      setProcessando(false);
    }
  };

  const deletarPaciente = async (id: string) => {
    setDeletando(prev => [...prev, id]);

    try {
      const { error } = await supabase
        .from('agendamentos_obst')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setInventados(prev => prev.filter(p => p.id !== id));
      setPacientes(prev => prev.filter(p => p.id !== id));
      
      toast.success('Paciente deletado');
    } catch (error) {
      console.error('Erro ao deletar:', error);
      toast.error('Erro ao deletar paciente');
    } finally {
      setDeletando(prev => prev.filter(d => d !== id));
    }
  };

  const deletarTodosInventados = async () => {
    if (!confirm(`Deletar ${inventados.length} pacientes inventados?`)) return;

    setProcessando(true);

    try {
      const ids = inventados.map(p => p.id);
      
      const { error } = await supabase
        .from('agendamentos_obst')
        .delete()
        .in('id', ids);

      if (error) throw error;

      toast.success(`${inventados.length} pacientes deletados`);
      setInventados([]);
      setPacientes(prev => prev.filter(p => p.status !== 'inventado'));
    } catch (error) {
      console.error('Erro ao deletar:', error);
      toast.error('Erro ao deletar pacientes');
    } finally {
      setProcessando(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Comparar Pacientes - Identificar Inventados</CardTitle>
          <CardDescription>
            Faça upload do CSV original para identificar pacientes que não deveriam estar no banco
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">
                CSV Original (Consolidado_Novembro_Dezembro.csv)
              </label>
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={processando}
              />
            </div>
            <Button
              onClick={compararPacientes}
              disabled={!arquivo || processando}
            >
              <FileCheck className="mr-2 h-4 w-4" />
              {processando ? 'Processando...' : 'Comparar'}
            </Button>
          </div>

          {inventados.length > 0 && (
            <>
              <Alert>
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <span>
                      <strong>{inventados.length} pacientes inventados</strong> encontrados no banco
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={deletarTodosInventados}
                      disabled={processando}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Deletar Todos
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Carteirinha</TableHead>
                      <TableHead>Maternidade</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventados.map((paciente) => (
                      <TableRow key={paciente.id}>
                        <TableCell className="font-medium">
                          {paciente.nome_completo}
                        </TableCell>
                        <TableCell>{paciente.carteirinha}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{paciente.maternidade}</Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(paciente.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deletarPaciente(paciente.id)}
                            disabled={deletando.includes(paciente.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {pacientes.length > 0 && inventados.length === 0 && (
            <Alert>
              <AlertDescription>
                ✓ Todos os pacientes no banco estão no CSV original. Nenhum inventado encontrado.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
