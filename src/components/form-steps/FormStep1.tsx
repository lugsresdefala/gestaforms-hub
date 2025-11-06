import { UseFormReturn } from "react-hook-form";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface FormStep1Props {
  form: UseFormReturn<any>;
}

export const FormStep1 = ({ form }: FormStep1Props) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-1">Informações da Paciente</h2>
        <p className="text-sm text-muted-foreground">Dados básicos e histórico obstétrico</p>
      </div>

      <FormField
        control={form.control}
        name="carteirinha"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Carteirinha</FormLabel>
            <FormDescription>Tem na guia que sai do sistema - não inserir CPF</FormDescription>
            <FormControl>
              <Input placeholder="Número da carteirinha" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="nomeCompleto"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome completo da paciente</FormLabel>
            <FormControl>
              <Input placeholder="Nome completo" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="dataNascimento"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Data de nascimento da gestante</FormLabel>
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
          name="numeroGestacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número de Gestações</FormLabel>
              <FormControl>
                <Input type="number" min="0" placeholder="0" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="numeroPartosCesareas"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número de Partos Cesáreas</FormLabel>
              <FormControl>
                <Input type="number" min="0" placeholder="0" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="numeroPartosNormais"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número de Partos Normais</FormLabel>
              <FormControl>
                <Input type="number" min="0" placeholder="0" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="numeroAbortos"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número de Abortos</FormLabel>
              <FormControl>
                <Input type="number" min="0" placeholder="0" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="telefones"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Telefones de contato</FormLabel>
            <FormDescription>Informe dois telefones de contato com o paciente</FormDescription>
            <FormControl>
              <Input placeholder="(11) 99999-9999 / (11) 98888-8888" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
