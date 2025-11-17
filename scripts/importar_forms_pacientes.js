import {createClient} from "@supabase/supabase-js";
const URL="https://dssdffhbdpwgusfeqiqk.supabase.co";
const KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzc2RmZmhiZHB3Z3VzZmVxaXFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzMzMDI1MiwiZXhwIjoyMDc4OTA2MjUyfQ.jQjYiKGaPMt3aHCCTlbG0emYhswceF3ZziX1zRostmA";
const sb=createClient(URL,KEY);

function parseDate(d){
  if(!d||d==="#VALOR!"||d==="ERRO")return null;
  const m=d.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if(!m)return null;
  const d1=parseInt(m[1]);const d2=parseInt(m[2]);
  if(d2>12){return `${m[3]}-${m[1].padStart(2,"0")}-${m[2].padStart(2,"0")}`;}
  return `${m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`;
}

function classifyProc(txt){const t=(txt||"").toLowerCase();const p=[];if(t.includes("cesár")||t.includes("cesar"))p.push("Parto cesárea");if(t.includes("laqueadura")||t.includes("lt")||t.includes("diu"))p.push("Laqueadura tubária");if(t.includes("induç")||t.includes("induc")||t.includes("parto normal"))p.push("Indução de parto");if(t.includes("cerclagem"))p.push("Cerclagem");if(!p.length)p.push("Parto cesárea");return p;}

const dados=[
{nome:"Adriana Alves Barbosa",dn:"1986-08-19",cart:"0Z0JQ000335002",tel:"1197989-1929",proc:"Cesárea + Laqueadura",dum:"24/02/2025",ind:"Dmg + p>90",diag_mat:"Dmg",mat:"NotreCare",email:"adrianabarbosa1908@gmail.com",data_ag:"18/12/2025"},
{nome:"KAROLINYVICTORIA BARRETO BATISTA",dn:"2005-08-05",cart:"0VG6A000001023",tel:"11945558962",proc:"Cesárea",dum:"06/03/2025",ind:"BARIATRICA",diag_mat:"Bariátrica",mat:"NotreCare",email:"karolinyvictoria05@gmail.com",data_ag:"04/12/2025"},
{nome:"MILENE CARDOSO DE SOUZA",dn:"1997-03-06",cart:"1UXPX005504007",tel:"11976123787",proc:"Cesárea + Laqueadura",dum:"",ind:"ITERATIVIDADE",diag_mat:"HIPERTIREOIDISMO",mat:"NotreCare",email:"SOUZACARDOSO90@GMAIL.COM",data_ag:"02/12/2025"},
{nome:"Ana Caroline Buzzi Domingues",dn:"1988-09-08",cart:"0SQ1H000001015",tel:"11 968302891",proc:"Cesárea",dum:"17/02/2025",ind:"Desejo Materno",diag_mat:"HAC + DMG",mat:"NotreCare",email:"cbuzzi.carol@gmail.com",data_ag:"",urgente:true},
{nome:"ACSA CRISTINA SILVA DE AMORIM CASTRO",dn:"1998-02-28",cart:"0X3IN000235016",tel:"11 96390-4342",proc:"Indução Programada",dum:"",ind:"DMG + LA",diag_mat:"DMG",mat:"Cruzeiro",email:"acsa.cristina.s.a@gmail.com",data_ag:"10/12/2025"},
{nome:"Stefanny Karoline Santos Arruda",dn:"1993-12-24",cart:"0UGB2000237035",tel:"11 960842803",proc:"Indução Programada",dum:"11/03/2025",ind:"Desejo",diag_mat:"DMG c/ insulina",mat:"NotreCare",email:"skss120@gmail.com",data_ag:"02/12/2025"},
{nome:"Bruna alves de souza",dn:"2000-03-09",cart:"0p5ce000057010",tel:"11991507545",proc:"Cesárea",dum:"",ind:"Desejo",diag_mat:"Has",mat:"NotreCare",email:"brunasales190418@gmail.com",data_ag:"",urgente:true},
{nome:"Samara Isaias da Silva",dn:"1993-11-02",cart:"0MY1S000779024",tel:"962398856",proc:"Cerclagem",dum:"10/08/2025",ind:"IIC",diag_mat:"IIC",mat:"NotreCare",email:"samara.isaias@outlook.com",data_ag:"27/04/2026"},
{nome:"Amanda couto melo",dn:"2000-02-17",cart:"0X1M2005075017",tel:"976227658",proc:"Cesárea + Laqueadura",dum:"15/03/2025",ind:"Iteratividade",diag_mat:"Anemia",mat:"NotreCare",email:"amandacoutomelo17@gmail.com",data_ag:"06/12/2025"},
{nome:"Marina Lidia Rosa Soares",dn:"1994-01-12",cart:"1T9LX000259004",tel:"11 930568812",proc:"Indução Programada",dum:"",ind:"Desejo",diag_mat:"DM1",mat:"NotreCare",email:"lidiamarina.1@gmail.com",data_ag:"08/12/2025"},
{nome:"RENATA MARIA MONTEIRO",dn:"2000-05-18",cart:"0M0YI004305000",tel:"11958021753",proc:"Cesárea",dum:"01/03/2025",ind:"TRANSVERSO",diag_mat:"HIPOTIREOIDISMO",mat:"Cruzeiro",email:"renatamonteiro990@gmail.com",data_ag:"29/11/2025"},
{nome:"Carina Viana Gomes",dn:"1987-01-23",cart:"1PVHP000001007",tel:"1191406-9619",proc:"Cesárea + Laqueadura",dum:"25/03/2025",ind:"PE + rciu",diag_mat:"Pe",mat:"Guarulhos",email:"carigomes520@gmail.com",data_ag:"09/12/2025"},
{nome:"Tassia Cristina Alves Vasconcelos",dn:"1988-07-05",cart:"1rvs2000124001",tel:"983032375",proc:"Cesárea",dum:"11/03/2025",ind:"Desejo",diag_mat:"Anemia",mat:"Salvalus",email:"tassiavasconcelos88@gmail.com",data_ag:"09/12/2025"},
{nome:"KAROLINE MARA FERRI",dn:"1986-11-27",cart:"1ZURD000240001",tel:"11974823820",proc:"Cesárea",dum:"",ind:"desejo",diag_mat:"DMG",mat:"Salvalus",email:"karol_ferri@hotmail.com",data_ag:"",urgente:true},
{nome:"IANDA OLIVEIRA BATISTA",dn:"1983-07-21",cart:"0M06Q009987002",tel:"11945093086",proc:"Cesárea + Laqueadura",dum:"",ind:"HAS",diag_mat:"RCIU?",mat:"NotreCare",email:"jairlucas.74@gmail.com",data_ag:"",urgente:true},
{nome:"Jennifer Baptista Pio",dn:"1990-04-21",cart:"1PGUH000181005",tel:"11987107180",proc:"Cesárea",dum:"",ind:"Pelvico DMG",diag_mat:"DMG insulina",mat:"Salvalus",email:"jenniferpiotg@gmail.com",data_ag:"03/12/2025"},
{nome:"Camila Soares de a Oliveira",dn:"1990-01-17",cart:"0VC5000001015",tel:"11 992906259",proc:"Cesárea",dum:"01/03/2025",ind:"Desejo",diag_mat:"Tireodite",mat:"Cruzeiro",email:"cah_milla17@hotmail.com",data_ag:"",urgente:true},
{nome:"GIOVANNA GOMES MUNHOZ",dn:"1999-06-04",cart:"0SAWK000028002",tel:"11988429065",proc:"Indução Programada",dum:"",ind:"HAS",diag_mat:"HAS",mat:"Salvalus",email:"giovannagomes.munhoz1999@gmail.com",data_ag:"29/11/2025"},
{nome:"TAMIRES ROBERTA DA SILVA SANTOS",dn:"1996-10-28",cart:"0U355000002003",tel:"11988344235",proc:"Cesárea",dum:"",ind:"desejo",diag_mat:"dmg, dheg",mat:"NotreCare",email:"tamiresroberta28101996@gmail.com",data_ag:"01/12/2025"},
{nome:"Tatiane Oliveira da Cruz",dn:"1986-07-27",cart:"1Z8L4000001007",tel:"1197342-1869",proc:"Cesárea",dum:"15/03/2025",ind:"Desejo",diag_mat:"Dmg",mat:"Guarulhos",email:"tatianecruz86@bol.com.br",data_ag:"20/12/2025"},
{nome:"Aline Rodrigues Macedo",dn:"1992-05-23",cart:"0ZYFT000001023",tel:"11 933551644",proc:"Cesárea",dum:"10/03/2025",ind:"Iterativa",diag_mat:"Trissomia 21",mat:"Salvalus",email:"alinemacedo9432@gmail.com",data_ag:"",urgente:true},
{nome:"Nayara dos Santos Silva",dn:"2003-01-27",cart:"3010T149944035",tel:"11 962896616",proc:"Cesárea",dum:"24/02/2025",ind:"Desejo",diag_mat:"Dmg",mat:"Guarulhos",email:"nayarasantos2703@hotmail.com",data_ag:"01/12/2025"},
{nome:"Luiza Cristine torquette sant ana",dn:"1997-10-23",cart:"0qmgd000026000",tel:"947044442",proc:"Cesárea",dum:"",ind:"Desejo",diag_mat:"HAC",mat:"NotreCare",email:"luiza.luli@hotmail.com",data_ag:"23/12/2025"},
{nome:"Tais Ferreira da silva",dn:"1989-08-20",cart:"0xzq0001270028",tel:"11 979768674",proc:"Cesárea",dum:"",ind:"Feto gig PE",diag_mat:"Feto gig",mat:"Guarulhos",email:"taisfersil@gmail.com",data_ag:"10/12/2025"},
{nome:"LUANA GADANHOTO LIMA",dn:"1994-05-24",cart:"0ZBU1007922000",tel:"11 948051333",proc:"Cesárea",dum:"15/03/2025",ind:"desejo",diag_mat:"dmg insulina",mat:"Salvalus",email:"luana_arthur@icloud.com",data_ag:"06/12/2025"},
{nome:"Beatriz de Lima Paulino",dn:"1996-04-03",cart:"0Z2BI000015008",tel:"11 962710641",proc:"Cesárea",dum:"06/03/2025",ind:"Desejo",diag_mat:"Hac, dmg",mat:"Salvalus",email:"Beatriz.pauliino@gmail.com",data_ag:"04/12/2025"},
{nome:"Paloma Duarte Lima",dn:"1992-09-19",cart:"0UDN9000024007",tel:"11 989273140",proc:"Cesárea",dum:"08/03/2025",ind:"Pelvica",diag_mat:"Dmg",mat:"Guarulhos",email:"Palomaduarteuna@gmail.com",data_ag:"13/12/2025"},
{nome:"Bianca pereira lins ribeiro",dn:"1988-02-10",cart:"Oz2ew000006009",tel:"977385017",proc:"Cesárea",dum:"",ind:"Desejo",diag_mat:"Dmg",mat:"Salvalus",email:"ribeiro.bialins@gmail.com",data_ag:"03/12/2025"},
{nome:"Mercia Silva da Conceição",dn:"1995-03-11",cart:"0ZZ48000001007",tel:"11 934989294",proc:"Cerclagem",dum:"",ind:"IIC",diag_mat:"IIC",mat:"Guarulhos",email:"Merciasilvad@gmail.com",data_ag:"01/05/2026"},
{nome:"Ingredy Sena Santos",dn:"2003-02-23",cart:"0M00K004217004",tel:"11 979939543",proc:"Indução Programada",dum:"09/03/2025",ind:"Desejo",diag_mat:"Anemia",mat:"NotreCare",email:"ingredysena2003@gmail.com",data_ag:"13/12/2025"},
{nome:"Gabriela Cândida Nogueira",dn:"2002-05-11",cart:"1ZUNX001296019",tel:"11 994562076",proc:"Indução Programada",dum:"",ind:"Desejo",diag_mat:"Dmg sífilis",mat:"NotreCare",email:"Gabriela.farias5@icloud.com.br",data_ag:"",urgente:true},
{nome:"THAYNA ALMEIDA NOVAIS",dn:"2003-04-24",cart:"0WRZX035161000",tel:"11970703090",proc:"Cesárea",dum:"15/03/2025",ind:"HAS",diag_mat:"HAS gestacional",mat:"Salvalus",email:"ts1423216@gmail.com",data_ag:"29/11/2025"},
{nome:"LORRAYNNY GEASY ELIAS GALINDO",dn:"1995-08-06",cart:"3010t226823000",tel:"11 97276 1758",proc:"Cesárea",dum:"11/03/2025",ind:"HAS",diag_mat:"HAS",mat:"NotreCare",email:"LORRAYNNY.GEASY@HOTMAIL.COM",data_ag:"03/12/2025"},
{nome:"Flávia dos a Santos Pereira",dn:"1989-07-15",cart:"0VKQD000005010",tel:"11 960625649",proc:"Cesárea + Laqueadura",dum:"11/03/2025",ind:"Iteratividade",diag_mat:"Dmg",mat:"Cruzeiro",email:"flavia.sanper1529@outlook.com",data_ag:"16/12/2025"},
{nome:"Simone Vitorino ramos",dn:"1991-06-25",cart:"0skjf000001007",tel:"970345927",proc:"Cesárea",dum:"19/03/2025",ind:"Desejo",diag_mat:"Hag",mat:"NotreCare",email:"simonevitorino2010@hotmail.com",data_ag:"03/12/2025"},
{nome:"Leidiana Lira da Silva",dn:"1989-04-26",cart:"0WFUZ002687011",tel:"11 96284-0760",proc:"Cesárea + Laqueadura",dum:"22/03/2025",ind:"Córmica",diag_mat:"HAS, DMG",mat:"Salvalus",email:"leidiana.lira2019@gmail.com",data_ag:"06/12/2025"},
{nome:"Girlene Maria Santos da Rocha",dn:"1991-01-09",cart:"0WJMT000133000",tel:"11 910831453",proc:"Indução Programada",dum:"09/03/2025",ind:"HAS gig",diag_mat:"HAS",mat:"Cruzeiro",email:"girlenesantos532@gmail.com",data_ag:"",urgente:true},
{nome:"Laysa Fortunato da Silva",dn:"2003-06-02",cart:"0NXIZ000144002",tel:"11 942751718",proc:"Indução Programada",dum:"09/03/2025",ind:"HAS gig",diag_mat:"HAS",mat:"Salvalus",email:"laysasilva0406@gmail.com",data_ag:"",urgente:true},
{nome:"ALICE GOUVEIA VICENTIM",dn:"2011-11-12",cart:"3010T275183010",tel:"11985620129",proc:"Cesárea",dum:"",ind:"RCF PP",diag_mat:"placenta previa",mat:"NotreCare",email:"angelac.sgouveia@hotmail.com",data_ag:"06/12/2025"},
{nome:"Jessyca Hellen Barros da Silva",dn:"2000-08-25",cart:"1ZKH2000001007",tel:"11 989639617",proc:"Cesárea",dum:"04/03/2025",ind:"Desejo",diag_mat:"DMG",mat:"NotreCare",email:"jessyca.hellen20@gmail.com",data_ag:"17/12/2025"},
{nome:"Luana Eloisa Santos Moura da Silva",dn:"1995-04-07",cart:"0YQDE000397008",tel:"11 966231994",proc:"Cesárea",dum:"22/04/2025",ind:"Gemelar",diag_mat:"Gemelar m/m",mat:"Salvalus",email:"luan.epss07@gmail.com",data_ag:"06/01/2026"},
{nome:"Luciana prieto jordao",dn:"1979-02-05",cart:"1T7X2000038008",tel:"11 985994011",proc:"Cesárea",dum:"18/03/2025",ind:"Desejo",diag_mat:"Dmg, hac",mat:"Guarulhos",email:"Luprietojordao@gmail.com",data_ag:"16/12/2025"},
{nome:"Viviane Lima dos Santos",dn:"1987-03-16",cart:"0YXY2032125003",tel:"11 995085614",proc:"Cesárea + Laqueadura",dum:"",ind:"Desejo",diag_mat:"HAC",mat:"NotreCare",email:"vivianececirafa@gmail.com",data_ag:"15/12/2025"},
{nome:"ANTONIA KARINY MORAIS DE SOUSA",dn:"2002-06-13",cart:"0PZEL000490008",tel:"978110787",proc:"Cesárea",dum:"",ind:"DMG HAS",diag_mat:"HAS DMG",mat:"NotreCare",email:"karinymoraes13062002@gmail.com",data_ag:"",urgente:true},
{nome:"Tamires Eva Prates Ramos",dn:"2000-12-22",cart:"3010T046128000",tel:"11 982990394",proc:"Indução Programada",dum:"26/03/2025",ind:"Desejo",diag_mat:"HAS obesidade",mat:"Guarulhos",email:"Tamyveh@gmail.com",data_ag:"10/12/2025"},
{nome:"Mariana de Souza Matos",dn:"1996-07-31",cart:"0M45W000002011",tel:"11 942187532",proc:"Indução Programada",dum:"",ind:"Desejo",diag_mat:"DMG HAC",mat:"NotreCare",email:"mariane.smatos@outlook.com",data_ag:"",urgente:true},
{nome:"GIOVANNA AVILA ASSIS NUNES",dn:"2001-02-10",cart:"0WZQ5008103003",tel:"963570625",proc:"Indução Programada",dum:"",ind:"HAS",diag_mat:"HAS",mat:"NotreCare",email:"giovannaavilaassis@gmail.com",data_ag:"",urgente:true},
{nome:"Aline Silva Barreto",dn:"1992-06-30",cart:"1ZDYV000021008",tel:"11 973384377",proc:"Indução Programada",dum:"",ind:"Desejo",diag_mat:"Miomatose HAC DMG",mat:"NotreCare",email:"line.barreto3@gmail.com",data_ag:"09/12/2025"},
{nome:"Vivian Aparecida Luiz",dn:"2000-08-10",cart:"1ZBDY000001015",tel:"11 947924410",proc:"Cesárea;DIU",dum:"12/03/2025",ind:"Desejo",diag_mat:"Hac obesidade sífilis",mat:"Guarulhos",email:"Lorenamauella690@gmail.com",data_ag:"10/12/2025"},
{nome:"Thayanne Martins Sales",dn:"2001-07-08",cart:"1ZTSX000143006",tel:"11 969630113",proc:"Cesárea",dum:"",ind:"Desejo",diag_mat:"Dmg HAS obesidade",mat:"Guarulhos",email:"Msaatay48@gmail.com",data_ag:"08/12/2025"},
{nome:"Vanderlainia da Silva Viana",dn:"1992-07-01",cart:"1ZUHF000208000",tel:"11961244708",proc:"Indução Programada",dum:"15/03/2025",ind:"Pós datismo",diag_mat:"TN AUMENTADA",mat:"NotreCare",email:"laneviana1992@gmail.com",data_ag:"19/12/2025"},
{nome:"Adriana Pinto Pereira Galdino",dn:"1987-05-07",cart:"1ZEI004112016",tel:"11937681617",proc:"Cesárea",dum:"10/04/2025",ind:"Gemelar",diag_mat:"Gemelar",mat:"Salvalus",email:"Adriana.pp@outlook.com",data_ag:"08/01/2026"},
{nome:"Giurlan Silva Silveira",dn:"1984-05-04",cart:"1T5NU000010006",tel:"980297747",proc:"Cesárea + Laqueadura",dum:"03/03/2025",ind:"Desejo LT",diag_mat:"Hipotireoidismo",mat:"NotreCare",email:"Alves.s.g74@gmail.com",data_ag:"01/12/2025"},
{nome:"Tabata Xavier do Nascimento",dn:"1987-07-03",cart:"3010T123389026",tel:"11964623580",proc:"Cesárea + Laqueadura",dum:"24/03/2025",ind:"Iteratividade",diag_mat:"Iteratividade ansiedade",mat:"NotreCare",email:"nx.tabata@gmail.com",data_ag:"22/12/2025"},
{nome:"Raionia Maciel de Souza",dn:"2001-05-25",cart:"0LL24006467024",tel:"948551598",proc:"Cesárea",dum:"11/03/2025",ind:"Desejo",diag_mat:"PIG",mat:"Salvalus",email:"Raioniasouza45@gmail.com",data_ag:"09/12/2025"},
{nome:"DAIANE NOGUEIRA CARVALHO DE SOUSA",dn:"1988-05-30",cart:"3010T007996004",tel:"11 939378193",proc:"Cesárea + Laqueadura",dum:"",ind:"DESEJO",diag_mat:"DMG HIPOTIREOIDISMO",mat:"Salvalus",email:"daynogueira_carvalho@hotmail.com",data_ag:"08/12/2025"},
{nome:"Jessica Lunguinho Batista",dn:"1991-10-18",cart:"1PYF1000003000",tel:"11 951381392",proc:"Cesárea",dum:"14/03/2025",ind:"Desejo",diag_mat:"DMG insulina",mat:"NotreCare",email:"jehlunguinho@gmail.com",data_ag:"28/11/2025"},
{nome:"Ana Beatriz dos Santos",dn:"2002-12-17",cart:"0XYC2002773007",tel:"11978254299",proc:"Indução Programada",dum:"",ind:"Pós datismo",diag_mat:"DMG sífilis",mat:"NotreCare",email:"anabiaejan@gmail.com",data_ag:"20/12/2025"},
{nome:"ROSANA DE ALMEIDA BARBOSA",dn:"1985-10-15",cart:"0RMMX000522007",tel:"11 972128933",proc:"Indução Programada;DIU",dum:"04/03/2025",ind:"feto pig",diag_mat:"bariátrica",mat:"Salvalus",email:"rosanadalmeida10@gmail.com",data_ag:"09/12/2025"},
{nome:"MIRIA LIDIA DOS SANTOS DIAS",dn:"1998-09-24",cart:"1R03X003544028",tel:"11947420113",proc:"Cesárea + Laqueadura",dum:"13/03/2025",ind:"iteratividade DM2",diag_mat:"iteratividade",mat:"NotreCare",email:"santosmiria470@gmail.com",data_ag:"11/12/2025"}
];

const ags=[];
for(const d of dados){
  const procs=classifyProc(d.proc);
  const dataAg=parseDate(d.data_ag);
  let status="pendente";
  if(d.urgente)status="pendente";
  else if(dataAg)status="aprovado";
  
  ags.push({
    carteirinha:d.cart,
    nome_completo:d.nome,
    data_nascimento:d.dn,
    telefones:d.tel||"Não informado",
    email_paciente:d.email||"nao@example.com",
    numero_gestacoes:1,
    numero_partos_cesareas:0,
    numero_partos_normais:0,
    numero_abortos:0,
    procedimentos:procs,
    dum_status:d.dum?"Sim - Confiavel":"Não sabe",
    data_dum:d.dum?parseDate(d.dum):d.dn,
    data_primeiro_usg:d.dn,
    semanas_usg:37,
    dias_usg:0,
    usg_recente:"Não",
    ig_pretendida:"37-40 semanas",
    indicacao_procedimento:d.ind||"Conforme avaliação",
    medicacao:"Conforme prescrição",
    diagnosticos_maternos:d.diag_mat||"Não informado",
    diagnosticos_fetais:"Conforme USG",
    historia_obstetrica:"",
    placenta_previa:"Não",
    necessidade_uti_materna:"Não",
    necessidade_reserva_sangue:"Não",
    maternidade:d.mat||"Não especificada",
    medico_responsavel:"Médico",
    centro_clinico:d.mat||"Não especificado",
    status:status,
    created_by:"0e342e73-8f18-4a3d-830f-0bc2c9d4b306"
  });
}

console.log(`\n ${ags.length} registros processados (Forms)\n`);
console.log(`    Aprovados: ${ags.filter(a=>a.status==="aprovado").length}`);
console.log(`    Pendentes (incluindo urgentes): ${ags.filter(a=>a.status==="pendente").length}\n`);

let ok=0,erros=0;
for(let i=0;i<ags.length;i+=50){
  const b=ags.slice(i,i+50);
  console.log(` Lote ${Math.floor(i/50)+1}/${Math.ceil(ags.length/50)} (${b.length} registros)...`);
  const {error}=await sb.from("agendamentos_obst").insert(b);
  if(!error){ok+=b.length;console.log(`   ${b.length} inseridos`);}
  else{erros+=b.length;console.error(`   ERRO:`,error.message);}
}
console.log(`\n IMPORTAÇÃO CONCLUÍDA: ${ok}/${ags.length} OK | ${erros} erros\n`);

const {count}=await sb.from("agendamentos_obst").select("*",{count:"exact",head:true});
console.log(` TOTAL GERAL NO BANCO: ${count} agendamentos\n`);
