# 🔍 Diagnósticos Suportados - Sistema de Detecção Inteligente

## 📋 Visão Geral

O sistema agora detecta automaticamente diagnósticos em texto livre e os normaliza para os protocolos obstétricos correspondentes. Isso permite identificar corretamente a **IG ideal** para cada caso.

---

## 🎯 Como Funciona

### **Detecção Inteligente:**
1. **Analisa 3 colunas**: Diagnósticos Maternos, Diagnósticos Fetais, Indicação
2. **Normaliza texto**: Remove acentos, pontuação, converte para minúsculas
3. **Busca sinônimos**: Detecta variações de escrita
4. **Prioriza**: Seleciona o protocolo mais específico/grave
5. **Retorna IG ideal**: Baseado no protocolo detectado

### **Exemplo:**
```
Entrada: "Diabetes gestacional em uso de insulina com bom controle"
Detectado: dmg_insulina_bom_controle
IG Ideal: 38 semanas + 0 dias
```

---

## 📚 Diagnósticos Suportados

### 🚨 **EMERGÊNCIAS (Prioridade Máxima)**

#### **Eclâmpsia**
- **Protocolo**: `eclampsia`
- **IG Ideal**: 34s + 0d
- **Keywords**: eclampsia, eclâmpsia, convulsão, convulsao
- **Exemplo**: "Eclâmpsia com convulsões"

#### **Síndrome HELLP**
- **Protocolo**: `sindrome_hellp`
- **IG Ideal**: 34s + 0d
- **Keywords**: hellp, hemolise, hemólise, plaquetopenia
- **Exemplo**: "Síndrome HELLP com hemólise"

#### **DPP (Descolamento Prematuro de Placenta)**
- **Protocolo**: `dpp`
- **IG Ideal**: 34s + 0d
- **Keywords**: dpp, descolamento + placenta + prematuro (requer todas)
- **Exemplo**: "Descolamento prematuro de placenta"

---

### 🩺 **HIPERTENSÃO (Prioridade Alta)**

#### **Pré-eclâmpsia com Deterioração**
- **Protocolo**: `pre_eclampsia_com_deterioracao`
- **IG Ideal**: 34s + 0d
- **Keywords**: pre-eclampsia grave, pré-eclâmpsia grave, pe grave, deterioracao, deterioração
- **Exemplo**: "Pré-eclâmpsia grave com deterioração"

#### **Pré-eclâmpsia sem Deterioração**
- **Protocolo**: `pre_eclampsia_sem_deterioracao`
- **IG Ideal**: 37s + 0d
- **Keywords**: pre-eclampsia, pré-eclâmpsia, pe, proteinuria, proteinúria
- **Exemplo**: "Pré-eclâmpsia com proteinúria"

#### **HAC de Difícil Controle**
- **Protocolo**: `hac_dificil`
- **IG Ideal**: 37s + 0d
- **Keywords**: hac, hipertensao cronica, hipertensão crônica, dificil controle, difícil controle, 3 drogas, tres drogas
- **Exemplo**: "HAC de difícil controle com 3 drogas"

#### **HAC Compensada**
- **Protocolo**: `hac_compensada`
- **IG Ideal**: 38s + 0d
- **Keywords**: hac, hipertensao cronica, hipertensão crônica, compensada, controlada
- **Exemplo**: "Hipertensão crônica compensada"

#### **Hipertensão Gestacional**
- **Protocolo**: `hipertensao_gestacional`
- **IG Ideal**: 38s + 0d
- **Keywords**: hipertensao gestacional, hipertensão gestacional, dheg, hg
- **Exemplo**: "Hipertensão gestacional"

---

### 🍬 **DIABETES (Prioridade Alta)**

#### **DM Pré-gestacional com Descontrole**
- **Protocolo**: `dm_pregestacional_descontrole`
- **IG Ideal**: 37s + 0d
- **Keywords**: dm1, dm2, diabetes tipo, pregestacional, descontrole, descompensada, vasculopatia, nefropatia, retinopatia
- **Exemplo**: "DM1 pré-gestacional com descontrole"

#### **DM Pré-gestacional com Bom Controle**
- **Protocolo**: `dm_pregestacional_bom_controle`
- **IG Ideal**: 38s + 0d
- **Keywords**: dm1, dm2, diabetes tipo, pregestacional, controlada, compensada
- **Exemplo**: "DM2 pré-gestacional controlada"

#### **DMG com Insulina e Descontrole**
- **Protocolo**: `dmg_insulina_descontrole`
- **IG Ideal**: 38s + 0d
- **Keywords**: dmg, diabetes gestacional, insulina, descontrole, descompensada, macrossomia
- **Exemplo**: "DMG em uso de insulina com descontrole"

#### **DMG com Insulina e Bom Controle**
- **Protocolo**: `dmg_insulina_bom_controle`
- **IG Ideal**: 38s + 0d
- **Keywords**: dmg, diabetes gestacional, insulina, controlada, compensada
- **Exemplo**: "Diabetes gestacional em uso de insulina controlada"

#### **DMG sem Insulina com Descontrole**
- **Protocolo**: `dmg_sem_insulina_descontrole`
- **IG Ideal**: 39s + 0d
- **Keywords**: dmg, diabetes gestacional, dieta, descontrole, descompensada
- **Exemplo**: "DMG em dieta com descontrole"

#### **DMG sem Insulina com Bom Controle**
- **Protocolo**: `dmg_sem_insulina_bom_controle`
- **IG Ideal**: 39s + 0d
- **Keywords**: dmg, diabetes gestacional, dieta, controlada, compensada
- **Exemplo**: "Diabetes gestacional controlada com dieta"

---

### 🩸 **PLACENTA (Prioridade Alta)**

#### **Placenta Acreta**
- **Protocolo**: `placenta_acreta`
- **IG Ideal**: 34s + 0d
- **Keywords**: acreta, acretismo, increta, percreta
- **Exemplo**: "Placenta acreta"

#### **Placenta Prévia Total**
- **Protocolo**: `placenta_previa_total`
- **IG Ideal**: 36s + 0d
- **Keywords**: placenta previa total, placenta prévia total, pp total, centro-total, centro total
- **Exemplo**: "Placenta prévia centro-total"

#### **Placenta Prévia Marginal**
- **Protocolo**: `placenta_previa_marginal`
- **IG Ideal**: 37s + 0d
- **Keywords**: placenta previa, placenta prévia, pp, marginal, baixa
- **Exemplo**: "Placenta prévia marginal"

---

### 💧 **LÍQUIDO AMNIÓTICO**

#### **Oligodrâmnio Severo/Anidrâmnio**
- **Protocolo**: `oligodramnia_severa`
- **IG Ideal**: 34s + 0d
- **Keywords**: anidramnia, anidrâmnio, oligodramnia severa, oligodrâmnio severo
- **Exemplo**: "Anidrâmnio"

#### **Oligoâmnio Isolado**
- **Protocolo**: `oligoamnio_isolado`
- **IG Ideal**: 36s + 0d
- **Keywords**: oligodramnia, oligodrâmnio, oligoamnio, oligoâmnio, la reduzido, líquido reduzido
- **Exemplo**: "Oligodrâmnio isolado"

#### **Líquido Limítrofe**
- **Protocolo**: `liquido_limitrofe`
- **IG Ideal**: 37s + 0d
- **Keywords**: la limitrofe, líquido limítrofe, la borderline
- **Exemplo**: "LA limítrofe"

#### **Polidrâmnio Severo**
- **Protocolo**: `polidramnia_severo`
- **IG Ideal**: 37s + 0d
- **Keywords**: polidramnia severo, polidrâmnio severo, polidramnia grave
- **Exemplo**: "Polidrâmnio severo"

#### **Polidrâmnio Leve/Moderado**
- **Protocolo**: `polidramnia_leve_moderado`
- **IG Ideal**: 38s + 0d
- **Keywords**: polidramnia, polidrâmnio, la aumentado, líquido aumentado
- **Exemplo**: "Polidrâmnio moderado"

---

### 📏 **CRESCIMENTO FETAL**

#### **RCF com Doppler Crítico**
- **Protocolo**: `rcf_doppler_critico`
- **IG Ideal**: 34s + 0d
- **Keywords**: rcf, rciu, restricao, restrição, doppler, diastole zero, diástole zero, reversa (requer todas)
- **Exemplo**: "RCF com doppler crítico e diástole zero"

#### **RCF com Doppler Alterado**
- **Protocolo**: `rcf_doppler_alterado`
- **IG Ideal**: 37s + 0d
- **Keywords**: rcf, rciu, restricao, restrição, doppler alterado, ip au
- **Exemplo**: "RCIU com doppler alterado"

#### **RCF < P3**
- **Protocolo**: `rcf_menor_p3`
- **IG Ideal**: 37s + 0d
- **Keywords**: rcf, rciu, restricao, restrição, p3, percentil 3, <p3
- **Exemplo**: "RCF menor que P3"

#### **RCF P3-P10 com Comorbidade**
- **Protocolo**: `rcf_p3_p10_comorbidade`
- **IG Ideal**: 38s + 0d
- **Keywords**: rcf, rciu, restricao, restrição, pig, p10, comorbidade
- **Exemplo**: "PIG entre P3-P10 com comorbidade"

#### **RCF/PIG sem Comorbidade**
- **Protocolo**: `rcf_pig_sem_comorbidade`
- **IG Ideal**: 39s + 0d
- **Keywords**: rcf, rciu, restricao, restrição, pig, pequeno
- **Exemplo**: "PIG sem comorbidades"

#### **Macrossomia ≥ 4500g**
- **Protocolo**: `macrossomia_4500g`
- **IG Ideal**: 38s + 0d
- **Keywords**: macrossomia, macrossômico, 4500, 4,5kg, >4500
- **Exemplo**: "Macrossomia fetal > 4500g"

#### **Macrossomia ≥ 4000g**
- **Protocolo**: `macrossomia_4000g`
- **IG Ideal**: 39s + 0d
- **Keywords**: macrossomia, macrossômico, 4000, 4kg, gig, grande
- **Exemplo**: "Feto GIG com 4kg"

---

### 👶👶 **GEMELARIDADE**

#### **Gemelar Monocoriônico Monoamniótico**
- **Protocolo**: `gemelar_monocorionico_monoamniotico`
- **IG Ideal**: 32s + 0d
- **Keywords**: gemelar, gemeos, gêmeos, monocorionico, monocoriônico, monoamniotico, monoamniótico (requer todas)
- **Exemplo**: "Gemelar monocoriônico monoamniótico"

#### **Gemelar Monocoriônico Diamniótico**
- **Protocolo**: `gemelar_monocorionico_diamniotico`
- **IG Ideal**: 36s + 0d
- **Keywords**: gemelar, gemeos, gêmeos, monocorionico, monocoriônico, diamniotico, diamniótico (requer todas)
- **Exemplo**: "Gestação gemelar monocoriônica diamniótica"

#### **Gemelar Bicoriônico**
- **Protocolo**: `gemelar_bicorionico`
- **IG Ideal**: 37s + 0d
- **Keywords**: gemelar, gemeos, gêmeos, bicorionico, bicoriônico, dicorionico, dicoriônico
- **Exemplo**: "Gemelar bicoriônica"

---

### 🔄 **APRESENTAÇÃO**

#### **Transversa**
- **Protocolo**: `transversa`
- **IG Ideal**: 37s + 0d
- **Keywords**: transversa, situacao transversa, situação transversa, cormica
- **Exemplo**: "Situação transversa"

#### **Pélvica**
- **Protocolo**: `pelvica`
- **IG Ideal**: 37s + 0d
- **Keywords**: pelvica, pélvica, podalica, podálica, sentado, breech
- **Exemplo**: "Apresentação pélvica"

---

### ✂️ **ITERATIVIDADE**

#### **Cesárea Clássica**
- **Protocolo**: `cesarea_classica`
- **IG Ideal**: 37s + 0d
- **Keywords**: cesarea classica, cesárea clássica, corporal, segmento superior
- **Exemplo**: "Cesárea clássica anterior"

#### **Iteratividade ≥ 3**
- **Protocolo**: `iteratividade_3_ou_mais`
- **IG Ideal**: 37s + 0d
- **Keywords**: 3 cesareas, 3 cesáreas, tres cesareas, três cesáreas, 4 cesareas, quatro cesareas
- **Exemplo**: "3 cesáreas anteriores"

#### **Iteratividade = 2**
- **Protocolo**: `iteratividade_2`
- **IG Ideal**: 39s + 0d
- **Keywords**: 2 cesareas, 2 cesáreas, duas cesareas, duas cesáreas, iteratividade
- **Exemplo**: "Iteratividade (2 cesáreas)"

---

### 🦠 **INFECÇÕES**

#### **HIV com Carga Viral Detectável**
- **Protocolo**: `hiv_cv_detectavel`
- **IG Ideal**: 38s + 0d
- **Keywords**: hiv, aids, carga viral, detectavel, detectável, >1000
- **Exemplo**: "HIV com carga viral detectável"

#### **HIV com Carga Viral Indetectável**
- **Protocolo**: `hiv_cv_indetectavel`
- **IG Ideal**: 39s + 0d
- **Keywords**: hiv, aids, indetectavel, indetectável, controlado
- **Exemplo**: "HIV com carga viral indetectável"

#### **Hepatite B Alta Carga**
- **Protocolo**: `hepatite_b_alta_carga`
- **IG Ideal**: 38s + 0d
- **Keywords**: hepatite b, hbv, alta carga, >200000
- **Exemplo**: "Hepatite B com alta carga viral"

#### **Hepatite B Baixa Carga**
- **Protocolo**: `hepatite_b_baixa_carga`
- **IG Ideal**: 39s + 0d
- **Keywords**: hepatite b, hbv, baixa carga, controlada
- **Exemplo**: "Hepatite B controlada"

#### **Hepatite C**
- **Protocolo**: `hepatite_c`
- **IG Ideal**: 39s + 0d
- **Keywords**: hepatite c, hcv
- **Exemplo**: "Hepatite C"

#### **Sífilis Tratada**
- **Protocolo**: `sifilis_tratada`
- **IG Ideal**: 39s + 0d
- **Keywords**: sifilis, sífilis, tratada, vdrl negativo
- **Exemplo**: "Sífilis tratada adequadamente"

#### **Sífilis Não Tratada**
- **Protocolo**: `sifilis_nao_tratada`
- **IG Ideal**: 38s + 0d
- **Keywords**: sifilis, sífilis, nao tratada, não tratada, vdrl positivo
- **Exemplo**: "Sífilis não tratada"

---

### 🧬 **OUTRAS CONDIÇÕES MATERNAS**

#### **LES com Atividade**
- **Protocolo**: `les_atividade`
- **IG Ideal**: 37s + 0d
- **Keywords**: les, lupus, atividade, ativo
- **Exemplo**: "LES em atividade"

#### **LES sem Atividade**
- **Protocolo**: `les_sem_atividade`
- **IG Ideal**: 38s + 0d
- **Keywords**: les, lupus, remissao, remissão, inativo
- **Exemplo**: "LES em remissão"

#### **Trombofilia**
- **Protocolo**: `trombofilia`
- **IG Ideal**: 37s + 0d
- **Keywords**: trombofilia, trombose, anticoagulacao, anticoagulação, saf, antifosfolipide
- **Exemplo**: "Trombofilia em anticoagulação"

#### **Anemia Falciforme**
- **Protocolo**: `anemia_falciforme`
- **IG Ideal**: 38s + 0d
- **Keywords**: falciforme, anemia falciforme, doenca falciforme, doença falciforme
- **Exemplo**: "Doença falciforme"

#### **IIC (Incompetência Istmo-Cervical)**
- **Protocolo**: `iic`
- **IG Ideal**: 37s + 0d
- **Keywords**: iic, incompetencia, incompetência, istmo, cervical, cerclagem
- **Exemplo**: "IIC com cerclagem"

#### **Natimorto Anterior**
- **Protocolo**: `natimorto_anterior`
- **IG Ideal**: 38s + 0d
- **Keywords**: natimorto, obito fetal, óbito fetal, morte fetal, anterior, previo, prévio
- **Exemplo**: "Natimorto anterior"

#### **Obesidade IMC ≥ 35**
- **Protocolo**: `obesidade_imc35`
- **IG Ideal**: 39s + 0d
- **Keywords**: obesidade, imc, obesa, morbida, mórbida, 35
- **Exemplo**: "Obesidade mórbida IMC 38"

#### **RPMO (Rotura Prematura de Membranas)**
- **Protocolo**: `rpmo`
- **IG Ideal**: 34s + 0d
- **Keywords**: rpmo, rotura, ruptura, membranas, bolsa rota
- **Exemplo**: "RPMO"

---

### 🧬 **MALFORMAÇÕES FETAIS**

#### **Malformação Grave**
- **Protocolo**: `malformacao_grave`
- **IG Ideal**: 37s + 0d
- **Keywords**: malformacao grave, malformação grave, anomalia grave, incompativel, incompatível
- **Exemplo**: "Malformação fetal grave"

#### **Malformação Corrigível**
- **Protocolo**: `malformacao_corrigivel`
- **IG Ideal**: 38s + 0d
- **Keywords**: malformacao, malformação, anomalia, corrigivel, corrigível
- **Exemplo**: "Malformação corrigível"

---

### 💚 **DESEJO MATERNO (Padrão)**

#### **Desejo Materno**
- **Protocolo**: `desejo_materno`
- **IG Ideal**: 39s + 0d
- **Keywords**: desejo materno, eletiva, eletivo, opcao, opção
- **Exemplo**: "Cesárea eletiva a pedido"

#### **Laqueadura**
- **Protocolo**: `laqueadura`
- **IG Ideal**: 39s + 0d
- **Keywords**: laqueadura, ligadura, esterilizacao, esterilização
- **Exemplo**: "Cesárea com laqueadura"

---

## 🎯 Sistema de Priorização

Quando múltiplos diagnósticos são detectados, o sistema seleciona o mais prioritário:

1. **Emergências** (Prioridade 100): Eclâmpsia, HELLP, DPP
2. **Condições Graves** (Prioridade 85-95): Placenta acreta, RCF crítico, Gemelar mono-mono
3. **Condições Moderadas** (Prioridade 75-85): Hipertensão, Diabetes, Placenta prévia
4. **Condições Leves** (Prioridade 65-75): DMG controlada, Obesidade
5. **Desejo Materno** (Prioridade 50-55): Padrão quando nenhum diagnóstico detectado

---

## 📊 Exemplos de Uso

### **Exemplo 1: Diabetes Gestacional**
```
Entrada:
- Diagnósticos Maternos: "Diabetes gestacional em uso de insulina"
- Diagnósticos Fetais: ""
- Indicação: "Bom controle glicêmico"

Resultado:
- Protocolo Detectado: dmg_insulina_bom_controle
- IG Ideal: 38 semanas + 0 dias
- Confiança: Alta
```

### **Exemplo 2: Múltiplos Diagnósticos**
```
Entrada:
- Diagnósticos Maternos: "Hipertensão crônica, Diabetes tipo 2"
- Diagnósticos Fetais: "Macrossomia fetal"
- Indicação: "Controle difícil da PA"

Resultado:
- Todos Detectados: [hac_dificil, dm_pregestacional_bom_controle, macrossomia_4000g]
- Protocolo Primário: hac_dificil (maior prioridade)
- IG Ideal: 37 semanas + 0 dias
- Confiança: Alta
```

### **Exemplo 3: Sem Diagnósticos**
```
Entrada:
- Diagnósticos Maternos: ""
- Diagnósticos Fetais: ""
- Indicação: "Cesárea eletiva"

Resultado:
- Protocolo Detectado: desejo_materno
- IG Ideal: 39 semanas + 0 dias
- Confiança: Baixa
```

---

## 🔧 Modo Debug

Para desenvolvedores, há uma função de debug que mostra quais keywords foram encontradas:

```typescript
import { debugDiagnosticDetection } from '@/lib/diagnosticNormalizer';

const debug = debugDiagnosticDetection(
  "Diabetes gestacional em uso de insulina",
  "",
  "Bom controle"
);

console.log(debug);
// Output:
// [
//   {
//     protocolId: 'dmg_insulina_bom_controle',
//     matchedKeywords: ['dmg', 'diabetes gestacional', 'insulina', 'controlada'],
//     priority: 80
//   }
// ]
```

---

## ✅ Benefícios do Sistema

1. **Flexibilidade**: Aceita variações de escrita e sinônimos
2. **Precisão**: Prioriza diagnósticos mais graves/específicos
3. **Automação**: Não requer seleção manual de protocolo
4. **Rastreabilidade**: Mostra quais diagnósticos foram detectados
5. **Extensível**: Fácil adicionar novos padrões

---

## 📝 Como Adicionar Novos Diagnósticos

Para adicionar um novo diagnóstico, edite `/src/lib/diagnosticNormalizer.ts`:

```typescript
{
  protocolId: 'novo_diagnostico',
  keywords: ['palavra1', 'palavra2', 'sinonimo'],
  priority: 85, // Ajuste conforme gravidade
  requiresAll: false // true se requer todas as keywords
}
```

---

**Última atualização:** 30/11/2024
**Versão:** 1.0
