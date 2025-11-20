import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, UserPlus, Copy, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const CriarUsuariosPadrao = () => {
  const [loading, setLoading] = useState(false);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const criarUsuarios = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-default-users');

      if (error) throw error;

      console.log("RESPOSTA COMPLETA DO BACKEND:", data);
      console.log("RESULTADOS:", data.results);
      
      setUsuarios(data.results || []);
      
      const successCount = data.results.filter((r: any) => r.success).length;
      const errorCount = data.results.filter((r: any) => !r.success).length;
      
      if (successCount > 0) {
        toast.success(`✅ ${successCount} usuário(s) criado(s) com sucesso!`);
      }
      if (errorCount > 0) {
        toast.error(`❌ ${errorCount} usuário(s) NÃO foram criados (já existem ou erro)`);
      }
    } catch (error: any) {
      console.error("Erro ao criar usuários:", error);
      toast.error("Erro ao criar usuários: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, email: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-8">
      <div className="container mx-auto max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Criar Usuários Padrão</CardTitle>
            <CardDescription>
              Crie usuários de teste para os 4 tipos de perfil do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Usuários que serão criados:</h3>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Badge>Admin</Badge>
                  <span className="text-sm">admin@hapvida.com.br</span>
                  <span className="text-sm text-muted-foreground">• Senha segura gerada automaticamente</span>
                </div>

                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Badge variant="secondary">Admin Médico</Badge>
                  <span className="text-sm">admin.med@hapvida.com.br</span>
                  <span className="text-sm text-muted-foreground">• Senha segura gerada automaticamente</span>
                </div>

                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Badge variant="secondary">Médico Unidade</Badge>
                  <span className="text-sm">medico.unidade@hapvida.com.br</span>
                  <span className="text-sm text-muted-foreground">• Senha segura gerada automaticamente</span>
                </div>

                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Badge variant="outline">Médico Maternidade</Badge>
                  <span className="text-sm">medico.maternidade@hapvida.com.br</span>
                  <span className="text-sm text-muted-foreground">• Senha segura gerada automaticamente</span>
                </div>
              </div>
            </div>

            <Button 
              onClick={criarUsuarios} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando usuários...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Criar Usuários Padrão
                </>
              )}
            </Button>

            {usuarios.length > 0 && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Resultado da Criação:</h3>
                  <div className="flex gap-2">
                    <Badge className="bg-green-600">
                      {usuarios.filter(u => u.success).length} Criados
                    </Badge>
                    <Badge variant="destructive">
                      {usuarios.filter(u => !u.success).length} Erros
                    </Badge>
                  </div>
                </div>
                
                {usuarios.map((usuario, idx) => (
                  <Card key={idx} className={usuario.success ? "border-green-500 border-2" : "border-red-500 border-2"}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3">
                            <p className="font-bold text-lg">{usuario.email}</p>
                            {usuario.success ? (
                              <Badge className="bg-green-600 text-white">✅ CRIADO COM SUCESSO</Badge>
                            ) : (
                              <Badge variant="destructive" className="text-white">❌ ERRO / JÁ EXISTE</Badge>
                            )}
                          </div>
                          
                          {usuario.success ? (
                            <div className="space-y-2 bg-green-50 dark:bg-green-950 p-3 rounded-lg">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm">Senha:</span>
                                <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded font-mono text-sm border">
                                  {usuario.password}
                                </code>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm">Role:</span>
                                <Badge variant="outline">{usuario.role}</Badge>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-red-50 dark:bg-red-950 p-3 rounded-lg">
                              <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                                Motivo: {usuario.error}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {usuario.success && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="ml-4"
                            onClick={() => copyToClipboard(`Email: ${usuario.email}\nSenha: ${usuario.password}\nRole: ${usuario.role}`, usuario.email)}
                          >
                            {copiedEmail === usuario.email ? (
                              <>
                                <Check className="h-4 w-4 mr-2 text-green-600" />
                                Copiado!
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4 mr-2" />
                                Copiar Credenciais
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CriarUsuariosPadrao;
