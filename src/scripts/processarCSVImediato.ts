// Script para processar o CSV enviado pelo usuário imediatamente
import { supabase } from '@/lib/supabase';

const CSV_CONTENT = `ID,Hora de início,Hora da conclusão,Email,Nome,Nome completo da paciente,Data de nascimento da gestante ,CARTEIRINHA (tem na guia que sai do sistema - não inserir CPF),Número de Gestações,Número de Partos Cesáreas,Número de Partos Normais,Número de Abortos,Informe dois telefones de contato com o paciente para que ele seja contato pelo hospital,Informe o procedimento(s) que será(ão) realizado(s),DUM ,Data da DUM,Data do Primeiro USG,"Numero de semanas no primeiro USG (inserir apenas o numero) - considerar o exame entre 8 e 12 semanas, embrião com BCF","Numero de dias no primeiro USG (inserir apenas o numero)- considerar o exame entre 8 e 12 semanas, embrião com BCF","USG mais recente (Inserir data, apresentação, PFE com percentil, ILA/MBV e doppler)","Informe IG pretendida para o procedimento 
* Não confirmar essa data para a paciente, dependendo da agenda hospitalar poderemos ter uma variação
* Para laqueaduras favor colocar data que completa 60 d",Coluna3,Informe a indicação do procedimento,Indique qual medicação e dosagem que a paciente utiliza.,"Indique os Diagnósticos Obstétricos Maternos ATUAIS ( ex. DMG com/sem insulina, Pre-eclampsia, Hipertensão gestacional, TPP na gestação atual, RPMO na gestação atual, hipotireoidismo gestacional, etc)",Placenta previa centro total com acretismo confirmado ou suspeito,"Indique os Diagnósticos Fetais (ex: RCF, Oligo/Polidramnio, Macrossomia, malformação fetal - especificar, cardiopatia fetal - especificar, etc)","Informe História Obstétrica Prévia Relevante e Diagnósticos clínicos cirúrgicos (ex. Aborto tardio, parto prematuro,  óbito fetal, DMG, macrossomia, eclampsia, pré eclampsia precoce, cardiopatia - esp",Necessidade de reserva de UTI materna,Necessidade de reserva de Sangue,Maternidade que a paciente deseja,Médico responsável pelo agendamento ,E-mail da paciente,DPP DUM,DPP USG,Idade,DATA AGENDADA,Coluna2,Coluna22,Coluna23,Coluna24,Coluna25,Coluna26
2449,11/7/2025 16:42:31,11/7/2025 16:46:31,anonymous,,Adriana Alves Barbosa ,8/19/1986,0Z0JQ000335002,2,1,0,0,1197989-1929 / 1195331-8371,Cesárea + Laqueadura,Sim - Confiavel ,2/24/2025,6/5/2025,12,6,"4/11: cef, bcf+, plac post 2, ila 21 cm , 2720 (p94) Doppler normal. 34+1",38 sem ,,Dmg + p>90,Nega ,Dmg ,Não,Acima ,Nega ,Não,Não,NotreCare,Gabriela de Miranda Cuba Nogueira,adrianabarbosa1908@gmail.com,12/1/2025,12/12/2025,39.3,"agendada 28/11 38s, pedir nutri, controle dx",Controle no wpp - paciente informa não ter guia ,,,,,`;

export async function processarCSV(userId: string) {
  try {
    console.log('Iniciando processamento do CSV...');
    
    const { data, error } = await supabase.functions.invoke('importar-csv-lote', {
      body: {
        csvContent: CSV_CONTENT,
        userId: userId
      }
    });

    if (error) {
      console.error('Erro ao chamar edge function:', error);
      throw error;
    }

    console.log('Resultado:', data);
    return data;
  } catch (error) {
    console.error('Erro no processamento:', error);
    throw error;
  }
}
