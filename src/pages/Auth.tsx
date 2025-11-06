import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Copy, Check, UserPlus } from 'lucide-react';

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [creatingUsers, setCreatingUsers] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

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
  });

  const [copiedCredential, setCopiedCredential] = useState<string | null>(null);

  const credenciaisPadrao = [
    {
      tipo: 'Admin',
      email: 'admin@hapvida.com.br',
      senha: 'Admin@2024',
      cor: 'bg-red-100 dark:bg-red-950 border-red-300 dark:border-red-800 text-red-800 dark:text-red-200'
    },
    {
      tipo: 'Médico Unidade',
      email: 'medico.unidade@hapvida.com.br',
      senha: 'Medico@2024',
      cor: 'bg-blue-100 dark:bg-blue-950 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-200'
    },
    {
      tipo: 'Médico Maternidade',
      email: 'medico.maternidade@hapvida.com.br',
      senha: 'Medico@2024',
      cor: 'bg-green-100 dark:bg-green-950 border-green-300 dark:border-green-800 text-green-800 dark:text-green-200'
    }
  ];

  const copyToClipboard = (text: string, credential: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCredential(credential);
    setTimeout(() => setCopiedCredential(null), 2000);
    toast.success('Copiado!');
  };

  const criarUsuariosPadrao = async () => {
    setCreatingUsers(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-default-users');

      if (error) throw error;

      const successCount = data.results.filter((r: any) => r.success).length;
      
      toast.success(`${successCount} usuário(s) criado(s) com sucesso! Agora você pode fazer login.`);
    } catch (error: any) {
      console.error("Erro ao criar usuários:", error);
      toast.error("Erro ao criar usuários: " + error.message);
    } finally {
      setCreatingUsers(false);
    }
  };

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
      navigate('/');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      // Aguardar um pouco para garantir que o usuário foi criado
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Fazer login para obter o user_id
      const { data: sessionData } = await supabase.auth.signInWithPassword({
        email: signupData.email,
        password: signupData.password,
      });

      if (sessionData.user) {
        // Criar solicitação de acesso
        const { error: solicitacaoError } = await supabase
          .from('solicitacoes_acesso')
          .insert({
            user_id: sessionData.user.id,
            tipo_acesso: signupData.tipoAcesso,
            maternidade: signupData.maternidade || null,
            justificativa: signupData.justificativa
          });

        if (solicitacaoError) {
          console.error('Erro ao criar solicitação:', solicitacaoError);
        }

        // Fazer logout
        await supabase.auth.signOut();
      }

      toast.success('Cadastro realizado! Aguarde aprovação do administrador.');
      setSignupData({ email: '', password: '', nomeCompleto: '', tipoAcesso: '', maternidade: '', justificativa: '' });
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-6">
        {/* Card principal de login/cadastro */}
        <Card className="flex-1">
          <CardHeader className="text-center">
            <img 
              src="/src/assets/hapvida-logo.png" 
              alt="Logo" 
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
                      minLength={6}
                    />
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

        {/* Card de credenciais padrão */}
        <Card className="w-full lg:w-80">
          <CardHeader>
            <CardTitle className="text-lg">Credenciais de Teste</CardTitle>
            <CardDescription className="text-xs">
              Use estas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {credenciaisPadrao.map((cred, idx) => (
              <div key={idx} className={`border-2 rounded-lg p-3 ${cred.cor}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-sm">{cred.tipo}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-mono break-all">{cred.email}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0"
                      onClick={() => copyToClipboard(cred.email, `${cred.tipo}-email`)}
                    >
                      {copiedCredential === `${cred.tipo}-email` ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-mono">{cred.senha}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0"
                      onClick={() => copyToClipboard(cred.senha, `${cred.tipo}-senha`)}
                    >
                      {copiedCredential === `${cred.tipo}-senha` ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
