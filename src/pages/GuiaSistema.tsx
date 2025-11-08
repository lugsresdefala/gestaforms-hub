import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  UserCircle, 
  FileText, 
  CheckCircle, 
  Calendar, 
  Building2, 
  Upload, 
  Users,
  ArrowRight,
  Shield,
  Stethoscope,
  Baby
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const GuiaSistema = () => {
  return (
    <div className="min-h-screen gradient-subtle p-8">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-3">
            Guia do Sistema PGS
          </h1>
          <p className="text-lg text-muted-foreground">
            Entenda como funciona o Programa Gestação Segura e as permissões de cada usuário
          </p>
        </div>

        {/* Workflow Geral */}
        <Card className="mb-8 shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Baby className="h-6 w-6 text-primary" />
              Fluxo do Sistema
            </CardTitle>
            <CardDescription>Como funciona o processo de agendamento obstétrico</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">1</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">Médico da Unidade PGS cria o agendamento</h3>
                  <p className="text-muted-foreground">
                    O médico da unidade de pré-natal preenche o formulário completo com dados da gestante, 
                    incluindo histórico obstétrico, diagnósticos, idade gestacional e dados do parto planejado.
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <ArrowRight className="h-8 w-8 text-muted-foreground" />
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white font-bold">2</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">Agendamento fica pendente de aprovação</h3>
                  <p className="text-muted-foreground">
                    O sistema valida automaticamente os protocolos obstétricos, calcula a idade gestacional ideal 
                    e verifica disponibilidade de vagas. O agendamento aguarda revisão administrativa.
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <ArrowRight className="h-8 w-8 text-muted-foreground" />
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white font-bold">3</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">Administrador aprova ou rejeita</h3>
                  <p className="text-muted-foreground">
                    O administrador revisa o agendamento, verifica conformidade com protocolos e capacidade da maternidade. 
                    Pode aprovar, rejeitar com observações ou solicitar mais informações.
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <ArrowRight className="h-8 w-8 text-muted-foreground" />
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white font-bold">4</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">Médico da Maternidade visualiza agendamentos aprovados</h3>
                  <p className="text-muted-foreground">
                    Os médicos de cada maternidade têm acesso apenas aos agendamentos aprovados da sua unidade, 
                    podendo se preparar com antecedência para receber as gestantes.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tipos de Usuário */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Admin */}
          <Card className="shadow-elegant border-2 border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Shield className="h-10 w-10 text-primary" />
                <Badge className="bg-primary text-primary-foreground">ADMIN</Badge>
              </div>
              <CardTitle className="text-xl">Administrador</CardTitle>
              <CardDescription>Gerencia todo o sistema e aprova agendamentos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2 text-sm uppercase text-muted-foreground">Acesso Completo</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Aprovar ou rejeitar agendamentos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Visualizar todos os agendamentos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Gerenciar usuários e permissões</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Importar agendas em lote (Excel/Word)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Monitorar ocupação das maternidades</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Receber notificações de novos agendamentos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Acessar dashboards e relatórios</span>
                  </li>
                </ul>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-2 text-sm uppercase text-muted-foreground">Páginas Disponíveis</h4>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-3 w-3" />
                    <span>Dashboard e Listagem</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-3 w-3" />
                    <span>Aprovações</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-3 w-3" />
                    <span>Ocupação de Maternidades</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Upload className="h-3 w-3" />
                    <span>Importar Agenda</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-3 w-3" />
                    <span>Gerenciar Usuários</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Médico Unidade */}
          <Card className="shadow-elegant border-2 border-blue-500/20">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Stethoscope className="h-10 w-10 text-blue-500" />
                <Badge className="bg-blue-500 text-white">UNIDADE PGS</Badge>
              </div>
              <CardTitle className="text-xl">Médico da Unidade</CardTitle>
              <CardDescription>Cria e acompanha agendamentos de parto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2 text-sm uppercase text-muted-foreground">Permissões</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Criar novos agendamentos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Visualizar próprios agendamentos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Acompanhar status (Pendente/Aprovado/Rejeitado)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Ver observações de aprovação/rejeição</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Acesso ao dashboard geral</span>
                  </li>
                </ul>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-2 text-sm uppercase text-muted-foreground">Páginas Disponíveis</h4>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-3 w-3" />
                    <span>Dashboard e Listagem</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-3 w-3" />
                    <span>Novo Agendamento</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <UserCircle className="h-3 w-3" />
                    <span>Meus Agendamentos</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-3 w-3" />
                    <span>Ocupação de Maternidades</span>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertDescription className="text-xs">
                  <strong>Importante:</strong> Você só visualiza agendamentos criados por você mesmo.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Médico Maternidade */}
          <Card className="shadow-elegant border-2 border-green-500/20">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Building2 className="h-10 w-10 text-green-500" />
                <Badge className="bg-green-500 text-white">MATERNIDADE</Badge>
              </div>
              <CardTitle className="text-xl">Médico da Maternidade</CardTitle>
              <CardDescription>Visualiza partos agendados na sua unidade</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2 text-sm uppercase text-muted-foreground">Permissões</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Visualizar agendamentos aprovados</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Ver apenas agendamentos da sua maternidade</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Acesso completo aos dados clínicos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Preparação antecipada para atendimento</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Dashboard com estatísticas</span>
                  </li>
                </ul>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-2 text-sm uppercase text-muted-foreground">Páginas Disponíveis</h4>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-3 w-3" />
                    <span>Dashboard e Listagem</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-3 w-3" />
                    <span>Ocupação de Maternidades</span>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertDescription className="text-xs">
                  <strong>Restrição:</strong> Você não pode criar nem aprovar agendamentos, apenas visualizar os já aprovados.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>

        {/* Funcionalidades Especiais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Importação em Lote
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Administradores podem importar múltiplos agendamentos de uma vez usando arquivos Excel ou Word.
              </p>
              <ul className="space-y-1.5 text-sm">
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Suporte para .xlsx, .xls, .csv, .docx, .doc</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Parser inteligente de dados obstétricos</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Prévia antes da importação definitiva</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Agendamentos importados já entram como aprovados</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Gestão de Ocupação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Controle inteligente da capacidade de cada maternidade para evitar sobrecarga.
              </p>
              <ul className="space-y-1.5 text-sm">
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Limites diários e semanais por maternidade</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Vagas reservadas para casos urgentes</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Alertas automáticos quando próximo do limite</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Visão semanal da ocupação por unidade</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Credenciais de Teste */}
        <Card className="shadow-elegant bg-muted/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="h-5 w-5" />
              Credenciais de Teste
            </CardTitle>
            <CardDescription>Use estas credenciais para testar o sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card p-4 rounded-lg border">
                <Badge className="mb-2 bg-primary">Admin</Badge>
                <p className="text-sm font-mono mb-1">admin@hapvida.com.br</p>
                <p className="text-sm font-mono text-muted-foreground">Admin@2024</p>
              </div>
              <div className="bg-card p-4 rounded-lg border">
                <Badge className="mb-2 bg-blue-500">Médico Unidade</Badge>
                <p className="text-sm font-mono mb-1">medico.unidade@hapvida.com.br</p>
                <p className="text-sm font-mono text-muted-foreground">Medico@2024</p>
              </div>
              <div className="bg-card p-4 rounded-lg border">
                <Badge className="mb-2 bg-green-500">Médico Maternidade</Badge>
                <p className="text-sm font-mono mb-1">medico.maternidade@hapvida.com.br</p>
                <p className="text-sm font-mono text-muted-foreground">Medico@2024</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GuiaSistema;
