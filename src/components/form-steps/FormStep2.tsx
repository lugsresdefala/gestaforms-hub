import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface FormStep2Props {
  form: UseFormReturn<any>;
}

const procedimentos = [
  "Cesárea",
  "Cesárea + Laqueadura",
  "Indução Programada",
  "Laqueadura Pós-parto Normal",
  "DIU de Cobre Pós-parto",
  "Cerclagem",
];

export const FormStep2 = ({ form }: FormStep2Props) => {
  return (
    <div className="space-y-6 animate-slide-in">
      <div className="pb-4 border-b border-border/30">
        <h2 className="text-2xl font-bold text-foreground mb-2">Procedimento e DUM</h2>
        <p className="text-sm text-muted-foreground">Informações sobre o procedimento solicitado</p>
      </div>

      <FormField
        control={form.control}
        name="procedimento"
        render={() => (
          <FormItem>
            <FormLabel>Procedimento(s) que será(ão) realizado(s)</FormLabel>
            <div className="space-y-3 mt-3">
              {procedimentos.map((item) => (
                <FormField
                  key={item}
                  control={form.control}
                  name="procedimento"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={item}
                        className="flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(item)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, item])
                                : field.onChange(
                                    field.value?.filter(
                                      (value: string) => value !== item
                                    )
                                  );
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          {item}
                        </FormLabel>
                      </FormItem>
                    );
                  }}
                />
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="dum"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>DUM</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="flex flex-col space-y-2"
              >
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl>
                    <RadioGroupItem value="Sim - Confiavel" />
                  </FormControl>
                  <FormLabel className="font-normal cursor-pointer">
                    Sim - Confiável
                  </FormLabel>
                </FormItem>
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl>
                    <RadioGroupItem value="Incerta" />
                  </FormControl>
                  <FormLabel className="font-normal cursor-pointer">
                    Incerta
                  </FormLabel>
                </FormItem>
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl>
                    <RadioGroupItem value="Não sabe" />
                  </FormControl>
                  <FormLabel className="font-normal cursor-pointer">
                    Não sabe
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
        name="dataDum"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Data da DUM</FormLabel>
            <FormControl>
              <Input type="date" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
