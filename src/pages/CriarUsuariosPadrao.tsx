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

      setUsuarios(data.results || []);
      
      const successCount = data.results.filter((r: any) => r.success).length;
      
      toast.success(`${successCount} usuário(s) criado(s) com sucesso!`);
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
              Crie usuários de teste para os 3 tipos de perfil do sistema
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
              <div className="mt-6 space-y-3">
                <h3 className="font-semibold">Resultado:</h3>
                {usuarios.map((usuario, idx) => (
                  <Card key={idx}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{usuario.email}</p>
                            {usuario.success ? (
                              <Badge variant="default" className="bg-green-500">Criado</Badge>
                            ) : (
                              <Badge variant="destructive">Erro</Badge>
                            )}
                          </div>
                          {usuario.success ? (
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Senha: {usuario.password}</p>
                              <p className="text-sm text-muted-foreground">Role: {usuario.role}</p>
                            </div>
                          ) : (
                            <p className="text-sm text-red-500">{usuario.error}</p>
                          )}
                        </div>
                        {usuario.success && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(`${usuario.email}\n${usuario.password}`, usuario.email)}
                          >
                            {copiedEmail === usuario.email ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
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
