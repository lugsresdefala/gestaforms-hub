const fs = require('fs');
const path = require('path');

function limparTexto(texto) {
  if (!texto) return "";
  texto = texto.trim();
  texto = texto.replace(/^[?¿�]+|[?¿�]+$/g, '');
  texto = texto.replace(/\s+/g, ' ');
  return texto.trim();
}

function padronizarData(dataStr) {
  if (!dataStr || dataStr === '' || dataStr === '#VALOR!' || dataStr === 'ERRO') {
    return "";
  }
  
  const match1 = dataStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match1) {
    let [, dia, mes, ano] = match1;
    if (parseInt(mes) > 12) {
      [dia, mes] = [mes, dia];
    }
    return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`;
  }
  
  return dataStr;
}

function padronizarTelefone(telefone) {
  if (!telefone) return "";
  return telefone.replace(/[^\d/]/g, '');
}

function padronizarProcedimento(proc) {
  if (!proc) return "Não especificado";
  
  const procLower = proc.toLowerCase();
  
  if (procLower.includes('cesár') || procLower.includes('cesar')) {
    if (procLower.includes('laq') || procLower.includes('lt') || procLower.includes('diu')) {
      return "Cesárea + Laqueadura";
    }
    return "Cesárea";
  } else if (procLower.includes('indu')) {
    return "Indução Programada";
  } else if (procLower.includes('laq')) {
    return "Laqueadura tubária";
  } else if (procLower.includes('cerc')) {
    return "Cerclagem";
  }
  
  return limparTexto(proc);
}

function padronizarMaternidade(mat) {
  if (!mat) return "Não especificada";
  
  const matLower = mat.toLowerCase();
  
  if (matLower.includes('notre')) return "NotreCare";
  if (matLower.includes('salva')) return "Salvalus";
  if (matLower.includes('cruz')) return "Cruzeiro do Sul";
  if (matLower.includes('guarulhos')) return "Guarulhos";
  if (matLower.includes('ros') && matLower.includes('rio')) return "Rosário";
  
  return limparTexto(mat);
}

function processarFormsParto(arquivoEntrada) {
  console.log(`📂 Lendo: ${arquivoEntrada}\n`);
  
  const conteudo = fs.readFileSync(arquivoEntrada, 'utf-8');
  const linhas = conteudo.split('\n');
  const registros = [];
  
  for (let idx = 1; idx < linhas.length; idx++) {
    const linha = linhas[idx].trim();
    if (!linha) continue;
    
    const cols = linha.split(';');
    if (cols.length < 40 || !cols[0]) continue;
    
    try {
      const idForm = cols[0].trim();
      const nome = limparTexto(cols[5]);
      const carteirinha = limparTexto(cols[7]);
      
      if (!nome || !carteirinha) {
        console.log(`Linha ${idx + 1}: Nome ou carteirinha ausente - IGNORADO`);
        continue;
      }
      
      const dataNasc = padronizarData(cols[6]);
      const telefones = padronizarTelefone(cols[12]);
      const procedimento = padronizarProcedimento(cols[13]);
      const maternidade = padronizarMaternidade(cols[30]);
      const medico = limparTexto(cols[31]);
      const centroClinico = limparTexto(cols[32]);
      const email = limparTexto(cols[33]);
      const indicacao = limparTexto(cols[22]);
      const diagMaternos = limparTexto(cols[24]);
      const diagFetais = limparTexto(cols[26]);
      
      const dumStatus = limparTexto(cols[14]);
      const dataDum = padronizarData(cols[15]);
      const dataUsg = padronizarData(cols[16]);
      const dataAgendada = padronizarData(cols[37] || "");
      
      const gestacoes = cols[8]?.trim() || "0";
      const cesareas = cols[9]?.trim() || "0";
      const normais = cols[10]?.trim() || "0";
      const abortos = cols[11]?.trim() || "0";
      
      const registro = {
        id: `FORMS-${idForm}`,
        nome_completo: nome,
        carteirinha: carteirinha,
        data_nascimento: dataNasc,
        telefones: telefones,
        email: email,
        gestacoes: gestacoes,
        partos_cesareas: cesareas,
        partos_normais: normais,
        abortos: abortos,
        procedimento: procedimento,
        maternidade: maternidade,
        medico_responsavel: medico,
        centro_clinico: centroClinico,
        indicacao: indicacao || "Não informado",
        diagnosticos_maternos: diagMaternos || "Não informado",
        diagnosticos_fetais: diagFetais || "Não informado",
        dum_status: dumStatus,
        data_dum: dataDum,
        data_primeiro_usg: dataUsg,
        data_agendada: dataAgendada,
        origem: 'Forms de Parto'
      };
      
      registros.push(registro);
      console.log(`Linha ${idx + 1}: ${nome} - OK`);
      
    } catch (e) {
      console.log(`Linha ${idx + 1}: ERRO - ${e.message}`);
      continue;
    }
  }
  
  return registros;
}

function gerarCSVConsolidado(registros, arquivoSaida) {
  const campos = [
    'id', 'nome_completo', 'carteirinha', 'data_nascimento', 'telefones', 'email',
    'gestacoes', 'partos_cesareas', 'partos_normais', 'abortos',
    'procedimento', 'maternidade', 'medico_responsavel', 'centro_clinico',
    'indicacao', 'diagnosticos_maternos', 'diagnosticos_fetais',
    'dum_status', 'data_dum', 'data_primeiro_usg', 'data_agendada', 'origem'
  ];
  
  const linhas = [campos.join(',')];
  
  for (const reg of registros) {
    const valores = campos.map(campo => {
      const valor = reg[campo] || "";
      return `"${String(valor).replace(/"/g, '""')}"`;
    });
    linhas.push(valores.join(','));
  }
  
  fs.writeFileSync(arquivoSaida, linhas.join('\n'), 'utf-8');
  
  console.log(`\n✅ Arquivo consolidado gerado: ${arquivoSaida}`);
  console.log(`   Total de registros: ${registros.length}`);
}

function gerarRelatorio(registros) {
  console.log("\n" + "=".repeat(60));
  console.log("RELATÓRIO DE CONSOLIDAÇÃO");
  console.log("=".repeat(60));
  
  console.log(`\n📊 Total de registros: ${registros.length}`);
  
  const maternidades = {};
  for (const reg of registros) {
    const mat = reg.maternidade;
    maternidades[mat] = (maternidades[mat] || 0) + 1;
  }
  
  console.log("\n🏥 Por Maternidade:");
  Object.entries(maternidades)
    .sort((a, b) => b[1] - a[1])
    .forEach(([mat, qtd]) => {
      console.log(`   ${mat}: ${qtd}`);
    });
  
  const procedimentos = {};
  for (const reg of registros) {
    const proc = reg.procedimento;
    procedimentos[proc] = (procedimentos[proc] || 0) + 1;
  }
  
  console.log("\n💉 Por Procedimento:");
  Object.entries(procedimentos)
    .sort((a, b) => b[1] - a[1])
    .forEach(([proc, qtd]) => {
      console.log(`   ${proc}: ${qtd}`);
    });
  
  const comData = registros.filter(r => r.data_agendada).length;
  console.log(`\n📅 Com data agendada: ${comData} (${(comData/registros.length*100).toFixed(1)}%)`);
  
  const comEmail = registros.filter(r => r.email).length;
  console.log(`📧 Com email: ${comEmail} (${(comEmail/registros.length*100).toFixed(1)}%)`);
  
  console.log("\n" + "=".repeat(60));
}

// Executar
console.log("🔄 Iniciando limpeza e consolidação de CSV...\n");

const arquivoEntrada = "C:\\Users\\t_tiago.oliveira\\Downloads\\Forms de parto - anteriores.CSV";
const arquivoSaida = "C:\\Users\\t_tiago.oliveira\\Downloads\\Forms_CONSOLIDADO.csv";

const registros = processarFormsParto(arquivoEntrada);
gerarCSVConsolidado(registros, arquivoSaida);
gerarRelatorio(registros);

console.log("\n✅ CONCLUÍDO!");
