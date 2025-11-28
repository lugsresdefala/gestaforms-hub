/**
 * Auditoria de Agendamentos - Página Admin
 * 
 * Permite upload/colagem de texto para auditoria automatizada de agendamentos:
 * - Comparação banco vs calendários
 * - Detecção de duplicidades
 * - Verificação de overbooking
 * - Redistribuição automática
 * - Geração de relatórios CSV
 */

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { 
  FileDown, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  Calendar,
  FileText,
  RefreshCw,
  Database
} from "lucide-react";

// Import processing functions
import {
  parseBanco,
  parseCalendario,
  processarRegistros,
  compararBancoCalendario,
  gerarCSVComparacao,
  gerarCSVAjustesDomingo,
  gerarCSVAgendaFinal,
  gerarCSVProblemas,
  type RegistroBanco,
  type RegistroCalendario,
  type RegistroAgendamento,
  type ResultadoComparacao,
  type ResultadoProcessamento,
} from "../../../scripts/processarAgendas";

interface ProcessingState {
  isProcessing: boolean;
  hasResults: boolean;
  resultado: ResultadoProcessamento | null;
  comparacao: ResultadoComparacao[];
}

export default function AuditoriaAgendamentos() {
  const { isAdmin, isAdminMed } = useAuth();
  const hasAccess = isAdmin() || isAdminMed();

  // Input state
  const [textoBanco, setTextoBanco] = useState<string>("");
  const [textoGuarulhosNov, setTextoGuarulhosNov] = useState<string>("");
  const [textoGuarulhosDez, setTextoGuarulhosDez] = useState<string>("");
  const [textoCruzeiroNov, setTextoCruzeiroNov] = useState<string>("");
  const [textoCruzeiroDez, setTextoCruzeiroDez] = useState<string>("");

  // Processing state
  const [state, setState] = useState<ProcessingState>({
    isProcessing: false,
    hasResults: false,
    resultado: null,
    comparacao: [],
  });

  /**
   * Simula o processamento em memória
   */
  const handleSimular = useCallback(() => {
    if (!textoBanco.trim()) {
      toast.error("Por favor, cole os dados do banco de dados.");
      return;
    }

    setState(prev => ({ ...prev, isProcessing: true }));

    try {
      // Parse banco data
      const registrosBanco = parseBanco(textoBanco);
      
      if (registrosBanco.length === 0) {
        toast.error("Nenhum registro encontrado nos dados do banco.");
        setState(prev => ({ ...prev, isProcessing: false }));
        return;
      }

      // Parse calendarios
      const registrosCalendario: RegistroCalendario[] = [];
      
      if (textoGuarulhosNov.trim()) {
        registrosCalendario.push(...parseCalendario(textoGuarulhosNov, 11, 2025, "Guarulhos"));
      }
      if (textoGuarulhosDez.trim()) {
        registrosCalendario.push(...parseCalendario(textoGuarulhosDez, 12, 2025, "Guarulhos"));
      }
      if (textoCruzeiroNov.trim()) {
        registrosCalendario.push(...parseCalendario(textoCruzeiroNov, 11, 2025, "Cruzeiro"));
      }
      if (textoCruzeiroDez.trim()) {
        registrosCalendario.push(...parseCalendario(textoCruzeiroDez, 12, 2025, "Cruzeiro"));
      }

      // Process records
      const resultado = processarRegistros(registrosBanco);

      // Compare banco vs calendario
      const comparacao = registrosCalendario.length > 0 
        ? compararBancoCalendario(registrosBanco, registrosCalendario)
        : [];

      setState({
        isProcessing: false,
        hasResults: true,
        resultado,
        comparacao,
      });

      toast.success(`Simulação concluída! ${resultado.registros.length} registros processados.`);
    } catch (error) {
      console.error("Erro no processamento:", error);
      toast.error("Erro ao processar os dados. Verifique o formato.");
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [textoBanco, textoGuarulhosNov, textoGuarulhosDez, textoCruzeiroNov, textoCruzeiroDez]);

  /**
   * Download de arquivo CSV
   */
  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Gera e baixa todos os CSVs
   */
  const handleGerarCSVs = useCallback(() => {
    if (!state.resultado) {
      toast.error("Execute a simulação primeiro.");
      return;
    }

    try {
      const { resultado, comparacao } = state;

      // Gerar e baixar cada CSV
      if (comparacao.length > 0) {
        downloadCSV(gerarCSVComparacao(comparacao), "comparacao.csv");
      }

      if (resultado.ajustes_domingo.length > 0) {
        downloadCSV(gerarCSVAjustesDomingo(resultado.ajustes_domingo), "ajustes_domingo.csv");
      }

      downloadCSV(gerarCSVAgendaFinal(resultado.registros), "agenda_final.csv");

      if (resultado.problemas.length > 0) {
        downloadCSV(gerarCSVProblemas(resultado.problemas), "problemas.csv");
      }

      toast.success("CSVs gerados com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar CSVs:", error);
      toast.error("Erro ao gerar CSVs.");
    }
  }, [state]);

  /**
   * Exibe plano de correções (sem aplicar no DB)
   */
  const handleAplicarCorrecoes = useCallback(() => {
    if (!state.resultado) {
      toast.error("Execute a simulação primeiro.");
      return;
    }

    toast.info(
      "Funcionalidade de aplicação no banco está em desenvolvimento. " +
      "Por enquanto, utilize os CSVs gerados para revisão manual."
    );
  }, [state.resultado]);

  // Acesso negado
  if (!hasAccess) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              Você não tem permissão para acessar esta página.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Auditoria de Agendamentos</h1>
        <p className="text-muted-foreground">
          Auditoria automatizada de agendamentos obstétricos: correção de encoding, 
          verificação de datas, capacidade e duplicidades.
        </p>
      </div>

      {/* Área de Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Dados para Auditoria
          </CardTitle>
          <CardDescription>
            Cole os dados do banco e dos calendários para processamento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dados do Banco */}
          <div className="space-y-2">
            <Label htmlFor="banco">
              Dados do Banco (Nome, Carteirinha, Maternidade, Data) - Separados por TAB ou vírgula
            </Label>
            <Textarea
              id="banco"
              placeholder="Maria Silva&#9;12345&#9;Guarulhos&#9;2025-11-03&#10;João Santos&#9;67890&#9;NotreCare&#9;2025-11-04"
              value={textoBanco}
              onChange={(e) => setTextoBanco(e.target.value)}
              className="min-h-[150px] font-mono text-sm"
            />
          </div>

          <Separator />

          {/* Calendários */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="guarulhos-nov">Calendário Guarulhos - Novembro 2025</Label>
              <Textarea
                id="guarulhos-nov"
                placeholder="1&#10;Maria Silva&#10;João Santos&#10;2&#10;Ana Paula"
                value={textoGuarulhosNov}
                onChange={(e) => setTextoGuarulhosNov(e.target.value)}
                className="min-h-[100px] font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guarulhos-dez">Calendário Guarulhos - Dezembro 2025</Label>
              <Textarea
                id="guarulhos-dez"
                placeholder="1&#10;Maria Silva&#10;2&#10;Ana Paula"
                value={textoGuarulhosDez}
                onChange={(e) => setTextoGuarulhosDez(e.target.value)}
                className="min-h-[100px] font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cruzeiro-nov">Calendário Cruzeiro - Novembro 2025</Label>
              <Textarea
                id="cruzeiro-nov"
                placeholder="1&#10;Pedro Costa&#10;2&#10;Laura Lima"
                value={textoCruzeiroNov}
                onChange={(e) => setTextoCruzeiroNov(e.target.value)}
                className="min-h-[100px] font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cruzeiro-dez">Calendário Cruzeiro - Dezembro 2025</Label>
              <Textarea
                id="cruzeiro-dez"
                placeholder="1&#10;Pedro Costa&#10;2&#10;Laura Lima"
                value={textoCruzeiroDez}
                onChange={(e) => setTextoCruzeiroDez(e.target.value)}
                className="min-h-[100px] font-mono text-sm"
              />
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={handleSimular} 
              disabled={state.isProcessing}
              className="flex items-center gap-2"
            >
              {state.isProcessing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Simular
            </Button>
            <Button 
              onClick={handleGerarCSVs} 
              disabled={!state.hasResults}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <FileDown className="h-4 w-4" />
              Gerar CSVs
            </Button>
            <Button 
              onClick={handleAplicarCorrecoes} 
              disabled={!state.hasResults}
              variant="outline"
              className="flex items-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Aplicar Correções
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {state.hasResults && state.resultado && (
        <>
          {/* Cards de Resumo */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Registros</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{state.resultado.registros.length}</div>
                <p className="text-xs text-muted-foreground">
                  Registros processados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mantidos</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {state.resultado.registros.filter(r => r.status === 'mantido').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Sem alterações
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ajustados</CardTitle>
                <Calendar className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {state.resultado.registros.filter(r => r.status === 'ajustado').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Data alterada
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Needs Review</CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  {state.resultado.problemas.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Revisão manual
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs com Detalhes */}
          <Tabs defaultValue="resumo" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="resumo">Resumo</TabsTrigger>
              <TabsTrigger value="duplicidades">Duplicidades ({state.resultado.duplicidades.length})</TabsTrigger>
              <TabsTrigger value="domingo">Ajustes Domingo ({state.resultado.ajustes_domingo.length})</TabsTrigger>
              <TabsTrigger value="overbooking">Overbooking ({state.resultado.overbooking.length})</TabsTrigger>
              <TabsTrigger value="problemas">Needs Review ({state.resultado.problemas.length})</TabsTrigger>
            </TabsList>

            {/* Tab Resumo */}
            <TabsContent value="resumo">
              <Card>
                <CardHeader>
                  <CardTitle>Resumo do Processamento</CardTitle>
                  <CardDescription>Visão geral das alterações realizadas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertTitle>Processamento Concluído</AlertTitle>
                      <AlertDescription>
                        {state.resultado.registros.length} registros analisados.{" "}
                        {state.resultado.registros.filter(r => r.status === 'ajustado').length} ajustados,{" "}
                        {state.resultado.problemas.length} precisam de revisão manual.
                      </AlertDescription>
                    </Alert>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead>Carteirinha</TableHead>
                          <TableHead>Maternidade</TableHead>
                          <TableHead>Data Original</TableHead>
                          <TableHead>Data Final</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {state.resultado.registros.slice(0, 20).map((reg) => (
                          <TableRow key={reg.id_interno}>
                            <TableCell className="font-mono">{reg.id_interno}</TableCell>
                            <TableCell>{reg.nome_original}</TableCell>
                            <TableCell className="font-mono">{reg.carteirinha || "-"}</TableCell>
                            <TableCell>{reg.maternidade}</TableCell>
                            <TableCell>{reg.data_original}</TableCell>
                            <TableCell>{reg.data_final}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  reg.status === 'mantido' ? 'default' : 
                                  reg.status === 'ajustado' ? 'secondary' : 
                                  'destructive'
                                }
                              >
                                {reg.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {state.resultado.registros.length > 20 && (
                      <p className="text-sm text-muted-foreground text-center">
                        Mostrando 20 de {state.resultado.registros.length} registros. 
                        Baixe o CSV para ver todos.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Duplicidades */}
            <TabsContent value="duplicidades">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Duplicidades Detectadas
                  </CardTitle>
                  <CardDescription>
                    Pacientes com múltiplos agendamentos na mesma maternidade
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {state.resultado.duplicidades.length === 0 ? (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertTitle>Nenhuma duplicidade</AlertTitle>
                      <AlertDescription>
                        Não foram encontrados pacientes com agendamentos duplicados.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Carteirinha</TableHead>
                          <TableHead>Datas Antes</TableHead>
                          <TableHead>Datas Depois</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {state.resultado.duplicidades.map((dup, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{dup.nome}</TableCell>
                            <TableCell className="font-mono">{dup.carteirinha || "-"}</TableCell>
                            <TableCell>{dup.registros_antes.join(", ")}</TableCell>
                            <TableCell>{dup.registros_depois.join(", ")}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Ajustes Domingo */}
            <TabsContent value="domingo">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Ajustes de Domingo
                  </CardTitle>
                  <CardDescription>
                    Agendamentos que foram movidos de domingo para próximo dia útil
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {state.resultado.ajustes_domingo.length === 0 ? (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertTitle>Nenhum ajuste de domingo</AlertTitle>
                      <AlertDescription>
                        Não foram encontrados agendamentos em domingos.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Data Original (Domingo)</TableHead>
                          <TableHead>Data Ajustada</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {state.resultado.ajustes_domingo.map((ajuste, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{ajuste.nome}</TableCell>
                            <TableCell className="text-red-600">{ajuste.data_original}</TableCell>
                            <TableCell className="text-green-600">{ajuste.data_ajustada}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Overbooking */}
            <TabsContent value="overbooking">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Overbooking Detectado
                  </CardTitle>
                  <CardDescription>
                    Dias com agendamentos acima da capacidade
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {state.resultado.overbooking.length === 0 ? (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertTitle>Sem overbooking</AlertTitle>
                      <AlertDescription>
                        Nenhum dia está acima da capacidade máxima.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Maternidade</TableHead>
                          <TableHead>Capacidade</TableHead>
                          <TableHead>Total Agendado</TableHead>
                          <TableHead>Excedente</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {state.resultado.overbooking.map((ob, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{ob.data}</TableCell>
                            <TableCell>{ob.maternidade}</TableCell>
                            <TableCell>{ob.capacidade}</TableCell>
                            <TableCell className="text-red-600">{ob.total}</TableCell>
                            <TableCell>
                              <Badge variant="destructive">+{ob.excedente}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Needs Review */}
            <TabsContent value="problemas">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    Registros para Revisão Manual
                  </CardTitle>
                  <CardDescription>
                    Agendamentos que não puderam ser ajustados automaticamente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {state.resultado.problemas.length === 0 ? (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertTitle>Nenhum problema</AlertTitle>
                      <AlertDescription>
                        Todos os agendamentos foram processados com sucesso.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      <Alert variant="destructive" className="mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Atenção</AlertTitle>
                        <AlertDescription>
                          Os registros abaixo precisam de intervenção manual. 
                          Não foi possível encontrar uma data disponível dentro da tolerância de ±7 dias.
                        </AlertDescription>
                      </Alert>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Carteirinha</TableHead>
                            <TableHead>Maternidade</TableHead>
                            <TableHead>Data Original</TableHead>
                            <TableHead>Motivo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {state.resultado.problemas.map((prob) => (
                            <TableRow key={prob.id_interno}>
                              <TableCell className="font-mono">{prob.id_interno}</TableCell>
                              <TableCell>{prob.nome_original}</TableCell>
                              <TableCell className="font-mono">{prob.carteirinha || "-"}</TableCell>
                              <TableCell>{prob.maternidade}</TableCell>
                              <TableCell>{prob.data_original}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{prob.motivo_alteracao}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
