import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Shield, Stethoscope, Calendar, Building2, Plus, Trash2, History } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UserRole {
  id: string;
  role: string;
  maternidade: string | null;
}

interface UserData {
  id: string;
  nome_completo: string;
  email: string;
  roles: UserRole[];
}

interface EditUserRolesDialogProps {
  user: UserData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface AuditLog {
  id: string;
  action: string;
  created_at: string;
  table_name: string;
  old_data: any;
  new_data: any;
}

const MATERNIDADES = [
  "Salvalus Canindé",
  "Salvalus Guarulhos",
  "Notre Care",
  "Cruzeiro do Sul",
  "Outra"
];

export const EditUserRolesDialog = ({ user, open, onOpenChange, onSuccess }: EditUserRolesDialogProps) => {
  const { user: currentUser } = useAuth();
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [maternidadeForRole, setMaternidadeForRole] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    if (open && user) {
      // Inicializar roles selecionados
      const currentRoles = user.roles.map(r => r.role);
      setSelectedRoles(currentRoles);

      // Inicializar maternidades para roles de medico_maternidade
      const maternidades: { [key: string]: string } = {};
      user.roles.forEach(role => {
        if (role.role === 'medico_maternidade' && role.maternidade) {
          maternidades[role.role] = role.maternidade;
        }
      });
      setMaternidadeForRole(maternidades);

      // Carregar histórico de alterações
      fetchAuditLogs();
    }
  }, [open, user]);

  const fetchAuditLogs = async () => {
    setLoadingLogs(true);
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('table_name', 'user_roles')
      .contains('old_data', { user_id: user.id })
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setAuditLogs(data);
    }
    setLoadingLogs(false);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'admin_med':
        return <Stethoscope className="h-4 w-4" />;
      case 'medico_unidade':
        return <Calendar className="h-4 w-4" />;
      case 'medico_maternidade':
        return <Building2 className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'admin_med':
        return 'Admin Médico';
      case 'medico_unidade':
        return 'Médico Unidade';
      case 'medico_maternidade':
        return 'Médico Maternidade';
      default:
        return role;
    }
  };

  const handleRoleToggle = (role: string) => {
    setSelectedRoles(prev => {
      if (prev.includes(role)) {
        return prev.filter(r => r !== role);
      } else {
        return [...prev, role];
      }
    });
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      // 1. Remover roles que não estão mais selecionados
      const rolesToRemove = user.roles.filter(r => !selectedRoles.includes(r.role));
      for (const role of rolesToRemove) {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('id', role.id);

        if (error) throw error;
      }

      // 2. Adicionar novos roles
      const currentRoleNames = user.roles.map(r => r.role);
      const rolesToAdd = selectedRoles.filter(r => !currentRoleNames.includes(r));
      
      for (const role of rolesToAdd) {
        const roleData: any = {
          user_id: user.id,
          role: role,
        };

        // Se for medico_maternidade, adicionar a maternidade
        if (role === 'medico_maternidade') {
          if (!maternidadeForRole[role]) {
            toast.error("Por favor, selecione uma maternidade para o role Médico Maternidade");
            setLoading(false);
            return;
          }
          roleData.maternidade = maternidadeForRole[role];
        }

        const { error } = await supabase
          .from('user_roles')
          .insert(roleData);

        if (error) throw error;
      }

      // 3. Atualizar maternidades de roles existentes do tipo medico_maternidade
      const existingMaternidadeRoles = user.roles.filter(
        r => r.role === 'medico_maternidade' && selectedRoles.includes(r.role)
      );
      
      for (const role of existingMaternidadeRoles) {
        if (maternidadeForRole['medico_maternidade'] && maternidadeForRole['medico_maternidade'] !== role.maternidade) {
          const { error } = await supabase
            .from('user_roles')
            .update({ maternidade: maternidadeForRole['medico_maternidade'] })
            .eq('id', role.id);

          if (error) throw error;
        }
      }

      toast.success("Roles atualizados com sucesso!");
      onSuccess();
    } catch (error: any) {
      toast.error("Erro ao atualizar roles: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Roles do Usuário</DialogTitle>
          <DialogDescription>
            <div className="space-y-1">
              <p className="font-medium text-foreground">{user.nome_completo}</p>
              <p className="text-sm">{user.email}</p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="roles" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="roles" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Roles Disponíveis</Label>
                
                {/* Admin */}
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="admin"
                          checked={selectedRoles.includes('admin')}
                          onCheckedChange={() => handleRoleToggle('admin')}
                        />
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-primary" />
                          <Label htmlFor="admin" className="cursor-pointer font-medium">
                            Administrador
                          </Label>
                        </div>
                      </div>
                      <Badge variant="secondary">Acesso Total</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground ml-9 mt-1">
                      Acesso completo a todas as funcionalidades do sistema
                    </p>
                  </CardContent>
                </Card>

                {/* Admin Med */}
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="admin_med"
                          checked={selectedRoles.includes('admin_med')}
                          onCheckedChange={() => handleRoleToggle('admin_med')}
                        />
                        <div className="flex items-center gap-2">
                          <Stethoscope className="h-4 w-4 text-primary" />
                          <Label htmlFor="admin_med" className="cursor-pointer font-medium">
                            Admin Médico
                          </Label>
                        </div>
                      </div>
                      <Badge variant="secondary">Aprovações</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground ml-9 mt-1">
                      Pode aprovar agendamentos e gerenciar usuários médicos
                    </p>
                  </CardContent>
                </Card>

                {/* Medico Unidade */}
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="medico_unidade"
                          checked={selectedRoles.includes('medico_unidade')}
                          onCheckedChange={() => handleRoleToggle('medico_unidade')}
                        />
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <Label htmlFor="medico_unidade" className="cursor-pointer font-medium">
                            Médico Unidade
                          </Label>
                        </div>
                      </div>
                      <Badge variant="secondary">Criação</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground ml-9 mt-1">
                      Pode criar e visualizar agendamentos de sua unidade
                    </p>
                  </CardContent>
                </Card>

                {/* Medico Maternidade */}
                <Card>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="medico_maternidade"
                            checked={selectedRoles.includes('medico_maternidade')}
                            onCheckedChange={() => handleRoleToggle('medico_maternidade')}
                          />
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-primary" />
                            <Label htmlFor="medico_maternidade" className="cursor-pointer font-medium">
                              Médico Maternidade
                            </Label>
                          </div>
                        </div>
                        <Badge variant="secondary">Visualização</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground ml-9">
                        Visualiza agendamentos aprovados da maternidade
                      </p>
                      
                      {selectedRoles.includes('medico_maternidade') && (
                        <div className="ml-9">
                          <Label htmlFor="maternidade" className="text-sm mb-2 block">
                            Selecione a Maternidade *
                          </Label>
                          <Select
                            value={maternidadeForRole['medico_maternidade'] || ''}
                            onValueChange={(value) => setMaternidadeForRole({ ...maternidadeForRole, medico_maternidade: value })}
                          >
                            <SelectTrigger id="maternidade">
                              <SelectValue placeholder="Escolha uma maternidade" />
                            </SelectTrigger>
                            <SelectContent>
                              {MATERNIDADES.map((mat) => (
                                <SelectItem key={mat} value={mat}>
                                  {mat}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-semibold">Roles Atuais</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {user.roles.length === 0 ? (
                    <Badge variant="outline">Nenhum role atribuído</Badge>
                  ) : (
                    user.roles.map((role) => (
                      <Badge key={role.id} variant="secondary" className="flex items-center gap-1">
                        {getRoleIcon(role.role)}
                        <span>{getRoleLabel(role.role)}</span>
                        {role.maternidade && (
                          <span className="text-xs opacity-70">({role.maternidade})</span>
                        )}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-3 mt-4">
            {loadingLogs ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Carregando histórico...</p>
              </div>
            ) : auditLogs.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  Nenhuma alteração registrada para este usuário
                </CardContent>
              </Card>
            ) : (
              auditLogs.map((log) => (
                <Card key={log.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <History className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">
                          {log.action === 'INSERT' ? 'Role Adicionado' : 
                           log.action === 'UPDATE' ? 'Role Atualizado' : 
                           log.action === 'DELETE' ? 'Role Removido' : log.action}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                        {log.old_data && (
                          <div className="text-xs text-muted-foreground mt-2">
                            <span className="font-medium">Anterior:</span> {JSON.stringify(log.old_data)}
                          </div>
                        )}
                        {log.new_data && (
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium">Novo:</span> {JSON.stringify(log.new_data)}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
