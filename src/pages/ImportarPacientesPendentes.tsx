import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Dados das 22 pacientes a serem importadas
const PACIENTES_PENDENTES = [
  {
    id: "2515",
    nomeCompleto: "JACQUELINE DE OLIVEIRA DIAS",
    dataNascimento: "12/23/1986",
    carteirinha: "0P377000901008",
    numeroGestacoes: "4",
    numeroCesareas: "1",
    numeroPartosNormais: "1",
    numeroAbortos: "1",
    telefones: "11 98666-7974",
    procedimentos: "Cesárea + Laqueadura",
    dumStatus: "Sim - Confiavel",
    dataDum: "3/28/2025",
    dataPrimeiroUsg: "6/7/2025",
    semanasUsg: "9",
    diasUsg: "6",
    usgRecente: "US 13/11 - CEF / 2564G (PP97) / MBV 7CM / FETO GIG / DOPPLER NORMAL / PBF 8/8.",
    igPretendida: "37s0d",
    indicacaoProcedimento: "DM2 COM USO DE INSULINA EM ALTAS DOSES E REPRCUSSAO FETAL - FETO GIG",
    medicacao: "INSULINA NPH 22/24/26, REGULAR 10/10/10",
    diagnosticosMaternos: "DM2, DEPRESSAO, TRANSTORNO BIPOLAR",
    placentaPrevia: "Não",
    diagnosticosFetais: "FETO GIG",
    historiaObstetrica: "--",
    necessidadeUtiMaterna: "Não",
    necessidadeReservaSangue: "Não",
    maternidade: "Cruzeiro",
    medicoResponsavel: "Wilson Loike",
    emailPaciente: "jdconsultoria.rh@gmail.com"
  },
  {
    id: "2521",
    nomeCompleto: "FRANCISCA MARIA PEREIRA DOS SANTOS",
    dataNascimento: "6/28/2025",
    carteirinha: "0m0nw000656003",
    numeroGestacoes: "3",
    numeroCesareas: "1",
    numeroPartosNormais: "1",
    numeroAbortos: "0",
    telefones: "1111953549071 11967636232",
    procedimentos: "Cesárea + Laqueadura",
    dumStatus: "Sim - Confiavel",
    dataDum: "3/12/2025",
    dataPrimeiroUsg: "5/13/2025",
    semanasUsg: "8",
    diasUsg: "6",
    usgRecente: "06/11 CEFALICO PESO 2628 %76,4 MBV 8,1 DOPPLER MATERNO FETAL OK",
    igPretendida: "39",
    indicacaoProcedimento: "A PEDIDO DMG DEXTRO UBS",
    medicacao: "VITAMINAS",
    diagnosticosMaternos: "DMG",
    placentaPrevia: "Não",
    diagnosticosFetais: "NAO",
    historiaObstetrica: "SEM PASSADO OBSTETRICO",
    necessidadeUtiMaterna: "Não",
    necessidadeReservaSangue: "Não",
    maternidade: "Cruzeiro",
    medicoResponsavel: "Wagner Perruolo",
    emailPaciente: "davi1417282009@icloud.com"
  },
  {
    id: "2529",
    nomeCompleto: "Dara Fernanda Ferreira de Souza",
    dataNascimento: "2/21/2003",
    carteirinha: "1Z8AV000001040",
    numeroGestacoes: "1",
    numeroCesareas: "0",
    numeroPartosNormais: "0",
    numeroAbortos: "0",
    telefones: "11 994514747",
    procedimentos: "Indução Programada",
    dumStatus: "Sim - Confiavel",
    dataDum: "3/8/2025",
    dataPrimeiroUsg: "5/6/2025",
    semanasUsg: "8",
    diasUsg: "6",
    usgRecente: "23/10 - 33;1 semanas, 2290g, ila e doppler normais",
    igPretendida: "40",
    indicacaoProcedimento: "Dmg (dieta)",
    medicacao: "Nenhuma",
    diagnosticosMaternos: "Dmg (dieta)",
    placentaPrevia: "Não",
    diagnosticosFetais: "Nenhum",
    historiaObstetrica: "Na",
    necessidadeUtiMaterna: "Não",
    necessidadeReservaSangue: "Não",
    maternidade: "Cruzeiro",
    medicoResponsavel: "Sandra Regina Gonçalves",
    emailPaciente: "pink81473@gmail.com"
  },
  {
    id: "2550",
    nomeCompleto: "Dalila Pedro da Silva",
    dataNascimento: "3/2/1987",
    carteirinha: "1ar9LA000042005",
    numeroGestacoes: "1",
    numeroCesareas: "0",
    numeroPartosNormais: "0",
    numeroAbortos: "0",
    telefones: "11 988371894 11 993487165",
    procedimentos: "Indução Programada",
    dumStatus: "Sim - Confiavel",
    dataDum: "3/1/2025",
    dataPrimeiroUsg: "5/22/2025",
    semanasUsg: "9",
    diasUsg: "6",
    usgRecente: "11/11 if 35 sem 5/7 cef peso 3003g p93 mbv4,2 pa(I) Doppler normal",
    igPretendida: "38",
    indicacaoProcedimento: "DM II em uso insulina e descompensado com feto gog",
    medicacao: "Insulina NPh (36-22-20), cálcio, AAS, megamather / Lt4 50 mcg",
    diagnosticosMaternos: "DM Ii em uso de insulina, descompensado",
    placentaPrevia: "Não",
    diagnosticosFetais: "Feto GIG",
    historiaObstetrica: "Primigesta",
    necessidadeUtiMaterna: "Não",
    necessidadeReservaSangue: "Não",
    maternidade: "Cruzeiro",
    medicoResponsavel: "Bruna Mariano",
    emailPaciente: "dalilapedro96@gmail.com"
  },
  {
    id: "2452",
    nomeCompleto: "MILENE CARDOSO DE SOUZA",
    dataNascimento: "3/6/1997",
    carteirinha: "1UXPX005504007",
    numeroGestacoes: "3",
    numeroCesareas: "2",
    numeroPartosNormais: "0",
    numeroAbortos: "0",
    telefones: "11976123787 11959642533",
    procedimentos: "Cesárea + Laqueadura",
    dumStatus: "Incerta",
    dataDum: "",
    dataPrimeiroUsg: "4/8/2025",
    semanasUsg: "5",
    diasUsg: "5",
    usgRecente: "17/09 29 SEMANAS 3 DIAS DOPPLER NORMAL",
    igPretendida: "39",
    indicacaoProcedimento: "ITERATIVIDADE",
    medicacao: "PPU E SERTRALINA 50",
    diagnosticosMaternos: "HIPERTIREOIDISMO E ANSIEDADE",
    placentaPrevia: "Não",
    diagnosticosFetais: "NORMAL",
    historiaObstetrica: "HIPERTIREOIDISMO",
    necessidadeUtiMaterna: "Não",
    necessidadeReservaSangue: "Não",
    maternidade: "NotreCare",
    medicoResponsavel: "Renata Daura Lanzone",
    emailPaciente: "SOUZACARDOSO90@GMAIL.COM"
  },
  {
    id: "2502",
    nomeCompleto: "VANEIA FRANCISCA DA CRUZ",
    dataNascimento: "4/18/2025",
    carteirinha: "OMOEG000046000",
    numeroGestacoes: "1",
    numeroCesareas: "0",
    numeroPartosNormais: "0",
    numeroAbortos: "0",
    telefones: "11957452738 11959342872",
    procedimentos: "Cesárea",
    dumStatus: "Incerta",
    dataDum: "",
    dataPrimeiroUsg: "5/5/2025",
    semanasUsg: "8",
    diasUsg: "4",
    usgRecente: "11/11 35 5/7 PELVICO PESO2486%23MBV 6.3 DI=OPPLER NL",
    igPretendida: "39",
    indicacaoProcedimento: "PEIVICO",
    medicacao: "METILDOPA 1250",
    diagnosticosMaternos: "H ARTERIAL",
    placentaPrevia: "Não",
    diagnosticosFetais: "NAO",
    historiaObstetrica: "NAO",
    necessidadeUtiMaterna: "Não",
    necessidadeReservaSangue: "Não",
    maternidade: "NotreCare",
    medicoResponsavel: "Wagner Perruolo",
    emailPaciente: "VANEIAFCRUZ@GMAIL.COM"
  },
  {
    id: "2509",
    nomeCompleto: "VITORIA MARIANO VITOR",
    dataNascimento: "11/24/2025",
    carteirinha: "0nh5k000062006",
    numeroGestacoes: "1",
    numeroCesareas: "0",
    numeroPartosNormais: "0",
    numeroAbortos: "0",
    telefones: "11 939428816 11947137055",
    procedimentos: "Cesárea",
    dumStatus: "Incerta",
    dataDum: "",
    dataPrimeiroUsg: "5/30/2025",
    semanasUsg: "12",
    diasUsg: "2",
    usgRecente: "06/11/25 CEFALICO PESO2585 %42MBV4.8 DOPPLER OK",
    igPretendida: "39",
    indicacaoProcedimento: "A PEDIDO",
    medicacao: "METILDOPA 750MG DIA",
    diagnosticosMaternos: "H ARTERIAL",
    placentaPrevia: "Não",
    diagnosticosFetais: "NADA",
    historiaObstetrica: "NORMAL",
    necessidadeUtiMaterna: "Não",
    necessidadeReservaSangue: "Não",
    maternidade: "NotreCare",
    medicoResponsavel: "Wagner Perruolo",
    emailPaciente: "vitoriamariano675@gmail.com"
  },
  {
    id: "2526",
    nomeCompleto: "MONICA SOUZA SANTOS",
    dataNascimento: "6/17/1985",
    carteirinha: "0NH860000300007",
    numeroGestacoes: "1",
    numeroCesareas: "0",
    numeroPartosNormais: "0",
    numeroAbortos: "0",
    telefones: "011 9 8989 2113",
    procedimentos: "Cesárea",
    dumStatus: "Sim - Confiavel",
    dataDum: "3/2/2025",
    dataPrimeiroUsg: "6/6/2025",
    semanasUsg: "13",
    diasUsg: "5",
    usgRecente: "10/11 FUV CEF PESO 2410 DDPL NL 35S3D",
    igPretendida: "38",
    indicacaoProcedimento: "DHEG",
    medicacao: "METILS DOPA 2,0 G",
    diagnosticosMaternos: "DNDN",
    placentaPrevia: "Não",
    diagnosticosFetais: "NDN",
    historiaObstetrica: "HAS",
    necessidadeUtiMaterna: "Não",
    necessidadeReservaSangue: "Não",
    maternidade: "NotreCare",
    medicoResponsavel: "Lauro Massayuki Nakano",
    emailPaciente: "SOUZAMONIKI60@GMAIL.COM"
  },
  {
    id: "2537",
    nomeCompleto: "LUCIANA ALVES ZANONI",
    dataNascimento: "12/28/1981",
    carteirinha: "0N0XH000001007",
    numeroGestacoes: "2",
    numeroCesareas: "0",
    numeroPartosNormais: "0",
    numeroAbortos: "1",
    telefones: "967679989",
    procedimentos: "Indução Programada",
    dumStatus: "Sim - Confiavel",
    dataDum: "3/16/2025",
    dataPrimeiroUsg: "5/9/2025",
    semanasUsg: "8",
    diasUsg: "1",
    usgRecente: "10/11/25 - 34SEM 4 DIAS 2260G P91 - MBV 6,9 - DOPPLER NL",
    igPretendida: "39",
    indicacaoProcedimento: "DMG + FETO GIG",
    medicacao: "VITAMINAS",
    diagnosticosMaternos: "DMG + GIG",
    placentaPrevia: "Não",
    diagnosticosFetais: "FETO GIG",
    historiaObstetrica: "1 ABORTO ANTERIOR",
    necessidadeUtiMaterna: "Não",
    necessidadeReservaSangue: "Não",
    maternidade: "NotreCare",
    medicoResponsavel: "Juliana Fazio",
    emailPaciente: "luciana@lzin.com.br"
  },
  {
    id: "2505",
    nomeCompleto: "Adriana Pinto Pereira Galdino",
    dataNascimento: "5/7/1987",
    carteirinha: "1ZEI004112016",
    numeroGestacoes: "1",
    numeroCesareas: "0",
    numeroPartosNormais: "0",
    numeroAbortos: "0",
    telefones: "11937681617 11965628435",
    procedimentos: "Cesárea",
    dumStatus: "Sim - Confiavel",
    dataDum: "4/10/2025",
    dataPrimeiroUsg: "5/31/2025",
    semanasUsg: "7",
    diasUsg: "6",
    usgRecente: "7/11 IG 30,1 plac ant I, gemelad MONO/DI dusc 8 % osso 1 1655 perc 50-90 feto 2 peso 1522 perc 50-90 v",
    igPretendida: "36",
    indicacaoProcedimento: "Gemelaridade mono/di",
    medicacao: "Vitaminas",
    diagnosticosMaternos: "Ndn",
    placentaPrevia: "Não",
    diagnosticosFetais: "Ndn",
    historiaObstetrica: "Ndn",
    necessidadeUtiMaterna: "Não",
    necessidadeReservaSangue: "Não",
    maternidade: "Salvalus",
    medicoResponsavel: "Marisa Helena",
    emailPaciente: "Adriana.pp@outlook.com"
  },
  {
    id: "2508",
    nomeCompleto: "Raionia Maciel de Souza",
    dataNascimento: "5/25/2001",
    carteirinha: "0LL24006467024",
    numeroGestacoes: "2",
    numeroCesareas: "0",
    numeroPartosNormais: "1",
    numeroAbortos: "0",
    telefones: "948551598 990116547",
    procedimentos: "Cesárea",
    dumStatus: "Sim - Confiavel",
    dataDum: "3/11/2025",
    dataPrimeiroUsg: "4/24/2025",
    semanasUsg: "6",
    diasUsg: "5",
    usgRecente: "04/11 IG 34 peso 2064 perc 16 LA nl doppler nl plac pist I",
    igPretendida: "39",
    indicacaoProcedimento: "Desejo materno. E feto perc 26",
    medicacao: "Vitaminad",
    diagnosticosMaternos: "Ndn",
    placentaPrevia: "Não",
    diagnosticosFetais: "Perc 16",
    historiaObstetrica: "Ndn",
    necessidadeUtiMaterna: "Não",
    necessidadeReservaSangue: "Não",
    maternidade: "Salvalus",
    medicoResponsavel: "Marisa Helena",
    emailPaciente: "Raioniasouza45@gmail.com"
  },
  {
    id: "2516",
    nomeCompleto: "GIOVANNA VILAS BOAS BORELLI",
    dataNascimento: "11/28/1993",
    carteirinha: "WP0M7000031003",
    numeroGestacoes: "3",
    numeroCesareas: "2",
    numeroPartosNormais: "0",
    numeroAbortos: "0",
    telefones: "11 91111-2676",
    procedimentos: "Cesárea",
    dumStatus: "Sim - Confiavel",
    dataDum: "3/27/2025",
    dataPrimeiroUsg: "5/29/2025",
    semanasUsg: "8",
    diasUsg: "5",
    usgRecente: "07/11/2025 - 32S2D / CEF / 2764G (P97) / MBV 5,5 / DOPPLER NORMAL / FETO GIG",
    igPretendida: "37",
    indicacaoProcedimento: "DMG COM REPERUSSÃO FETAL (FETO GIG) / ALÉM DE MULTIPLAS COMORBIDADES",
    medicacao: "METILDOPA 500MG 8/8H / PURAN 75 MCG/DIA / REGENESIS PREMIUM / CALCIO",
    diagnosticosMaternos: "OBESIDADE G4 / ITERATIVIDADE / DMG / HAC",
    placentaPrevia: "Não",
    diagnosticosFetais: "FETO GIG",
    historiaObstetrica: "-",
    necessidadeUtiMaterna: "Não",
    necessidadeReservaSangue: "Não",
    maternidade: "Salvalus",
    medicoResponsavel: "Wilson Loike",
    emailPaciente: "giovana.vb@yahoo.com"
  },
  {
    id: "2528",
    nomeCompleto: "Helen Cristina dos Santos Calixto",
    dataNascimento: "9/22/1995",
    carteirinha: "0M6FH000007005",
    numeroGestacoes: "1",
    numeroCesareas: "0",
    numeroPartosNormais: "0",
    numeroAbortos: "0",
    telefones: "11 982318586",
    procedimentos: "Cesárea",
    dumStatus: "Incerta",
    dataDum: "",
    dataPrimeiroUsg: "4/28/2025",
    semanasUsg: "6",
    diasUsg: "5",
    usgRecente: "10/11 - 34;5 semanas, 2621g, ila e doppler normais",
    igPretendida: "38",
    indicacaoProcedimento: "Desejo materno de pc, hac em uso de dois anti-hipertensivos, dmg (dieta), hipotiroidismo",
    medicacao: "Levotiroxina 50mcg, metildopa 2g, anlodipino 10mg",
    diagnosticosMaternos: "Dmg (dieta), hac (mtd, anlodipino), hipotiroidismo (lt4)",
    placentaPrevia: "Não",
    diagnosticosFetais: "Nenhum",
    historiaObstetrica: "Na",
    necessidadeUtiMaterna: "Não",
    necessidadeReservaSangue: "Não",
    maternidade: "Salvalus",
    medicoResponsavel: "Sandra Regina Gonçalves",
    emailPaciente: "helencris.enfermeira@gmail.com"
  },
  {
    id: "2532",
    nomeCompleto: "Rhaissa Soares Lopes",
    dataNascimento: "9/10/2003",
    carteirinha: "0WRZX044943016",
    numeroGestacoes: "1",
    numeroCesareas: "0",
    numeroPartosNormais: "0",
    numeroAbortos: "0",
    telefones: "(11)983704819 (11)952682720",
    procedimentos: "Cesárea",
    dumStatus: "Sim - Confiavel",
    dataDum: "3/18/2025",
    dataPrimeiroUsg: "7/21/2025",
    semanasUsg: "18",
    diasUsg: "4",
    usgRecente: "14/11/2025 - USG Obstetrico: IG 35 1/7 s, FUV , cefálico , peso estimado 2905 (P97) , PFGII, LÁ normal",
    igPretendida: "38",
    indicacaoProcedimento: "Desejo Materno",
    medicacao: "Dieta",
    diagnosticosMaternos: "DMG sem insulina",
    placentaPrevia: "Não",
    diagnosticosFetais: "Macrossomia fetal",
    historiaObstetrica: "DMG macrossomia",
    necessidadeUtiMaterna: "Não",
    necessidadeReservaSangue: "Não",
    maternidade: "Salvalus",
    medicoResponsavel: "Luis Houra",
    emailPaciente: "rayssasoares20142014@gmail.com"
  },
  {
    id: "2536",
    nomeCompleto: "Thaina Santos Amorim de Carvalho",
    dataNascimento: "1/16/1997",
    carteirinha: "A3ncj00132007",
    numeroGestacoes: "2",
    numeroCesareas: "0",
    numeroPartosNormais: "1",
    numeroAbortos: "0",
    telefones: "961315707 932005704",
    procedimentos: "Cesárea",
    dumStatus: "Sim - Confiavel",
    dataDum: "3/13/2025",
    dataPrimeiroUsg: "4/23/2025",
    semanasUsg: "5",
    diasUsg: "6",
    usgRecente: "14/11/25 fuvlc 34 5/7 2583 (p44) ila 92 e dop nl",
    igPretendida: "39",
    indicacaoProcedimento: "Desejo",
    medicacao: "Mtd 750/dia sertralina 50mg/dia",
    diagnosticosMaternos: "Dmg sem controle",
    placentaPrevia: "Não",
    diagnosticosFetais: "Nao",
    historiaObstetrica: "Hac sd pânico abdominoplastia",
    necessidadeUtiMaterna: "Não",
    necessidadeReservaSangue: "Não",
    maternidade: "Salvalus",
    medicoResponsavel: "Paula Iervolino",
    emailPaciente: "thaina.amorim14@gmail.com"
  },
  {
    id: "2538",
    nomeCompleto: "Débora Rosa Bispo",
    dataNascimento: "8/13/1986",
    carteirinha: "1T9W7000001007",
    numeroGestacoes: "2",
    numeroCesareas: "0",
    numeroPartosNormais: "1",
    numeroAbortos: "0",
    telefones: "11 986485505 11 985184114",
    procedimentos: "Indução Programada",
    dumStatus: "Incerta",
    dataDum: "",
    dataPrimeiroUsg: "5/13/2025",
    semanasUsg: "9",
    diasUsg: "1",
    usgRecente: "17.11-fuv, cef, 2772- P39 mbv5,5 Doppler nl perfil 10/10",
    igPretendida: "39",
    indicacaoProcedimento: "Dmg",
    medicacao: "Ndn",
    diagnosticosMaternos: "Dmg",
    placentaPrevia: "Não",
    diagnosticosFetais: "Ndn",
    historiaObstetrica: "Ndn",
    necessidadeUtiMaterna: "Não",
    necessidadeReservaSangue: "Não",
    maternidade: "Salvalus",
    medicoResponsavel: "Angélica do Rosário",
    emailPaciente: "debora.r.bispo32@gmail.com"
  },
  {
    id: "2552",
    nomeCompleto: "AMANDA DE SOUSA DA ROCHA",
    dataNascimento: "10/1/1999",
    carteirinha: "0WRZX043607004",
    numeroGestacoes: "1",
    numeroCesareas: "0",
    numeroPartosNormais: "0",
    numeroAbortos: "0",
    telefones: "11 98494-8803",
    procedimentos: "Cesárea",
    dumStatus: "Sim - Confiavel",
    dataDum: "3/14/2025",
    dataPrimeiroUsg: "4/5/2025",
    semanasUsg: "7",
    diasUsg: "1",
    usgRecente: "08/11/2025: 33S6D / CEF / 2714G / P85 / ILA NORMAL",
    igPretendida: "39",
    indicacaoProcedimento: "DESEJO MATERNO",
    medicacao: "METILDOPA 500MG 8/8h //LVT 50 MCG/D // AAS até 36s E CALCIO",
    diagnosticosMaternos: "HAC - FAZIA USO PREVIO DE LOSARTANA + HCT + ATENOLOL / OBESIDADE / DMG / HIPOTIREOIDISMO",
    placentaPrevia: "Não",
    diagnosticosFetais: "--",
    historiaObstetrica: "--",
    necessidadeUtiMaterna: "Não",
    necessidadeReservaSangue: "Não",
    maternidade: "Cruzeiro",
    medicoResponsavel: "Wilson Loike",
    emailPaciente: "as1257604@gmail.com"
  },
  {
    id: "2553",
    nomeCompleto: "Daniele Rodrigues",
    dataNascimento: "3/8/1988",
    carteirinha: "0W7EX001553020",
    numeroGestacoes: "2",
    numeroCesareas: "0",
    numeroPartosNormais: "1",
    numeroAbortos: "0",
    telefones: "11 985365258",
    procedimentos: "Cesárea + Laqueadura",
    dumStatus: "Sim - Confiavel",
    dataDum: "3/10/2025",
    dataPrimeiroUsg: "8/5/2025",
    semanasUsg: "9",
    diasUsg: "0",
    usgRecente: "USG 08/11 34 1/7, peso 2268g, liq nl, plac post G1, chef, Doppler nl",
    igPretendida: "39",
    indicacaoProcedimento: "Desejo materno",
    medicacao: "Levotiroxina 25",
    diagnosticosMaternos: "Hipotireoidismo",
    placentaPrevia: "Não",
    diagnosticosFetais: "Ndn",
    historiaObstetrica: "Ndn",
    necessidadeUtiMaterna: "Não",
    necessidadeReservaSangue: "Não",
    maternidade: "Guarulhos",
    medicoResponsavel: "Mariliz de Mello",
    emailPaciente: "Danyebryan2019@gmail.com"
  },
  {
    id: "2554",
    nomeCompleto: "MILLENE SILVA SANTOS",
    dataNascimento: "8/19/2005",
    carteirinha: "1ZHV5000054011",
    numeroGestacoes: "1",
    numeroCesareas: "0",
    numeroPartosNormais: "0",
    numeroAbortos: "0",
    telefones: "11 941954778 11 952484116",
    procedimentos: "Indução Programada",
    dumStatus: "Sim - Confiavel",
    dataDum: "3/17/2025",
    dataPrimeiroUsg: "2/5/2025",
    semanasUsg: "6",
    diasUsg: "5",
    usgRecente: "17/11 - 35 SEM CEF 2570 P47 MBV 7,2 DOPPLER NL PBF 10/10",
    igPretendida: "39",
    indicacaoProcedimento: "DESEJO MATERNO",
    medicacao: "MATERNA / SF",
    diagnosticosMaternos: "DMG",
    placentaPrevia: "Não",
    diagnosticosFetais: "NDN",
    historiaObstetrica: "NDN",
    necessidadeUtiMaterna: "Não",
    necessidadeReservaSangue: "Não",
    maternidade: "NotreCare",
    medicoResponsavel: "Raquel Grecco",
    emailPaciente: "MILLENESILSANTOS19@GMAIL.COM"
  },
  {
    id: "2555",
    nomeCompleto: "TATIANA DA COSTA SEVERO SILVA",
    dataNascimento: "1/15/1985",
    carteirinha: "0NWMQ000001015",
    numeroGestacoes: "2",
    numeroCesareas: "0",
    numeroPartosNormais: "0",
    numeroAbortos: "1",
    telefones: "11 97386-9875",
    procedimentos: "Cesárea",
    dumStatus: "Sim - Confiavel",
    dataDum: "3/20/2025",
    dataPrimeiroUsg: "5/19/2025",
    semanasUsg: "8",
    diasUsg: "2",
    usgRecente: "US 06/11: 33S0D / CEF / 2262g (p64) / mbv 7,1 / pbf 8/8/ doppler normal",
    igPretendida: "38",
    indicacaoProcedimento: "dmg em uso de insulina",
    medicacao: "nph 0-0-10 / regenesis premium",
    diagnosticosMaternos: "dmg / ima / obesidade",
    placentaPrevia: "Não",
    diagnosticosFetais: "--",
    historiaObstetrica: "--",
    necessidadeUtiMaterna: "Não",
    necessidadeReservaSangue: "Não",
    maternidade: "Cruzeiro",
    medicoResponsavel: "Wilson Loike",
    emailPaciente: "cs.tatymarcos@gmail.com"
  },
  {
    id: "2556",
    nomeCompleto: "GABRIELA DE ARAUJO JORGE",
    dataNascimento: "7/23/1997",
    carteirinha: "3010V005119006",
    numeroGestacoes: "1",
    numeroCesareas: "0",
    numeroPartosNormais: "0",
    numeroAbortos: "0",
    telefones: "11 99154-9979",
    procedimentos: "Cesárea",
    dumStatus: "Sim - Confiavel",
    dataDum: "3/1/2025",
    dataPrimeiroUsg: "5/5/2025",
    semanasUsg: "9",
    diasUsg: "3",
    usgRecente: "17/11/2025 - 37S2D / CEF / 3494G (P84) / MBV 6,2 / DOPPLER NORMAL",
    igPretendida: "39",
    indicacaoProcedimento: "Desejo materno",
    medicacao: "--",
    diagnosticosMaternos: "Obesidade",
    placentaPrevia: "Não",
    diagnosticosFetais: "--",
    historiaObstetrica: "--",
    necessidadeUtiMaterna: "Não",
    necessidadeReservaSangue: "Não",
    maternidade: "Guarulhos",
    medicoResponsavel: "Wilson Loike",
    emailPaciente: "gabrielaa_jorge@icloud.com"
  },
  {
    id: "2557",
    nomeCompleto: "ALINE CASTANHO DA SILVA",
    dataNascimento: "3/4/1990",
    carteirinha: "0UMWN000001007",
    numeroGestacoes: "3",
    numeroCesareas: "1",
    numeroPartosNormais: "1",
    numeroAbortos: "1",
    telefones: "11969645085 11992109696",
    procedimentos: "Cesárea",
    dumStatus: "Sim - Confiavel",
    dataDum: "3/9/2025",
    dataPrimeiroUsg: "4/29/2025",
    semanasUsg: "7",
    diasUsg: "1",
    usgRecente: "17/11/2025: cefalico, MBV 4,6cm,placenta posterior g2,peso 3131g p78, doppler normal",
    igPretendida: "39",
    indicacaoProcedimento: "desejo materno",
    medicacao: "metildopa 750mg/dia, levotiroxina 25mcg/dia",
    diagnosticosMaternos: "-",
    placentaPrevia: "Não",
    diagnosticosFetais: "-",
    historiaObstetrica: "HAC + OBESIDADE + HIPOTIREOIDISMO SUBCLINICO; NATIMORTO EM 2009 22 SEMANAS",
    necessidadeUtiMaterna: "Não",
    necessidadeReservaSangue: "Não",
    maternidade: "Guarulhos",
    medicoResponsavel: "Thiago Ricci",
    emailPaciente: "alinecastanho@hotmail.com"
  }
];

export default function ImportarPacientesPendentes() {
  const [isImporting, setIsImporting] = useState(false);
  const [results, setResults] = useState<{
    success: number;
    failed: number;
    skipped: number;
    errors: string[];
    warnings: string[];
  } | null>(null);
  const { toast } = useToast();

  const gerarCSV = () => {
    // A edge function espera exatamente 33 campos na seguinte ordem:
    // 0-4: vazios, 5: Nome, 6: Data Nasc, 7: Carteirinha, 8-11: Paridade,
    // 12: Tel, 13: Proc, 14: DUM Status, 15: Data DUM, 16: Data USG,
    // 17: Sem USG, 18: Dias USG, 19: USG Rec, 20: IG Pret, 21: vazio,
    // 22: Indicação, 23: Med, 24: Diag Mat, 25: Placenta, 26: Diag Fetal,
    // 27: Hist Obst, 28: UTI, 29: Reserva, 30: Maternidade, 31: Médico, 32: Email
    
    const header = "ID,Hora Início,Coluna1,Coluna2,Coluna3,Nome Completo,Data Nascimento,Carteirinha,Nº Gestações,Nº Cesáreas,Nº Partos Normais,Nº Abortos,Telefones,Procedimentos,DUM,Data DUM,Data 1º USG,Semanas USG,Dias USG,USG Recente,IG Pretendida,Coluna3,Indicação,Medicação,Diagnósticos Maternos,Placenta Prévia,Diagnósticos Fetais,História Obstétrica,UTI Materna,Reserva Sangue,Maternidade,Médico Responsável,Email Paciente";
    
    const linhas = PACIENTES_PENDENTES.map(p => {
      const campos = [
        p.id,                           // 0
        "",                             // 1: Hora Início
        "",                             // 2: Coluna1
        "",                             // 3: Coluna2
        "",                             // 4: Coluna3
        p.nomeCompleto,                 // 5
        p.dataNascimento,               // 6
        p.carteirinha,                  // 7
        p.numeroGestacoes,              // 8
        p.numeroCesareas,               // 9
        p.numeroPartosNormais,          // 10
        p.numeroAbortos,                // 11
        p.telefones,                    // 12
        p.procedimentos,                // 13
        p.dumStatus,                    // 14
        p.dataDum,                      // 15
        p.dataPrimeiroUsg,              // 16
        p.semanasUsg,                   // 17
        p.diasUsg,                      // 18
        `"${p.usgRecente.replace(/"/g, '""')}"`,  // 19: escape quotes
        p.igPretendida,                 // 20
        "",                             // 21: Coluna3
        `"${p.indicacaoProcedimento.replace(/"/g, '""')}"`,  // 22
        `"${p.medicacao.replace(/"/g, '""')}"`,              // 23
        p.diagnosticosMaternos,         // 24
        p.placentaPrevia,               // 25
        `"${p.diagnosticosFetais.replace(/"/g, '""')}"`,     // 26
        `"${p.historiaObstetrica.replace(/"/g, '""')}"`,     // 27
        p.necessidadeUtiMaterna,        // 28
        p.necessidadeReservaSangue,     // 29
        p.maternidade,                  // 30
        p.medicoResponsavel,            // 31
        p.emailPaciente                 // 32
      ];
      
      return campos.join(',');
    });
    
    return [header, "", "", ...linhas].join('\n');
  };

  const handleImport = async () => {
    setIsImporting(true);
    setResults(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const csvContent = gerarCSV();
      
      const { data, error } = await supabase.functions.invoke('importar-csv-lote', {
        body: { csvContent, userId: user.id }
      });

      if (error) throw error;

      setResults(data);
      
      if (data.success > 0) {
        toast({
          title: "Importação concluída",
          description: `${data.success} pacientes importadas com sucesso!`,
        });
      }
    } catch (error: any) {
      console.error('Erro na importação:', error);
      toast({
        title: "Erro na importação",
        description: error.message || "Erro ao importar pacientes",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar 22 Pacientes Pendentes
          </CardTitle>
          <CardDescription>
            Importação em lote das pacientes identificadas na planilha de novembro/dezembro 2025
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Lista de pacientes */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <h3 className="font-semibold mb-3">Pacientes a serem importadas:</h3>
            <div className="space-y-1 max-h-[300px] overflow-y-auto text-sm">
              {PACIENTES_PENDENTES.map((p, idx) => (
                <div key={p.id} className="flex items-center justify-between py-1 border-b last:border-0">
                  <span className="text-muted-foreground">#{idx + 1}</span>
                  <span className="flex-1 px-3">{p.nomeCompleto}</span>
                  <span className="text-xs text-muted-foreground">{p.carteirinha}</span>
                  <span className="ml-3 px-2 py-0.5 rounded text-xs bg-primary/10">{p.maternidade}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Botão de importação */}
          <Button
            onClick={handleImport}
            disabled={isImporting}
            size="lg"
            className="w-full"
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Importando {PACIENTES_PENDENTES.length} pacientes...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-5 w-5" />
                Importar {PACIENTES_PENDENTES.length} Pacientes
              </>
            )}
          </Button>

          {/* Resultados */}
          {results && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold">Resultado da Importação:</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <div className="font-bold text-2xl">{results.success}</div>
                    <div className="text-xs">Importadas</div>
                  </AlertDescription>
                </Alert>

                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <div className="font-bold text-2xl">{results.skipped}</div>
                    <div className="text-xs">Duplicadas</div>
                  </AlertDescription>
                </Alert>

                <Alert className="border-red-200 bg-red-50">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <div className="font-bold text-2xl">{results.failed}</div>
                    <div className="text-xs">Falharam</div>
                  </AlertDescription>
                </Alert>
              </div>

              {/* Erros */}
              {results.errors.length > 0 && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-semibold mb-2">Erros:</div>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      {results.errors.slice(0, 10).map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                      {results.errors.length > 10 && (
                        <li className="text-muted-foreground">...e mais {results.errors.length - 10} erros</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Avisos */}
              {results.warnings.length > 0 && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <div className="font-semibold mb-2">Avisos:</div>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      {results.warnings.slice(0, 5).map((warn, idx) => (
                        <li key={idx}>{warn}</li>
                      ))}
                      {results.warnings.length > 5 && (
                        <li className="text-muted-foreground">...e mais {results.warnings.length - 5} avisos</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Informações importantes */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Importante:</strong> Todas as pacientes serão importadas com status "pendente" e aguardarão aprovação do admin médico.
              O sistema calculará automaticamente a IG atual e a data ideal de agendamento baseada nos protocolos obstétricos.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
