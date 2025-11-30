/**
 * Modal de Correção de Datas
 * 
 * Componente interativo para correção de datas incoerentes em agendamentos obstétricos.
 * Exibe incoerências detectadas, oferece sugestões e permite correções manuais.
 * 
 * @component ModalCorrecaoDatas
 */

import { useState, useEffect, useCallback } from "react";
import { parseDateSafe } from '@/lib/import/dateParser';
import { chooseAndComputeExtended } from '@/lib/import/gestationalCalculator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, ArrowRight, Lightbulb, SkipForward, Check, XCircle } from "lucide-react";
import {
  type IncoerenciaData,
  getLabelCampo,
  getLabelTipo,
  temSugestaoDisponivel,
} from "@/lib/validation/dateCoherenceValidator";

/**
 * Props for the ModalCorrecaoDatas component
 */
export interface ModalCorrecaoDatasProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Patient information with obstetric data for IG recalculation */
  paciente: {
    nome: string;
    carteirinha: string;
    /** Data do registro/formulário original (para cálculos históricos) */
    data_registro?: string;
    /** Status da DUM (Sim - Confiavel, Incerta, Não sabe) */
    dum_status?: string;
    /** Data da última menstruação */
    data_dum?: string;
    /** Data do primeiro USG */
    data_primeiro_usg?: string;
    /** Semanas de gestação no USG */
    semanas_usg?: string;
    /** Dias de gestação no USG (0-6) */
    dias_usg?: string;
  };
  /** List of incoherencies to display/correct */
  incoerencias: IncoerenciaData[];
  /** Callback when corrections are confirmed */
  onCorrigir: (correcoes: Record<string, string>) => void;
  /** Callback when user chooses to keep current values */
  onManter: () => void;
  /** Callback when user chooses to skip this patient */
  onPular: () => void;
  /** Position in the queue (optional) */
  posicaoFila?: {
    atual: number;
    total: number;
  };
}

/**
 * Interactive modal for correcting date incoherencies
 */
export function ModalCorrecaoDatas({
  isOpen,
  paciente,
  incoerencias,
  onCorrigir,
  onManter,
  onPular,
  posicaoFila,
}: ModalCorrecaoDatasProps) {
  // State for editable values
  const [correcoes, setCorrecoes] = useState<Record<string, string>>({});
  // State for recalculated IGs (campo -> IG string)
  const [igRecalculadas, setIgRecalculadas] = useState<Record<string, string>>({});
  
  // Initialize corrections with suggestions or current values
  useEffect(() => {
    const inicial: Record<string, string> = {};
    incoerencias.forEach((inco) => {
      inicial[inco.campo] = inco.sugestaoCorrecao || inco.valorAtual;
    });
    setCorrecoes(inicial);
    setIgRecalculadas({}); // Reset recalculated IGs when incoerencies change
  }, [incoerencias]);

  // Recalculate IG when values are changed
  const recalcularIG = useCallback((campo: string, valorCorrigido: string) => {
    // Não recalcular IG para campos que não são obstétricos (data_nascimento é da mãe)
    if (campo === 'data_nascimento') {
      return;
    }
    
    try {
      // Build updated data with the correction applied
      const dadosAtualizados: Record<string, string | undefined> = {
        dum_status: paciente.dum_status,
        data_dum: paciente.data_dum,
        data_primeiro_usg: paciente.data_primeiro_usg,
        semanas_usg: paciente.semanas_usg,
        dias_usg: paciente.dias_usg,
      };
      
      // Apply the specific field correction
      dadosAtualizados[campo] = valorCorrigido;
      
      // Use data_registro as reference for historical data, or today if not available
      let dataReferencia = new Date();
      if (paciente.data_registro) {
        const parsedData = parseDateSafe(paciente.data_registro);
        if (parsedData) {
          dataReferencia = parsedData;
        }
      }
      dataReferencia.setHours(0, 0, 0, 0);
      
      // Calculate IG with corrected data
      const result = chooseAndComputeExtended({
        dumStatus: dadosAtualizados.dum_status || '',
        dumRaw: dadosAtualizados.data_dum || '',
        usgDateRaw: dadosAtualizados.data_primeiro_usg || '',
        usgWeeks: parseInt(dadosAtualizados.semanas_usg || '0') || 0,
        usgDays: parseInt(dadosAtualizados.dias_usg || '0') || 0,
        referenceDate: dataReferencia,
      });
      
      if (result && result.source !== 'INVALID') {
        const igCorrigida = `${result.gaWeeks}s${result.gaDaysRemainder}d`;
        setIgRecalculadas(prev => ({
          ...prev,
          [campo]: igCorrigida,
        }));
      } else {
        setIgRecalculadas(prev => ({
          ...prev,
          [campo]: 'Inválido',
        }));
      }
    } catch {
      setIgRecalculadas(prev => ({
        ...prev,
        [campo]: 'Erro',
      }));
    }
  }, [paciente]);

  // Apply all suggestions
  const aplicarSugestoes = () => {
    const novasCorrecoes: Record<string, string> = { ...correcoes };
    incoerencias.forEach((inco) => {
      if (inco.sugestaoCorrecao) {
        novasCorrecoes[inco.campo] = inco.sugestaoCorrecao;
        // Recalculate IG for each suggestion applied
        recalcularIG(inco.campo, inco.sugestaoCorrecao);
      }
    });
    setCorrecoes(novasCorrecoes);
  };

  // Handle field value change
  const handleChange = (campo: string, valor: string) => {
    setCorrecoes((prev) => ({
      ...prev,
      [campo]: valor,
    }));
    
    // Recalculate IG with the new value
    if (valor) {
      recalcularIG(campo, valor);
    }
  };

  // Confirm corrections
  const handleConfirmar = () => {
    // Only include fields that were changed
    const alteracoes: Record<string, string> = {};
    incoerencias.forEach((inco) => {
      const valorCorrigido = correcoes[inco.campo];
      if (valorCorrigido && valorCorrigido !== inco.valorAtual) {
        alteracoes[inco.campo] = valorCorrigido;
      }
    });
    onCorrigir(alteracoes);
  };

  const hasSugestoes = temSugestaoDisponivel(incoerencias);

  // Get badge color based on incoherence type
  const getBadgeVariant = (tipo: IncoerenciaData['tipo']) => {
    switch (tipo) {
      case 'ig_impossivel':
        return 'destructive';
      case 'data_futura':
        return 'destructive';
      case 'idade_implausivel':
        return 'secondary';
      case 'usg_muito_antigo':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] flex flex-col"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-6 w-6" />
            Incoerências Detectadas
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-foreground">{paciente.nome}</span>
                <span className="text-muted-foreground ml-2">
                  Carteirinha: {paciente.carteirinha}
                </span>
              </div>
              {posicaoFila && (
                <Badge variant="outline" className="text-xs">
                  {posicaoFila.atual} de {posicaoFila.total}
                </Badge>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 py-2">
            {incoerencias.map((inco, index) => (
              <div
                key={`${inco.campo}-${index}`}
                className="p-4 border rounded-lg space-y-3 bg-card"
              >
                {/* Header with type badge and field name */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="font-medium">{getLabelCampo(inco.campo)}</span>
                  </div>
                  <Badge variant={getBadgeVariant(inco.tipo)}>
                    {getLabelTipo(inco.tipo)}
                  </Badge>
                </div>

                {/* Problem description */}
                <p className="text-sm text-muted-foreground">{inco.problema}</p>

                {/* Details */}
                {(inco.detalhes.igCalculada || inco.detalhes.idadeCalculada || inco.detalhes.mesesDecorridos) && (
                  <div className="flex flex-wrap gap-2 text-xs">
                    {inco.detalhes.igCalculada && (
                      <Badge variant="outline">IG: {inco.detalhes.igCalculada}</Badge>
                    )}
                    {inco.detalhes.idadeCalculada !== undefined && (
                      <Badge variant="outline">Idade: {inco.detalhes.idadeCalculada.toFixed(1)} anos</Badge>
                    )}
                    {inco.detalhes.mesesDecorridos && (
                      <Badge variant="outline">{inco.detalhes.mesesDecorridos} meses atrás</Badge>
                    )}
                  </div>
                )}

                {/* Current value and correction */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Current value */}
                  <div>
                    <Label className="text-xs text-muted-foreground">Valor Atual</Label>
                    <div className="mt-1 px-3 py-2 bg-destructive/10 border border-destructive/30 rounded-md text-sm text-destructive font-mono">
                      {inco.valorAtual}
                    </div>
                  </div>

                  {/* Correction input */}
                  <div>
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      Correção
                      {inco.sugestaoCorrecao && (
                        <Lightbulb className="h-3 w-3 text-amber-500" />
                      )}
                    </Label>
                    <div className="mt-1 flex items-center gap-2">
                      <Input
                        value={correcoes[inco.campo] || ''}
                        onChange={(e) => handleChange(inco.campo, e.target.value)}
                        placeholder="DD/MM/YYYY"
                        className={`font-mono ${
                          inco.sugestaoCorrecao && correcoes[inco.campo] === inco.sugestaoCorrecao
                            ? 'border-green-500 bg-green-500/10'
                            : ''
                        }`}
                      />
                    </div>
                    {inco.sugestaoCorrecao && (
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <ArrowRight className="h-3 w-3" />
                        Sugestão: {inco.sugestaoCorrecao}
                      </p>
                    )}
                  </div>
                </div>

                {/* Comparação de IG: Antes vs Depois (não exibir para erros de idade materna) */}
                {inco.detalhes.igCalculada && inco.campo !== 'data_nascimento' && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <Label className="text-xs font-semibold text-blue-900 mb-2 block">
                      Idade Gestacional Calculada
                    </Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Atual</div>
                        <div className="text-lg font-mono font-semibold text-destructive">
                          {inco.detalhes.igCalculada}
                        </div>
                      </div>
                      {igRecalculadas[inco.campo] && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Com Correção</div>
                          <div className={`text-lg font-mono font-semibold ${
                            igRecalculadas[inco.campo].includes('s') && 
                            !igRecalculadas[inco.campo].includes('Erro') &&
                            !igRecalculadas[inco.campo].includes('Inválido')
                              ? 'text-green-600' 
                              : 'text-amber-600'
                          }`}>
                            {igRecalculadas[inco.campo]}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-4 border-t">
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={onPular}
              className="flex-1 sm:flex-none text-destructive hover:text-destructive"
            >
              <SkipForward className="h-4 w-4 mr-1" />
              Pular Paciente
            </Button>
            <Button
              variant="outline"
              onClick={onManter}
              className="flex-1 sm:flex-none"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Manter Valores
            </Button>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {hasSugestoes && (
              <Button
                variant="secondary"
                onClick={aplicarSugestoes}
                className="flex-1 sm:flex-none"
              >
                <Lightbulb className="h-4 w-4 mr-1" />
                Aplicar Sugestões
              </Button>
            )}
            <Button
              onClick={handleConfirmar}
              className="flex-1 sm:flex-none"
            >
              <Check className="h-4 w-4 mr-1" />
              Confirmar Correções
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ModalCorrecaoDatas;
