import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { FileText, Database, RefreshCw, Upload, Wrench } from 'lucide-react';
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
  const { user } = useAuth();
  const { refreshAgendamentos } = useData();
  const [processando, setProcessando] = useState(false);
  const [dadosHTML, setDadosHTML] = useState<HTMLRecord[]>([]);
  const [comparacao, setComparacao] = useState<{
    novos: number;
    existentes: number;
    atualizados: number;
  } | null>(null);
  const [progresso, setProgresso] = useState(0);
  const [detalhesExistentes, setDetalhesExistentes] = useState<PacienteComparacao[]>([]);
  const [datasCorrigidas, setDatasCorrigidas] = useState<number | null>(null);

  // Função auxiliar para obter valor de coluna com fallback
  const getColumnValue = (colunas: NodeListOf<Element>, index: number, defaultValue: string = ''): string => {
    return colunas[index]?.textContent?.trim() || defaultValue;
  };

  const extrairDadosHTML = async () => {
    setProcessando(true);
    try {
      console.log('Iniciando extração do HTML...');
      
      // Buscar o arquivo HTML
      const response = await fetch('/agendamentos_final_pro.html');
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        toast.error('❌ Arquivo HTML não encontrado! Verifique se está em /public/agendamentos_final_pro.html');
        console.error('❌ Arquivo HTML não encontrado. Status:', response.status);
        return;
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
      const linhasComColunasIncompletas: { index: number; colunas: number }[] = [];
      
      linhas.forEach((linha, index) => {
        const colunas = linha.querySelectorAll('td');
        
        // Aceitar linhas com pelo menos 1 coluna (nome/carteirinha)
        if (colunas.length >= 1) {
          const carteirinhaAttr = colunas[0]?.getAttribute('data-carteirinha') || '';
          const carteirinha = carteirinhaAttr.replace('Carteirinha:', '').replace('Carteirinha: ', '').trim() || 'SEM-CARTEIRINHA';
          const status = linha.getAttribute('data-status') || 'agendado';
          
          // Se tem menos de 16 colunas, registrar para log
          if (colunas.length < 16) {
            linhasComColunasIncompletas.push({ index: index + 1, colunas: colunas.length });
            console.log(`ℹ️ Linha ${index + 1} com ${colunas.length} colunas - usando valores padrão para campos faltantes`);
          }
          
          registros.push({
            carteirinha,
            nome_completo: getColumnValue(colunas, 0, 'Nome não informado'),
            telefones: getColumnValue(colunas, 1, 'Não informado'),
            idade: getColumnValue(colunas, 2, '0'),
            paridade: getColumnValue(colunas, 3, 'G1C0N0A0'),
            data_dum: getColumnValue(colunas, 4, ''),
            usg_primeiro: getColumnValue(colunas, 5, ''),
            ig_atual: getColumnValue(colunas, 6, '0 semanas'),
            diagnosticos_maternos: getColumnValue(colunas, 7, 'Não especificado'),
            diagnosticos_fetais: getColumnValue(colunas, 8, 'Não especificado'),
            usg_ultimo: getColumnValue(colunas, 9, 'Não informado'),
            procedimentos: getColumnValue(colunas, 10, 'Não especificado'),
            maternidade: getColumnValue(colunas, 11, 'Não definida'),
            ig_ideal: getColumnValue(colunas, 12, '37-40 semanas'),
            data_agendada: getColumnValue(colunas, 13, ''),
            ig_na_data: getColumnValue(colunas, 14, '0 semanas'),
            status: status
          });
        } else {
          console.warn(`⚠️ Linha ${index + 1} completamente vazia - ignorada`);
        }
      });
      
      console.log('Registros extraídos:', registros.length);
      console.log('Linhas com colunas incompletas:', linhasComColunasIncompletas.length);
      
      if (linhasComColunasIncompletas.length > 0) {
        console.table(linhasComColunasIncompletas);
        toast.info(`ℹ️ ${linhasComColunasIncompletas.length} registros com campos faltantes`, {
          description: `Campos ausentes foram preenchidos com valores padrão. Total: ${registros.length} registros extraídos.`,
          duration: 6000
        });
      }
      
      setDadosHTML(registros);
      
      if (registros.length > 0) {
        toast.success(`✅ ${registros.length} registros extraídos de ${linhas.length} linhas HTML`);
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
    if (!dataBR) return null;
    const trimmed = dataBR.trim();
    
    // Se já está no formato ISO (YYYY-MM-DD), retornar como está
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    
    // Formato DD/MM/YYYY
    const partes = trimmed.split('/');
    if (partes.length === 3) {
      const [dia, mes, ano] = partes;
      // Validar que são números válidos
      const diaNum = parseInt(dia, 10);
      const mesNum = parseInt(mes, 10);
      const anoNum = parseInt(ano, 10);
      
      const currentYear = new Date().getFullYear();
      if (diaNum >= 1 && diaNum <= 31 && mesNum >= 1 && mesNum <= 12 && anoNum >= 2020 && anoNum <= currentYear + 5) {
        return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
      }
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

  // Constante para idade padrão quando não disponível
  const DEFAULT_AGE = 25;
  const MIN_AGE = 12;
  const MAX_AGE = 65;

  // Calcular data de nascimento aproximada a partir da idade
  const calcularDataNascimento = (idade: string): string => {
    let idadeNum = parseInt(idade);
    
    // Validar idade dentro de faixa razoável (12-65 anos)
    if (isNaN(idadeNum) || idadeNum < MIN_AGE || idadeNum > MAX_AGE) {
      idadeNum = DEFAULT_AGE;
    }
    
    const anoNascimento = new Date().getFullYear() - idadeNum;
    return `${anoNascimento}-01-01`;
  };

  const corrigirDatasExistentes = async () => {
    if (!confirm('Deseja corrigir todas as datas no formato DD/MM/YYYY para o formato ISO (YYYY-MM-DD)?')) {
      return;
    }

    setProcessando(true);
    setDatasCorrigidas(null);
    
    try {
      // Buscar todos os registros com data no formato errado (contém "/")
      const { data: registros, error } = await supabase
        .from('agendamentos_obst')
        .select('id, data_agendamento_calculada')
        .like('data_agendamento_calculada', '%/%');

      if (error) throw error;

      console.log(`Encontrados ${registros?.length || 0} registros com datas no formato DD/MM/YYYY`);
      
      let corrigidos = 0;
      let erros = 0;
      
      for (const registro of registros || []) {
        const dataOriginal = registro.data_agendamento_calculada;
        const dataCorrigida = parseDataBR(dataOriginal);
        
        if (dataCorrigida) {
          console.log(`Corrigindo: ${dataOriginal} -> ${dataCorrigida}`);
          
          const { error: updateError } = await supabase
            .from('agendamentos_obst')
            .update({ data_agendamento_calculada: dataCorrigida })
            .eq('id', registro.id);
          
          if (updateError) {
            console.error(`Erro ao corrigir registro ${registro.id}:`, updateError);
            erros++;
          } else {
            corrigidos++;
          }
        } else {
          console.warn(`Não foi possível converter a data: ${dataOriginal}`);
          erros++;
        }
      }
      
      setDatasCorrigidas(corrigidos);
      toast.success(`${corrigidos} datas corrigidas${erros > 0 ? `, ${erros} erros` : ''}`);
    } catch (error) {
      console.error('Erro ao corrigir datas:', error);
      toast.error('Erro ao corrigir datas existentes');
    } finally {
      setProcessando(false);
    }
  };

  const importarParaBanco = async () => {
    if (dadosHTML.length === 0) {
      toast.error('Extraia os dados do HTML primeiro');
      return;
    }

    // Verificar autenticação
    if (!user) {
      toast.error('Usuário não autenticado. Faça login novamente.');
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
      let pulados = 0;
      const errosDetalhados: Array<{ paciente: string; carteirinha: string; erro: string; code?: string }> = [];

      for (let i = 0; i < dadosHTML.length; i++) {
        const registro = dadosHTML[i];
        const paridade = parseParidade(registro.paridade);
        const dataDum = parseDataBR(registro.data_dum);
        const dataAgendada = parseDataBR(registro.data_agendada);

        // Validar dados críticos antes de inserir
        if (!dataAgendada) {
          console.error(`⚠️ Data inválida para ${registro.nome_completo}: ${registro.data_agendada}`);
          errosDetalhados.push({
            paciente: registro.nome_completo,
            carteirinha: registro.carteirinha,
            erro: `Data inválida: ${registro.data_agendada}`
          });
          pulados++;
          continue;
        }

        if (!registro.carteirinha || registro.carteirinha === 'SEM-CARTEIRINHA') {
          console.error(`⚠️ Carteirinha inválida para ${registro.nome_completo}`);
          errosDetalhados.push({
            paciente: registro.nome_completo,
            carteirinha: registro.carteirinha,
            erro: 'Carteirinha inválida ou ausente'
          });
          pulados++;
          continue;
        }

        // Log detalhado para debug
        console.log(`Processando [${i + 1}/${dadosHTML.length}]: ${registro.nome_completo}, Carteirinha: ${registro.carteirinha}, Data: ${registro.data_agendada} -> ${dataAgendada}`);

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
          data_nascimento: calcularDataNascimento(registro.idade),
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
          data_agendamento_calculada: dataAgendada,
          status: statusMapeado,
          created_by: user.id
        };

        try {
          // Verificar se existe
          const { data: existente, error: selectError } = await supabase
            .from('agendamentos_obst')
            .select('id')
            .eq('carteirinha', registro.carteirinha)
            .maybeSingle();

          if (selectError) {
            console.error('❌ ERRO AO BUSCAR:', {
              paciente: registro.nome_completo,
              carteirinha: registro.carteirinha,
              erro: selectError.message,
              code: selectError.code,
              details: selectError.details
            });
            errosDetalhados.push({
              paciente: registro.nome_completo,
              carteirinha: registro.carteirinha,
              erro: selectError.message,
              code: selectError.code
            });
            erros++;
            continue;
          }

          if (existente) {
            // Atualizar registro existente (não atualiza created_by)
            const { created_by: _, ...dadosAtualizacao } = dadosAgendamento;
            const { error, data } = await supabase
              .from('agendamentos_obst')
              .update(dadosAtualizacao)
              .eq('id', existente.id)
              .select('id');

            if (error) {
              console.error('❌ ERRO DETALHADO:', {
                paciente: registro.nome_completo,
                carteirinha: registro.carteirinha,
                erro: error.message,
                code: error.code,
                details: error.details
              });
              errosDetalhados.push({
                paciente: registro.nome_completo,
                carteirinha: registro.carteirinha,
                erro: error.message,
                code: error.code
              });
              erros++;
            } else {
              console.log(`✅ Atualizado: ${registro.nome_completo} (ID: ${data?.[0]?.id || existente.id})`);
              atualizados++;
            }
          } else {
            // Inserir novo registro
            const { error, data } = await supabase
              .from('agendamentos_obst')
              .insert(dadosAgendamento)
              .select('id');

            if (error) {
              console.error('❌ ERRO DETALHADO:', {
                paciente: registro.nome_completo,
                carteirinha: registro.carteirinha,
                erro: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint
              });
              console.error('Dados do agendamento:', JSON.stringify(dadosAgendamento, null, 2));
              errosDetalhados.push({
                paciente: registro.nome_completo,
                carteirinha: registro.carteirinha,
                erro: error.message,
                code: error.code
              });
              erros++;
            } else {
              console.log(`✅ Inserido: ${registro.nome_completo} (ID: ${data?.[0]?.id || 'N/A'})`);
              importados++;
            }
          }
        } catch (err) {
          console.error('Erro inesperado ao processar:', registro.nome_completo, err);
          errosDetalhados.push({
            paciente: registro.nome_completo,
            carteirinha: registro.carteirinha,
            erro: String(err)
          });
          erros++;
        }

        setProgresso(Math.round(((i + 1) / dadosHTML.length) * 100));
      }

      // Resumo detalhado da importação
      console.log('='.repeat(60));
      console.log('📊 RESUMO DA IMPORTAÇÃO:');
      console.log(`✅ Inseridos no banco: ${importados}`);
      console.log(`🔄 Atualizados no banco: ${atualizados}`);
      console.log(`⏭️ Pulados (dados inválidos): ${pulados}`);
      console.log(`❌ Erros (não salvos): ${erros}`);
      console.log(`📈 Total processado: ${dadosHTML.length}`);
      console.log('='.repeat(60));

      // Log de erros detalhados
      if (errosDetalhados.length > 0) {
        console.log('❌ ERROS DETALHADOS:');
        console.table(errosDetalhados);
      }

      // Verificar IMEDIATAMENTE se os dados foram realmente salvos
      console.log('🔍 Verificando dados no banco...');
      const { data: verificacao, error: verificacaoError } = await supabase
        .from('agendamentos_obst')
        .select('id, carteirinha')
        .in('carteirinha', dadosHTML.map(r => r.carteirinha));

      if (verificacaoError) {
        console.error('❌ Erro ao verificar registros:', verificacaoError);
      } else {
        console.log(`✅ Verificação: ${verificacao?.length || 0} registros encontrados no banco`);
      }

      const { count: countTotal, error: countError } = await supabase
        .from('agendamentos_obst')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('❌ Erro ao contar registros:', countError);
      } else {
        console.log(`📊 TOTAL DE REGISTROS NO BANCO: ${countTotal}`);
      }

      // Mostrar toast baseado em resultados reais
      if (importados === 0 && atualizados === 0) {
        toast.error(`❌ Importação falhou! ${erros} erros, ${pulados} pulados. Verifique o console (F12).`);
      } else if (erros > 0 || pulados > 0) {
        toast.warning(`⚠️ Importação parcial: ${importados} novos, ${atualizados} atualizados, ${erros} erros, ${pulados} pulados`);
      } else {
        toast.success(`✅ Sucesso! ${importados} novos, ${atualizados} atualizados`);
      }

      setComparacao(prev => prev ? { ...prev, atualizados: importados + atualizados } : null);

      // Atualizar dashboard
      console.log('🔄 Iniciando atualização do dashboard...');
      try {
        await refreshAgendamentos();
        console.log('✅ Dashboard atualizado');
        
        if (importados > 0 || atualizados > 0) {
          toast.info('✅ Dashboard atualizado - recarregue para ver os dados');
        }
      } catch (refreshError) {
        console.error('❌ Erro ao atualizar dashboard:', refreshError);
        toast.warning('⚠️ Recarregue a página para ver os dados atualizados');
      }
    } catch (error) {
      console.error('Erro geral:', error);
      toast.error(`Erro durante importação: ${error}`);
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

          <div className="flex gap-4">
            <Button
              onClick={corrigirDatasExistentes}
              disabled={processando}
              variant="secondary"
              className="flex-1"
            >
              <Wrench className="mr-2 h-4 w-4" />
              Corrigir Datas Existentes (DD/MM/YYYY → YYYY-MM-DD)
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

          {datasCorrigidas !== null && (
            <Alert>
              <AlertDescription>
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  <strong>Datas corrigidas:</strong>
                  <Badge variant="outline">{datasCorrigidas} registros</Badge>
                </div>
              </AlertDescription>
            </Alert>
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
