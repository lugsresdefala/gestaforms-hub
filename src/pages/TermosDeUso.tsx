import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TermosDeUso = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Termos e Condições de Uso</CardTitle>
            <CardDescription>
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </CardDescription>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">1. Aceitação dos Termos</h2>
              <p className="text-muted-foreground">
                Ao acessar e utilizar o Sistema de Agendamentos Obstétricos Hapvida, você concorda em cumprir 
                estes Termos e Condições de Uso. Este sistema é destinado exclusivamente para uso interno por 
                profissionais de saúde autorizados da rede Hapvida.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">2. Uso Autorizado</h2>
              <p className="text-muted-foreground mb-2">
                O acesso ao sistema é restrito a:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Médicos das unidades de atendimento Hapvida</li>
                <li>Médicos das maternidades conveniadas</li>
                <li>Administradores médicos autorizados</li>
                <li>Administradores do sistema</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                Qualquer uso não autorizado será considerado violação destes termos e pode resultar em 
                suspensão imediata do acesso.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">3. Responsabilidades do Usuário</h2>
              <p className="text-muted-foreground mb-2">
                Ao utilizar o sistema, você se compromete a:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Manter a confidencialidade de suas credenciais de acesso</li>
                <li>Não compartilhar seu login e senha com terceiros</li>
                <li>Utilizar o sistema apenas para fins profissionais legítimos</li>
                <li>Inserir informações precisas e atualizadas dos pacientes</li>
                <li>Seguir os protocolos médicos e obstétricos estabelecidos</li>
                <li>Reportar imediatamente qualquer uso não autorizado de sua conta</li>
                <li>Respeitar a confidencialidade dos dados dos pacientes (LGPD)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">4. Segurança da Informação</h2>
              <p className="text-muted-foreground">
                O sistema implementa medidas de segurança para proteger dados sensíveis. Todas as senhas devem 
                atender aos requisitos mínimos de segurança estabelecidos. Os usuários são responsáveis por 
                manter suas credenciais seguras e criar senhas fortes que atendam aos critérios obrigatórios.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">5. Dados dos Pacientes</h2>
              <p className="text-muted-foreground">
                Todas as informações inseridas no sistema são confidenciais e protegidas pela Lei Geral de 
                Proteção de Dados (LGPD - Lei 13.709/2018) e pelo sigilo médico. O uso indevido ou 
                compartilhamento não autorizado de dados pode resultar em sanções legais e disciplinares.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">6. Funcionalidades do Sistema</h2>
              <p className="text-muted-foreground mb-2">
                O sistema oferece as seguintes funcionalidades:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Agendamento de procedimentos obstétricos</li>
                <li>Gestão de capacidade das maternidades</li>
                <li>Cálculo automático de idade gestacional</li>
                <li>Validação de protocolos médicos</li>
                <li>Sistema de notificações e aprovações</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">7. Limitações de Responsabilidade</h2>
              <p className="text-muted-foreground">
                A Hapvida não se responsabiliza por decisões clínicas tomadas com base nos dados do sistema. 
                O sistema é uma ferramenta de apoio administrativo e não substitui o julgamento clínico 
                profissional. Todas as decisões médicas permanecem sob responsabilidade do profissional 
                de saúde.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">8. Modificações do Sistema</h2>
              <p className="text-muted-foreground">
                A Hapvida reserva-se o direito de modificar, suspender ou descontinuar qualquer aspecto 
                do sistema a qualquer momento, com ou sem aviso prévio. Atualizações dos termos serão 
                comunicadas aos usuários.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">9. Violações e Sanções</h2>
              <p className="text-muted-foreground">
                Violações destes termos podem resultar em:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Suspensão temporária ou permanente do acesso</li>
                <li>Investigação interna</li>
                <li>Medidas disciplinares conforme regulamento interno</li>
                <li>Ações legais quando aplicável</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">10. Contato</h2>
              <p className="text-muted-foreground">
                Para questões relacionadas a estes termos ou ao uso do sistema, entre em contato com o 
                departamento de TI ou com o administrador médico responsável.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">11. Lei Aplicável</h2>
              <p className="text-muted-foreground">
                Estes termos são regidos pelas leis brasileiras. Quaisquer disputas serão resolvidas no 
                foro da comarca competente.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermosDeUso;
