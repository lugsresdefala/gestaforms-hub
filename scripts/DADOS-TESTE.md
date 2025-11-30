# 🧪 Dados de Teste para Agendamentos

## 📋 Dados para Teste Via Formulário

### **Paciente 1: Maria Silva**
```
Nome Completo: Maria Silva Santos
Data Nascimento: 15/03/1990
Carteirinha: 123456789
Telefones: (11) 98765-4321
Email: maria.silva@email.com

Dados Obstétricos:
- Gestações: 2
- Partos Cesárea: 1
- Partos Normal: 0
- Abortos: 0

DUM:
- Status: Sim - Confiável
- Data DUM: 01/04/2024

USG:
- Data 1º USG: 15/05/2024
- Semanas USG: 6
- Dias USG: 2
- USG Recente: USG morfológico 20 semanas normal

Procedimento:
- Procedimentos: Cesárea
- IG Pretendida: 39
- Indicação: Cesárea anterior

Diagnósticos:
- Maternos: Diabetes gestacional
- Fetais: Nenhum
- Placenta Prévia: Não

Necessidades:
- UTI Materna: Não
- Reserva Sangue: Não

Local:
- Maternidade: Guarulhos
- Médico Responsável: Dr. João Santos
- Centro Clínico: Centro Clínico Hapvida
```

### **Paciente 2: Ana Costa**
```
Nome Completo: Ana Paula Costa
Data Nascimento: 20/08/1985
Carteirinha: 987654321
Telefones: (11) 91234-5678
Email: ana.costa@email.com

Dados Obstétricos:
- Gestações: 3
- Partos Cesárea: 2
- Partos Normal: 0
- Abortos: 1

DUM:
- Status: Incerta
- Data DUM: 10/03/2024

USG:
- Data 1º USG: 25/04/2024
- Semanas USG: 7
- Dias USG: 0
- USG Recente: USG 3D 28 semanas

Procedimento:
- Procedimentos: Cesárea
- IG Pretendida: 38
- Indicação: Iteratividade

Diagnósticos:
- Maternos: Hipertensão arterial
- Fetais: Nenhum
- Placenta Prévia: Não

Necessidades:
- UTI Materna: Sim
- Reserva Sangue: Não

Local:
- Maternidade: Salvalus
- Médico Responsável: Dra. Maria Oliveira
- Centro Clínico: Centro Clínico Hapvida
```

---

## 📊 Dados para Teste Via Importação (Tabela)

### **Formato para Colar (TSV - Tab Separated Values)**

Cole os dados abaixo na tabela usando Ctrl+V:

```
Maria Silva Santos	15/03/1990	123456789	2	1	0	0	(11) 98765-4321	Cesárea	Sim - Confiavel	01/04/2024	15/05/2024	6	2	USG morfológico 20 semanas normal	39	Cesárea anterior	Nenhum	Diabetes gestacional	Não	Nenhum	Nenhum	Não	Não	Guarulhos	Dr. João Santos	maria.silva@email.com	Centro Clínico Hapvida	25/11/2024
Ana Paula Costa	20/08/1985	987654321	3	2	0	1	(11) 91234-5678	Cesárea	Incerta	10/03/2024	25/04/2024	7	0	USG 3D 28 semanas	38	Iteratividade	Nenhum	Hipertensão arterial	Não	Nenhum	Nenhum	Sim	Não	Salvalus	Dra. Maria Oliveira	ana.costa@email.com	Centro Clínico Hapvida	26/11/2024
Juliana Mendes	10/12/1992	456789123	1	0	0	0	(11) 99876-5432	Cesárea	Sim - Confiavel	15/05/2024	30/06/2024	6	4	USG 12 semanas normal	39	Desejo materno	Nenhum	Nenhum	Não	Nenhum	Nenhum	Não	Não	NotreCare	Dr. Carlos Lima	juliana.mendes@email.com	Centro Clínico Hapvida	27/11/2024
```

### **Ordem das Colunas:**
1. Nome Completo
2. Data Nascimento
3. Carteirinha
4. Gestações
5. Partos Cesárea
6. Partos Normal
7. Abortos
8. Telefones
9. Procedimentos
10. Status DUM
11. Data DUM
12. Data 1º USG
13. Semanas USG
14. Dias USG
15. USG Recente
16. IG Pretendida
17. Indicação
18. Medicação
19. Diag Maternos
20. Placenta Prévia
21. Diag Fetais
22. História Obstétrica
23. Necessidade UTI
24. Necessidade Sangue
25. Maternidade
26. Médico Responsável
27. Email Paciente
28. Centro Clínico
29. **Data Pedido** ← NOVA COLUNA!

---

## 📝 Dados Adicionais para Teste

### **Paciente 3: Juliana Mendes**
```
Nome Completo: Juliana Mendes Alves
Data Nascimento: 10/12/1992
Carteirinha: 456789123
Telefones: (11) 99876-5432
Email: juliana.mendes@email.com

Dados Obstétricos:
- Gestações: 1
- Partos Cesárea: 0
- Partos Normal: 0
- Abortos: 0

DUM:
- Status: Sim - Confiável
- Data DUM: 15/05/2024

USG:
- Data 1º USG: 30/06/2024
- Semanas USG: 6
- Dias USG: 4
- USG Recente: USG 12 semanas normal

Procedimento:
- Procedimentos: Cesárea
- IG Pretendida: 39
- Indicação: Desejo materno

Diagnósticos:
- Maternos: Nenhum
- Fetais: Nenhum
- Placenta Prévia: Não

Necessidades:
- UTI Materna: Não
- Reserva Sangue: Não

Local:
- Maternidade: NotreCare
- Médico Responsável: Dr. Carlos Lima
- Centro Clínico: Centro Clínico Hapvida

Data do Pedido: 27/11/2024
```

### **Paciente 4: Fernanda Rocha**
```
Nome Completo: Fernanda Rocha Lima
Data Nascimento: 05/07/1988
Carteirinha: 789123456
Telefones: (11) 97654-3210
Email: fernanda.rocha@email.com

Dados Obstétricos:
- Gestações: 4
- Partos Cesárea: 3
- Partos Normal: 0
- Abortos: 1

DUM:
- Status: Não sabe
- Data DUM: (vazio)

USG:
- Data 1º USG: 20/04/2024
- Semanas USG: 8
- Dias USG: 3
- USG Recente: USG 24 semanas com doppler

Procedimento:
- Procedimentos: Cesárea
- IG Pretendida: 37
- Indicação: Iteratividade + Placenta prévia

Diagnósticos:
- Maternos: Placenta prévia total
- Fetais: Nenhum
- Placenta Prévia: Sim

Necessidades:
- UTI Materna: Sim
- Reserva Sangue: Sim

Local:
- Maternidade: Cruzeiro
- Médico Responsável: Dr. Roberto Silva
- Centro Clínico: Centro Clínico Hapvida

Data do Pedido: 28/11/2024
```

---

## 🎯 Cenários de Teste

### **Cenário 1: Agendamento Normal**
- Paciente: Maria Silva
- DUM confiável
- Sem complicações
- IG pretendida: 39 semanas
- Resultado esperado: Data calculada automaticamente

### **Cenário 2: DUM Incerta**
- Paciente: Ana Costa
- DUM incerta (usa USG)
- Com complicação (hipertensão)
- Necessita UTI
- Resultado esperado: Cálculo baseado em USG

### **Cenário 3: Primeira Gestação**
- Paciente: Juliana Mendes
- Primigesta
- Sem complicações
- Desejo materno
- Com data do pedido
- Resultado esperado: IG calculada na data do pedido

### **Cenário 4: Alto Risco**
- Paciente: Fernanda Rocha
- Placenta prévia
- Necessita UTI e sangue
- IG pretendida: 37 semanas
- Resultado esperado: Protocolo específico aplicado

---

## ✅ Checklist de Validação

Após inserir cada paciente, verificar:

- [ ] **Dados Salvos**
  - [ ] Nome completo correto
  - [ ] Carteirinha única
  - [ ] Telefones formatados

- [ ] **Cálculos**
  - [ ] IG calculada corretamente
  - [ ] Data agendada dentro do protocolo
  - [ ] IG na data agendada calculada

- [ ] **Campo Data Pedido**
  - [ ] Aceita data manual
  - [ ] Usa data atual se vazio
  - [ ] Afeta cálculo de IG

- [ ] **Status**
  - [ ] Inicia como "pendente"
  - [ ] Aparece em aprovações

- [ ] **Validações**
  - [ ] Maternidade obrigatória
  - [ ] Médico responsável validado
  - [ ] Carteirinha única

---

## 📊 Resultados Esperados

### **Via Formulário:**
- ✅ Agendamento criado com status "pendente"
- ✅ IG calculada automaticamente
- ✅ Data agendada sugerida
- ✅ Todos os campos salvos

### **Via Importação:**
- ✅ Múltiplos agendamentos processados
- ✅ Cálculos em lote
- ✅ Campo data_pedido funcionando
- ✅ Exportação Excel com todos os dados

---

**Última atualização:** 30/11/2024
