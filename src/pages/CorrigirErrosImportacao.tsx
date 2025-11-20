import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ProblemaDetectado {
  id: string;
  nome_completo: string;
  carteirinha: string;
  tipo: 'maternidade_invalida' | 'data_nascimento_invalida' | 'email_invalido' | 'telefone_invalido';
  valor_atual: string;
  descricao: string;
  acao_sugerida: 'corrigir' | 'deletar';
  valor_corrigido?: string;
}

const MATERNIDADES_VALIDAS = ['Cruzeiro', 'Guarulhos', 'NotreCare', 'Salvalus'];

export default function CorrigirErrosImportacao() {
  const [problemas, setProblemas] = useState<ProblemaDetectado[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [processando, setProcessando] = useState<string[]>([]);

  useEffect(() => {
    detectarProblemas();
  }, []);

  const detectarProblemas = async () => {
    setCarregando(true);

    try {
      const { data: agendamentos, error } = await supabase
        .from('agendamentos_obst')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const problemasDetectados: ProblemaDetectado[] = [];

      agendamentos?.forEach((ag) => {
        // 1. Maternidade inválida
        if (!MATERNIDADES_VALIDAS.includes(ag.maternidade)) {
          // Tentar detectar se email contém nome de maternidade
          let valorCorrigido: string | undefined;
          if (ag.email_paciente) {
            const emailLower = ag.email_paciente.toLowerCase();
            if (emailLower.includes('cruzeiro')) valorCorrigido = 'Cruzeiro';
            else if (emailLower.includes('notrecare')) valorCorrigido = 'NotreCare';
            else if (emailLower.includes('guarulhos')) valorCorrigido = 'Guarulhos';
            else if (emailLower.includes('salvalus')) valorCorrigido = 'Salvalus';
          }

          problemasDetectados.push({
            id: ag.id,
            nome_completo: ag.nome_completo,
            carteirinha: ag.carteirinha,
            tipo: 'maternidade_invalida',
            valor_atual: ag.maternidade,
            descricao: `Maternidade "${ag.maternidade}" não é válida. Email: ${ag.email_paciente}`,
            acao_sugerida: valorCorrigido ? 'corrigir' : 'deletar',
            valor_corrigido: valorCorrigido
          });
        }

        // 2. Data de nascimento inválida (futuro ou muito recente)
        const dataNasc = new Date(ag.data_nascimento);
        const hoje = new Date();
        const idade = (hoje.getTime() - dataNasc.getTime()) / (1000 * 60 * 60 * 24 * 365);

        if (dataNasc > hoje || idade < 10 || idade > 60) {
          problemasDetectados.push({
            id: ag.id,
            nome_completo: ag.nome_completo,
            carteirinha: ag.carteirinha,
            tipo: 'data_nascimento_invalida',
            valor_atual: ag.data_nascimento,
            descricao: `Data de nascimento suspeita: ${new Date(ag.data_nascimento).toLocaleDateString('pt-BR')} (idade: ${Math.floor(idade)} anos)`,
            acao_sugerida: 'deletar'
          });
        }

        // 3. Email inválido (não tem @)
        if (ag.email_paciente && !ag.email_paciente.includes('@')) {
          problemasDetectados.push({
            id: ag.id,
            nome_completo: ag.nome_completo,
            carteirinha: ag.carteirinha,
            tipo: 'email_invalido',
            valor_atual: ag.email_paciente,
            descricao: `Email não contém @: "${ag.email_paciente}"`,
            acao_sugerida: 'deletar'
          });
        }
      });

      setProblemas(problemasDetectados);
      toast.success(`${problemasDetectados.length} problemas detectados`);
    } catch (error) {
      console.error('Erro ao detectar problemas:', error);
      toast.error('Erro ao detectar problemas');
    } finally {
      setCarregando(false);
    }
  };

  const corrigirProblema = async (problema: ProblemaDetectado) => {
    setProcessando(prev => [...prev, problema.id]);

    try {
      if (problema.acao_sugerida === 'corrigir' && problema.valor_corrigido) {
        const { error } = await supabase
          .from('agendamentos_obst')
          .update({ maternidade: problema.valor_corrigido })
          .eq('id', problema.id);

        if (error) throw error;

        setProblemas(prev => prev.filter(p => p.id !== problema.id));
        toast.success(`Corrigido: ${problema.nome_completo}`);
      }
    } catch (error) {
      console.error('Erro ao corrigir:', error);
      toast.error('Erro ao corrigir problema');
    } finally {
      setProcessando(prev => prev.filter(id => id !== problema.id));
    }
  };

  const deletarProblema = async (problema: ProblemaDetectado) => {
    if (!confirm(`Deletar ${problema.nome_completo}?`)) return;

    setProcessando(prev => [...prev, problema.id]);

    try {
      const { error } = await supabase
        .from('agendamentos_obst')
        .delete()
        .eq('id', problema.id);

      if (error) throw error;

      setProblemas(prev => prev.filter(p => p.id !== problema.id));
      toast.success(`Deletado: ${problema.nome_completo}`);
    } catch (error) {
      console.error('Erro ao deletar:', error);
      toast.error('Erro ao deletar');
    } finally {
      setProcessando(prev => prev.filter(id => id !== problema.id));
    }
  };

  const corrigirTodos = async () => {
    const corrigiveis = problemas.filter(p => p.acao_sugerida === 'corrigir');
    
    if (!confirm(`Corrigir ${corrigiveis.length} problemas automaticamente?`)) return;

    setCarregando(true);

    for (const problema of corrigiveis) {
      await corrigirProblema(problema);
    }

    setCarregando(false);
  };

  const deletarTodos = async () => {
    const deletaveis = problemas.filter(p => p.acao_sugerida === 'deletar');
    
    if (!confirm(`Deletar ${deletaveis.length} registros com erros graves?`)) return;

    setCarregando(true);

    for (const problema of deletaveis) {
      await deletarProblema(problema);
    }

    setCarregando(false);
  };

  const problemasCorrigiveis = problemas.filter(p => p.acao_sugerida === 'corrigir');
  const problemasDeletaveis = problemas.filter(p => p.acao_sugerida === 'deletar');

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Corrigir Erros de Importação</CardTitle>
          <CardDescription>
            Detecta e corrige automaticamente erros comuns de parsing/importação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {carregando && (
            <Alert>
              <AlertDescription>Analisando registros...</AlertDescription>
            </Alert>
          )}

          {!carregando && problemas.length === 0 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                ✓ Nenhum problema detectado! Todos os registros estão corretos.
              </AlertDescription>
            </Alert>
          )}

          {problemas.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Alert>
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span>
                        <strong>{problemasCorrigiveis.length} corrigíveis</strong>
                      </span>
                      {problemasCorrigiveis.length > 0 && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={corrigirTodos}
                          disabled={carregando}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Corrigir Todos
                        </Button>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>

                <Alert variant="destructive">
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span>
                        <strong>{problemasDeletaveis.length} para deletar</strong>
                      </span>
                      {problemasDeletaveis.length > 0 && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={deletarTodos}
                          disabled={carregando}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Deletar Todos
                        </Button>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Carteirinha</TableHead>
                      <TableHead>Problema</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {problemas.map((problema) => (
                      <TableRow key={`${problema.id}-${problema.tipo}`}>
                        <TableCell className="font-medium">
                          {problema.nome_completo}
                        </TableCell>
                        <TableCell>{problema.carteirinha}</TableCell>
                        <TableCell>
                          <Badge variant={problema.acao_sugerida === 'corrigir' ? 'secondary' : 'destructive'}>
                            {problema.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {problema.descricao}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {problema.acao_sugerida === 'corrigir' && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => corrigirProblema(problema)}
                              disabled={processando.includes(problema.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deletarProblema(problema)}
                            disabled={processando.includes(problema.id)}
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
        </CardContent>
      </Card>
    </div>
  );
}
