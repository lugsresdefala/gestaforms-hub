import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

interface FormStep4Props {
  form: UseFormReturn<any>;
}

export const FormStep4 = ({ form }: FormStep4Props) => {
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

      <FormField
        control={form.control}
        name="diagnosticosMaternos"
        render={() => (
          <FormItem>
            <div className="mb-4">
              <FormLabel className="text-base">Diagnósticos Obstétricos Maternos ATUAIS</FormLabel>
            </div>
            <div className="space-y-3">
              {[
                { id: "nenhum_materno", label: "Nenhum" },
                { id: "dmg_insulina", label: "DMG com insulina" },
                { id: "dmg_sem_insulina", label: "DMG sem insulina" },
                { id: "pre_eclampsia_grave", label: "Pré-eclâmpsia grave / HELLP" },
                { id: "hipertensao_gestacional", label: "Hipertensão gestacional" },
                { id: "hac", label: "HAC - Hipertensão arterial crônica" },
                { id: "tpp", label: "TPP - Trabalho de parto prematuro na gestação atual" },
                { id: "rpmo", label: "RPMO - Rotura prematura de membranas ovulares" },
                { id: "hipotireoidismo", label: "Hipotireoidismo gestacional" },
                { id: "dm_pregestacional", label: "DM pré-gestacional (tipo 1/2/MODY)" },
                { id: "cardiopatia_materna", label: "Cardiopatia materna" },
                { id: "trombofilias", label: "Trombofilias" },
                { id: "obesidade", label: "Obesidade (IMC >30)" },
                { id: "les", label: "LES - Lúpus eritematoso sistêmico" },
                { id: "saaf", label: "SAAF - Síndrome antifosfolípide" },
              ].map((item) => (
                <FormField
                  key={item.id}
                  control={form.control}
                  name="diagnosticosMaternos"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={item.id}
                        className="flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(item.id)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, item.id])
                                : field.onChange(
                                    field.value?.filter(
                                      (value: string) => value !== item.id
                                    )
                                  )
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          {item.label}
                        </FormLabel>
                      </FormItem>
                    )
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
        name="diagnosticosMaternos"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Outros diagnósticos maternos</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Especifique outros diagnósticos maternos não listados acima" 
                className="min-h-[60px]"
                value={typeof field.value === 'string' ? field.value : ''}
                onChange={(e) => {
                  const currentArray = Array.isArray(field.value) ? field.value : [];
                  const otherText = e.target.value;
                  if (otherText) {
                    field.onChange([...currentArray.filter(v => typeof v !== 'string' || !v.startsWith('outro_')), `outro_${otherText}`]);
                  } else {
                    field.onChange(currentArray.filter(v => typeof v !== 'string' || !v.startsWith('outro_')));
                  }
                }}
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
        render={() => (
          <FormItem>
            <div className="mb-4">
              <FormLabel className="text-base">Diagnósticos Fetais</FormLabel>
            </div>
            <div className="space-y-3">
              {[
                { id: "nenhum_fetal", label: "Nenhum" },
                { id: "gestacao_gemelar_dicorionica", label: "Gestação gemelar dicoriônica" },
                { id: "gestacao_gemelar_monocorionica", label: "Gestação gemelar monocoriônica" },
                { id: "rcf", label: "RCF - Restrição de crescimento fetal" },
                { id: "oligoamnio", label: "Oligoâmnio" },
                { id: "polidramnio", label: "Polidrâmnio" },
                { id: "macrossomia", label: "Macrossomia fetal (>4000g)" },
                { id: "malformacao_fetal", label: "Malformação fetal" },
                { id: "cardiopatia_fetal", label: "Cardiopatia fetal" },
                { id: "obito_fetal", label: "Óbito fetal" },
              ].map((item) => (
                <FormField
                  key={item.id}
                  control={form.control}
                  name="diagnosticosFetais"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={item.id}
                        className="flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(item.id)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, item.id])
                                : field.onChange(
                                    field.value?.filter(
                                      (value: string) => value !== item.id
                                    )
                                  )
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          {item.label}
                        </FormLabel>
                      </FormItem>
                    )
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
