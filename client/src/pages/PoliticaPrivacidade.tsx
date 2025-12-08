import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PoliticaPrivacidade = () => {
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
            <CardTitle className="text-3xl">Política de Privacidade</CardTitle>
            <CardDescription>
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </CardDescription>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">1. Introdução</h2>
              <p className="text-muted-foreground">
                A Hapvida está comprometida com a proteção da privacidade e segurança dos dados pessoais e 
                sensíveis de pacientes e profissionais de saúde. Esta Política de Privacidade descreve como 
                coletamos, usamos, armazenamos e protegemos as informações no Sistema de Agendamentos Obstétricos, 
                em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">2. Dados Coletados</h2>
              
              <h3 className="text-xl font-semibold text-foreground mb-2 mt-4">2.1 Dados dos Profissionais de Saúde</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Nome completo</li>
                <li>Email profissional</li>
                <li>Tipo de acesso e permissões</li>
                <li>Unidade/maternidade vinculada</li>
                <li>Registros de atividades no sistema</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mb-2 mt-4">2.2 Dados dos Pacientes</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Nome completo</li>
                <li>Data de nascimento</li>
                <li>Número da carteirinha</li>
                <li>Telefones de contato</li>
                <li>Email</li>
                <li>Dados obstétricos (gestações, partos, abortos)</li>
                <li>Informações gestacionais (DUM, USG, idade gestacional)</li>
                <li>Procedimentos agendados</li>
                <li>Diagnósticos maternos e fetais</li>
                <li>História obstétrica</li>
                <li>Necessidades especiais (UTI, reserva de sangue)</li>
                <li>Informações sobre medicação</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">3. Finalidade do Tratamento de Dados</h2>
              <p className="text-muted-foreground mb-2">
                Os dados pessoais são coletados e tratados exclusivamente para:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Gestão de agendamentos de procedimentos obstétricos</li>
                <li>Controle de capacidade das maternidades</li>
                <li>Cálculo de idade gestacional e validação de protocolos médicos</li>
                <li>Comunicação com pacientes e profissionais de saúde</li>
                <li>Garantia da continuidade e qualidade da assistência médica</li>
                <li>Cumprimento de obrigações legais e regulatórias</li>
                <li>Segurança do sistema e prevenção de fraudes</li>
                <li>Auditoria e controle de qualidade</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">4. Base Legal (LGPD)</h2>
              <p className="text-muted-foreground mb-2">
                O tratamento de dados pessoais é fundamentado nas seguintes bases legais:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li><strong>Execução de contrato:</strong> Prestação de serviços de saúde</li>
                <li><strong>Consentimento:</strong> Aceite dos termos ao criar conta no sistema</li>
                <li><strong>Proteção da vida:</strong> Tutela da saúde das pacientes gestantes</li>
                <li><strong>Exercício regular de direitos:</strong> Cumprimento de obrigações legais médicas</li>
                <li><strong>Legítimo interesse:</strong> Gestão administrativa e controle de qualidade</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">5. Compartilhamento de Dados</h2>
              <p className="text-muted-foreground mb-2">
                Os dados pessoais podem ser compartilhados com:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Profissionais de saúde autorizados envolvidos no atendimento</li>
                <li>Maternidades conveniadas para fins de agendamento</li>
                <li>Autoridades sanitárias quando legalmente exigido</li>
                <li>Prestadores de serviços de TI sob contrato de confidencialidade</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                <strong>Não compartilhamos dados</strong> com terceiros para fins comerciais, marketing ou 
                quaisquer finalidades não relacionadas à prestação de serviços de saúde.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">6. Segurança dos Dados</h2>
              <p className="text-muted-foreground mb-2">
                Implementamos medidas técnicas e organizacionais de segurança, incluindo:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Criptografia de dados em trânsito e em repouso</li>
                <li>Controle de acesso baseado em funções (RBAC)</li>
                <li>Autenticação segura com requisitos mínimos de senha</li>
                <li>Políticas de Row-Level Security no banco de dados</li>
                <li>Monitoramento e logs de acesso</li>
                <li>Backups regulares e recuperação de desastres</li>
                <li>Atualizações de segurança periódicas</li>
                <li>Treinamento de equipe em proteção de dados</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">7. Retenção de Dados</h2>
              <p className="text-muted-foreground">
                Os dados dos pacientes são mantidos pelo período necessário para a prestação de serviços de 
                saúde e conforme exigido pela legislação vigente. Dados médicos são retidos por no mínimo 
                20 anos, conforme determinado pelo Conselho Federal de Medicina (Resolução CFM nº 1.821/2007).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">8. Direitos dos Titulares (LGPD)</h2>
              <p className="text-muted-foreground mb-2">
                Conforme a LGPD, os titulares de dados têm direito a:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li><strong>Acesso:</strong> Confirmar tratamento e acessar seus dados</li>
                <li><strong>Correção:</strong> Solicitar correção de dados incompletos ou incorretos</li>
                <li><strong>Anonimização/Bloqueio:</strong> Solicitar anonimização ou bloqueio de dados desnecessários</li>
                <li><strong>Portabilidade:</strong> Receber dados em formato estruturado</li>
                <li><strong>Eliminação:</strong> Solicitar exclusão de dados tratados com consentimento</li>
                <li><strong>Informação:</strong> Receber informações sobre compartilhamento</li>
                <li><strong>Revogação:</strong> Revogar consentimento</li>
                <li><strong>Oposição:</strong> Opor-se a tratamento em desacordo com a lei</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                <strong>Nota importante:</strong> Dados essenciais para prontuário médico não podem ser eliminados 
                em conformidade com regulamentações médicas e obrigações legais.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">9. Cookies e Tecnologias Similares</h2>
              <p className="text-muted-foreground">
                O sistema utiliza cookies e armazenamento local apenas para funcionalidades essenciais como 
                autenticação e manutenção de sessão. Não utilizamos cookies de rastreamento ou publicidade.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">10. Alterações nesta Política</h2>
              <p className="text-muted-foreground">
                Esta Política de Privacidade pode ser atualizada periodicamente. Alterações significativas 
                serão comunicadas aos usuários através do sistema. A data da última atualização é sempre 
                exibida no início deste documento.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">11. Encarregado de Dados (DPO)</h2>
              <p className="text-muted-foreground">
                Para exercer seus direitos ou esclarecer dúvidas sobre o tratamento de dados pessoais, 
                entre em contato com o Encarregado de Proteção de Dados (DPO) da Hapvida através dos canais 
                oficiais de atendimento.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">12. Autoridade Nacional</h2>
              <p className="text-muted-foreground">
                Em caso de dúvidas não resolvidas, você pode contatar a Autoridade Nacional de Proteção de 
                Dados (ANPD) através do site <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.gov.br/anpd</a>.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PoliticaPrivacidade;
