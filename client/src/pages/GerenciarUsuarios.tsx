import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Search, UserCog, UserX, UserCheck, Shield, Calendar, Building2, Stethoscope } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EditUserRolesDialog } from "@/components/EditUserRolesDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface UserData {
  id: string;
  nome_completo: string;
  email: string;
  status_aprovacao: string;
  created_at: string;
  roles: Array<{
    id: string;
    role: string;
    maternidade: string | null;
  }>;
}

const GerenciarUsuarios = () => {
  const { isAdmin, isAdminMed } = useAuth();
  const [usuarios, setUsuarios] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [userToToggleStatus, setUserToToggleStatus] = useState<UserData | null>(null);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    setLoading(true);
    
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, nome_completo, email, status_aprovacao, created_at')
      .order('created_at', { ascending: false });

    if (profilesError) {
      toast.error("Erro ao carregar usuários: " + profilesError.message);
      setLoading(false);
      return;
    }

    // Buscar roles de cada usuário
    const usersWithRoles = await Promise.all(
      (profilesData || []).map(async (profile) => {
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('id, role, maternidade')
          .eq('user_id', profile.id);

        return {
          ...profile,
          roles: rolesData || []
        };
      })
    );

    setUsuarios(usersWithRoles);
    setLoading(false);
  };

  const handleToggleStatus = async (user: UserData) => {
    const newStatus = user.status_aprovacao === 'ativo' ? 'inativo' : 'ativo';
    
    const { error } = await supabase
      .from('profiles')
      .update({ status_aprovacao: newStatus })
      .eq('id', user.id);

    if (error) {
      toast.error("Erro ao atualizar status: " + error.message);
      return;
    }

    toast.success(`Usuário ${newStatus === 'ativo' ? 'reativado' : 'desativado'} com sucesso`);
    setUserToToggleStatus(null);
    fetchUsuarios();
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

  const filteredUsuarios = usuarios.filter(user => {
    const matchesSearch = 
      user.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === "all" || user.roles.some(r => r.role === filterRole);
    const matchesStatus = filterStatus === "all" || user.status_aprovacao === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  if (!isAdmin() && !isAdminMed()) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Você não tem permissão para acessar esta página.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gerenciar Usuários</h1>
          <p className="text-muted-foreground mt-1">
            Visualize e gerencie todos os usuários do sistema
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Roles</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="admin_med">Admin Médico</SelectItem>
                <SelectItem value="medico_unidade">Médico Unidade</SelectItem>
                <SelectItem value="medico_maternidade">Médico Maternidade</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="inativo">Inativos</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <span>Total: {filteredUsuarios.length} usuários</span>
            <span>•</span>
            <span>Ativos: {filteredUsuarios.filter(u => u.status_aprovacao === 'ativo').length}</span>
            <span>•</span>
            <span>Inativos: {filteredUsuarios.filter(u => u.status_aprovacao === 'inativo').length}</span>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Usuários */}
      {loading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Carregando usuários...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : filteredUsuarios.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground py-8">
              Nenhum usuário encontrado com os filtros aplicados.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cadastrado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsuarios.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.nome_completo}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles.length === 0 ? (
                            <Badge variant="outline">Sem roles</Badge>
                          ) : (
                            user.roles.map((role) => (
                              <Badge
                                key={role.id}
                                variant="secondary"
                                className="flex items-center gap-1"
                              >
                                {getRoleIcon(role.role)}
                                <span>{getRoleLabel(role.role)}</span>
                                {role.maternidade && (
                                  <span className="text-xs opacity-70">
                                    ({role.maternidade})
                                  </span>
                                )}
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.status_aprovacao === 'ativo'
                              ? 'default'
                              : user.status_aprovacao === 'inativo'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {user.status_aprovacao === 'ativo' ? 'Ativo' : 
                           user.status_aprovacao === 'inativo' ? 'Inativo' : 'Pendente'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedUser(user)}
                            disabled={!isAdmin()}
                          >
                            <UserCog className="h-4 w-4 mr-1" />
                            Editar Roles
                          </Button>
                          
                          <Button
                            size="sm"
                            variant={user.status_aprovacao === 'ativo' ? 'destructive' : 'default'}
                            onClick={() => setUserToToggleStatus(user)}
                            disabled={!isAdmin()}
                          >
                            {user.status_aprovacao === 'ativo' ? (
                              <>
                                <UserX className="h-4 w-4 mr-1" />
                                Desativar
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4 mr-1" />
                                Reativar
                              </>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog para Editar Roles */}
      {selectedUser && (
        <EditUserRolesDialog
          user={selectedUser}
          open={!!selectedUser}
          onOpenChange={(open) => !open && setSelectedUser(null)}
          onSuccess={() => {
            setSelectedUser(null);
            fetchUsuarios();
          }}
        />
      )}

      {/* Dialog de Confirmação de Desativação/Reativação */}
      <AlertDialog open={!!userToToggleStatus} onOpenChange={(open) => !open && setUserToToggleStatus(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {userToToggleStatus?.status_aprovacao === 'ativo' ? 'Desativar Usuário' : 'Reativar Usuário'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {userToToggleStatus?.status_aprovacao === 'ativo' 
                ? `Tem certeza que deseja desativar o usuário "${userToToggleStatus?.nome_completo}"? Ele não poderá mais acessar o sistema até ser reativado.`
                : `Tem certeza que deseja reativar o usuário "${userToToggleStatus?.nome_completo}"? Ele poderá acessar o sistema novamente com os roles atuais.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToToggleStatus && handleToggleStatus(userToToggleStatus)}
              className={userToToggleStatus?.status_aprovacao === 'ativo' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GerenciarUsuarios;
