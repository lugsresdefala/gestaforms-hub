import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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

type SqlRecord = Record<string, string | null>;

const DEFAULT_DATA_NASCIMENTO = '1990-01-01';

const normalizeText = (value?: string | null) =>
  value?.replace(/\s+/g, ' ').trim() ?? '';

const splitTuples = (valuesBlock: string) => {
  const tuples: string[] = [];
  let depth = 0;
  let current = '';

  for (let i = 0; i < valuesBlock.length; i++) {
    const char = valuesBlock[i];

    if (char === '(') {
      if (depth === 0) {
        current = '';
      }
      depth++;
    }

    if (depth > 0) {
      current += char;
    }

    if (char === ')') {
      depth--;
      if (depth === 0) {
        tuples.push(current.trim());
        current = '';
      }
    }
  }

  return tuples;
};

const parseTupleValues = (tuple: string): (string | null)[] => {
  const values: (string | null)[] = [];
  let current = '';
  let inString = false;

  for (let i = 0; i < tuple.length; i++) {
    const char = tuple[i];

    if (char === "'" && tuple[i - 1] !== '\\') {
      inString = !inString;

      if (!inString) {
        values.push(current);
        current = '';
      }
      continue;
    }

    if (char === ',' && !inString) {
      const trimmed = current.trim();
      values.push(trimmed.length === 0 ? '' : (trimmed.toUpperCase() === 'NULL' ? null : trimmed));
      current = '';
      continue;
    }

    if (!inString && (char === '(' || char === ')')) {
      continue;
    }

    current += char;
  }

  const trimmed = current.trim();
  if (trimmed.length > 0) {
    values.push(trimmed.toUpperCase() === 'NULL' ? null : trimmed);
  }

  return values;
};

const parseInsertRecords = (sql: string, table: string): SqlRecord[] => {
  const regex = new RegExp(`INSERT INTO\\s+${table}\\s*\\(([^)]+)\\)\\s*VALUES\\s*([\\s\\S]*?);`, 'gi');
  const records: SqlRecord[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(sql)) !== null) {
    const columns = match[1]
      .split(',')
      .map(column => column.trim().replace(/["`]/g, ''));
    const valuesBlock = match[2].trim();
    const tuples = splitTuples(valuesBlock);

    for (const tuple of tuples) {
      const values = parseTupleValues(tuple);
      const record: SqlRecord = {};
      columns.forEach((column, index) => {
        record[column] = values[index] ?? null;
      });
      records.push(record);
    }
  }

  return records;
};

const toNumber = (value?: string | null) => {
  if (value === undefined || value === null) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const parseProcedimentos = (procedimento: string): string[] => {
  const normalized = procedimento
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

  const procs: string[] = [];

  if (normalized.includes('cesa')) procs.push('Cesariana');
  if (normalized.includes('laque')) procs.push('Laqueadura Tubária');
  if (normalized.includes('normal')) procs.push('Parto Normal');
  if (normalized.includes('indu')) procs.push('Indução Programada');
  if (normalized.includes('cerclag')) procs.push('Cerclagem');
  if (normalized.includes('diu')) procs.push('DIU de Cobre Pós-parto');

  return procs.length > 0 ? Array.from(new Set(procs)) : ['Parto Normal'];
};

const parseMaternidade = (idMaternidade: number): string => {
  const maternidades: { [key: number]: string } = {
    1: 'Guarulhos',
    2: 'NotreCare',
    3: 'Salvalus',
    4: 'Cruzeiro'
  };
  return maternidades[idMaternidade] || 'Guarulhos';
};

const parseSQL = (sql: string): ParsedPatient[] => {
  const maternidades = parseInsertRecords(sql, 'maternidades');
  const pacientes = parseInsertRecords(sql, 'pacientes');
  const agendamentos = parseInsertRecords(sql, 'agendamentos');

  if (pacientes.length === 0 || agendamentos.length === 0) {
    return [];
  }

  const maternidadeMap = new Map<number, string>();
  maternidades.forEach((record, index) => {
    const nome = normalizeText(record.nome) || `Maternidade ${index + 1}`;
    maternidadeMap.set(index + 1, nome);
  });

  const pacientesMap = new Map<number, SqlRecord>();
  pacientes.forEach((record, index) => {
    pacientesMap.set(index + 1, record);
  });

  const patients: ParsedPatient[] = [];

  for (const agendamento of agendamentos) {
    const pacienteId = toNumber(agendamento.id_paciente);
    const maternidadeId = toNumber(agendamento.id_maternidade);
    const paciente = pacienteId ? pacientesMap.get(pacienteId) : undefined;

    if (!paciente || !agendamento.data_agendamento) {
      continue;
    }

    const nomePaciente = normalizeText(paciente.nome ?? paciente.nome_completo);
    const carteirinha = normalizeText(paciente.carteirinha);

    if (!nomePaciente || !carteirinha) {
      continue;
    }

    patients.push({
      carteirinha,
      nome_completo: nomePaciente,
      data_nascimento: paciente.data_nascimento || DEFAULT_DATA_NASCIMENTO,
      telefone: normalizeText(paciente.telefone) || 'Não informado',
      diagnostico_materno: normalizeText(agendamento.diagnostico) || 'Não informado',
      procedimento_solicitado: normalizeText(agendamento.procedimento) || 'Parto Normal',
      data_agendada: agendamento.data_agendamento,
      maternidade: maternidadeId ? (maternidadeMap.get(maternidadeId) || parseMaternidade(maternidadeId)) : 'Guarulhos'
    });
  }

  return patients;
};

export default function ImportarSQL() {
  const [sqlContent, setSqlContent] = useState('');
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<{ success: number; failed: number; duplicates: number; errors: string[] } | null>(null);
  const { toast } = useToast();

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
            dum_status: 'Não sabe',
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
