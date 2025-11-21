import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Upload, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { processarFormsPartoFluxoNovo } from '@/utils/importFormsPartoFluxoNovo';

export default function ProcessarFormsParto() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<{
    success: number;
    failed: number;
    skipped: number;
    errors: string[];
    warnings: string[];
  } | null>(null);

  const handleProcess = async () => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar autenticado',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    setResults(null);

    try {
      // Dados extraídos manualmente do Excel (pacientes das últimas linhas que ainda não foram agendadas)
      const pacientes = [
        {
          id: '2567',
          horaInicio: '11/19/2025 15:20:52',
          nomeCompleto: 'Tatiane de Souza Rocha',
          dataNascimento: '5/2/84',
          carteirinha: '1QWMV000034010',
          numeroGestacoes: 3,
          numeroCesareas: 2,
          numeroPartosNormais: 0,
          numeroAbortos: 0,
          telefones: '11 957606950// 11 966697319',
          procedimentos: 'Cesárea',
          dumStatus: 'Incerta',
          dataDum: null,
          dataPrimeiroUsg: '5/13/25',
          semanasUsg: 8,
          diasUsg: 2,
          usgRecente: '17/11 ig35 sem 1/7 cef pesi2341g p21 mbv6,4 Doppler normal',
          igPretendida: '37',
          indicacaoProcedimento: 'Iteratividade + pre eclampsia sobreposta',
          medicacao: 'Metildipa 1g , AAS 100 mg, cálcio 1g ,ofertam gold , neutrofer 500',
          diagnosticosMaternos: 'Pré eclâmpsia sobreposta a HAC, iteratividade',
          placentaPrevia: 'Não',
          diagnosticosFetais: 'Sem diagnóstico',
          historiaObstetrica: 'OFIu gestação anterior ( t 21)',
          necessidadeUtiMaterna: 'Não',
          necessidadeReservaSangue: 'Não',
          maternidade: 'Cruzeiro',
          medicoResponsavel: 'Bruna Mariano',
          emailPaciente: 'tatycaetano84@gmail.com'
        },
        {
          id: '2568',
          horaInicio: '11/19/2025 16:20:14',
          nomeCompleto: 'Léa dos Santis Silva',
          dataNascimento: '3/27/87',
          carteirinha: '1M0BI000001007',
          numeroGestacoes: 2,
          numeroCesareas: 0,
          numeroPartosNormais: 1,
          numeroAbortos: 0,
          telefones: '11 970457927// 11 939455306',
          procedimentos: 'Cesárea',
          dumStatus: 'Incerta',
          dataDum: null,
          dataPrimeiroUsg: '6/18/25',
          semanasUsg: 12,
          diasUsg: 0,
          usgRecente: '11/11 8Ig33 sem 1/7 cef peso 2313g p66 mbv5,1 Doppler normal',
          igPretendida: '38',
          indicacaoProcedimento: 'Diabetes gestacional em uso insulina',
          medicacao: 'Insulina nos (28-20-22) , insulina regular (4-4-4), ogestam gold, metildipa 1,5g, cálcio 1g , AAS 100 mg , sulfato ferroso 40mg',
          diagnosticosMaternos: 'HAC , DM II em uso de insulina , obesidade',
          placentaPrevia: 'Não',
          diagnosticosFetais: 'Feto AIG',
          historiaObstetrica: 'DMG',
          necessidadeUtiMaterna: 'Não',
          necessidadeReservaSangue: 'Não',
          maternidade: 'Cruzeiro',
          medicoResponsavel: 'Bruna Mariano',
          emailPaciente: 'lea_stos@hotmail.com'
        },
        {
          id: '2569',
          horaInicio: '11/19/2025 20:36:21',
          nomeCompleto: 'Beatriz dos Santos Pacheco',
          dataNascimento: '1/21/96',
          carteirinha: '0T9EJ000299006',
          numeroGestacoes: 1,
          numeroCesareas: 0,
          numeroPartosNormais: 0,
          numeroAbortos: 0,
          telefones: '11 954599156 11 954534561',
          procedimentos: 'Indução Programada',
          dumStatus: 'Sim - Confiavel',
          dataDum: '3/15/25',
          dataPrimeiroUsg: '5/24/25',
          semanasUsg: 10,
          diasUsg: 1,
          usgRecente: '21/10- fuv, cefalico, peso 1728,15g, placenta posterior grau II, líquido normal, doppler normal, IG 31 2/8',
          igPretendida: '38',
          indicacaoProcedimento: 'Desejo materno',
          medicacao: 'Requinol, enoxaparina 40mg',
          diagnosticosMaternos: 'Em acompanhamento e investigação para LES',
          placentaPrevia: 'Não',
          diagnosticosFetais: 'Não há',
          historiaObstetrica: 'G1p0',
          necessidadeUtiMaterna: 'Não',
          necessidadeReservaSangue: 'Não',
          maternidade: 'Guarulhos',
          medicoResponsavel: 'Joara Almeida',
          emailPaciente: 'pacheccobeatriz@gmail.com'
        },
        {
          id: '2570',
          horaInicio: '11/21/2025 7:15:22',
          nomeCompleto: 'Driely Júlia Silva Gusmão',
          dataNascimento: '12/1/92',
          carteirinha: '1PH26000001007',
          numeroGestacoes: 1,
          numeroCesareas: 0,
          numeroPartosNormais: 0,
          numeroAbortos: 0,
          telefones: '11982472622. 11991113526',
          procedimentos: 'Cesárea',
          dumStatus: 'Sim - Confiavel',
          dataDum: '2/26/25',
          dataPrimeiroUsg: '4/16/25',
          semanasUsg: 6,
          diasUsg: 3,
          usgRecente: '18/11 Ig 37 semana2 d peso 3428 g p97',
          igPretendida: '39',
          indicacaoProcedimento: 'Gig',
          medicacao: 'Vitaminas',
          diagnosticosMaternos: 'Diabetes gestacional',
          placentaPrevia: 'Não',
          diagnosticosFetais: 'Macrossomia',
          historiaObstetrica: 'Dg',
          necessidadeUtiMaterna: 'Não',
          necessidadeReservaSangue: 'Não',
          maternidade: 'NotreCare',
          medicoResponsavel: 'Renata Daura Lanzone',
          emailPaciente: 'drielyjulia_01@hotmail.com'
        },
        {
          id: '2571',
          horaInicio: '11/21/2025 7:22:09',
          nomeCompleto: 'Jeniffer dos Santos Dantas Nascimento',
          dataNascimento: '5/5/94',
          carteirinha: '0ZXAZ000010006',
          numeroGestacoes: 1,
          numeroCesareas: 0,
          numeroPartosNormais: 0,
          numeroAbortos: 0,
          telefones: '11 953040084/ 11958242787',
          procedimentos: 'Indução Programada',
          dumStatus: 'Não sabe',
          dataDum: null,
          dataPrimeiroUsg: '5/16/25',
          semanasUsg: 6,
          diasUsg: 4,
          usgRecente: 'Usg 12/11 FULC BCF160, pfe 2353g p90, CA 320(p98), MBV 5,3 Doppler normal',
          igPretendida: '37',
          indicacaoProcedimento: 'HAC+ DMG em uso de insulina + PFE p90 e CAp98',
          medicacao: 'NPH 16-14-12',
          diagnosticosMaternos: 'DMG EM USO DE INSULINA + HAC',
          placentaPrevia: 'Não',
          diagnosticosFetais: 'GIG pfe p90 e CÁ p98',
          historiaObstetrica: '-',
          necessidadeUtiMaterna: 'Não',
          necessidadeReservaSangue: 'Não',
          maternidade: 'NotreCare',
          medicoResponsavel: 'Fernanda Taniguchi Falleiros',
          emailPaciente: 'jenifferdantas2@gmail.com'
        },
        {
          id: '2572',
          horaInicio: '11/21/2025 7:51:07',
          nomeCompleto: 'Lucilene Aparecida de Almeida Santos',
          dataNascimento: '12/31/83',
          carteirinha: '0Y44C002151014',
          numeroGestacoes: 2,
          numeroCesareas: 0,
          numeroPartosNormais: 1,
          numeroAbortos: 0,
          telefones: '11 998660316/ 11 972223935',
          procedimentos: 'Cesárea',
          dumStatus: 'Sim - Confiavel',
          dataDum: '3/5/25',
          dataPrimeiroUsg: '5/6/25',
          semanasUsg: 9,
          diasUsg: 1,
          usgRecente: 'Usg 17/11 FUL CEF BCF 152bpm PFE 3081(p57), MBV 5,2cm, placa anterior II Doppler normal',
          igPretendida: '39',
          indicacaoProcedimento: 'IMA + desejo materno',
          medicacao: 'Materna',
          diagnosticosMaternos: 'Idade materna avançada',
          placentaPrevia: 'Não',
          diagnosticosFetais: '—-',
          historiaObstetrica: '—-',
          necessidadeUtiMaterna: 'Não',
          necessidadeReservaSangue: 'Não',
          maternidade: 'NotreCare',
          medicoResponsavel: 'Fernanda Taniguchi Falleiros',
          emailPaciente: 'reisfranscisco15@gmail.com'
        },
        {
          id: '2573',
          horaInicio: '11/21/2025 8:33:41',
          nomeCompleto: 'Adriana Aparecida dos Reis',
          dataNascimento: '4/14/90',
          carteirinha: '1TK3M001759000',
          numeroGestacoes: 1,
          numeroCesareas: 0,
          numeroPartosNormais: 0,
          numeroAbortos: 0,
          telefones: '11 941081775/ 11 942411039',
          procedimentos: 'Indução Programada',
          dumStatus: 'Sim - Confiavel',
          dataDum: '3/13/25',
          dataPrimeiroUsg: '5/9/25',
          semanasUsg: 8,
          diasUsg: 6,
          usgRecente: 'Usg 31+5 FULC BCF 129, PFE 1937(p78) plac anterior Grau I, mbv 6,1cm,doppler normal',
          igPretendida: '40',
          indicacaoProcedimento: 'Pós datismo + asma',
          medicacao: 'Simbicort',
          diagnosticosMaternos: 'Pós data + asma',
          placentaPrevia: 'Não',
          diagnosticosFetais: '-',
          historiaObstetrica: 'IMA + asma',
          necessidadeUtiMaterna: 'Não',
          necessidadeReservaSangue: 'Não',
          maternidade: 'NotreCare',
          medicoResponsavel: 'Fernanda Taniguchi Falleiros',
          emailPaciente: 'areis873@gmail.com'
        },
        {
          id: '2574',
          horaInicio: '11/21/2025 10:15:07',
          nomeCompleto: 'Tamires Teodoro',
          dataNascimento: '3/3/98',
          carteirinha: '1ZUNX000885010',
          numeroGestacoes: 1,
          numeroCesareas: 0,
          numeroPartosNormais: 0,
          numeroAbortos: 0,
          telefones: '11989577248/ 1174693420',
          procedimentos: 'Cesárea',
          dumStatus: 'Não sabe',
          dataDum: null,
          dataPrimeiroUsg: '6/1/25',
          semanasUsg: 9,
          diasUsg: 1,
          usgRecente: 'Usg 16/10 gemelar Didi feto 1 CEF BCF+, PFE 1135g, lá 5,8plac post I/ Feto 2 pélvico BCF+ pfe 1120, m v 5,1cm, plac ant I, Doppler normal diferença de peso 1%',
          igPretendida: '37',
          indicacaoProcedimento: 'Gemelar Didi',
          medicacao: '-',
          diagnosticosMaternos: 'Gemelar Didi',
          placentaPrevia: 'Não',
          diagnosticosFetais: 'Gemelar Didi',
          historiaObstetrica: 'Gemelar Didi',
          necessidadeUtiMaterna: 'Não',
          necessidadeReservaSangue: 'Não',
          maternidade: 'NotreCare',
          medicoResponsavel: 'Fernanda Taniguchi Falleiros',
          emailPaciente: 'tamires.teodoro0324@gmail.com'
        },
        {
          id: '2575',
          horaInicio: '11/21/2025 10:43:57',
          nomeCompleto: 'Sandra da Silva Martins',
          dataNascimento: '9/19/87',
          carteirinha: '1SRCQ000194000',
          numeroGestacoes: 4,
          numeroCesareas: 0,
          numeroPartosNormais: 0,
          numeroAbortos: 3,
          telefones: '11 980589124/ 11945387110',
          procedimentos: 'Cesárea',
          dumStatus: 'Sim - Confiavel',
          dataDum: '3/28/25',
          dataPrimeiroUsg: '6/16/25',
          semanasUsg: 11,
          diasUsg: 5,
          usgRecente: '19/11 - FUL pélvico BCF+, PFE 2488g p71, plac post I, Doppler normal MBV 4,9 Doppler normal',
          igPretendida: '39',
          indicacaoProcedimento: 'Pélvico',
          medicacao: 'Enoxaparina 40mg/d',
          diagnosticosMaternos: 'Trombofilia + IMA',
          placentaPrevia: 'Não',
          diagnosticosFetais: 'Pélvico',
          historiaObstetrica: 'SAAAF / IMA',
          necessidadeUtiMaterna: 'Não',
          necessidadeReservaSangue: 'Não',
          maternidade: 'NotreCare',
          medicoResponsavel: 'Fernanda Taniguchi Falleiros',
          emailPaciente: 'douglas.souza.f@hotmail.com'
        }
      ];

      const resultado = await processarFormsPartoFluxoNovo(pacientes, user.id);
      setResults(resultado);

      if (resultado.success > 0) {
        toast({
          title: 'Processamento concluído!',
          description: `${resultado.success} pacientes inseridas com sucesso`,
        });
      }

    } catch (error) {
      console.error('Erro no processamento:', error);
      toast({
        title: 'Erro no processamento',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Processar Forms de Parto</h1>
          <p className="text-muted-foreground">
            Importar pacientes do Forms de Parto - Fluxo Novo 2025
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Importação de Pacientes</CardTitle>
          <CardDescription>
            Este processo irá importar as pacientes das últimas linhas do Excel que ainda não foram agendadas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleProcess}
            disabled={processing}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {processing ? 'Processando...' : 'Processar Pacientes'}
          </Button>

          {results && (
            <div className="space-y-4 mt-6">
              <div className="grid grid-cols-3 gap-4">
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>{results.success}</strong> inseridas
                  </AlertDescription>
                </Alert>
                
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <strong>{results.skipped}</strong> já existentes
                  </AlertDescription>
                </Alert>
                
                <Alert className="bg-red-50 border-red-200">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>{results.failed}</strong> com erro
                  </AlertDescription>
                </Alert>
              </div>

              {results.warnings.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Avisos:</strong>
                    <ul className="mt-2 space-y-1 text-sm">
                      {results.warnings.map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {results.errors.length > 0 && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Erros:</strong>
                    <ul className="mt-2 space-y-1 text-sm">
                      {results.errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
