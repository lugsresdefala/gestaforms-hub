import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { FileText, Database, RefreshCw, Upload } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface HTMLRecord {
  carteirinha: string;
  nome_completo: string;
  telefones: string;
  idade: string;
  paridade: string;
  data_dum: string;
  usg_primeiro: string;
  ig_atual: string;
  diagnosticos_maternos: string;
  diagnosticos_fetais: string;
  usg_ultimo: string;
  procedimentos: string;
  maternidade: string;
  ig_ideal: string;
  data_agendada: string;
  ig_na_data: string;
  status: string;
}

interface PacienteComparacao {
  carteirinha: string;
  nome_html: string;
  nome_banco: string;
  maternidade_html: string;
  maternidade_banco: string;
  data_html: string;
  data_banco: string;
  status_html: string;
  status_banco: string;
  identico: boolean;
}

export default function ImportarAgendamentosHTML() {
  const [processando, setProcessando] = useState(false);
  const [dadosHTML, setDadosHTML] = useState<HTMLRecord[]>([]);
  const [comparacao, setComparacao] = useState<{
    novos: number;
    existentes: number;
    atualizados: number;
  } | null>(null);
  const [progresso, setProgresso] = useState(0);
  const [detalhesExistentes, setDetalhesExistentes] = useState<PacienteComparacao[]>([]);

  const extrairDadosHTML = async () => {
    setProcessando(true);
    try {
      console.log('Iniciando extração do HTML...');
      
      // Buscar o arquivo HTML
      const response = await fetch('/agendamentos_final_pro.html');
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const html = await response.text();
      console.log('HTML carregado, tamanho:', html.length);
      
      // Criar parser DOM
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Extrair dados das linhas da tabela
      const linhas = doc.querySelectorAll('tbody tr');
      console.log('Linhas encontradas:', linhas.length);
      
      const registros: HTMLRecord[] = [];
      
      linhas.forEach((linha, index) => {
        const colunas = linha.querySelectorAll('td');
        if (colunas.length >= 16) {
          const carteirinhaAttr = colunas[0].getAttribute('data-carteirinha') || '';
          const carteirinha = carteirinhaAttr.replace('Carteirinha:', '').replace('Carteirinha: ', '').trim();
          const status = linha.getAttribute('data-status') || 'agendado';
          
          registros.push({
            carteirinha,
            nome_completo: colunas[0].textContent?.trim() || '',
            telefones: colunas[1].textContent?.trim() || '',
            idade: colunas[2].textContent?.trim() || '',
            paridade: colunas[3].textContent?.trim() || '',
            data_dum: colunas[4].textContent?.trim() || '',
            usg_primeiro: colunas[5].textContent?.trim() || '',
            ig_atual: colunas[6].textContent?.trim() || '',
            diagnosticos_maternos: colunas[7].textContent?.trim() || '',
            diagnosticos_fetais: colunas[8].textContent?.trim() || '',
            usg_ultimo: colunas[9].textContent?.trim() || '',
            procedimentos: colunas[10].textContent?.trim() || '',
            maternidade: colunas[11].textContent?.trim() || '',
            ig_ideal: colunas[12].textContent?.trim() || '',
            data_agendada: colunas[13].textContent?.trim() || '',
            ig_na_data: colunas[14].textContent?.trim() || '',
            status: status
          });
        } else {
          console.log(`Linha ${index} tem apenas ${colunas.length} colunas`);
        }
      });
      
      console.log('Registros extraídos:', registros.length);
      setDadosHTML(registros);
      
      if (registros.length > 0) {
        toast.success(`${registros.length} registros extraídos do HTML`);
      } else {
        toast.error('Nenhum registro encontrado no HTML');
      }
    } catch (error) {
      console.error('Erro ao extrair dados:', error);
      toast.error(`Erro ao processar HTML: ${error}`);
    } finally {
      setProcessando(false);
    }
  };

  const compararComBanco = async () => {
    if (dadosHTML.length === 0) {
      toast.error('Extraia os dados do HTML primeiro');
      return;
    }

    setProcessando(true);
    try {
      // Buscar todos os registros do banco
      const { data: registrosBanco, error } = await supabase
        .from('agendamentos_obst')
        .select('carteirinha, nome_completo, maternidade, data_agendamento_calculada, status');

      if (error) throw error;

      const carteirinhasBanco = new Map(
        (registrosBanco || []).map(r => [r.carteirinha.toLowerCase().trim(), r])
      );

      let novos = 0;
      let existentes = 0;
      const detalhes: PacienteComparacao[] = [];

      dadosHTML.forEach(registro => {
        const carteirinhaNorm = registro.carteirinha.toLowerCase().trim();
        const registroBanco = carteirinhasBanco.get(carteirinhaNorm);
        
        if (registroBanco) {
          existentes++;
          
          // Comparar dados
          const nomeIgual = registroBanco.nome_completo.toLowerCase().trim() === 
                           registro.nome_completo.toLowerCase().trim();
          const maternidadeIgual = registroBanco.maternidade === registro.maternidade;
          const dataHTML = parseDataBR(registro.data_agendada);
          const dataIgual = registroBanco.data_agendamento_calculada === dataHTML;
          const statusHTML = registro.status === 'realizado' ? 'realizado' : 'aprovado';
          const statusIgual = registroBanco.status === statusHTML;
          
          detalhes.push({
            carteirinha: registro.carteirinha,
            nome_html: registro.nome_completo,
            nome_banco: registroBanco.nome_completo,
            maternidade_html: registro.maternidade,
            maternidade_banco: registroBanco.maternidade,
            data_html: registro.data_agendada,
            data_banco: registroBanco.data_agendamento_calculada || 'N/A',
            status_html: statusHTML,
            status_banco: registroBanco.status,
            identico: nomeIgual && maternidadeIgual && dataIgual && statusIgual
          });
        } else {
          novos++;
        }
      });

      setComparacao({ novos, existentes, atualizados: 0 });
      setDetalhesExistentes(detalhes);
      
      const identicos = detalhes.filter(d => d.identico).length;
      const diferentes = detalhes.filter(d => !d.identico).length;
      
      toast.success(`Comparação concluída: ${identicos} idênticos, ${diferentes} diferentes`);
    } catch (error) {
      console.error('Erro ao comparar:', error);
      toast.error('Erro ao comparar com banco de dados');
    } finally {
      setProcessando(false);
    }
  };

  const parseDataBR = (dataBR: string): string | null => {
    // Formato: DD/MM/YYYY
    const partes = dataBR.split('/');
    if (partes.length === 3) {
      const [dia, mes, ano] = partes;
      return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }
    return null;
  };

  const parseParidade = (paridade: string) => {
    // Formato: G3C2N0A0
    const match = paridade.match(/G(\d+)C(\d+)N(\d+)A(\d+)/i);
    if (match) {
      return {
        gestacoes: parseInt(match[1]),
        cesareas: parseInt(match[2]),
        normais: parseInt(match[3]),
        abortos: parseInt(match[4])
      };
    }
    return { gestacoes: 1, cesareas: 0, normais: 0, abortos: 0 };
  };

  const importarParaBanco = async () => {
    if (dadosHTML.length === 0) {
      toast.error('Extraia os dados do HTML primeiro');
      return;
    }

    if (!confirm(`Deseja substituir ${dadosHTML.length} registros no banco de dados pelos dados do HTML?`)) {
      return;
    }

    setProcessando(true);
    setProgresso(0);

    try {
      let importados = 0;
      let atualizados = 0;
      let erros = 0;

      for (let i = 0; i < dadosHTML.length; i++) {
        const registro = dadosHTML[i];
        const paridade = parseParidade(registro.paridade);
        const dataDum = parseDataBR(registro.data_dum);
        const dataAgendada = parseDataBR(registro.data_agendada);

        const procedimentos = [registro.procedimentos];

        let statusMapeado = 'aprovado';
        if (registro.status === 'realizado') {
          statusMapeado = 'realizado';
        } else if (registro.status === 'agendado') {
          statusMapeado = 'aprovado';
        }

        const dadosAgendamento = {
          carteirinha: registro.carteirinha,
          nome_completo: registro.nome_completo,
          telefones: registro.telefones,
          data_nascimento: '2000-01-01',
          numero_gestacoes: paridade.gestacoes,
          numero_partos_cesareas: paridade.cesareas,
          numero_partos_normais: paridade.normais,
          numero_abortos: paridade.abortos,
          dum_status: dataDum ? 'Sim - Confiavel' : 'Não sabe',
          data_dum: dataDum,
          data_primeiro_usg: dataDum || '2025-01-01',
          semanas_usg: 0,
          dias_usg: 0,
          usg_recente: 'Sim',
          idade_gestacional_calculada: registro.ig_atual,
          ig_pretendida: registro.ig_ideal || '37-40 semanas',
          procedimentos,
          indicacao_procedimento: registro.diagnosticos_maternos,
          diagnosticos_maternos: registro.diagnosticos_maternos,
          diagnosticos_fetais: registro.diagnosticos_fetais,
          medicacao: 'Não informado',
          placenta_previa: 'Não',
          necessidade_uti_materna: 'Não',
          necessidade_reserva_sangue: 'Não',
          historia_obstetrica: registro.usg_ultimo,
          maternidade: registro.maternidade,
          medico_responsavel: 'Importado do HTML',
          centro_clinico: 'Importado',
          email_paciente: 'nao-informado@example.com',
          data_agendamento_calculada: dataAgendada,
          status: statusMapeado
        };

        try {
          // Verificar se existe
          const { data: existente } = await supabase
            .from('agendamentos_obst')
            .select('id')
            .eq('carteirinha', registro.carteirinha)
            .maybeSingle();

          if (existente) {
            // Atualizar registro existente
            const { error } = await supabase
              .from('agendamentos_obst')
              .update(dadosAgendamento)
              .eq('id', existente.id);

            if (error) {
              console.error('Erro ao atualizar:', registro.nome_completo, error);
              erros++;
            } else {
              atualizados++;
            }
          } else {
            // Inserir novo registro
            const { error } = await supabase
              .from('agendamentos_obst')
              .insert(dadosAgendamento);

            if (error) {
              console.error('Erro ao inserir:', registro.nome_completo, error);
              erros++;
            } else {
              importados++;
            }
          }
        } catch (err) {
          console.error('Erro ao processar:', registro.nome_completo, err);
          erros++;
        }

        setProgresso(Math.round(((i + 1) / dadosHTML.length) * 100));
      }

      toast.success(`${importados} novos, ${atualizados} atualizados, ${erros} erros`);
      setComparacao(prev => prev ? { ...prev, atualizados: importados + atualizados } : null);
    } catch (error) {
      console.error('Erro geral:', error);
      toast.error('Erro durante importação');
    } finally {
      setProcessando(false);
      setProgresso(0);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Importar Agendamentos do HTML</CardTitle>
          <CardDescription>
            Extrair dados do arquivo agendamentos_final_pro.html e substituir no banco de dados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4">
            <Button
              onClick={extrairDadosHTML}
              disabled={processando}
              className="flex-1"
            >
              <FileText className="mr-2 h-4 w-4" />
              1. Extrair Dados do HTML
            </Button>
            
            <Button
              onClick={compararComBanco}
              disabled={processando || dadosHTML.length === 0}
              variant="outline"
              className="flex-1"
            >
              <Database className="mr-2 h-4 w-4" />
              2. Comparar com Banco
            </Button>
            
            <Button
              onClick={importarParaBanco}
              disabled={processando || dadosHTML.length === 0}
              variant="default"
              className="flex-1"
            >
              <Upload className="mr-2 h-4 w-4" />
              3. Importar para Banco
            </Button>
          </div>

          {progresso > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Importando...</span>
                <span>{progresso}%</span>
              </div>
              <Progress value={progresso} />
            </div>
          )}

          {dadosHTML.length > 0 && (
            <Alert>
              <AlertDescription>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <strong>Dados extraídos do HTML:</strong>
                    <Badge variant="outline">{dadosHTML.length} registros</Badge>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {comparacao && (
            <Alert>
              <AlertDescription>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <RefreshCw className="h-4 w-4" />
                    <strong>Resultado da comparação:</strong>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Novos</div>
                      <div className="text-2xl font-bold text-green-600">
                        {comparacao.novos}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Já existem</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {comparacao.existentes}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Importados</div>
                      <div className="text-2xl font-bold text-purple-600">
                        {comparacao.atualizados}
                      </div>
                    </div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {detalhesExistentes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detalhes dos Registros Existentes</CardTitle>
                <CardDescription>
                  Comparação entre dados do HTML e banco de dados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-auto max-h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[150px]">Carteirinha</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Maternidade</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-center">Idêntico?</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detalhesExistentes.map((detalhe, index) => (
                        <TableRow key={index} className={detalhe.identico ? 'bg-green-50' : 'bg-amber-50'}>
                          <TableCell className="font-mono text-xs">
                            {detalhe.carteirinha}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className={detalhe.nome_html === detalhe.nome_banco ? 'text-sm' : 'text-sm text-amber-700'}>
                                HTML: {detalhe.nome_html}
                              </div>
                              {detalhe.nome_html !== detalhe.nome_banco && (
                                <div className="text-sm text-muted-foreground">
                                  Banco: {detalhe.nome_banco}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className={detalhe.maternidade_html === detalhe.maternidade_banco ? 'text-sm' : 'text-sm text-amber-700'}>
                                {detalhe.maternidade_html}
                              </div>
                              {detalhe.maternidade_html !== detalhe.maternidade_banco && (
                                <div className="text-xs text-muted-foreground">
                                  Banco: {detalhe.maternidade_banco}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-sm">{detalhe.data_html}</div>
                              {detalhe.data_html !== detalhe.data_banco && (
                                <div className="text-xs text-muted-foreground">
                                  Banco: {detalhe.data_banco}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Badge variant={detalhe.status_html === 'realizado' ? 'default' : 'outline'}>
                                {detalhe.status_html}
                              </Badge>
                              {detalhe.status_html !== detalhe.status_banco && (
                                <div className="text-xs text-muted-foreground">
                                  Banco: {detalhe.status_banco}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {detalhe.identico ? (
                              <Badge variant="default" className="bg-green-600">✓ Sim</Badge>
                            ) : (
                              <Badge variant="destructive">✗ Não</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  Total: {detalhesExistentes.length} registros existentes • 
                  {' '}{detalhesExistentes.filter(d => d.identico).length} idênticos • 
                  {' '}{detalhesExistentes.filter(d => !d.identico).length} diferentes
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
