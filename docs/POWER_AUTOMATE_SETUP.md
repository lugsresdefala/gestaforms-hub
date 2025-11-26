# Configuração do Power Automate para Integração com GestaForms Hub

Este guia descreve como configurar o Microsoft Power Automate para enviar dados do Microsoft Forms para o GestaForms Hub e atualizar planilhas Excel automaticamente.

## Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Configuração do Microsoft Forms](#configuração-do-microsoft-forms)
3. [Criação do Fluxo no Power Automate](#criação-do-fluxo-no-power-automate)
4. [Configuração da Ação HTTP](#configuração-da-ação-http)
5. [Parse JSON da Resposta](#parse-json-da-resposta)
6. [Atualização das Planilhas Excel](#atualização-das-planilhas-excel)
7. [Tratamento de Erros](#tratamento-de-erros)
8. [Testes e Validação](#testes-e-validação)

---

## Pré-requisitos

- Acesso ao Microsoft Power Automate (licença incluída no Microsoft 365)
- Microsoft Forms configurado com o formulário de agendamento obstétrico
- Planilhas Excel no OneDrive ou SharePoint para cada maternidade
- URL da Edge Function: `https://[SEU_PROJETO].supabase.co/functions/v1/processar-forms-webhook`

---

## Configuração do Microsoft Forms

### Campos Obrigatórios no Formulário

| Campo | Tipo | Nome Técnico |
|-------|------|--------------|
| Nome da Paciente | Texto | `nome_paciente` |
| Carteirinha | Texto | `carteirinha` |
| Telefone | Texto | `telefone` |
| DUM (Última Menstruação) | Data | `dum` |
| DUM Confiável? | Escolha | `dum_confiavel` |
| Data do USG | Data | `data_usg` |
| Semanas no USG | Número | `semanas_usg` |
| Dias no USG | Número | `dias_usg` |
| Diagnósticos | Múltipla escolha | `diagnosticos` |
| Maternidade | Escolha | `maternidade` |
| Data Agendada (se já definida) | Data | `data_agendada` |

### Opções de DUM Confiável
- `Sim - Confiavel`
- `Não - Incerta`
- `Não lembra`

### Opções de Maternidade
- `Cruzeiro`
- `Salvalus`
- `Notrecare`
- `Guarulhos`

---

## Criação do Fluxo no Power Automate

### Passo 1: Criar Novo Fluxo

1. Acesse [Power Automate](https://make.powerautomate.com)
2. Clique em **Criar** → **Fluxo de nuvem automatizado**
3. Nome: `Processar Agendamento Obstétrico`
4. Trigger: **"Quando uma nova resposta é enviada"** (Microsoft Forms)

### Passo 2: Configurar Trigger

1. Selecione o formulário desejado no campo **ID do Formulário**
2. Adicione uma segunda ação: **"Obter detalhes da resposta"**
3. Configure o ID da resposta usando a expressão dinâmica

```
triggerOutputs()?['body/resourceData/responseId']
```

---

## Configuração da Ação HTTP

### Passo 3: Adicionar Ação HTTP

Após obter os detalhes da resposta, adicione a ação **HTTP**:

**Método:** `POST`

**URI:**
```
https://[SEU_PROJETO].supabase.co/functions/v1/processar-forms-webhook
```

**Cabeçalhos:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer [SUA_ANON_KEY]"
}
```

**Corpo (Body):**
```json
{
  "nome_paciente": "@{outputs('Obter_detalhes_da_resposta')?['body/r1234567890']}",
  "carteirinha": "@{outputs('Obter_detalhes_da_resposta')?['body/r1234567891']}",
  "telefone": "@{outputs('Obter_detalhes_da_resposta')?['body/r1234567892']}",
  "dum": "@{outputs('Obter_detalhes_da_resposta')?['body/r1234567893']}",
  "dum_confiavel": "@{outputs('Obter_detalhes_da_resposta')?['body/r1234567894']}",
  "data_usg": "@{outputs('Obter_detalhes_da_resposta')?['body/r1234567895']}",
  "semanas_usg": "@{outputs('Obter_detalhes_da_resposta')?['body/r1234567896']}",
  "dias_usg": "@{outputs('Obter_detalhes_da_resposta')?['body/r1234567897']}",
  "diagnosticos": "@{outputs('Obter_detalhes_da_resposta')?['body/r1234567898']}",
  "maternidade": "@{outputs('Obter_detalhes_da_resposta')?['body/r1234567899']}",
  "data_agendada": "@{outputs('Obter_detalhes_da_resposta')?['body/r1234567900']}"
}
```

> **Nota:** Substitua `r1234567890`, `r1234567891`, etc. pelos IDs reais das perguntas do seu formulário. Você pode encontrá-los nas configurações do Forms ou inspecionando a saída da ação "Obter detalhes da resposta".

---

## Parse JSON da Resposta

### Passo 4: Adicionar Parse JSON

Adicione a ação **"Analisar JSON"** (Parse JSON) após a ação HTTP.

**Conteúdo:** `@{body('HTTP')}`

**Esquema:**
```json
{
  "type": "object",
  "properties": {
    "nome_paciente": { "type": "string" },
    "carteirinha": { "type": "string" },
    "telefone": { "type": "string" },
    "dum": { "type": "string" },
    "dum_confiavel": { "type": "string" },
    "data_usg": { "type": "string" },
    "semanas_usg": { "type": ["integer", "string"] },
    "dias_usg": { "type": ["integer", "string"] },
    "diagnosticos": { "type": ["string", "array"] },
    "maternidade": { "type": "string" },
    "data_agendada": { "type": "string" },
    "maternidade_resultado": { "type": "string" },
    "IG_Atual_Dias": { "type": "integer" },
    "IG_Atual_Formatada": { "type": "string" },
    "Metodo_IG": { "type": "string" },
    "IG_Recomendada_Dias": { "type": "integer" },
    "IG_Recomendada_Formatada": { "type": "string" },
    "Data_Ideal_Calculada": { "type": "string" },
    "Data_Agendada": { "type": "string" },
    "IG_na_Data_Agendada_Formatada": { "type": "string" },
    "Intervalo": { "type": "integer" },
    "erro": { "type": "string" }
  }
}
```

---

## Atualização das Planilhas Excel

### Passo 5: Adicionar Condição por Maternidade

Adicione uma ação **"Condição"** (Switch) baseada no campo `maternidade`:

```
@{body('Analisar_JSON')?['maternidade']}
```

### Casos:
- **Cruzeiro** → Atualizar `Agenda_Cruzeiro_2025.xlsx`
- **Salvalus** → Atualizar `Agenda_Salvalus_2025.xlsx`
- **Notrecare** → Atualizar `Agenda_Notrecare_2025.xlsx`
- **Guarulhos** → Atualizar `Agenda_Guarulhos_2025.xlsx`

### Passo 6: Configurar Ação "Adicionar linha em tabela"

Para cada caso, adicione a ação **"Adicionar uma linha em uma tabela"** (Excel Online - OneDrive):

**Localização:** OneDrive for Business  
**Biblioteca de Documentos:** Documentos  
**Arquivo:** `/Agendamentos/Agenda_[MATERNIDADE]_2025.xlsx`  
**Tabela:** `TabelaAgenda`

**Mapeamento de Colunas:**

| Coluna Excel | Valor do Power Automate |
|--------------|-------------------------|
| Data | `@{body('Analisar_JSON')?['Data_Agendada']}` |
| Paciente | `@{body('Analisar_JSON')?['nome_paciente']}` |
| Carteirinha | `@{body('Analisar_JSON')?['carteirinha']}` |
| Procedimento | `@{body('Analisar_JSON')?['procedimento']}` |
| IG Agendada | `@{body('Analisar_JSON')?['IG_na_Data_Agendada_Formatada']}` |
| IG Recomendada | `@{body('Analisar_JSON')?['IG_Recomendada_Formatada']}` |
| Diagnóstico | `@{body('Analisar_JSON')?['diagnosticos']}` |
| Telefone | `@{body('Analisar_JSON')?['telefone']}` |
| Médico | `@{body('Analisar_JSON')?['medico_responsavel']}` |
| Status | `Pendente` |
| Observações | `@{body('Analisar_JSON')?['maternidade_resultado']}` |

---

## Tratamento de Erros

### Passo 7: Configurar Escopo de Tratamento de Erros

Envolva as ações HTTP e de atualização do Excel em um **Escopo** (Scope), e adicione um escopo paralelo para tratamento de erros:

1. **Escopo Principal** - Contém todas as ações de processamento
2. **Escopo de Erro** - Configurado para rodar quando o escopo principal falhar

No Escopo de Erro, adicione:

1. **Enviar email** (Outlook) para notificar falhas:
   - Para: `equipe.obst@hapvida.com.br`
   - Assunto: `⚠️ Erro no processamento de agendamento`
   - Corpo: Detalhes do erro + dados do formulário

2. **Criar item em lista** (SharePoint) para log de erros

### Configurar "Executar Após"

No escopo de erro, configure a opção **"Executar após"** para:
- ✅ falhou
- ✅ expirou

---

## Testes e Validação

### Lista de Verificação

- [ ] Formulário Microsoft Forms configurado corretamente
- [ ] IDs das perguntas mapeados no corpo do HTTP
- [ ] URL da Edge Function correta
- [ ] Chave de API (anon key) configurada no header
- [ ] Planilhas Excel criadas em cada pasta correspondente
- [ ] Tabelas Excel nomeadas como `TabelaAgenda`
- [ ] Condições de switch cobrindo todas as maternidades
- [ ] Tratamento de erros configurado

### Teste Manual

1. Preencha o formulário com dados de teste
2. Monitore a execução no Power Automate
3. Verifique se a linha foi adicionada na planilha correta
4. Valide os cálculos de IG e datas

### Dados de Teste Sugeridos

```json
{
  "nome_paciente": "Maria Silva (TESTE)",
  "carteirinha": "TEST123456",
  "telefone": "(11) 99999-0000",
  "dum": "2024-06-01",
  "dum_confiavel": "Sim - Confiavel",
  "data_usg": "2024-08-15",
  "semanas_usg": 12,
  "dias_usg": 3,
  "diagnosticos": "DMG com insulina",
  "maternidade": "Salvalus"
}
```

**Resultado Esperado:**
- IG Atual: ~31 semanas (considerando data de referência)
- IG Recomendada: 38s (DMG com insulina)
- Data ideal calculada conforme protocolo

---

## Campos Calculados Retornados

A Edge Function retorna os seguintes campos calculados, que são adicionados ao final da linha do Excel:

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| `maternidade_resultado` | Resultado completo com observações | "Maternidade Salvalus. Com insulina, bom controle. IG ideal baseada em dmg insulina." |
| `IG_Atual_Dias` | IG atual em dias | 217 |
| `IG_Atual_Formatada` | IG atual formatada | "31s 0d" |
| `Metodo_IG` | Método usado para IG | "DUM" ou "USG" |
| `IG_Recomendada_Dias` | IG recomendada em dias | 266 |
| `IG_Recomendada_Formatada` | IG recomendada formatada | "38s" |
| `Data_Ideal_Calculada` | Data ideal para parto | "08/01/2026" |
| `Data_Agendada` | Data final agendada | "18/12/2025" |
| `IG_na_Data_Agendada_Formatada` | IG na data agendada | "36s0d" |
| `Intervalo` | Dias até o agendamento | 29 |

---

## Suporte

Em caso de problemas:

1. Verifique os logs de execução no Power Automate
2. Consulte os logs da Edge Function no painel Supabase
3. Entre em contato com a equipe de TI: `ti.obst@hapvida.com.br`

---

## Histórico de Versões

| Versão | Data | Alterações |
|--------|------|------------|
| 1.0 | 2025-01 | Versão inicial |
