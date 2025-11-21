import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info, Shield, Users, Database, Zap, Lock, FileCheck, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Sobre = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            ← Voltar
          </Button>
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20">
            <Info className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Sobre o Sistema</span>
          </div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            GestaForms Hub
          </h1>
          <p className="text-muted-foreground text-lg">
            Sistema Integrado de Gestão de Agendamentos Obstétricos
          </p>
        </div>

        {/* Visão Geral */}
        <Card className="mb-6 bg-background/60 backdrop-blur-sm border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Visão Geral
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              O <strong>GestaForms Hub</strong> é uma plataforma web desenvolvida para otimizar o fluxo de agendamentos 
              de procedimentos obstétricos em maternidades da rede Hapvida. O sistema centraliza solicitações de médicos 
              das unidades, valida disponibilidade com base em protocolos médicos e permite aprovação controlada pela 
              administração das maternidades.
            </p>
            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                <Clock className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-semibold mb-1">Eficiência</h3>
                <p className="text-sm text-muted-foreground">Redução de 70% no tempo de agendamento</p>
              </div>
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                <Shield className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-semibold mb-1">Segurança</h3>
                <p className="text-sm text-muted-foreground">Conformidade LGPD e criptografia</p>
              </div>
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                <Users className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-semibold mb-1">Colaboração</h3>
                <p className="text-sm text-muted-foreground">4 níveis de acesso hierárquico</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Funcionalidades Principais */}
        <Card className="mb-6 bg-background/60 backdrop-blur-sm border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Funcionalidades Principais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">1</Badge>
                  <div>
                    <h4 className="font-semibold mb-1">Gestão de Agendamentos</h4>
                    <p className="text-sm text-muted-foreground">
                      Criação, edição, aprovação e cancelamento de procedimentos obstétricos
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">2</Badge>
                  <div>
                    <h4 className="font-semibold mb-1">Validação Automática</h4>
                    <p className="text-sm text-muted-foreground">
                      Verificação de vagas, protocolos clínicos e idade gestacional
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">3</Badge>
                  <div>
                    <h4 className="font-semibold mb-1">Dashboard Analítico</h4>
                    <p className="text-sm text-muted-foreground">
                      Visualização de ocupação, estatísticas e indicadores em tempo real
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">4</Badge>
                  <div>
                    <h4 className="font-semibold mb-1">Notificações Real-Time</h4>
                    <p className="text-sm text-muted-foreground">
                      Alertas instantâneos via WebSocket para novos agendamentos
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">5</Badge>
                  <div>
                    <h4 className="font-semibold mb-1">Controle de Acesso</h4>
                    <p className="text-sm text-muted-foreground">
                      Sistema hierárquico com 4 perfis de usuário (Admin, Admin Médico, etc.)
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">6</Badge>
                  <div>
                    <h4 className="font-semibold mb-1">Auditoria Completa</h4>
                    <p className="text-sm text-muted-foreground">
                      Registro detalhado de todas as ações e alterações no sistema
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">7</Badge>
                  <div>
                    <h4 className="font-semibold mb-1">Histórico de Mudanças</h4>
                    <p className="text-sm text-muted-foreground">
                      Rastreamento campo a campo de todas as alterações em agendamentos
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">8</Badge>
                  <div>
                    <h4 className="font-semibold mb-1">Exportação de Relatórios</h4>
                    <p className="text-sm text-muted-foreground">
                      Geração de relatórios em PDF e Excel com filtros avançados
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Perfis de Usuário */}
        <Card className="mb-6 bg-background/60 backdrop-blur-sm border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Perfis de Usuário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-red-500">Admin</Badge>
                  <span className="font-semibold">Administrador do Sistema</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Acesso total: gerenciamento de usuários, aprovações, configurações, auditoria e relatórios completos
                </p>
              </div>
              
              <div className="p-4 rounded-lg border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-orange-500">Admin Médico</Badge>
                  <span className="font-semibold">Administrador Médico</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Aprovação de agendamentos, visualização de todas as unidades, acesso a relatórios e dashboard
                </p>
              </div>
              
              <div className="p-4 rounded-lg border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-blue-500">Médico Maternidade</Badge>
                  <span className="font-semibold">Médico da Maternidade</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Aprovação de agendamentos da própria maternidade, visualização de ocupação e estatísticas locais
                </p>
              </div>
              
              <div className="p-4 rounded-lg border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-green-500">Médico Unidade</Badge>
                  <span className="font-semibold">Médico Solicitante</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Criação e visualização dos próprios agendamentos, acompanhamento de status de aprovação
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tecnologias */}
        <Card className="mb-6 bg-background/60 backdrop-blur-sm border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Tecnologias Utilizadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 text-primary">Frontend</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">React 18</Badge>
                    <span className="text-sm text-muted-foreground">+ TypeScript</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Vite</Badge>
                    <span className="text-sm text-muted-foreground">Build tool otimizado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Tailwind CSS</Badge>
                    <span className="text-sm text-muted-foreground">Estilização</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Shadcn/UI</Badge>
                    <span className="text-sm text-muted-foreground">Componentes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Recharts</Badge>
                    <span className="text-sm text-muted-foreground">Visualização de dados</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-primary">Backend</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Lovable Cloud</Badge>
                    <span className="text-sm text-muted-foreground">Infraestrutura</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">PostgreSQL</Badge>
                    <span className="text-sm text-muted-foreground">Banco de dados</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Row Level Security</Badge>
                    <span className="text-sm text-muted-foreground">Segurança</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Edge Functions</Badge>
                    <span className="text-sm text-muted-foreground">Lógica serverless</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Realtime</Badge>
                    <span className="text-sm text-muted-foreground">WebSocket</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Segurança */}
        <Card className="mb-6 bg-background/60 backdrop-blur-sm border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Segurança e Conformidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Camadas de Segurança</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Autenticação JWT com hash bcrypt</li>
                    <li>Row Level Security (RLS) no banco de dados</li>
                    <li>Isolamento por perfil e maternidade</li>
                    <li>Criptografia TLS 1.3 em todas as comunicações</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <FileCheck className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Conformidade LGPD</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Consentimento explícito para tratamento de dados</li>
                    <li>Logs de auditoria completos para rastreabilidade</li>
                    <li>Minimização de dados: coleta apenas essencial</li>
                    <li>Direito de acesso, correção e exclusão de dados</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Proteção de Dados</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Backup automático diário</li>
                    <li>Retenção de dados por 5 anos</li>
                    <li>Anonimização após período legal</li>
                    <li>Controles de acesso granular por função</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contato e Suporte */}
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10 backdrop-blur-sm border-primary/20">
          <CardHeader>
            <CardTitle>Suporte e Contato</CardTitle>
            <CardDescription>
              Em caso de dúvidas ou problemas técnicos, entre em contato com a equipe de TI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Button 
                variant="default" 
                onClick={() => navigate('/faq')}
                className="gap-2"
              >
                <Info className="h-4 w-4" />
                Consultar FAQ
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/guia')}
                className="gap-2"
              >
                <FileCheck className="h-4 w-4" />
                Guia do Sistema
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Versão */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>GestaForms Hub v1.0 • Desenvolvido para Hapvida • 2024-2025</p>
        </div>
      </div>
    </div>
  );
};

export default Sobre;
