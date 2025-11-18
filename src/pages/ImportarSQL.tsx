import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

interface ParsedPatient {
  carteirinha: string;
  nome_completo: string;
  data_nascimento: string;
  telefone: string;
  diagnostico_materno: string;
  procedimento_solicitado: string;
  data_agendada: string;
  maternidade: string;
}

export default function ImportarSQL() {
  const [sqlContent, setSqlContent] = useState('');
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<{ success: number; failed: number; duplicates: number; errors: string[] } | null>(null);
  const { toast } = useToast();

  const parseMaternidade = (idMaternidade: number): string => {
    const maternidades: { [key: number]: string } = {
      1: 'Guarulhos',
      2: 'NotreCare',
      3: 'Salvalus',
      4: 'Cruzeiro'
    };
    return maternidades[idMaternidade] || 'Guarulhos';
  };

  const parseProcedimentos = (procedimento: string): string[] => {
    const lower = procedimento.toLowerCase();
    const procs: string[] = [];
    
    if (lower.includes('cesarea') || lower.includes('cesárea')) procs.push('Cesariana');
    if (lower.includes('laqueadura')) procs.push('Laqueadura Tubária');
    if (lower.includes('normal')) procs.push('Parto Normal');
    
    return procs.length > 0 ? procs : ['Parto Normal'];
  };

  const parseSQL = (sql: string): ParsedPatient[] => {
    const patients: ParsedPatient[] = [];
    const lines = sql.split('\n');
    
    let currentPatient: Partial<ParsedPatient> = {};
    let currentMaternidade = '';
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Identificar maternidade
      if (trimmed.includes("INSERT INTO maternidades")) {
        const match = trimmed.match(/VALUES \((\d+), '([^']+)'\)/);
        if (match) {
          currentMaternidade = match[2];
        }
      }
      
      // Parse paciente
      if (trimmed.includes("INSERT INTO pacientes")) {
        const match = trimmed.match(/VALUES \(\d+, '([^']+)', '([^']+)', '([^']+)', '([^']+)'\)/);
        if (match) {
          currentPatient = {
            carteirinha: match[1],
            nome_completo: match[2],
            data_nascimento: match[3].split(' ')[0],
            telefone: match[4]
          };
        }
      }
      
      // Parse diagnóstico
      if (trimmed.includes("INSERT INTO diagnosticos")) {
        const match = trimmed.match(/VALUES \(\d+, \d+, '([^']+)', '([^']+)'\)/);
        if (match && currentPatient.carteirinha) {
          currentPatient.diagnostico_materno = match[1].replace(/\t/g, ' ').trim();
          currentPatient.procedimento_solicitado = match[2];
        }
      }
      
      // Parse agendamento
      if (trimmed.includes("INSERT INTO agendamentos")) {
        const match = trimmed.match(/VALUES \(\d+, \d+, (\d+), '([^']+)', '[^']+'\)/);
        if (match && currentPatient.carteirinha) {
          const idMaternidade = parseInt(match[1]);
          currentPatient.data_agendada = match[2];
          currentPatient.maternidade = parseMaternidade(idMaternidade);
          
          if (currentPatient.carteirinha && currentPatient.nome_completo && 
              currentPatient.data_nascimento && currentPatient.data_agendada) {
            patients.push(currentPatient as ParsedPatient);
            currentPatient = {};
          }
        }
      }
    }
    
    return patients;
  };

  const importPatients = async () => {
    setProcessing(true);
    setResults(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive"
        });
        return;
      }

      const patients = parseSQL(sqlContent);
      
      if (patients.length === 0) {
        toast({
          title: "Aviso",
          description: "Nenhum paciente encontrado no SQL",
          variant: "destructive"
        });
        setProcessing(false);
        return;
      }

      const importResults = { success: 0, failed: 0, duplicates: 0, errors: [] as string[] };
      
      for (const patient of patients) {
        try {
          // Verificar se já existe agendamento com mesma carteirinha e data
          const { data: existingAgendamento } = await supabase
            .from('agendamentos_obst')
            .select('id')
            .eq('carteirinha', patient.carteirinha)
            .eq('data_agendamento_calculada', patient.data_agendada)
            .maybeSingle();

          if (existingAgendamento) {
            importResults.duplicates++;
            importResults.errors.push(`${patient.nome_completo}: Duplicado - já existe agendamento para esta carteirinha e data`);
            continue;
          }

          const agendamento = {
            carteirinha: patient.carteirinha,
            nome_completo: patient.nome_completo,
            data_nascimento: patient.data_nascimento,
            telefones: patient.telefone || 'Não informado',
            maternidade: patient.maternidade,
            data_agendamento_calculada: patient.data_agendada,
            procedimentos: parseProcedimentos(patient.procedimento_solicitado),
            diagnosticos_maternos: patient.diagnostico_materno || 'Não informado',
            indicacao_procedimento: patient.diagnostico_materno || 'Conforme protocolo',
            
            // Campos obrigatórios com valores padrão
            numero_gestacoes: 1,
            numero_partos_cesareas: 0,
            numero_partos_normais: 0,
            numero_abortos: 0,
            dum_status: 'Não sabe informar',
            data_dum: null,
            data_primeiro_usg: patient.data_nascimento,
            semanas_usg: 0,
            dias_usg: 0,
            usg_recente: 'Não',
            ig_pretendida: '37-40 semanas',
            medicacao: 'Conforme prescrição',
            placenta_previa: 'Não',
            diagnosticos_fetais: 'Sem alterações',
            necessidade_uti_materna: 'Não',
            necessidade_reserva_sangue: 'Não',
            medico_responsavel: 'Importado do SQL',
            centro_clinico: 'Importado',
            email_paciente: 'nao-informado@example.com',
            status: 'aprovado',
            created_by: user.id
          };

          const { error } = await supabase
            .from('agendamentos_obst')
            .insert(agendamento);

          if (error) {
            importResults.failed++;
            importResults.errors.push(`${patient.nome_completo}: ${error.message}`);
          } else {
            importResults.success++;
          }
        } catch (error) {
          importResults.failed++;
          importResults.errors.push(`${patient.nome_completo}: ${error}`);
        }
      }

      setResults(importResults);
      
      toast({
        title: "Importação Concluída",
        description: `${importResults.success} pacientes importados com sucesso`,
      });
    } catch (error) {
      toast({
        title: "Erro na Importação",
        description: `${error}`,
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle>Importar Agendamentos do SQL</CardTitle>
          <CardDescription>
            Cole o conteúdo do arquivo inserts_agendas.sql para importar os 159 agendamentos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Cole aqui o conteúdo do arquivo SQL..."
            value={sqlContent}
            onChange={(e) => setSqlContent(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
          />
          
          <Button 
            onClick={importPatients} 
            disabled={processing || !sqlContent}
            className="w-full"
          >
            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {processing ? 'Importando...' : 'Importar Agendamentos'}
          </Button>

          {results && (
            <Card>
              <CardHeader>
                <CardTitle>Resultados da Importação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-green-600">✓ Sucesso: {results.success}</p>
                  <p className="text-yellow-600">⊘ Duplicados: {results.duplicates}</p>
                  <p className="text-red-600">✗ Falhas: {results.failed}</p>
                  
                  {results.errors.length > 0 && (
                    <div className="mt-4">
                      <p className="font-semibold mb-2">Detalhes:</p>
                      <div className="max-h-48 overflow-y-auto">
                        {results.errors.map((error, i) => (
                          <p key={i} className="text-sm text-muted-foreground">{error}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
