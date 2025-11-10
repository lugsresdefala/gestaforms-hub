import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { UserCog, Search, Save, X, Shield, Mail, User } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface UserProfile {
  id: string;
  nome_completo: string;
  email: string;
  created_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  maternidade?: string;
}

const EditarUsuarios = () => {
  const navigate = useNavigate();
  const { isAdmin, isAdminMed } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [newMaternidade, setNewMaternidade] = useState('');

  useEffect(() => {
    if (!isAdmin() && !isAdminMed()) {
      toast({
        variant: "destructive",
        title: "Acesso negado",
        description: "Apenas administradores podem acessar esta página.",
      });
      navigate('/');
      return;
    }
    fetchUsers();
  }, [isAdmin, isAdminMed, navigate]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('nome_completo', { ascending: true });

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar usuários",
        description: error.message,
      });
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  const fetchUserRoles = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar roles",
        description: error.message,
      });
    } else {
      setUserRoles(data || []);
    }
  };

  const handleEditUser = async (user: UserProfile) => {
    setSelectedUser(user);
    await fetchUserRoles(user.id);
    setEditDialogOpen(true);
    setNewRole('');
    setNewMaternidade('');
  };

  const handleAddRole = async () => {
    if (!selectedUser || !newRole) return;

    const roleData: any = {
      user_id: selectedUser.id,
      role: newRole,
    };

    if (newRole === 'medico_maternidade' && !newMaternidade) {
      toast({
        variant: "destructive",
        title: "Maternidade obrigatória",
        description: "Selecione a maternidade para médico de maternidade.",
      });
      return;
    }

    if (newRole === 'medico_maternidade') {
      roleData.maternidade = newMaternidade;
    }

    const { error } = await supabase
      .from('user_roles')
      .insert(roleData);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao adicionar role",
        description: error.message,
      });
    } else {
      toast({
        title: "Role adicionado",
        description: "O role foi adicionado com sucesso.",
      });
      await fetchUserRoles(selectedUser.id);
      setNewRole('');
      setNewMaternidade('');
    }
  };

  const handleRemoveRole = async (roleId: string) => {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('id', roleId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao remover role",
        description: error.message,
      });
    } else {
      toast({
        title: "Role removido",
        description: "O role foi removido com sucesso.",
      });
      if (selectedUser) {
        await fetchUserRoles(selectedUser.id);
      }
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      'admin': 'Administrador',
      'admin_med': 'Administrador Médico',
      'medico_unidade': 'Médico de Unidade',
      'medico_maternidade': 'Médico de Maternidade',
    };
    return labels[role] || role;
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'admin_med':
        return 'default';
      case 'medico_unidade':
        return 'secondary';
      case 'medico_maternidade':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const filteredUsers = users.filter(user =>
    user.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <UserCog className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Gerenciar Usuários</h1>
        </div>
        <p className="text-muted-foreground">
          Editar perfis e permissões de usuários do sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buscar Usuários</CardTitle>
          <CardDescription>
            Encontre usuários por nome ou email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="hover:border-primary/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{user.nome_completo}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => handleEditUser(user)}
                  variant="outline"
                  className="gap-2"
                >
                  <Shield className="h-4 w-4" />
                  Gerenciar Permissões
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredUsers.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Search className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhum usuário encontrado</h3>
              <p className="text-muted-foreground">
                Tente ajustar os termos de busca
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gerenciar Permissões</DialogTitle>
            <DialogDescription>
              {selectedUser?.nome_completo} - {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <h4 className="font-semibold mb-3">Permissões Atuais</h4>
              <div className="space-y-2">
                {userRoles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma permissão atribuída</p>
                ) : (
                  userRoles.map((role) => (
                    <div key={role.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Badge variant={getRoleBadgeVariant(role.role)}>
                          {getRoleLabel(role.role)}
                        </Badge>
                        {role.maternidade && (
                          <span className="text-sm text-muted-foreground">
                            - {role.maternidade}
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveRole(role.id)}
                        className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border-t pt-6">
              <h4 className="font-semibold mb-4">Adicionar Nova Permissão</h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo de Acesso</Label>
                  <Select value={newRole} onValueChange={setNewRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de acesso" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="admin_med">Administrador Médico</SelectItem>
                      <SelectItem value="medico_unidade">Médico de Unidade</SelectItem>
                      <SelectItem value="medico_maternidade">Médico de Maternidade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newRole === 'medico_maternidade' && (
                  <div className="space-y-2">
                    <Label>Maternidade</Label>
                    <Select value={newMaternidade} onValueChange={setNewMaternidade}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a maternidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cruzeiro">Cruzeiro</SelectItem>
                        <SelectItem value="Guarulhos">Guarulhos</SelectItem>
                        <SelectItem value="Notrecare">Notrecare</SelectItem>
                        <SelectItem value="Salvalus">Salvalus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button
                  onClick={handleAddRole}
                  disabled={!newRole || (newRole === 'medico_maternidade' && !newMaternidade)}
                  className="w-full gap-2"
                >
                  <Save className="h-4 w-4" />
                  Adicionar Permissão
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EditarUsuarios;
