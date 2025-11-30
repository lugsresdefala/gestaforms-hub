# 🧪 Dados de Teste - Detecção de Diagnósticos

## 📋 Casos de Teste para Validar Detecção Inteligente

Estes dados testam o novo sistema de detecção automática de diagnósticos.

---

## 📊 Formato TSV para Importar por Tabela

Cole os dados abaixo na página `/importar-tabela` usando Ctrl+V:

```tsv
Maria Silva Santos	15/03/1990	123456789	2	1	0	0	(11) 98765-4321	Cesárea	Sim - Confiavel	01/04/2024	15/05/2024	6	2	USG morfológico 20 semanas normal	39	Cesárea anterior	Nenhum	Diabetes gestacional em uso de insulina com bom controle	Não	Nenhum	Nenhum	Não	Não	Guarulhos	Dr. João Santos	maria.silva@email.com	Centro Clínico Hapvida	25/11/2024
Ana Paula Costa	20/08/1985	987654321	3	2	0	1	(11) 91234-5678	Cesárea	Incerta	10/03/2024	25/04/2024	7	0	USG 3D 28 semanas	38	Iteratividade	Nenhum	Hipertensão arterial crônica de difícil controle	Não	Nenhum	Nenhum	Sim	Não	Salvalus	Dra. Maria Oliveira	ana.costa@email.com	Centro Clínico Hapvida	26/11/2024
Juliana Mendes	10/12/1992	456789123	1	0	0	0	(11) 99876-5432	Cesárea	Sim - Confiavel	15/05/2024	30/06/2024	6	4	USG 12 semanas normal	39	Desejo materno	Nenhum	Nenhum	Não	Nenhum	Nenhum	Não	Não	NotreCare	Dr. Carlos Lima	juliana.mendes@email.com	Centro Clínico Hapvida	27/11/2024
Fernanda Rocha	05/07/1988	789123456	4	3	0	1	(11) 97654-3210	Cesárea	Não sabe	01/01/2024	20/04/2024	8	3	USG 24 semanas com doppler	37	Iteratividade	Nenhum	Placenta prévia total	Sim	Nenhum	Nenhum	Sim	Sim	Cruzeiro	Dr. Roberto Silva	fernanda.rocha@email.com	Centro Clínico Hapvida	28/11/2024
Patricia Santos	12/02/1993	321654987	2	1	0	0	(11) 98888-7777	Cesárea	Sim - Confiavel	20/03/2024	05/05/2024	6	5	USG morfológico normal	38	Pré-eclâmpsia	Nenhum	Pré-eclâmpsia grave com proteinúria	Não	Nenhum	Nenhum	Não	Não	Guarulhos	Dr. João Santos	patricia.santos@email.com	Centro Clínico Hapvida	29/11/2024
Carla Oliveira	18/09/1987	654987321	3	2	0	1	(11) 97777-6666	Cesárea	Incerta	15/02/2024	30/03/2024	7	1	USG com doppler alterado	37	RCF	Nenhum	Nenhum	Não	Restrição de crescimento fetal com doppler alterado	Nenhum	Não	Não	Salvalus	Dra. Maria Oliveira	carla.oliveira@email.com	Centro Clínico Hapvida	30/11/2024
Beatriz Lima	25/11/1991	147258369	1	0	0	0	(11) 96666-5555	Cesárea	Sim - Confiavel	10/04/2024	25/05/2024	6	3	USG gemelar	37	Gemelar	Nenhum	Nenhum	Não	Gestação gemelar bicoriônica diamniótica	Nenhum	Não	Não	NotreCare	Dr. Carlos Lima	beatriz.lima@email.com	Centro Clínico Hapvida	01/12/2024
Amanda Costa	30/06/1989	258369147	2	1	0	0	(11) 95555-4444	Cesárea	Sim - Confiavel	05/03/2024	20/04/2024	6	4	USG com macrossomia	39	Macrossomia	Nenhum	DMG em dieta com bom controle	Não	Macrossomia fetal estimada em 4200g	Nenhum	Não	Não	Cruzeiro	Dr. Roberto Silva	amanda.costa@email.com	Centro Clínico Hapvida	02/12/2024
Renata Alves	14/04/1986	369147258	3	2	0	1	(11) 94444-3333	Cesárea	Não sabe	01/02/2024	15/03/2024	7	2	USG com oligodrâmnio	36	Oligodrâmnio	Nenhum	Nenhum	Não	Oligodrâmnio isolado	Nenhum	Não	Não	Guarulhos	Dr. João Santos	renata.alves@email.com	Centro Clínico Hapvida	03/12/2024
Luciana Martins	22/08/1990	741852963	1	0	0	0	(11) 93333-2222	Cesárea	Sim - Confiavel	25/04/2024	10/06/2024	6	5	USG normal	37	Apresentação pélvica	Nenhum	Nenhum	Não	Apresentação pélvica persistente	Nenhum	Não	Não	Salvalus	Dra. Maria Oliveira	luciana.martins@email.com	Centro Clínico Hapvida	04/12/2024
```

---

## 🎯 Casos de Teste Detalhados

### **Caso 1: DMG com Insulina (Bom Controle)**
- **Paciente**: Maria Silva Santos
- **Diagnóstico Materno**: "Diabetes gestacional em uso de insulina com bom controle"
- **Protocolo Esperado**: `dmg_insulina_bom_controle`
- **IG Ideal Esperada**: 38 semanas + 0 dias
- **Keywords Detectadas**: dmg, diabetes gestacional, insulina, controlada, bom controle

### **Caso 2: HAC de Difícil Controle**
- **Paciente**: Ana Paula Costa
- **Diagnóstico Materno**: "Hipertensão arterial crônica de difícil controle"
- **Protocolo Esperado**: `hac_dificil`
- **IG Ideal Esperada**: 37 semanas + 0 dias
- **Keywords Detectadas**: hac, hipertensao cronica, dificil controle

### **Caso 3: Desejo Materno (Sem Diagnósticos)**
- **Paciente**: Juliana Mendes
- **Diagnóstico Materno**: "Nenhum"
- **Diagnóstico Fetal**: "Nenhum"
- **Indicação**: "Desejo materno"
- **Protocolo Esperado**: `desejo_materno`
- **IG Ideal Esperada**: 39 semanas + 0 dias

### **Caso 4: Placenta Prévia Total**
- **Paciente**: Fernanda Rocha
- **Diagnóstico Materno**: "Placenta prévia total"
- **Placenta Prévia**: "Sim"
- **Protocolo Esperado**: `placenta_previa_total`
- **IG Ideal Esperada**: 36 semanas + 0 dias
- **Keywords Detectadas**: placenta previa total

### **Caso 5: Pré-eclâmpsia Grave**
- **Paciente**: Patricia Santos
- **Diagnóstico Materno**: "Pré-eclâmpsia grave com proteinúria"
- **Indicação**: "Pré-eclâmpsia"
- **Protocolo Esperado**: `pre_eclampsia_com_deterioracao`
- **IG Ideal Esperada**: 34 semanas + 0 dias
- **Keywords Detectadas**: pre-eclampsia grave, proteinuria

### **Caso 6: RCF com Doppler Alterado**
- **Paciente**: Carla Oliveira
- **Diagnóstico Fetal**: "Restrição de crescimento fetal com doppler alterado"
- **Indicação**: "RCF"
- **Protocolo Esperado**: `rcf_doppler_alterado`
- **IG Ideal Esperada**: 37 semanas + 0 dias
- **Keywords Detectadas**: rcf, restricao, doppler alterado

### **Caso 7: Gemelar Bicoriônico**
- **Paciente**: Beatriz Lima
- **Diagnóstico Fetal**: "Gestação gemelar bicoriônica diamniótica"
- **Indicação**: "Gemelar"
- **Protocolo Esperado**: `gemelar_bicorionico`
- **IG Ideal Esperada**: 37 semanas + 0 dias
- **Keywords Detectadas**: gemelar, bicorionico

### **Caso 8: Macrossomia + DMG**
- **Paciente**: Amanda Costa
- **Diagnóstico Materno**: "DMG em dieta com bom controle"
- **Diagnóstico Fetal**: "Macrossomia fetal estimada em 4200g"
- **Indicação**: "Macrossomia"
- **Protocolos Detectados**: `dmg_sem_insulina_bom_controle`, `macrossomia_4000g`
- **Protocolo Primário**: `dmg_sem_insulina_bom_controle` (maior prioridade)
- **IG Ideal Esperada**: 39 semanas + 0 dias

### **Caso 9: Oligodrâmnio Isolado**
- **Paciente**: Renata Alves
- **Diagnóstico Fetal**: "Oligodrâmnio isolado"
- **Indicação**: "Oligodrâmnio"
- **Protocolo Esperado**: `oligoamnio_isolado`
- **IG Ideal Esperada**: 36 semanas + 0 dias
- **Keywords Detectadas**: oligodramnia, isolado

### **Caso 10: Apresentação Pélvica**
- **Paciente**: Luciana Martins
- **Diagnóstico Fetal**: "Apresentação pélvica persistente"
- **Indicação**: "Apresentação pélvica"
- **Protocolo Esperado**: `pelvica`
- **IG Ideal Esperada**: 37 semanas + 0 dias
- **Keywords Detectadas**: pelvica, persistente

---

## ✅ Checklist de Validação

Após importar e processar os dados, verificar:

### **Detecção de Diagnósticos:**
- [ ] Caso 1: DMG com insulina detectado corretamente
- [ ] Caso 2: HAC difícil controle detectado
- [ ] Caso 3: Desejo materno (padrão) quando sem diagnósticos
- [ ] Caso 4: Placenta prévia total detectada
- [ ] Caso 5: Pré-eclâmpsia grave detectada
- [ ] Caso 6: RCF com doppler detectado
- [ ] Caso 7: Gemelar bicoriônico detectado
- [ ] Caso 8: Múltiplos diagnósticos, primário correto
- [ ] Caso 9: Oligodrâmnio detectado
- [ ] Caso 10: Apresentação pélvica detectada

### **IG Ideal:**
- [ ] Caso 1: 38s + 0d
- [ ] Caso 2: 37s + 0d
- [ ] Caso 3: 39s + 0d
- [ ] Caso 4: 36s + 0d
- [ ] Caso 5: 34s + 0d
- [ ] Caso 6: 37s + 0d
- [ ] Caso 7: 37s + 0d
- [ ] Caso 8: 39s + 0d
- [ ] Caso 9: 36s + 0d
- [ ] Caso 10: 37s + 0d

### **Coluna "Protocolo Detectado":**
- [ ] Mostra nome do protocolo
- [ ] Badge colorido (outline para desejo_materno, default para outros)
- [ ] Tooltip com informações adicionais
- [ ] Texto truncado se muito longo

### **Console do Navegador:**
- [ ] Logs mostram diagnósticos detectados
- [ ] Mostra confiança (high/medium/low)
- [ ] Lista todos os protocolos detectados

---

## 🔍 Como Verificar no Console

Abra o Console do Navegador (F12) e procure por logs como:

```javascript
Paciente Maria Silva Santos: {
  detectados: ['dmg_insulina_bom_controle'],
  primario: 'dmg_insulina_bom_controle',
  confianca: 'medium'
}

Paciente Amanda Costa: {
  detectados: ['dmg_sem_insulina_bom_controle', 'macrossomia_4000g'],
  primario: 'dmg_sem_insulina_bom_controle',
  confianca: 'high'
}
```

---

## 📊 Resultados Esperados

### **Distribuição de Protocolos:**
- Desejo Materno: 1 caso (10%)
- DMG: 2 casos (20%)
- Hipertensão: 2 casos (20%)
- Placenta: 1 caso (10%)
- RCF: 1 caso (10%)
- Gemelar: 1 caso (10%)
- Líquido Amniótico: 1 caso (10%)
- Apresentação: 1 caso (10%)

### **Distribuição de IG Ideal:**
- 34 semanas: 1 caso (Pré-eclâmpsia grave)
- 36 semanas: 2 casos (Placenta prévia, Oligodrâmnio)
- 37 semanas: 4 casos (HAC, RCF, Gemelar, Pélvica)
- 38 semanas: 1 caso (DMG insulina)
- 39 semanas: 2 casos (Desejo materno, DMG dieta)

---

## 🎯 Casos Adicionais para Testar

### **Caso Extra 1: Eclâmpsia (Emergência)**
```
Nome: Teste Eclampsia
Diagnóstico Materno: Eclâmpsia com convulsões
Protocolo Esperado: eclampsia
IG Ideal: 34s + 0d
```

### **Caso Extra 2: Síndrome HELLP**
```
Nome: Teste HELLP
Diagnóstico Materno: Síndrome HELLP com hemólise
Protocolo Esperado: sindrome_hellp
IG Ideal: 34s + 0d
```

### **Caso Extra 3: Gemelar Mono-Mono (Mais Grave)**
```
Nome: Teste Gemelar Mono
Diagnóstico Fetal: Gestação gemelar monocoriônica monoamniótica
Protocolo Esperado: gemelar_monocorionico_monoamniotico
IG Ideal: 32s + 0d
```

---

## 📝 Notas Importantes

1. **Variações de Escrita**: O sistema detecta variações como:
   - "Diabetes gestacional" = "DMG" = "diabetes gestacional"
   - "Pré-eclâmpsia" = "Pre-eclampsia" = "PE"
   - "Restrição" = "Restricao" = "RCF" = "RCIU"

2. **Múltiplos Diagnósticos**: Quando há múltiplos, o sistema:
   - Detecta todos
   - Prioriza o mais grave/específico
   - Mostra no console todos os detectados

3. **Confiança**:
   - **High**: 2+ diagnósticos detectados
   - **Medium**: 1 diagnóstico detectado
   - **Low**: Nenhum diagnóstico (usa desejo_materno)

4. **Debug**: Para ver detalhes, abra o Console (F12) após processar

---

**Última atualização:** 30/11/2024
**Versão:** 1.0
