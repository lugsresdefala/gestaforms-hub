import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { updateParidadeFromCSV } from '@/scripts/updateParidadeFromCSV';

export default function AtualizarParidade() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [results, setResults] = useState<{ updated: number; notFound: number } | null>(null);
  const { toast } = useToast();

  const handleUpdate = async () => {
    setIsUpdating(true);
    setResults(null);
    
    try {
      const result = await updateParidadeFromCSV();
      setResults(result);
      
      toast({
        title: "Atualização concluída!",
        description: `${result.updated} registros atualizados com sucesso.`,
      });
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Ocorreu um erro ao atualizar a paridade dos agendamentos.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Atualizar Paridade dos Agendamentos</CardTitle>
          <CardDescription>
            Esta ferramenta atualiza a paridade (gestações, partos, abortos) dos agendamentos existentes
            a partir do arquivo CSV Consolidado_Novembro_Dezembro.csv
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleUpdate}
            disabled={isUpdating}
            size="lg"
          >
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isUpdating ? 'Atualizando...' : 'Atualizar Paridade'}
          </Button>

          {results && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Resultados:</h3>
              <p className="text-sm">✅ Registros atualizados: {results.updated}</p>
              {results.notFound > 0 && (
                <p className="text-sm text-muted-foreground">⚠️ Não encontrados: {results.notFound}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
