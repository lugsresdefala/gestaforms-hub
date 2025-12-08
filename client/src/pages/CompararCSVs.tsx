import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CSVRecord {
  linha: number;
  carteirinha: string;
  nome: string;
  maternidade: string;
}

export default function CompararCSVs() {
  const [loading, setLoading] = useState(false);
  const [registrosPorMaternidade, setRegistrosPorMaternidade] = useState<Map<string, CSVRecord[]> | null>(null);
  const [selectedMaternidade, setSelectedMaternidade] = useState<string | null>(null);

  const parseCSV = (content: string): Map<string, CSVRecord[]> => {
    const lines = content.split("\n");
    const recordsByMaternidade = new Map<string, CSVRecord[]>();

    lines.forEach((line, index) => {
      if (index === 0) return;

      const parts = line.split(";").map(p => p.trim());
      if (parts.length < 6) return;

      const maternidade = parts[0];
      const carteirinha = parts[4];
      const nome = parts[5];

      if (!maternidade || !carteirinha || !nome || maternidade === "Maternidade") {
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

      const calendarioRecords = parseCSV(calendarioContent);
      setRegistrosPorMaternidade(calendarioRecords);
    } catch (error) {
      console.error('Erro ao analisar arquivo:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    analyzeFiles();
  }, []);

  const getTotalRegistros = () => {
    if (!registrosPorMaternidade) return 0;
    return Array.from(registrosPorMaternidade.values()).reduce((sum, comp) => sum + comp.length, 0);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Resumo do CSV do Calendário</h1>
        <p className="text-muted-foreground">
          Visão geral do arquivo Calendario_Nov_Dez.csv distribuída por maternidade
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-lg">Analisando arquivo...</span>
        </div>
      ) : registrosPorMaternidade ? (
        <>
          <Alert className="mb-6">
            <AlertDescription>
              O calendário atualizado possui <strong>{getTotalRegistros()} registros</strong>.
            </AlertDescription>
          </Alert>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Registros por Maternidade</CardTitle>
              <CardDescription>Totais de agendamentos encontrados no arquivo</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Maternidade</TableHead>
                    <TableHead className="text-center">Registros</TableHead>
                    <TableHead className="text-center">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from(registrosPorMaternidade.entries()).map(([mat, registros]) => (
                    <TableRow key={mat}>
                      <TableCell className="font-medium">{mat}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{registros.length}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedMaternidade(mat)}
                        >
                          Ver amostra
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {selectedMaternidade && registrosPorMaternidade.get(selectedMaternidade) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Registros em {selectedMaternidade}
                </CardTitle>
                <CardDescription>
                  Amostra dos primeiros registros encontrados no calendário atualizado
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
                    {registrosPorMaternidade
                      .get(selectedMaternidade)!
                      .slice(0, 20)
                      .map((record) => (
                        <TableRow key={`${record.carteirinha}-${record.linha}`}>
                          <TableCell>{record.linha}</TableCell>
                          <TableCell>{record.carteirinha}</TableCell>
                          <TableCell className="capitalize">{record.nome}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center text-muted-foreground py-12">
          Não foi possível carregar o arquivo do calendário.
        </div>
      )}
    </div>
  );
}
