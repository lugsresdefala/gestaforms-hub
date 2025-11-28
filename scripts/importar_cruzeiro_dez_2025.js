import {createClient} from "@supabase/supabase-js";
const URL="https://dssdffhbdpwgusfeqiqk.supabase.co";
const KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzc2RmZmhiZHB3Z3VzZmVxaXFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzMzMDI1MiwiZXhwIjoyMDc4OTA2MjUyfQ.jQjYiKGaPMt3aHCCTlbG0emYhswceF3ZziX1zRostmA";
const sb=createClient(URL,KEY);

// Capacity validation helper functions
let capacidadesCache = null;

async function getCapacidades() {
  if (!capacidadesCache) {
    const { data } = await sb.from('capacidade_maternidades')
      .select('maternidade, vagas_dia_util, vagas_sabado, vagas_domingo');
    capacidadesCache = {};
    for (const cap of data || []) {
      capacidadesCache[cap.maternidade.toLowerCase().trim()] = cap;
    }
  }
  return capacidadesCache;
}

function getCapacidadeDia(cap, date) {
  const dow = date.getDay(); // 0 = Sunday, 6 = Saturday
  if (dow === 0) return cap.vagas_domingo || 0;
  if (dow === 6) return cap.vagas_sabado || 1;
  return cap.vagas_dia_util || 3;
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

async function verificarDisponibilidade(maternidade, dataAgendamento) {
  const capacidades = await getCapacidades();
  const cap = capacidades[maternidade.toLowerCase().trim()];
  
  if (!cap) {
    return { disponivel: true, dataAlternativa: null, mensagem: 'Capacidade não configurada' };
  }
  
  const capacidadeDia = getCapacidadeDia(cap, dataAgendamento);
  const dataStr = formatDate(dataAgendamento);
  
  // Count existing appointments
  const { data: agendamentos } = await sb.from('agendamentos_obst')
    .select('id')
    .ilike('maternidade', maternidade)
    .eq('data_agendamento_calculada', dataStr)
    .neq('status', 'rejeitado');
  
  const vagasUsadas = agendamentos?.length || 0;
  
  if (vagasUsadas < capacidadeDia) {
    return { disponivel: true, dataAlternativa: null, mensagem: `${capacidadeDia - vagasUsadas} vagas disponíveis` };
  }
  
  // Find alternative date (+1 to +7 days)
  for (let i = 1; i <= 7; i++) {
    const candidata = addDays(dataAgendamento, i);
    if (candidata.getDay() === 0) continue; // Skip Sundays
    
    const capDia = getCapacidadeDia(cap, candidata);
    const dataAlt = formatDate(candidata);
    
    const { data: agAlt } = await sb.from('agendamentos_obst')
      .select('id')
      .ilike('maternidade', maternidade)
      .eq('data_agendamento_calculada', dataAlt)
      .neq('status', 'rejeitado');
    
    if ((agAlt?.length || 0) < capDia) {
      return { 
        disponivel: true, 
        dataAlternativa: candidata, 
        mensagem: `Data ajustada de ${dataStr} para ${dataAlt} (+${i} dias)` 
      };
    }
  }
  
  return { disponivel: false, dataAlternativa: null, mensagem: 'Sem vagas na data ideal nem nos próximos 7 dias' };
}

const dados=[
  {data:"01/12/2025",cart:"1T5HU000083003",nome:"Carina da Silva Real",dn:"1979-07-16",diag:"DM em uso de insulina, HAC sem pre-eclampsia",proc:"Cesárea + Laqueadura"},
  {data:"01/12/2025",cart:"1PRSA000144002",nome:"Jaqueline Oliveira da Silva",dn:"1994-10-19",diag:"Gemelar dicorionica posições fetais desfavoráveis",proc:"Cesárea + Laqueadura"},
  {data:"01/12/2025",cart:"0M0UM027626008",nome:"Emilly Mayara Alexandre Vilaca",dn:"2006-03-19",diag:"Desejo materno de pc, hipertensão gestacional",proc:"Cesárea"},
  {data:"02/12/2025",cart:"3010T173820006",nome:"Juliana Cruz Silva Araujo",dn:"1996-11-29",diag:"Cesarea anterior + obesidade",proc:"Cesárea + Laqueadura"},
  {data:"03/12/2025",cart:"0MQSP000162019",nome:"Emily Cristiny Oliveira do Nascimento",dn:"2001-09-04",diag:"HAS desde os 12 anos; DMG controlada com dieta",proc:"Cesárea"},
  {data:"06/12/2025",cart:"0TTSB000001015",nome:"Viviane Santos Augusto",dn:"1999-02-13",diag:"DMG controlada com dieta, Iteratividade",proc:"Cesárea"},
  {data:"09/12/2025",cart:"0V2PZ000001023",nome:"Daiane Aline da Silva Dias",dn:"1986-03-11",diag:"Iteratividade + desejo de laqueadura, Istmocele",proc:"Cesárea + Laqueadura"}
];

const ags=[];
for(const d of dados){
  const [dia,mes,ano]=d.data.split("/");
  const dataFormatada=`${ano}-${mes}-${dia}`;
  const dataAgendamento = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
  
  const txt=(d.proc||"").toLowerCase();
  const procs=[];
  if(txt.includes("cesár")||txt.includes("cesar"))procs.push("Parto cesárea");
  if(txt.includes("laqueadura"))procs.push("Laqueadura tubária");
  if(txt.includes("induç")||txt.includes("induc"))procs.push("Indução de parto");
  if(!procs.length)procs.push("Parto cesárea");
  
  // Validate capacity and get alternative date if needed
  const disponibilidade = await verificarDisponibilidade("Cruzeiro", dataAgendamento);
  let dataFinal = dataFormatada;
  let observacoes = '';
  let status = 'aprovado';
  
  if (!disponibilidade.disponivel) {
    if (disponibilidade.dataAlternativa) {
      dataFinal = formatDate(disponibilidade.dataAlternativa);
      observacoes = `⚠️ [IMPORTAÇÃO] ${disponibilidade.mensagem}`;
      console.log(`  ⚠️ ${d.nome}: ${disponibilidade.mensagem}`);
    } else {
      status = 'pendente';
      observacoes = `⚠️ SEM VAGAS DISPONÍVEIS: ${disponibilidade.mensagem}`;
      console.log(`  ❌ ${d.nome}: ${disponibilidade.mensagem}`);
    }
  }
  
  ags.push({
    carteirinha:d.cart,
    nome_completo:d.nome,
    data_nascimento:d.dn,
    telefones:"Não informado",
    email_paciente:"nao@example.com",
    numero_gestacoes:1,
    numero_partos_cesareas:0,
    numero_partos_normais:0,
    numero_abortos:0,
    procedimentos:procs,
    dum_status:"Não sabe",
    data_dum:d.dn,
    data_primeiro_usg:d.dn,
    semanas_usg:37,
    dias_usg:0,
    usg_recente:"Não",
    ig_pretendida:"37-40 semanas",
    indicacao_procedimento:d.diag,
    medicacao:"Conforme prescrição",
    diagnosticos_maternos:d.diag,
    diagnosticos_fetais:"Conforme USG",
    historia_obstetrica:"",
    placenta_previa:"Não",
    necessidade_uti_materna:"Não",
    necessidade_reserva_sangue:"Não",
    maternidade:"Cruzeiro",
    medico_responsavel:"Médico",
    centro_clinico:"Cruzeiro",
    data_agendamento_calculada: dataFinal,
    observacoes_agendamento: observacoes || null,
    status: status,
    created_by:"0e342e73-8f18-4a3d-830f-0bc2c9d4b306"
  });
}

console.log(`\n ${ags.length} registros processados (Cruzeiro Dez 2025)\n`);
let ok=0,erros=0;
for(let i=0;i<ags.length;i+=50){
  const b=ags.slice(i,i+50);
  console.log(` Lote ${Math.floor(i/50)+1}/${Math.ceil(ags.length/50)} (${b.length} registros)...`);
  const {error}=await sb.from("agendamentos_obst").insert(b);
  if(!error){ok+=b.length;console.log(`   ${b.length} inseridos`);}
  else{erros+=b.length;console.error(`   ERRO:`,error.message);}
}
console.log(`\n IMPORTAÇÃO CRUZEIRO DEZ CONCLUÍDA: ${ok}/${ags.length} OK | ${erros} erros\n`);

const {count}=await sb.from("agendamentos_obst").select("*",{count:"exact",head:true});
console.log(` TOTAL GERAL NO BANCO: ${count} agendamentos\n`);
