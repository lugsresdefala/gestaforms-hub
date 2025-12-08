import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface PacienteForm1 {
  id: string;
  carteirinha: string;
  nome: string;
  maternidade: string;
  linha: number;
}

interface Resultado {
  naoEncontradas: PacienteForm1[];
  duplicadas: Array<{
    paciente: PacienteForm1;
    ocorrencias: number;
  }>;
}

export default function AnalisarForm1() {
  const [processando, setProcessando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  const normalizarTexto = (texto: string): string => {
    return texto
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  };

  const analisarForm1 = async () => {
    try {
      setProcessando(true);
      toast.info("Carregando arquivo Form1...");

      // Carregar arquivo Excel
      const response = await fetch("/csv-temp/Form1_FINAL_COMPLETO.xlsx");
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      // Extrair pacientes do Form1 (a partir da linha 2, após cabeçalhos)
      const pacientesForm1: PacienteForm1[] = [];
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row[2] || !row[4]) continue; // Nome e carteirinha

        const carteirinha = normalizarTexto(String(row[4] || ""));
        const nome = normalizarTexto(String(row[2] || ""));
        const maternidade = String(row[26] || "").trim();

        if (carteirinha && nome) {
          pacientesForm1.push({
            id: String(row[0] || ""),
            carteirinha,
            nome,
            maternidade,
            linha: i + 1
          });
        }
      }

      toast.info(`${pacientesForm1.length} pacientes encontradas no Form1`);

      // Buscar todas as pacientes no banco
      const { data: agendamentos, error } = await supabase
        .from("agendamentos_obst")
        .select("carteirinha, nome_completo, maternidade");

      if (error) throw error;

      toast.info(`${agendamentos?.length || 0} agendamentos no banco de dados`);

      // Normalizar dados do banco
      const pacientesBanco = new Map<string, { nome: string; maternidade: string }>();
      const contagemCarteirinha = new Map<string, number>();

      agendamentos?.forEach((ag) => {
        const carteirinha = normalizarTexto(ag.carteirinha);
        const nome = normalizarTexto(ag.nome_completo);
        
        pacientesBanco.set(carteirinha, { nome, maternidade: ag.maternidade });
        
        // Contar ocorrências de carteirinha
        contagemCarteirinha.set(
          carteirinha,
          (contagemCarteirinha.get(carteirinha) || 0) + 1
        );
      });

      // Identificar pacientes não encontradas
      const naoEncontradas: PacienteForm1[] = [];
      const duplicadas: Array<{ paciente: PacienteForm1; ocorrencias: number }> = [];

      pacientesForm1.forEach((paciente) => {
        const dadosBanco = pacientesBanco.get(paciente.carteirinha);
        
        if (!dadosBanco) {
          naoEncontradas.push(paciente);
        } else {
          const ocorrencias = contagemCarteirinha.get(paciente.carteirinha) || 0;
          if (ocorrencias > 1) {
            duplicadas.push({ paciente, ocorrencias });
          }
        }
      });

      setResultado({ naoEncontradas, duplicadas });

      toast.success(
        `Análise concluída: ${naoEncontradas.length} ausentes, ${duplicadas.length} duplicadas`
      );
    } catch (error) {
      console.error("Erro ao analisar Form1:", error);
      toast.error("Erro ao analisar arquivo");
    } finally {
      setProcessando(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Análise Form1 - Verificação de Pacientes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertDescription>
              Esta ferramenta verifica se as pacientes do arquivo Form1_FINAL_COMPLETO.xlsx
              estão cadastradas no banco de dados e identifica duplicatas.
            </AlertDescription>
          </Alert>

          <Button onClick={analisarForm1} disabled={processando}>
            {processando ? "Analisando..." : "Analisar Form1"}
          </Button>

          {resultado && (
            <div className="space-y-6">
              {/* Pacientes não encontradas */}
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Pacientes Ausentes no Banco ({resultado.naoEncontradas.length})
                </h3>
                {resultado.naoEncontradas.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID Form1</TableHead>
                        <TableHead>Linha</TableHead>
                        <TableHead>Carteirinha</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Maternidade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resultado.naoEncontradas.map((p, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{p.id}</TableCell>
                          <TableCell>{p.linha}</TableCell>
                          <TableCell className="font-mono text-sm">{p.carteirinha}</TableCell>
                          <TableCell>{p.nome}</TableCell>
                          <TableCell>{p.maternidade}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Alert>
                    <AlertDescription>
                      ✅ Todas as pacientes do Form1 estão cadastradas no banco!
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Pacientes duplicadas */}
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Pacientes Duplicadas no Banco ({resultado.duplicadas.length})
                </h3>
                {resultado.duplicadas.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID Form1</TableHead>
                        <TableHead>Linha</TableHead>
                        <TableHead>Carteirinha</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Maternidade</TableHead>
                        <TableHead>Ocorrências</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resultado.duplicadas.map((d, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{d.paciente.id}</TableCell>
                          <TableCell>{d.paciente.linha}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {d.paciente.carteirinha}
                          </TableCell>
                          <TableCell>{d.paciente.nome}</TableCell>
                          <TableCell>{d.paciente.maternidade}</TableCell>
                          <TableCell>
                            <Badge variant="destructive">{d.ocorrencias}x</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Alert>
                    <AlertDescription>
                      ✅ Nenhuma duplicata encontrada no banco!
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
