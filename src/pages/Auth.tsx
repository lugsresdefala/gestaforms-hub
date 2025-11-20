import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

import { PasswordStrengthIndicator, validatePasswordStrength } from '@/components/PasswordStrengthIndicator';
import { Footer } from '@/components/Footer';

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  // Get the redirect location from state (where user was trying to go)
  const from = location.state?.from?.pathname || '/';

  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });

  const [signupData, setSignupData] = useState({
    email: '',
    password: '',
    nomeCompleto: '',
    tipoAcesso: '',
    maternidade: '',
    justificativa: '',
    aceitouTermos: false,
    aceitouPrivacidade: false,
  });

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast.success('Email de recuperação enviado! Verifique sua caixa de entrada.');
      setResetPasswordOpen(false);
      setResetEmail('');
    } catch (error: any) {
      toast.error('Erro ao enviar email: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await signIn(loginData.email, loginData.password);
    
    setLoading(false);
    
    if (!error) {
      // Redirect to the page they were trying to access, or home
      navigate(from, { replace: true });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswordStrength(signupData.password)) {
      toast.error('A senha não atende aos requisitos mínimos de segurança');
      return;
    }
    
    if (!signupData.aceitouTermos) {
      toast.error('Você deve aceitar os Termos e Condições de Uso');
      return;
    }

    if (!signupData.aceitouPrivacidade) {
      toast.error('Você deve aceitar a Política de Privacidade');
      return;
    }
    
    if (!signupData.tipoAcesso) {
      toast.error('Por favor, selecione o tipo de acesso desejado');
      return;
    }

    if (signupData.tipoAcesso === 'medico_maternidade' && !signupData.maternidade) {
      toast.error('Por favor, informe a maternidade');
      return;
    }

    if (!signupData.justificativa) {
      toast.error('Por favor, adicione uma justificativa para sua solicitação');
      return;
    }

    setLoading(true);
    
    const { error } = await signUp(
      signupData.email,
      signupData.password,
      signupData.nomeCompleto
    );
    
    if (!error) {
      // Aguardar para garantir que o perfil foi criado
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Fazer login para obter o user_id
      const { data: sessionData, error: loginError } = await supabase.auth.signInWithPassword({
        email: signupData.email,
        password: signupData.password,
      });

      if (loginError) {
        console.error('Erro no login após cadastro:', loginError);
        toast.error('Cadastro realizado mas não foi possível criar a solicitação. Entre em contato com o suporte.');
        setLoading(false);
        return;
      }

      if (sessionData.user) {
        console.log('Criando solicitação para user_id:', sessionData.user.id);
        
        // Criar solicitação de acesso
        const { error: solicitacaoError, data: solicitacaoData } = await supabase
          .from('solicitacoes_acesso')
          .insert({
            user_id: sessionData.user.id,
            tipo_acesso: signupData.tipoAcesso,
            maternidade: signupData.maternidade || null,
            justificativa: signupData.justificativa
          })
          .select();

        if (solicitacaoError) {
          console.error('Erro ao criar solicitação:', solicitacaoError);
          toast.error(`Erro ao criar solicitação: ${solicitacaoError.message}. Entre em contato com o suporte.`);
          
          // Fazer logout mesmo com erro
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        console.log('Solicitação criada com sucesso:', solicitacaoData);

        // Fazer logout
        await supabase.auth.signOut();
      }

      toast.success('Cadastro realizado! Aguarde aprovação do administrador.');
      setSignupData({ 
        email: '', 
        password: '', 
        nomeCompleto: '', 
        tipoAcesso: '', 
        maternidade: '', 
        justificativa: '',
        aceitouTermos: false,
        aceitouPrivacidade: false,
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-6">
        {/* Card principal de login/cadastro */}
        <Card className="flex-1">
          <CardHeader className="text-center">
            <img 
              src="/hapvida-logo.png" 
              alt="Logo Hapvida NotreDame" 
              className="h-16 mx-auto mb-4"
            />
            <CardTitle>Sistema de Agendamento Obstétrico</CardTitle>
            <CardDescription>
              Acesse sua conta ou solicite acesso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Solicitar Acesso</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Entrando...' : 'Entrar'}
                  </Button>

                  <Dialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
                    <DialogTrigger asChild>
                      <Button variant="link" className="w-full text-sm">
                        Esqueceu a senha?
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Recuperar Senha</DialogTitle>
                        <DialogDescription>
                          Digite seu email para receber um link de recuperação de senha.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleResetPassword} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="reset-email">Email</Label>
                          <Input
                            id="reset-email"
                            type="email"
                            placeholder="seu@email.com"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                          {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nome Completo</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Seu nome completo"
                      value={signupData.nomeCompleto}
                      onChange={(e) => setSignupData({ ...signupData, nomeCompleto: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={signupData.email}
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signupData.password}
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                      required
                      minLength={8}
                    />
                    <PasswordStrengthIndicator password={signupData.password} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tipo-acesso">Tipo de Acesso Solicitado*</Label>
                    <Select 
                      value={signupData.tipoAcesso} 
                      onValueChange={(value) => setSignupData({ ...signupData, tipoAcesso: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de acesso" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="medico_unidade">Médico de Unidade PGS</SelectItem>
                        <SelectItem value="medico_maternidade">Médico de Maternidade</SelectItem>
                        <SelectItem value="admin_med">Administrador Médico</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {signupData.tipoAcesso === 'medico_maternidade' && (
                    <div className="space-y-2">
                      <Label htmlFor="maternidade">Maternidade*</Label>
                      <Input
                        id="maternidade"
                        type="text"
                        placeholder="Nome da maternidade"
                        value={signupData.maternidade}
                        onChange={(e) => setSignupData({ ...signupData, maternidade: e.target.value })}
                        required
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="justificativa">Justificativa da Solicitação*</Label>
                    <Textarea
                      id="justificativa"
                      placeholder="Por que você precisa de acesso a este sistema?"
                      value={signupData.justificativa}
                      onChange={(e) => setSignupData({ ...signupData, justificativa: e.target.value })}
                      required
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-4 border-t pt-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="termos"
                        checked={signupData.aceitouTermos}
                        onCheckedChange={(checked) => 
                          setSignupData({ ...signupData, aceitouTermos: checked as boolean })
                        }
                        required
                      />
                      <Label 
                        htmlFor="termos" 
                        className="text-sm font-normal leading-relaxed cursor-pointer"
                      >
                        Li e aceito os{' '}
                        <Link 
                          to="/termos" 
                          target="_blank"
                          className="text-primary hover:underline font-medium"
                        >
                          Termos e Condições de Uso
                        </Link>
                        <span className="text-destructive">*</span>
                      </Label>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="privacidade"
                        checked={signupData.aceitouPrivacidade}
                        onCheckedChange={(checked) => 
                          setSignupData({ ...signupData, aceitouPrivacidade: checked as boolean })
                        }
                        required
                      />
                      <Label 
                        htmlFor="privacidade" 
                        className="text-sm font-normal leading-relaxed cursor-pointer"
                      >
                        Li e aceito a{' '}
                        <Link 
                          to="/privacidade" 
                          target="_blank"
                          className="text-primary hover:underline font-medium"
                        >
                          Política de Privacidade
                        </Link>
                        <span className="text-destructive">*</span>
                      </Label>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      ℹ️ Sua solicitação será enviada para aprovação do administrador. Você receberá uma notificação quando for aprovada.
                    </p>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Enviando...' : 'Enviar Solicitação'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Auth;
