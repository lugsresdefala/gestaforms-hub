/**
 * Modal de Correção de Datas
 * 
 * Componente interativo para correção de datas incoerentes em agendamentos obstétricos.
 * Exibe incoerências detectadas, oferece sugestões e permite correções manuais.
 * 
 * @component ModalCorrecaoDatas
 */

import { useState, useEffect } from "react";
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
  /** Patient information */
  paciente: {
    nome: string;
    carteirinha: string;
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
  
  // Initialize corrections with suggestions or current values
  useEffect(() => {
    const inicial: Record<string, string> = {};
    incoerencias.forEach((inco) => {
      inicial[inco.campo] = inco.sugestaoCorrecao || inco.valorAtual;
    });
    setCorrecoes(inicial);
  }, [incoerencias]);

  // Apply all suggestions
  const aplicarSugestoes = () => {
    const novasCorrecoes: Record<string, string> = { ...correcoes };
    incoerencias.forEach((inco) => {
      if (inco.sugestaoCorrecao) {
        novasCorrecoes[inco.campo] = inco.sugestaoCorrecao;
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
