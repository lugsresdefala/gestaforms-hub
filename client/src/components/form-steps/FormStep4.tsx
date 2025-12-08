import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, AlertCircle, Clock } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { 
  DIAGNOSTIC_CHECKLIST, 
  getAllCategories, 
  getDiagnosticsByCategory,
  calculateAutomaticIG,
  PROTOCOLS,
  type DiagnosticCategory 
} from "@/lib/obstetricProtocols";

interface FormStep4Props {
  form: UseFormReturn<any>;
}

// Categorias materna (condições da gestante)
const MATERNAL_CATEGORIES: DiagnosticCategory[] = [
  'hipertensao',
  'diabetes',
  'outras_maternas',
  'rotura_membranas',
  'iteratividade',
  'infeccoes',
  'eletivos'
];

// Categorias fetais (condições do feto)
const FETAL_CATEGORIES: DiagnosticCategory[] = [
  'crescimento_fetal',
  'liquido_amniotico',
  'gemelaridade',
  'placentarias',
  'apresentacao',
  'malformacoes'
];

export const FormStep4 = ({ form }: FormStep4Props) => {
  const [openMaternalCategories, setOpenMaternalCategories] = useState<Record<string, boolean>>({});
  const [openFetalCategories, setOpenFetalCategories] = useState<Record<string, boolean>>({});
  
  const allCategories = getAllCategories();
  
  const diagnosticosMaternos = form.watch('diagnosticosMaternos') || [];
  const diagnosticosFetais = form.watch('diagnosticosFetais') || [];
  
  // Cálculo automático da IG pretendida baseada nos diagnósticos selecionados
  const calculatedIG = useMemo(() => {
    const allDiagnostics = [...diagnosticosMaternos, ...diagnosticosFetais].filter(
      (d: string) => d && !d.startsWith('nenhum_') && !d.startsWith('outro_')
    );
    return calculateAutomaticIG(allDiagnostics);
  }, [diagnosticosMaternos, diagnosticosFetais]);
  
  // Atualizar campo igPretendida automaticamente
  useEffect(() => {
    if (calculatedIG.igPretendida !== 'Imediato') {
      const igText = calculatedIG.igPretendidaMax 
        ? `${calculatedIG.igPretendida}-${calculatedIG.igPretendidaMax} semanas`
        : `${calculatedIG.igPretendida} semanas`;
      form.setValue('igPretendida', igText);
    }
  }, [calculatedIG, form]);
  
  const toggleMaternalCategory = (categoryId: string) => {
    setOpenMaternalCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };
  
  const toggleFetalCategory = (categoryId: string) => {
    setOpenFetalCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };
  
  const getCategoryLabel = (categoryId: DiagnosticCategory): string => {
    const cat = allCategories.find(c => c.id === categoryId);
    return cat?.label || categoryId;
  };
  
  const getSelectedCountForCategory = (categoryId: DiagnosticCategory, isFetal: boolean): number => {
    const diagnostics = getDiagnosticsByCategory(categoryId);
    const selectedArray = isFetal ? diagnosticosFetais : diagnosticosMaternos;
    return diagnostics.filter(d => selectedArray.includes(d.id)).length;
  };
  
  const renderDiagnosticCheckbox = (
    item: { id: string; label: string; igIdeal: string; igIdealMax?: string; observacoes: string },
    fieldName: 'diagnosticosMaternos' | 'diagnosticosFetais'
  ) => {
    const igText = item.igIdealMax ? `${item.igIdeal}-${item.igIdealMax}sem` : `${item.igIdeal}sem`;
    const protocol = PROTOCOLS[item.id];
    const prioridade = protocol?.prioridade || 3;
    
    return (
      <FormField
        key={item.id}
        control={form.control}
        name={fieldName}
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-1.5 px-2 rounded hover:bg-muted/50">
            <FormControl>
              <Checkbox
                checked={field.value?.includes(item.id)}
                onCheckedChange={(checked) => {
                  const newValue = checked
                    ? [...(field.value || []), item.id]
                    : field.value?.filter((value: string) => value !== item.id);
                  
                  // Remove "nenhum" se outro diagnóstico for selecionado
                  if (checked && item.id !== 'nenhum_materno' && item.id !== 'nenhum_fetal') {
                    const filteredValue = newValue.filter((v: string) => 
                      v !== 'nenhum_materno' && v !== 'nenhum_fetal'
                    );
                    field.onChange(filteredValue);
                  } else if (checked && (item.id === 'nenhum_materno' || item.id === 'nenhum_fetal')) {
                    // Se selecionar "nenhum", remove todos os outros
                    field.onChange([item.id]);
                  } else {
                    field.onChange(newValue);
                  }
                }}
              />
            </FormControl>
            <div className="flex flex-col flex-1">
              <FormLabel className="font-normal cursor-pointer text-sm">
                {item.label}
              </FormLabel>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  prioridade === 1 ? 'bg-red-100 text-red-700' :
                  prioridade === 2 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  <Clock className="inline-block w-3 h-3 mr-0.5" />
                  IG: {igText}
                </span>
                {prioridade === 1 && (
                  <span className="text-xs text-red-600 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-0.5" />
                    Alta prioridade
                  </span>
                )}
              </div>
            </div>
          </FormItem>
        )}
      />
    );
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="pb-4 border-b border-border/30">
        <h2 className="text-2xl font-bold text-foreground mb-2">Histórico Médico</h2>
        <p className="text-sm text-muted-foreground">Diagnósticos e medicações atuais</p>
      </div>

      <FormField
        control={form.control}
        name="medicacao"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Medicação e dosagem</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Indique qual medicação e dosagem que a paciente utiliza" 
                className="min-h-[80px]"
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Cálculo automático de IG */}
      {(diagnosticosMaternos.length > 0 || diagnosticosFetais.length > 0) && 
       !diagnosticosMaternos.includes('nenhum_materno') && 
       !diagnosticosFetais.includes('nenhum_fetal') && (
        <div className={`p-4 rounded-lg border ${
          calculatedIG.prioridade === 1 ? 'bg-red-50 border-red-200' :
          calculatedIG.prioridade === 2 ? 'bg-yellow-50 border-yellow-200' :
          'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <Clock className={`w-5 h-5 ${
              calculatedIG.prioridade === 1 ? 'text-red-600' :
              calculatedIG.prioridade === 2 ? 'text-yellow-600' :
              'text-green-600'
            }`} />
            <span className="font-semibold">IG Pretendida Calculada Automaticamente</span>
          </div>
          <div className="text-lg font-bold">
            {calculatedIG.igPretendidaMax 
              ? `${calculatedIG.igPretendida}-${calculatedIG.igPretendidaMax} semanas`
              : calculatedIG.igPretendida === 'Imediato' 
                ? 'IMEDIATO - Emergência Obstétrica'
                : `${calculatedIG.igPretendida} semanas`}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            Protocolo: {calculatedIG.protocoloAplicado.replace(/_/g, ' ')}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {calculatedIG.observacoes}
          </div>
        </div>
      )}

      {/* Diagnósticos Maternos com Categorias */}
      <div className="space-y-4">
        <div className="mb-4">
          <FormLabel className="text-base font-semibold">Diagnósticos Obstétricos Maternos ATUAIS</FormLabel>
          <p className="text-sm text-muted-foreground mt-1">
            Selecione os diagnósticos da gestante. A IG pretendida será calculada automaticamente.
          </p>
        </div>
        
        {/* Opção "Nenhum" */}
        <FormField
          control={form.control}
          name="diagnosticosMaternos"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0 py-2 px-3 bg-muted/30 rounded-lg">
              <FormControl>
                <Checkbox
                  checked={field.value?.includes('nenhum_materno')}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      field.onChange(['nenhum_materno']);
                    } else {
                      field.onChange([]);
                    }
                  }}
                />
              </FormControl>
              <FormLabel className="font-medium cursor-pointer">
                Nenhum diagnóstico materno
              </FormLabel>
            </FormItem>
          )}
        />
        
        {/* Categorias de diagnósticos maternos */}
        <div className="space-y-2">
          {MATERNAL_CATEGORIES.map(categoryId => {
            const diagnostics = getDiagnosticsByCategory(categoryId);
            if (diagnostics.length === 0) return null;
            
            const selectedCount = getSelectedCountForCategory(categoryId, false);
            const isOpen = openMaternalCategories[categoryId] || selectedCount > 0;
            
            return (
              <Collapsible key={categoryId} open={isOpen}>
                <CollapsibleTrigger
                  onClick={() => toggleMaternalCategory(categoryId)}
                  className="flex items-center justify-between w-full p-3 bg-muted/50 hover:bg-muted rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    <span className="font-medium">{getCategoryLabel(categoryId)}</span>
                    {selectedCount > 0 && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                        {selectedCount} selecionado(s)
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {diagnostics.length} opções
                  </span>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2 pl-4 space-y-1">
                  {diagnostics.map(item => renderDiagnosticCheckbox(item, 'diagnosticosMaternos'))}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </div>

      <FormField
        control={form.control}
        name="placentaPrevia"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>Placenta prévia centro total com acretismo confirmado ou suspeito</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="flex flex-col space-y-2"
              >
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl>
                    <RadioGroupItem value="Sim" />
                  </FormControl>
                  <FormLabel className="font-normal cursor-pointer">
                    Sim
                  </FormLabel>
                </FormItem>
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl>
                    <RadioGroupItem value="Não" />
                  </FormControl>
                  <FormLabel className="font-normal cursor-pointer">
                    Não
                  </FormLabel>
                </FormItem>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Diagnósticos Fetais com Categorias */}
      <div className="space-y-4">
        <div className="mb-4">
          <FormLabel className="text-base font-semibold">Diagnósticos Fetais</FormLabel>
          <p className="text-sm text-muted-foreground mt-1">
            Selecione os diagnósticos relacionados ao feto.
          </p>
        </div>
        
        {/* Opção "Nenhum" */}
        <FormField
          control={form.control}
          name="diagnosticosFetais"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0 py-2 px-3 bg-muted/30 rounded-lg">
              <FormControl>
                <Checkbox
                  checked={field.value?.includes('nenhum_fetal')}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      field.onChange(['nenhum_fetal']);
                    } else {
                      field.onChange([]);
                    }
                  }}
                />
              </FormControl>
              <FormLabel className="font-medium cursor-pointer">
                Nenhum diagnóstico fetal
              </FormLabel>
            </FormItem>
          )}
        />
        
        {/* Categorias de diagnósticos fetais */}
        <div className="space-y-2">
          {FETAL_CATEGORIES.map(categoryId => {
            const diagnostics = getDiagnosticsByCategory(categoryId);
            if (diagnostics.length === 0) return null;
            
            const selectedCount = getSelectedCountForCategory(categoryId, true);
            const isOpen = openFetalCategories[categoryId] || selectedCount > 0;
            
            return (
              <Collapsible key={categoryId} open={isOpen}>
                <CollapsibleTrigger
                  onClick={() => toggleFetalCategory(categoryId)}
                  className="flex items-center justify-between w-full p-3 bg-muted/50 hover:bg-muted rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    <span className="font-medium">{getCategoryLabel(categoryId)}</span>
                    {selectedCount > 0 && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                        {selectedCount} selecionado(s)
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {diagnostics.length} opções
                  </span>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2 pl-4 space-y-1">
                  {diagnostics.map(item => renderDiagnosticCheckbox(item, 'diagnosticosFetais'))}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </div>

      <FormField
        control={form.control}
        name="diagnosticosFetaisOutros"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Outros diagnósticos fetais / Especificações</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Especifique malformações, cardiopatias ou outros diagnósticos fetais não listados" 
                className="min-h-[60px]"
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="diagnosticoLivre"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <span>Diagnóstico Livre (casos raros/nova conduta)</span>
              <span className="text-xs text-muted-foreground font-normal">
                ⚠️ Será registrado para auditoria clínica
              </span>
            </FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Use este campo apenas para diagnósticos não listados acima ou casos especiais que requerem conduta individualizada. O sistema tentará classificar automaticamente." 
                className="min-h-[80px] border-orange-200 focus:border-orange-400"
                {...field} 
              />
            </FormControl>
            <p className="text-xs text-muted-foreground mt-1">
              💡 Este campo permite flexibilidade clínica. Diagnósticos livres serão logados para revisão posterior, mas não bloqueiam o cadastro.
            </p>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="historiaObstetrica"
        render={({ field }) => (
          <FormItem>
            <FormLabel>História Obstétrica Prévia Relevante e Diagnósticos clínicos cirúrgicos</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Ex: Aborto tardio, parto prematuro, óbito fetal, DMG, macrossomia, eclampsia, pré eclampsia precoce, cardiopatia - especificar, trombofilias- especificar o tipo, hipotireoidismo pré gestacional, DM 1/2/mody pré gestacional com/sem insulina, HAC - hipertensão arterial crônica, obesidade - IMC, LES, SAAF, tireoidopatias pré gestacionais, transtornos psiquiátricos, FIV etc" 
                className="min-h-[120px]"
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
