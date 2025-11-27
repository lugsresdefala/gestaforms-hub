import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText, Calendar, User, TrendingUp, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface AuditLog {
  id: string;
  created_at: string;
  action: string;
  table_name: string;
  record_id: string | null;
  old_data: any;
  new_data: any;
  user_id: string;
  user_agent: string | null;
}

interface ImportStats {
  total: number;
  novos: number;
  atualizados: number;
  ultimaImportacao: string | null;
}

export default function AuditoriaImportacoes() {
  const { isAdmin, isAdminMed } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<ImportStats>({
    total: 0,
    novos: 0,
    atualizados: 0,
    ultimaImportacao: null,
  });
  const [loading, setLoading] = useState(true);

  const hasAccess = isAdmin() || isAdminMed();

  useEffect(() => {
    if (!hasAccess) {
      toast.error("Acesso negado");
      return;
    }
    carregarDados();
  }, [hasAccess]);

  async function carregarDados() {
    setLoading(true);
    try {
      // Buscar logs de auditoria relacionados a agendamentos_obst
      const { data: auditData, error: auditError } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('table_name', 'agendamentos_obst')
        .order('created_at', { ascending: false })
        .limit(100);

      if (auditError) throw auditError;

      setLogs(auditData || []);

      // Calcular estatísticas
      const hoje = new Date().toISOString().split('T')[0];
      const logsHoje = (auditData || []).filter(log => 
        log.created_at.startsWith(hoje)
      );

      const novos = logsHoje.filter(log => log.action === 'insert' || log.action === 'create').length;
      const atualizados = logsHoje.filter(log => log.action === 'update').length;
      const ultimaImportacao = logsHoje.length > 0 ? logsHoje[0].created_at : null;

      setStats({
        total: logsHoje.length,
        novos,
        atualizados,
        ultimaImportacao,
      });

    } catch (error: any) {
      console.error('Erro ao carregar auditoria:', error);
      toast.error('Erro ao carregar dados de auditoria');
    } finally {
      setLoading(false);
    }
  }

  function getFieldChanges(log: AuditLog) {
    if (!log.old_data || !log.new_data) return [];
    
    const changes: Array<{ campo: string; anterior: any; novo: any }> = [];
    const allKeys = new Set([
      ...Object.keys(log.old_data),
      ...Object.keys(log.new_data)
    ]);

    allKeys.forEach(key => {
      if (key === 'updated_at' || key === 'created_at') return;
      
      const oldValue = log.old_data[key];
      const newValue = log.new_data[key];
      
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({
          campo: key,
          anterior: oldValue,
          novo: newValue,
        });
      }
    });

    return changes;
  }

  if (!hasAccess) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              Você não tem permissão para acessar esta página.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Auditoria de Importações</h1>
        <p className="text-muted-foreground">
          Detalhes das últimas importações e alterações no sistema
        </p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hoje</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Operações registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.novos}</div>
            <p className="text-xs text-muted-foreground">
              Registros inseridos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atualizados</CardTitle>
            <RefreshCw className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.atualizados}</div>
            <p className="text-xs text-muted-foreground">
              Registros modificados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Importação</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {stats.ultimaImportacao 
                ? format(new Date(stats.ultimaImportacao), "dd/MM/yyyy HH:mm", { locale: ptBR })
                : "Nenhuma hoje"
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Data e hora
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs com detalhes */}
      <Tabs defaultValue="todas" className="w-full">
        <TabsList>
          <TabsTrigger value="todas">Todas ({logs.length})</TabsTrigger>
          <TabsTrigger value="novas">Novas ({stats.novos})</TabsTrigger>
          <TabsTrigger value="atualizadas">Atualizadas ({stats.atualizados})</TabsTrigger>
        </TabsList>

        <TabsContent value="todas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico Completo</CardTitle>
              <CardDescription>Todas as operações recentes</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Registro</TableHead>
                    <TableHead>Alterações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const changes = getFieldChanges(log);
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={log.action === 'insert' || log.action === 'create' ? 'default' : 'secondary'}>
                            {log.action === 'insert' || log.action === 'create' ? 'Novo' : 'Atualizado'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-mono">{log.record_id?.substring(0, 8)}...</TableCell>
                        <TableCell className="text-sm">
                          {changes.length > 0 ? (
                            <div className="space-y-1">
                              {changes.slice(0, 2).map((change, idx) => (
                                <div key={idx} className="text-xs">
                                  <span className="font-semibold">{change.campo}:</span>{' '}
                                  <span className="line-through text-muted-foreground">
                                    {String(change.anterior || '—').substring(0, 20)}
                                  </span>
                                  {' → '}
                                  <span className="text-green-600">
                                    {String(change.novo || '—').substring(0, 20)}
                                  </span>
                                </div>
                              ))}
                              {changes.length > 2 && (
                                <div className="text-xs text-muted-foreground">
                                  +{changes.length - 2} campos
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">Novo registro</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="novas">
          <Card>
            <CardHeader>
              <CardTitle>Registros Novos</CardTitle>
              <CardDescription>Agendamentos inseridos</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Registro ID</TableHead>
                    <TableHead>Dados</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.filter(log => log.action === 'insert' || log.action === 'create').map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-xs font-mono">{log.record_id?.substring(0, 8)}...</TableCell>
                      <TableCell className="text-xs">
                        {log.new_data?.nome_completo && (
                          <div><strong>Nome:</strong> {log.new_data.nome_completo}</div>
                        )}
                        {log.new_data?.carteirinha && (
                          <div><strong>Carteirinha:</strong> {log.new_data.carteirinha}</div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="atualizadas">
          <Card>
            <CardHeader>
              <CardTitle>Registros Atualizados</CardTitle>
              <CardDescription>Alterações em agendamentos existentes</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Registro</TableHead>
                    <TableHead>Campos Alterados</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.filter(log => log.action === 'update').map((log) => {
                    const changes = getFieldChanges(log);
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-xs font-mono">{log.record_id?.substring(0, 8)}...</TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            {changes.map((change, idx) => (
                              <div key={idx} className="text-xs p-2 bg-muted rounded">
                                <div className="font-semibold mb-1">{change.campo}</div>
                                <div className="flex gap-2 items-center">
                                  <span className="line-through text-muted-foreground max-w-[150px] truncate">
                                    {String(change.anterior || '—')}
                                  </span>
                                  <span>→</span>
                                  <span className="text-green-600 max-w-[150px] truncate">
                                    {String(change.novo || '—')}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
