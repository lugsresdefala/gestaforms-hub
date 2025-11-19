import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UserCircle, FileText, CheckCircle, Calendar, Building2, Users, ArrowRight, Shield, Stethoscope, Baby, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
const GuiaSistema = () => {
  return <div className="min-h-screen relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/5 to-accent/10 animate-pulse" style={{
      animationDuration: '8s'
    }} />
      
      {/* 3D floating orbs */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-float" style={{
      animationDuration: '10s'
    }} />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float" style={{
      animationDuration: '15s',
      animationDelay: '2s'
    }} />
      
      <div className="container mx-auto max-w-7xl p-8 relative z-10">
        {/* Header with glassmorphism */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">Sistema Inteligente</span>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-4 animate-fade-in">
            Agendamentos Obstétricos    
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Entenda como funciona a plataforma de agendamentos do Programa Gestação Segura e as permissões de cada usuário
          </p>
        </div>

        {/* Workflow Geral with glassmorphism */}
        <Card className="mb-12 bg-background/40 backdrop-blur-xl border-primary/20 shadow-elegant hover:shadow-2xl transition-all duration-500 hover:scale-[1.01] hover:border-primary/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-3xl">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent shadow-lg">
                <Baby className="h-7 w-7 text-primary-foreground" />
              </div>
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Fluxo do Sistema</span>
            </CardTitle>
            <CardDescription className="text-base">Como funciona o processo de agendamento obstétrico</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div className="flex items-start gap-4 group">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-bold text-xl shadow-lg group-hover:scale-110 transition-transform duration-300 relative">
                  <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl group-hover:blur-2xl transition-all" />
                  <span className="relative">1</span>
                </div>
                <div className="flex-1 p-4 rounded-lg bg-gradient-to-r from-primary/5 to-transparent backdrop-blur-sm border border-primary/10 hover:border-primary/30 transition-all duration-300">
                  <h3 className="font-semibold text-lg mb-2">Médico da Unidade PGS cria o agendamento</h3>
                  <p className="text-muted-foreground text-sm">
                    O médico da unidade de pré-natal preenche o formulário completo com dados da gestante, 
                    incluindo histórico obstétrico, diagnósticos, idade gestacional e dados do parto planejado.
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <ArrowRight className="h-10 w-10 text-primary/60 animate-pulse" />
              </div>

              <div className="flex items-start gap-4 group">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-400 text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform duration-300 relative">
                  <div className="absolute inset-0 rounded-2xl bg-orange-500/20 blur-xl group-hover:blur-2xl transition-all" />
                  <span className="relative">2</span>
                </div>
                <div className="flex-1 p-4 rounded-lg bg-gradient-to-r from-orange-500/5 to-transparent backdrop-blur-sm border border-orange-500/10 hover:border-orange-500/30 transition-all duration-300">
                  <h3 className="font-semibold text-lg mb-2">Agendamento fica pendente de aprovação</h3>
                  <p className="text-muted-foreground text-sm">
                    O sistema valida automaticamente os protocolos obstétricos, calcula a idade gestacional ideal 
                    e verifica disponibilidade de vagas. O agendamento aguarda revisão administrativa.
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <ArrowRight className="h-10 w-10 text-primary/60 animate-pulse" style={{
                animationDelay: '0.5s'
              }} />
              </div>

              <div className="flex items-start gap-4 group">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-green-400 text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform duration-300 relative">
                  <div className="absolute inset-0 rounded-2xl bg-green-500/20 blur-xl group-hover:blur-2xl transition-all" />
                  <span className="relative">3</span>
                </div>
                <div className="flex-1 p-4 rounded-lg bg-gradient-to-r from-green-500/5 to-transparent backdrop-blur-sm border border-green-500/10 hover:border-green-500/30 transition-all duration-300">
                  <h3 className="font-semibold text-lg mb-2">Administrador aprova ou rejeita</h3>
                  <p className="text-muted-foreground text-sm">
                    O administrador revisa o agendamento, verifica conformidade com protocolos e capacidade da maternidade. 
                    Pode aprovar, rejeitar com observações ou solicitar mais informações.
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <ArrowRight className="h-10 w-10 text-primary/60 animate-pulse" style={{
                animationDelay: '1s'
              }} />
              </div>

              <div className="flex items-start gap-4 group">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-400 text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform duration-300 relative">
                  <div className="absolute inset-0 rounded-2xl bg-blue-500/20 blur-xl group-hover:blur-2xl transition-all" />
                  <span className="relative">4</span>
                </div>
                <div className="flex-1 p-4 rounded-lg bg-gradient-to-r from-blue-500/5 to-transparent backdrop-blur-sm border border-blue-500/10 hover:border-blue-500/30 transition-all duration-300">
                  <h3 className="font-semibold text-lg mb-2">Médico da Maternidade visualiza agendamentos aprovados</h3>
                  <p className="text-muted-foreground text-sm">
                    Os médicos de cada maternidade têm acesso apenas aos agendamentos aprovados da sua unidade, 
                    podendo se preparar com antecedência para receber as gestantes.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tipos de Usuário with 3D effects */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Admin */}
          <Card className="bg-background/60 backdrop-blur-xl border-2 border-primary/30 shadow-2xl hover:shadow-primary/20 transition-all duration-500 hover:scale-105 hover:-translate-y-2 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/60 shadow-lg">
                  <Shield className="h-10 w-10 text-primary-foreground" />
                </div>
                <Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg px-4 py-1">ADMIN</Badge>
              </div>
              <CardTitle className="text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Administrador</CardTitle>
              <CardDescription>Gerencia todo o sistema e aprova agendamentos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
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
                    <Users className="h-3 w-3" />
                    <span>Gerenciar Usuários</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Médico Unidade */}
          <Card className="bg-background/60 backdrop-blur-xl border-2 border-blue-500/30 shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 hover:scale-105 hover:-translate-y-2 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-blue-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-400 shadow-lg">
                  <Stethoscope className="h-10 w-10 text-white" />
                </div>
                <Badge className="bg-gradient-to-r from-blue-500 to-blue-400 text-white shadow-lg px-4 py-1">UNIDADE PGS</Badge>
              </div>
              <CardTitle className="text-2xl bg-gradient-to-r from-blue-500 to-blue-400 bg-clip-text text-transparent">Médico da Unidade</CardTitle>
              <CardDescription>Cria e acompanha agendamentos de parto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
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
          <Card className="bg-background/60 backdrop-blur-xl border-2 border-green-500/30 shadow-2xl hover:shadow-green-500/20 transition-all duration-500 hover:scale-105 hover:-translate-y-2 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-green-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-400 shadow-lg">
                  <Building2 className="h-10 w-10 text-white" />
                </div>
                <Badge className="bg-gradient-to-r from-green-500 to-green-400 text-white shadow-lg px-4 py-1">MATERNIDADE</Badge>
              </div>
              <CardTitle className="text-2xl bg-gradient-to-r from-green-500 to-green-400 bg-clip-text text-transparent">Médico da Maternidade</CardTitle>
              <CardDescription>Visualiza partos agendados na sua unidade</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
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
        <div className="grid grid-cols-1 gap-8 mb-12">
          <Card className="bg-background/60 backdrop-blur-xl border-2 border-primary/30 shadow-2xl hover:shadow-primary/20 transition-all duration-500 hover:scale-[1.02] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent shadow-lg">
                  <Building2 className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Gestão de Ocupação</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <p className="text-base text-muted-foreground mb-6">
                Controle inteligente da capacidade de cada maternidade para evitar sobrecarga.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex gap-3 p-4 rounded-lg bg-gradient-to-r from-primary/5 to-transparent border border-primary/10 hover:border-primary/30 transition-all duration-300">
                  <span className="text-2xl">📊</span>
                  <span className="text-sm">Limites diários e semanais por maternidade</span>
                </div>
                <div className="flex gap-3 p-4 rounded-lg bg-gradient-to-r from-accent/5 to-transparent border border-accent/10 hover:border-accent/30 transition-all duration-300">
                  <span className="text-2xl">🚨</span>
                  <span className="text-sm">Vagas reservadas para casos urgentes</span>
                </div>
                <div className="flex gap-3 p-4 rounded-lg bg-gradient-to-r from-primary/5 to-transparent border border-primary/10 hover:border-primary/30 transition-all duration-300">
                  <span className="text-2xl">⚡</span>
                  <span className="text-sm">Alertas automáticos quando próximo do limite</span>
                </div>
                <div className="flex gap-3 p-4 rounded-lg bg-gradient-to-r from-accent/5 to-transparent border border-accent/10 hover:border-accent/30 transition-all duration-300">
                  <span className="text-2xl">📅</span>
                  <span className="text-sm">Visão semanal da ocupação por unidade</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>;
};
export default GuiaSistema;