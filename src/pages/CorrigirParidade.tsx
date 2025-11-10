import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

interface ParidadeData {
  carteirinha: string;
  nome: string;
  gestacoes: number;
  partosNormais: number;
  cesareas: number;
  abortos: number;
  diagnosticoCompleto: string;
}

const extrairParidade = (diagnostico: string): { gestacoes: number; partosNormais: number; cesareas: number; abortos: number } => {
  if (!diagnostico) {
    return { gestacoes: 1, partosNormais: 0, cesareas: 0, abortos: 0 };
  }

  // Padrões: "3g2n", "2g1c", "4g2n1c1a", etc
  const patterns = [
    /(\d+)g(\d+)n(\d+)c(\d+)a/i, // Completo: gestações, normais, cesáreas, abortos
    /(\d+)g(\d+)n(\d+)c/i,       // 3 componentes: gestações, normais, cesáreas
    /(\d+)g(\d+)n(\d+)a/i,       // gestações, normais, abortos
    /(\d+)g(\d+)c(\d+)a/i,       // gestações, cesáreas, abortos
    /(\d+)g(\d+)n/i,             // gestações, normais
    /(\d+)g(\d+)c/i,             // gestações, cesáreas
    /(\d+)g(\d+)a/i,             // gestações, abortos
    /(\d+)g/i,                   // Apenas gestações
  ];

  for (const pattern of patterns) {
    const match = diagnostico.match(pattern);
    if (match) {
      const gestacoes = parseInt(match[1]);
      let partosNormais = 0;
      let cesareas = 0;
      let abortos = 0;

      if (pattern.source.includes('n')) {
        const nIndex = pattern.source.indexOf('n');
        const groupIndex = (nIndex - pattern.source.substring(0, nIndex).split('(').length) + 2;
        partosNormais = parseInt(match[groupIndex] || '0');
      }

      if (pattern.source.includes('c')) {
        const cIndex = pattern.source.indexOf('c');
        const groupsBefore = pattern.source.substring(0, cIndex).split('(\\d+)').length - 1;
        cesareas = parseInt(match[groupsBefore + 1] || '0');
      }

      if (pattern.source.includes('a')) {
        const aIndex = pattern.source.indexOf('a');
        const groupsBefore = pattern.source.substring(0, aIndex).split('(\\d+)').length - 1;
        abortos = parseInt(match[groupsBefore + 1] || '0');
      }

      // Se não tem abortos explícitos, calcula: gestações - (normais + cesáreas)
      if (abortos === 0 && gestacoes > partosNormais + cesareas) {
        abortos = gestacoes - partosNormais - cesareas;
      }

      return { gestacoes, partosNormais, cesareas, abortos };
    }
  }

  return { gestacoes: 1, partosNormais: 0, cesareas: 0, abortos: 0 };
};

const parseCSVLine = (line: string): { carteirinha: string; nome: string; diagnostico: string } | null => {
  const parts = line.split(';');
  if (parts.length < 8) return null;

  const carteirinha = parts[4]?.trim();
  const nome = parts[5]?.trim();
  const diagnostico = parts[7]?.trim();

  if (!carteirinha || !nome || carteirinha === 'CARTEIRINHA') return null;

  return { carteirinha, nome, diagnostico };
};

export default function CorrigirParidade() {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<{
    total: number;
    sucesso: number;
    falhas: number;
    naoEncontrados: number;
  } | null>(null);

  const processarCorrecao = async () => {
    setLoading(true);
    setResultado(null);

    try {
      // Buscar o CSV
      const response = await fetch('/calendars/Consolidado_Novembro_Dezembro.csv');
      const csvText = await response.text();
      
      const lines = csvText.split('\n');
      const dadosParaCorrigir: ParidadeData[] = [];

      // Processar cada linha do CSV
      for (let i = 1; i < lines.length; i++) {
        const parsed = parseCSVLine(lines[i]);
        if (!parsed) continue;

        const paridade = extrairParidade(parsed.diagnostico);
        dadosParaCorrigir.push({
          carteirinha: parsed.carteirinha,
          nome: parsed.nome,
          diagnosticoCompleto: parsed.diagnostico,
          ...paridade
        });
      }

      console.log(`📊 Total de registros para corrigir: ${dadosParaCorrigir.length}`);

      let sucesso = 0;
      let falhas = 0;
      let naoEncontrados = 0;

      // Atualizar cada registro no banco
      for (const dados of dadosParaCorrigir) {
        try {
          // Verificar se existe
          const { data: existing, error: checkError } = await supabase
            .from('agendamentos_obst')
            .select('id')
            .eq('carteirinha', dados.carteirinha)
            .single();

          if (checkError || !existing) {
            naoEncontrados++;
            continue;
          }

          // Atualizar
          const { error: updateError } = await supabase
            .from('agendamentos_obst')
            .update({
              numero_gestacoes: dados.gestacoes,
              numero_partos_normais: dados.partosNormais,
              numero_partos_cesareas: dados.cesareas,
              numero_abortos: dados.abortos,
              diagnosticos_maternos: dados.diagnosticoCompleto
            })
            .eq('carteirinha', dados.carteirinha);

          if (updateError) {
            console.error(`❌ Erro ao atualizar ${dados.carteirinha}:`, updateError);
            falhas++;
          } else {
            console.log(`✅ Corrigido: ${dados.nome} (${dados.gestacoes}g${dados.partosNormais}n${dados.cesareas}c${dados.abortos}a)`);
            sucesso++;
          }
        } catch (err) {
          console.error(`❌ Erro processando ${dados.carteirinha}:`, err);
          falhas++;
        }
      }

      setResultado({
        total: dadosParaCorrigir.length,
        sucesso,
        falhas,
        naoEncontrados
      });

      toast({
        title: "✅ Correção Concluída",
        description: `${sucesso} registros corrigidos, ${falhas} falhas, ${naoEncontrados} não encontrados.`
      });

    } catch (error) {
      console.error('Erro ao processar correção:', error);
      toast({
        title: "❌ Erro",
        description: "Erro ao processar a correção de paridade.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Corrigir Paridade dos Dados Importados</CardTitle>
          <CardDescription>
            Esta ferramenta corrige a paridade (gestações, partos normais, cesáreas, abortos) 
            de TODOS os pacientes importados do arquivo Consolidado_Novembro_Dezembro.csv
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <h3 className="font-semibold mb-2">O que será corrigido:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Número de gestações (extraído de "3g2n" → 3 gestações)</li>
              <li>Número de partos normais (extraído de "3g2n" → 2 partos normais)</li>
              <li>Número de cesáreas (extraído de "2g1c" → 1 cesárea)</li>
              <li>Número de abortos (calculado: gestações - partos ou extraído)</li>
              <li>Diagnóstico materno completo (todo o texto do campo DIAGNÓSTICO)</li>
            </ul>
          </div>

          {resultado && (
            <div className="rounded-lg bg-accent/50 p-4">
              <h3 className="font-semibold mb-2">Resultado da Correção:</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Total processado:</div>
                <div className="font-semibold">{resultado.total}</div>
                <div>✅ Sucesso:</div>
                <div className="font-semibold text-green-600">{resultado.sucesso}</div>
                <div>❌ Falhas:</div>
                <div className="font-semibold text-red-600">{resultado.falhas}</div>
                <div>⚠️ Não encontrados:</div>
                <div className="font-semibold text-yellow-600">{resultado.naoEncontrados}</div>
              </div>
            </div>
          )}

          <Button 
            onClick={processarCorrecao} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              'Executar Correção de Todos os Registros'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
