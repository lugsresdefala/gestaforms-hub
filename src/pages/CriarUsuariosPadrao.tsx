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
      toast.success(`${data.results.length} usuários criados!`);
    } catch (error: any) {
      toast.error("Erro: " + error.message);
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
            <Button 
              onClick={criarUsuarios} 
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Criar 4 Usuários Novos
                </>
              )}
            </Button>

            {usuarios.length > 0 && (
              <div className="space-y-3">
                {usuarios.map((usuario, idx) => (
                  <Card key={idx}>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="font-mono text-sm">
                          <div className="font-bold">Email: {usuario.email}</div>
                          <div>Senha: {usuario.password}</div>
                          <div className="text-muted-foreground">Role: {usuario.role}</div>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full"
                          onClick={() => copyToClipboard(`${usuario.email}\n${usuario.password}`, usuario.email)}
                        >
                          {copiedEmail === usuario.email ? (
                            <><Check className="h-4 w-4 mr-2" />Copiado</>
                          ) : (
                            <><Copy className="h-4 w-4 mr-2" />Copiar</>
                          )}
                        </Button>
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
