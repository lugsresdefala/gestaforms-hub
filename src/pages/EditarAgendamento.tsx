import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save } from 'lucide-react';

interface AgendamentoData {
  id: string;
  nome_completo: string;
  carteirinha: string;
  data_nascimento: string;
  telefones: string;
  email_paciente: string;
  maternidade: string;
  medico_responsavel: string;
  centro_clinico: string;
  data_agendamento_calculada: string | null;
  status: string;
  observacoes_aprovacao: string | null;
  observacoes_agendamento: string | null;
}

const EditarAgendamento = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { isAdminMed } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [agendamento, setAgendamento] = useState<AgendamentoData | null>(null);

  useEffect(() => {
    if (!isAdminMed()) {
      toast({
        variant: "destructive",
        title: "Acesso negado",
        description: "Apenas administradores médicos podem editar agendamentos.",
      });
      navigate('/');
      return;
    }
    if (id) {
      fetchAgendamento();
    }
  }, [id, isAdminMed, navigate]);

  const fetchAgendamento = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('agendamentos_obst')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar agendamento",
        description: error.message,
      });
      navigate('/aprovacoes-agendamentos');
    } else {
      setAgendamento(data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!agendamento) return;

    setSaving(true);
    const { error } = await supabase
      .from('agendamentos_obst')
      .update({
        nome_completo: agendamento.nome_completo,
        carteirinha: agendamento.carteirinha,
        data_nascimento: agendamento.data_nascimento,
        telefones: agendamento.telefones,
        email_paciente: agendamento.email_paciente,
        maternidade: agendamento.maternidade,
        medico_responsavel: agendamento.medico_responsavel,
        centro_clinico: agendamento.centro_clinico,
        data_agendamento_calculada: agendamento.data_agendamento_calculada,
        observacoes_aprovacao: agendamento.observacoes_aprovacao,
        observacoes_agendamento: agendamento.observacoes_agendamento,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    setSaving(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error.message,
      });
    } else {
      toast({
        title: "✅ Agendamento atualizado",
        description: "As alterações foram salvas com sucesso.",
      });
      navigate('/aprovacoes-agendamentos');
    }
  };

  const handleChange = (field: keyof AgendamentoData, value: string) => {
    if (agendamento) {
      setAgendamento({ ...agendamento, [field]: value });
    }
  };

  if (loading || !agendamento) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Button
        variant="ghost"
        onClick={() => navigate('/aprovacoes-agendamentos')}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Editar Agendamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome_completo">Nome Completo</Label>
              <Input
                id="nome_completo"
                value={agendamento.nome_completo}
                onChange={(e) => handleChange('nome_completo', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="carteirinha">Carteirinha</Label>
              <Input
                id="carteirinha"
                value={agendamento.carteirinha}
                onChange={(e) => handleChange('carteirinha', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="data_nascimento">Data de Nascimento</Label>
              <Input
                id="data_nascimento"
                type="date"
                value={agendamento.data_nascimento}
                onChange={(e) => handleChange('data_nascimento', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="telefones">Telefones</Label>
              <Input
                id="telefones"
                value={agendamento.telefones}
                onChange={(e) => handleChange('telefones', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="email_paciente">Email</Label>
              <Input
                id="email_paciente"
                type="email"
                value={agendamento.email_paciente}
                onChange={(e) => handleChange('email_paciente', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="maternidade">Maternidade</Label>
              <Input
                id="maternidade"
                value={agendamento.maternidade}
                onChange={(e) => handleChange('maternidade', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="medico_responsavel">Médico Responsável</Label>
              <Input
                id="medico_responsavel"
                value={agendamento.medico_responsavel}
                onChange={(e) => handleChange('medico_responsavel', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="centro_clinico">Centro Clínico</Label>
              <Input
                id="centro_clinico"
                value={agendamento.centro_clinico}
                onChange={(e) => handleChange('centro_clinico', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="data_agendamento_calculada">Data de Agendamento</Label>
              <Input
                id="data_agendamento_calculada"
                type="date"
                value={agendamento.data_agendamento_calculada || ''}
                onChange={(e) => handleChange('data_agendamento_calculada', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="observacoes_agendamento">Observações do Agendamento</Label>
            <Textarea
              id="observacoes_agendamento"
              value={agendamento.observacoes_agendamento || ''}
              onChange={(e) => handleChange('observacoes_agendamento', e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="observacoes_aprovacao">Observações da Aprovação</Label>
            <Textarea
              id="observacoes_aprovacao"
              value={agendamento.observacoes_aprovacao || ''}
              onChange={(e) => handleChange('observacoes_aprovacao', e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/aprovacoes-agendamentos')}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditarAgendamento;
