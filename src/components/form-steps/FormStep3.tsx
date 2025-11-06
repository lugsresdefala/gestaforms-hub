import { UseFormReturn } from "react-hook-form";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface FormStep3Props {
  form: UseFormReturn<any>;
}

export const FormStep3 = ({ form }: FormStep3Props) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-1">Detalhes da Gestação</h2>
        <p className="text-sm text-muted-foreground">Informações sobre USG e idade gestacional</p>
      </div>

      <FormField
        control={form.control}
        name="dataPrimeiroUsg"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Data do Primeiro USG</FormLabel>
            <FormControl>
              <Input type="date" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="semanasUsg"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Semanas no primeiro USG</FormLabel>
              <FormDescription>Exame entre 8 e 12 semanas, embrião com BCF</FormDescription>
              <FormControl>
                <Input type="number" min="0" placeholder="Apenas o número" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="diasUsg"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dias no primeiro USG</FormLabel>
              <FormDescription>Exame entre 8 e 12 semanas, embrião com BCF</FormDescription>
              <FormControl>
                <Input type="number" min="0" max="6" placeholder="Apenas o número" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="usgRecente"
        render={({ field }) => (
          <FormItem>
            <FormLabel>USG mais recente</FormLabel>
            <FormDescription>Inserir data, apresentação, PFE com percentil, ILA/MBV e doppler</FormDescription>
            <FormControl>
              <Textarea 
                placeholder="Data: __/__/____, Apresentação: _____, PFE: ___g (P___), ILA: ___cm, Doppler: _____" 
                className="min-h-[100px]"
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="igPretendida"
        render={({ field }) => (
          <FormItem>
            <FormLabel>IG pretendida para o procedimento</FormLabel>
            <FormDescription>
              Não confirmar essa data para a paciente, dependendo da agenda hospitalar poderemos ter uma variação. 
              Para laqueaduras favor colocar data que completa 60 dias do termo assinado.
            </FormDescription>
            <FormControl>
              <Input placeholder="Ex: 39 semanas" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="indicacaoProcedimento"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Indicação do procedimento</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Descreva a indicação do procedimento" 
                className="min-h-[80px]"
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
