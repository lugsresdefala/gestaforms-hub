import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PROTOCOLS } from "@/lib/obstetricProtocols";
import { BookOpen, AlertCircle, Calendar, Route } from "lucide-react";

const getPrioridadeColor = (prioridade: number) => {
  switch (prioridade) {
    case 1: return "destructive";
    case 2: return "default";
    case 3: return "secondary";
    default: return "outline";
  }
};

const getPrioridadeLabel = (prioridade: number) => {
  switch (prioridade) {
    case 1: return "Crítico";
    case 2: return "Alto";
    case 3: return "Moderado";
    default: return "Normal";
  }
};

const getProtocolLabel = (key: string): string => {
  const labels: Record<string, string> = {
    // Prioridade Crítica
    'cerclagem': 'Cerclagem / IIC',
    
    // Cesárea eletiva
    'desejo_materno': 'Desejo Materno',
    'laqueadura': 'Laqueadura',
    
    // Hipertensão
    'hac': 'HAC Compensada',
    'hac_dificil': 'HAC Difícil Controle',
    'hipertensao_gestacional': 'Hipertensão Gestacional',
    'pre_eclampsia_grave': 'Pré-eclâmpsia Grave',
    
    // Diabetes
    'dmg_sem_insulina': 'DMG sem Insulina',
    'dmg_sem_insulina_descomp': 'DMG sem Insulina Descompensada',
    'dmg_insulina': 'DMG com Insulina',
    'dmg_insulina_descomp': 'DMG com Insulina Descompensada',
    'dm_pregestacional': 'DM Pré-gestacional',
    'dm_pregestacional_descomp': 'DM Pré-gestacional Descompensada',
    
    // Gemelar
    'gestacao_gemelar_dicorionica': 'Gemelar Dicoriônica',
    'gestacao_gemelar_monocorionica': 'Gemelar Monocoriônica',
    
    // Placenta
    'placenta_previa_acretismo': 'Placenta Prévia com Acretismo',
    'placenta_previa_sem_acretismo': 'Placenta Prévia sem Acretismo',
    'vasa_previa': 'Vasa Prévia',
    
    // Fetais
    'rcf': 'Restrição de Crescimento Fetal',
    'oligoamnio': 'Oligoâmnio',
    'polidramnio': 'Polidrâmnio',
    'macrossomia': 'Macrossomia',
  };
  return labels[key] || key;
};

const categorias = {
  'Prioridade Crítica': ['cerclagem'],
  'Cesárea Eletiva': ['desejo_materno', 'laqueadura'],
  'Hipertensão': ['hac', 'hac_dificil', 'hipertensao_gestacional', 'pre_eclampsia_grave'],
  'Diabetes': ['dmg_sem_insulina', 'dmg_sem_insulina_descomp', 'dmg_insulina', 'dmg_insulina_descomp', 'dm_pregestacional', 'dm_pregestacional_descomp'],
  'Gestação Gemelar': ['gestacao_gemelar_dicorionica', 'gestacao_gemelar_monocorionica'],
  'Patologias Placentárias': ['placenta_previa_acretismo', 'placenta_previa_sem_acretismo', 'vasa_previa'],
  'Patologias Fetais': ['rcf', 'oligoamnio', 'polidramnio', 'macrossomia'],
};

const Protocolos = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-primary">Protocolos Obstétricos</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          PT-AON-097 - Indicações de procedimentos por patologia e idade gestacional
        </p>
      </div>
      
      <ScrollArea className="h-[calc(100vh-220px)]">
        <div className="space-y-8 pr-4">
          {Object.entries(categorias).map(([categoria, protocolKeys]) => (
            <div key={categoria}>
              <h2 className="text-xl font-semibold mb-4 text-primary border-b pb-2">
                {categoria}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {protocolKeys.map((key) => {
                  const protocol = PROTOCOLS[key];
                  if (!protocol) return null;
                  
                  return (
                    <Card key={key} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-start justify-between gap-2">
                          <span>{getProtocolLabel(key)}</span>
                          <Badge variant={getPrioridadeColor(protocol.prioridade)} className="shrink-0">
                            {getPrioridadeLabel(protocol.prioridade)}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-start gap-2">
                          <Calendar className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <div className="text-sm">
                            <span className="font-medium">IG Ideal:</span> {protocol.igIdeal} semanas
                            {protocol.margemDias > 0 && (
                              <span className="text-muted-foreground"> (+{protocol.margemDias} dias)</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <Route className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <div className="text-sm">
                            <span className="font-medium">Via:</span> {protocol.viaPreferencial}
                          </div>
                        </div>
                        
                        {protocol.observacoes && (
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                            <div className="text-sm text-muted-foreground">
                              {protocol.observacoes}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
          
          <Card className="bg-muted/50 border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                Legenda e Informações Importantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li><strong>IG Ideal:</strong> Idade gestacional recomendada para o procedimento</li>
                <li><strong>Margem de dias:</strong> Dias adicionais permitidos após a IG ideal</li>
                <li><strong>Prioridade Crítica:</strong> Casos que requerem atenção imediata</li>
                <li><strong>Prioridade Alta:</strong> Casos que devem ser priorizados no agendamento</li>
                <li><strong>Prioridade Moderada:</strong> Casos de rotina com protocolo estabelecido</li>
                <li><strong>Via obstétrica:</strong> Via de parto definida pela melhor indicação clínica</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
};

export default Protocolos;
