import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FormStep6Props {
  form: UseFormReturn<any>;
}

const maternidades = ["Salvalus", "NotreCare", "Guarulhos", "Cruzeiro"];

const medicos = [
  "Outros médicos / Outras regiões",
  "Equipe Medicina Fetal",
  "Aline Figueiredo",
  "Alyk Vargas",
  "Angela Storino das Chagas",
  "Angélica do Rosário",
  "Bruna Mariano",
  "Beatriz Moras Ronconi",
  "Cilmário Filho",
  "Cristina Pitelli de Britto",
  "Eveline Castro",
  "Emanuela Cristina Reis Barroso",
  "Fernanda Taniguchi Falleiros",
  "Gabriela de Miranda Cuba Nogueira",
  "Gabriel Luzetti",
  "Isadora Marques",
  "Jamir Piquini",
  "Jessica Campos",
  "Jessica Costa",
  "Joara Almeida",
  "Juliana Fazio",
  "Lauro Massayuki Nakano",
  "Luana Gallo",
  "Luis Houra",
  "Mariana Naponucena e Alcantara",
  "Mariliz de Mello",
  "Marisa Helena",
  "Maurício Fristachi",
  "Mila Moraes",
  "Patricia Kondi",
  "Patricia Varella",
  "Paula Iervolino",
  "Rafael Rezende",
  "Raquel Grecco",
  "Renata Assunção",
  "Renata Daura Lanzone",
  "Renata Maruyama",
  "Sandra Regina Gonçalves",
  "Suellen Totti",
  "Taiana Queiroz",
  "Thatianne Trindade",
  "Thiago Ricci",
  "Veridiana Franco",
  "Vitor Armenio Scontre",
  "Wagner Perruolo",
  "Wilson Loike",
];

const centrosClinicos = [
  "CC Alphaville",
  "CC Analia Franco",
  "CC Autonomistas",
  "CC Dom Pedro",
  "CC Guarulhos I",
  "CM São Gabriel",
  "CC Santo André 2",
  "Qualivida Higienópolis",
  "Qualivida ABC",
  "CC Mogi",
  "CC Arujá",
  "CC Santos",
];

export const FormStep6 = ({ form }: FormStep6Props) => {
  return (
    <div className="space-y-6 animate-slide-in">
      <div className="pb-4 border-b border-border/30">
        <h2 className="text-2xl font-bold text-foreground mb-2">Unidade e Responsável</h2>
        <p className="text-sm text-muted-foreground">Informações sobre a maternidade e médico responsável</p>
      </div>

      <FormField
        control={form.control}
        name="maternidade"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Maternidade que a paciente deseja</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a maternidade" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {maternidades.map((mat) => (
                  <SelectItem key={mat} value={mat}>
                    {mat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="medicoResponsavel"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Médico responsável pelo agendamento</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o médico" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {medicos.map((med) => (
                  <SelectItem key={med} value={med}>
                    {med}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="centroClinico"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Centro Clínico do Atendimento</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o centro clínico" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {centrosClinicos.map((cc) => (
                  <SelectItem key={cc} value={cc}>
                    {cc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>E-mail da paciente</FormLabel>
            <FormControl>
              <Input type="email" placeholder="exemplo@email.com" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
