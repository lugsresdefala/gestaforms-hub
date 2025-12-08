import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PROTOCOLS, ProtocolConfig } from "@/lib/obstetricProtocols";
import { BookOpen, AlertCircle, Calendar, Route } from "lucide-react";
interface ProtocolosModalProps {
  trigger?: React.ReactNode;
}
const getPrioridadeColor = (prioridade: number) => {
  switch (prioridade) {
    case 1:
      return "destructive";
    case 2:
      return "default";
    case 3:
      return "secondary";
    default:
      return "outline";
  }
};
const getPrioridadeLabel = (prioridade: number) => {
  switch (prioridade) {
    case 1:
      return "Crítico";
    case 2:
      return "Alto";
    case 3:
      return "Moderado";
    default:
      return "Normal";
  }
};
const getProtocolLabel = (key: string): string => {
  const labels: Record<string, string> = {
    // Hipertensão
    'hac': 'HAC Compensada',
    'hac_dificil': 'HAC Difícil Controle',
    'hipertensao_gestacional': 'Hipertensão Gestacional',
    'pre_eclampsia_sem_deterioracao': 'Pré-eclâmpsia sem Deterioração',
    'pre_eclampsia_grave': 'Pré-eclâmpsia Grave',
    'eclampsia': 'Eclâmpsia',
    'sindrome_hellp': 'Síndrome HELLP',
    // Diabetes
    'dmg_sem_insulina': 'DMG sem Insulina',
    'dmg_sem_insulina_descomp': 'DMG sem Insulina Descompensada',
    'dmg_insulina': 'DMG com Insulina',
    'dmg_insulina_descomp': 'DMG com Insulina Descompensada',
    'dm_pregestacional': 'DM Pré-gestacional',
    'dm_pregestacional_descomp': 'DM Pré-gestacional Descompensada',
    // Placenta
    'placenta_previa_total': 'Placenta Prévia Total',
    'placenta_previa_parcial': 'Placenta Prévia Parcial',
    'placenta_baixa': 'Placenta Baixa',
    'placenta_acreta': 'Placenta Acreta',
    'placenta_percreta': 'Placenta Percreta',
    'dpp': 'Descolamento Prematuro Placenta',
    // Gemelar
    'gemelar_monocorionico': 'Gemelar Monocoriônica',
    'gemelar_bicorionico': 'Gemelar Bicoriônica',
    'gemelar_monoamniotico': 'Gemelar Monoamniótica',
    // Apresentação Fetal
    'pelvico': 'Apresentação Pélvica',
    'cormica': 'Apresentação Córmica',
    // Rotura de Membranas
    'rpmo_pretermo': 'RPMO Pré-termo',
    'rpmo_termo': 'RPMO a Termo',
    // Crescimento Fetal
    'rcf': 'Restrição de Crescimento Fetal',
    'rcf_grave': 'RCF Grave',
    'macrossomia': 'Macrossomia',
    'macrossomia_severa': 'Macrossomia Severa',
    // Líquido Amniótico
    'oligodramnia': 'Oligodrâmnia',
    'oligodramnia_severa': 'Oligodrâmnia Severa',
    'polidramnia': 'Polidrâmnia',
    // Iteratividade
    'iteratividade_1cesarea': 'Iteratividade 1 Cesárea',
    'iteratividade_2cesarea': 'Iteratividade 2+ Cesáreas',
    'cesarea_corporal': 'Cesárea Corporal Prévia',
    // Malformações Fetais
    'malformacao_grave': 'Malformação Fetal Grave',
    'cardiopatia_fetal': 'Cardiopatia Fetal',
    'hidrocefalia': 'Hidrocefalia',
    // Doenças Maternas
    'cardiopatia_materna': 'Cardiopatia Materna',
    'cardiopatia_grave': 'Cardiopatia Grave',
    'doenca_renal': 'Doença Renal',
    'lupus': 'Lúpus',
    'epilepsia': 'Epilepsia',
    'trombofilia': 'Trombofilia',
    // Infecções
    'hiv': 'HIV',
    'hepatite_b': 'Hepatite B',
    'hepatite_c': 'Hepatite C',
    'sifilis': 'Sífilis',
    'toxoplasmose': 'Toxoplasmose',
    'cmv': 'Citomegalovírus',
    'herpes': 'Herpes Genital',
    // Condições Especiais
    'colestase': 'Colestase Gravídica',
    'obesidade': 'Obesidade Mórbida',
    'pos_datismo': 'Pós-datismo',
    'obito_fetal': 'Óbito Fetal'
  };
  return labels[key] || key;
};
const categorias = {
  'Distúrbios Hipertensivos': ['hac', 'hac_dificil', 'hipertensao_gestacional', 'pre_eclampsia_sem_deterioracao', 'pre_eclampsia_grave', 'eclampsia', 'sindrome_hellp'],
  'Diabetes Gestacional e Pré-gestacional': ['dmg_sem_insulina', 'dmg_sem_insulina_descomp', 'dmg_insulina', 'dmg_insulina_descomp', 'dm_pregestacional', 'dm_pregestacional_descomp'],
  'Patologias Placentárias': ['placenta_previa_total', 'placenta_previa_parcial', 'placenta_baixa', 'placenta_acreta', 'placenta_percreta', 'dpp'],
  'Gestação Gemelar': ['gemelar_monocorionico', 'gemelar_bicorionico', 'gemelar_monoamniotico'],
  'Apresentação Fetal': ['pelvico', 'cormica'],
  'Rotura de Membranas': ['rpmo_pretermo', 'rpmo_termo'],
  'Crescimento Fetal Anormal': ['rcf', 'rcf_grave', 'macrossomia', 'macrossomia_severa'],
  'Alterações do Líquido Amniótico': ['oligodramnia', 'oligodramnia_severa', 'polidramnia'],
  'Iteratividade e Cicatriz Uterina': ['iteratividade_1cesarea', 'iteratividade_2cesarea', 'cesarea_corporal'],
  'Malformações Fetais': ['malformacao_grave', 'cardiopatia_fetal', 'hidrocefalia'],
  'Doenças Maternas': ['cardiopatia_materna', 'cardiopatia_grave', 'doenca_renal', 'lupus', 'epilepsia', 'trombofilia'],
  'Infecções Maternas': ['hiv', 'hepatite_b', 'hepatite_c', 'sifilis', 'toxoplasmose', 'cmv', 'herpes'],
  'Outras Condições': ['colestase', 'obesidade', 'pos_datismo', 'obito_fetal']
};
export const ProtocolosModal = ({
  trigger
}: ProtocolosModalProps) => {
  return <Dialog>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Protocolos Obstétricos
          </Button>}
      </DialogTrigger>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Protocolos Obstétricos - PT-AON-097
          </DialogTitle>
          <DialogDescription>
            Indicações de procedimentos por patologia e idade gestacional
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[70vh] pr-4">
          <div className="space-y-6">
            {Object.entries(categorias).map(([categoria, protocolKeys]) => <div key={categoria}>
                <h3 className="text-lg font-semibold mb-3 text-primary border-b pb-2">
                  {categoria}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {protocolKeys.map(key => {
                const protocol = PROTOCOLS[key];
                if (!protocol) return null;
                return <Card key={key} className="hover:shadow-md transition-shadow">
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
                              {protocol.margemDias > 0 && <span className="text-muted-foreground"> (+{protocol.margemDias} dias)</span>}
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <Route className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                            <div className="text-sm">
                              <span className="font-medium">Via:</span> {protocol.viaPreferencial}
                            </div>
                          </div>
                          
                          {protocol.observacoes && <div className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                              <div className="text-sm text-muted-foreground">
                                {protocol.observacoes}
                              </div>
                            </div>}
                        </CardContent>
                      </Card>;
              })}
                </div>
              </div>)}
            
            <div className="bg-muted/50 rounded-lg p-4 mt-6 border">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                Legenda
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><strong>IG Ideal:</strong> Idade gestacional recomendada para o procedimento</li>
                <li><strong>Margem de dias:</strong> Dias adicionais permitidos após a IG ideal</li>
                <li><strong>Prioridade Crítica:</strong> Casos que requerem atenção imediata</li>
                <li><strong>Prioridade Alta:</strong> Casos que devem ser priorizados no agendamento</li>
                <li><strong>Prioridade Moderada:</strong> Casos de rotina com protocolo estabelecido</li>
                <li><strong>Via obstétrica:</strong> Via de parto definida pela melhor indicação clínica</li>
              </ul>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>;
};