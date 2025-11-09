import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CSVRecord {
  linha: number;
  carteirinha: string;
  nome: string;
  maternidade: string;
}

interface MaternidadeComparison {
  calendario: number;
  consolidado: number;
  diferenca: number;
  extras: CSVRecord[];
}

export default function CompararCSVs() {
  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState<Map<string, MaternidadeComparison> | null>(null);
  const [selectedMaternidade, setSelectedMaternidade] = useState<string | null>(null);

  const parseCSV = (content: string): Map<string, CSVRecord[]> => {
    const lines = content.split('\n');
    const recordsByMaternidade = new Map<string, CSVRecord[]>();
    
    lines.forEach((line, index) => {
      if (index === 0) return;
      
      const parts = line.split(';').map(p => p.trim());
      if (parts.length < 6) return;
      
      const maternidade = parts[0];
      const carteirinha = parts[4];
      const nome = parts[5];
      
      if (!maternidade || !carteirinha || !nome || maternidade === 'Maternidade') {
        return;
      }
      
      if (!recordsByMaternidade.has(maternidade)) {
        recordsByMaternidade.set(maternidade, []);
      }
      
      recordsByMaternidade.get(maternidade)!.push({
        linha: index + 1,
        carteirinha,
        nome: nome.toLowerCase().trim(),
        maternidade
      });
    });
    
    return recordsByMaternidade;
  };

  const analyzeFiles = async () => {
    setLoading(true);
    try {
      const calendarioResponse = await fetch('/calendars/Calendario_Nov_Dez.csv');
      const calendarioContent = await calendarioResponse.text();
      
      const consolidadoResponse = await fetch('/calendars/Consolidado_Novembro_Dezembro.csv');
      const consolidadoContent = await consolidadoResponse.text();
      
      const calendarioRecords = parseCSV(calendarioContent);
      const consolidadoRecords = parseCSV(consolidadoContent);
      
      const allMaternidades = new Set([
        ...Array.from(calendarioRecords.keys()),
        ...Array.from(consolidadoRecords.keys())
      ]);
      
      const result = new Map<string, MaternidadeComparison>();
      
      allMaternidades.forEach(mat => {
        const calRecords = calendarioRecords.get(mat) || [];
        const conRecords = consolidadoRecords.get(mat) || [];
        
        const calKeys = new Set(calRecords.map(r => `${r.carteirinha}-${r.nome}`));
        const onlyInConsolidado = conRecords.filter(r => 
          !calKeys.has(`${r.carteirinha}-${r.nome}`)
        );
        
        result.set(mat, {
          calendario: calRecords.length,
          consolidado: conRecords.length,
          diferenca: conRecords.length - calRecords.length,
          extras: onlyInConsolidado
        });
      });
      
      setComparison(result);
    } catch (error) {
      console.error('Erro ao analisar arquivos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    analyzeFiles();
  }, []);

  const getTotalExtras = () => {
    if (!comparison) return 0;
    return Array.from(comparison.values()).reduce((sum, comp) => sum + comp.extras.length, 0);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Comparação de Arquivos CSV</h1>
        <p className="text-muted-foreground">
          Análise detalhada das diferenças entre Calendario_Nov_Dez.csv e Consolidado_Novembro_Dezembro.csv
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-lg">Analisando arquivos...</span>
        </div>
      ) : comparison ? (
        <>
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Foram encontrados <strong>{getTotalExtras()} registros extras</strong> no arquivo Consolidado que não existem no Calendario.
            </AlertDescription>
          </Alert>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Resumo por Maternidade</CardTitle>
              <CardDescription>Comparação de registros válidos em cada arquivo</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Maternidade</TableHead>
                    <TableHead className="text-center">Calendario</TableHead>
                    <TableHead className="text-center">Consolidado</TableHead>
                    <TableHead className="text-center">Diferença</TableHead>
                    <TableHead className="text-center">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from(comparison.entries()).map(([mat, comp]) => (
                    <TableRow key={mat}>
                      <TableCell className="font-medium">{mat}</TableCell>
                      <TableCell className="text-center">{comp.calendario}</TableCell>
                      <TableCell className="text-center">{comp.consolidado}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={comp.diferenca > 0 ? "destructive" : "secondary"}>
                          {comp.diferenca > 0 ? `+${comp.diferenca}` : comp.diferenca}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {comp.extras.length > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedMaternidade(mat)}
                          >
                            Ver {comp.extras.length} extras
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {selectedMaternidade && comparison.get(selectedMaternidade) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Registros Extras em {selectedMaternidade}
                </CardTitle>
                <CardDescription>
                  Estes {comparison.get(selectedMaternidade)!.extras.length} pacientes estão no Consolidado mas não no Calendario
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Linha</TableHead>
                      <TableHead>Carteirinha</TableHead>
                      <TableHead>Nome</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comparison.get(selectedMaternidade)!.extras.map((record, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-sm">{record.linha}</TableCell>
                        <TableCell className="font-mono text-sm">{record.carteirinha}</TableCell>
                        <TableCell>{record.nome}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4">
                  <Button variant="ghost" onClick={() => setSelectedMaternidade(null)}>
                    Fechar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}
    </div>
  );
}
