import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface FormStep4Props {
  form: UseFormReturn<any>;
}

export const FormStep4 = ({ form }: FormStep4Props) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-1">Histórico Médico</h2>
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

      <FormField
        control={form.control}
        name="diagnosticosMaternos"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Diagnósticos Obstétricos Maternos ATUAIS</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Ex: DMG com/sem insulina, Pre-eclampsia, Hipertensão gestacional, TPP na gestação atual, RPMO na gestação atual, hipotireoidismo gestacional, etc" 
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

      <FormField
        control={form.control}
        name="diagnosticosFetais"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Diagnósticos Fetais</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Ex: RCF, Oligo/Polidramnio, Macrossomia, malformação fetal - especificar, cardiopatia fetal - especificar, etc" 
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
