import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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

export default function ImportarAgendamentosHTML() {
  const [processando, setProcessando] = useState(false);
  const [dadosHTML, setDadosHTML] = useState<HTMLRecord[]>([]);
  const [comparacao, setComparacao] = useState<{
    novos: number;
    existentes: number;
    atualizados: number;
  } | null>(null);
  const [progresso, setProgresso] = useState(0);

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
        .select('carteirinha, nome_completo');

      if (error) throw error;

      const carteirinhasBanco = new Set(
        (registrosBanco || []).map(r => r.carteirinha.toLowerCase().trim())
      );

      let novos = 0;
      let existentes = 0;

      dadosHTML.forEach(registro => {
        const carteirinhaNorm = registro.carteirinha.toLowerCase().trim();
        if (carteirinhasBanco.has(carteirinhaNorm)) {
          existentes++;
        } else {
          novos++;
        }
      });

      setComparacao({ novos, existentes, atualizados: 0 });
      toast.success('Comparação concluída');
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

    if (!confirm(`Deseja importar ${dadosHTML.length} registros para o banco de dados?`)) {
      return;
    }

    setProcessando(true);
    setProgresso(0);

    try {
      let importados = 0;
      let erros = 0;

      for (let i = 0; i < dadosHTML.length; i++) {
        const registro = dadosHTML[i];
        const paridade = parseParidade(registro.paridade);
        const dataDum = parseDataBR(registro.data_dum);
        const dataAgendada = parseDataBR(registro.data_agendada);

        // Extrair procedimentos como array
        const procedimentos = [registro.procedimentos];

        try {
          const { error } = await supabase
            .from('agendamentos_obst')
            .insert({
              carteirinha: registro.carteirinha,
              nome_completo: registro.nome_completo,
              telefones: registro.telefones,
              data_nascimento: '2000-01-01', // Não temos essa info no HTML
              numero_gestacoes: paridade.gestacoes,
              numero_partos_cesareas: paridade.cesareas,
              numero_partos_normais: paridade.normais,
              numero_abortos: paridade.abortos,
              dum_status: 'Sim - Confiavel',
              data_dum: dataDum,
              data_primeiro_usg: dataDum, // Usar DUM como primeira USG
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
              status: registro.status === 'realizado' ? 'realizado' : 'agendado'
            });

          if (error) {
            console.error('Erro ao importar:', registro.nome_completo, error);
            erros++;
          } else {
            importados++;
          }
        } catch (err) {
          console.error('Erro ao processar:', registro.nome_completo, err);
          erros++;
        }

        setProgresso(Math.round(((i + 1) / dadosHTML.length) * 100));
      }

      toast.success(`${importados} registros importados, ${erros} erros`);
      setComparacao(prev => prev ? { ...prev, atualizados: importados } : null);
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
        </CardContent>
      </Card>
    </div>
  );
}
