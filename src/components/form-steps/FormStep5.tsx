import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface FormStep5Props {
  form: UseFormReturn<any>;
}

export const FormStep5 = ({ form }: FormStep5Props) => {
  return (
    <div className="space-y-6 animate-slide-in">
      <div className="pb-4 border-b border-border/30">
        <h2 className="text-2xl font-bold text-foreground mb-2">Necessidades Adicionais</h2>
        <p className="text-sm text-muted-foreground">Requisitos especiais para o procedimento</p>
      </div>

      <FormField
        control={form.control}
        name="necessidadeUtiMaterna"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>Necessidade de reserva de UTI materna</FormLabel>
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

      <FormField
        control={form.control}
        name="necessidadeReservaSangue"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>Necessidade de reserva de Sangue</FormLabel>
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
    </div>
  );
};
