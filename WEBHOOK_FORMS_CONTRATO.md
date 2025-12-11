# Webhook Forms - Contrato de API

## Visão Geral

Este documento descreve o contrato da API de webhook para receber dados do Microsoft Forms via Power Automate. O webhook processa agendamentos obstétricos através do pipeline clínico PT-AON-097 e PR-DIMEP-PGS-01.

## Endpoint Principal

### POST /api/webhook/forms

Recebe dados de um formulário do Microsoft Forms e processa através do pipeline obstétrico.

**URL**: `https://seu-dominio.com/api/webhook/forms`

**Método**: `POST`

**Content-Type**: `application/json`

### Campos de Entrada

#### Campos Obrigatórios

| Campo | Tipo | Alternativas | Descrição |
|-------|------|-------------|-----------|
| `paciente` | string | `nome_paciente`, `nome`, `nomeCompleto` | Nome completo da paciente |
| `maternidade` | string | `hospital` | Nome da maternidade de destino |

#### Campos Obstétricos (Recomendados)

| Campo | Tipo | Alternativas | Descrição |
|-------|------|-------------|-----------|
| `data_dum` | string | `dum`, `dataDum` | Data da Última Menstruação (DD/MM/YYYY ou YYYY-MM-DD) |
| `dum_confiavel` | boolean | - | Se a DUM é confiável (default: true) |
| `data_primeiro_usg` | string | `data_usg`, `usg`, `dataUsg` | Data do primeiro USG (DD/MM/YYYY ou YYYY-MM-DD) |
| `semanas_usg` | number | `semanasUsg` | Semanas gestacionais no USG |
| `dias_usg` | number | `diasUsg` | Dias adicionais no USG (0-6) |

#### Campos de Diagnóstico

| Campo | Tipo | Alternativas | Descrição |
|-------|------|-------------|-----------|
| `diagnostico_materno` | string | `comorbidades` | Diagnósticos maternos (ex: "diabetes gestacional") |
| `diagnostico_fetal` | string | `malformacao` | Diagnósticos fetais |
| `indicacao` | string | - | Indicação do procedimento |
| `procedimento` | string | - | Tipo de procedimento (ex: "Cesárea") |

#### Campos Complementares (Opcionais)

| Campo | Tipo | Alternativas | Descrição |
|-------|------|-------------|-----------|
| `telefone` | string | `telefones` | Telefone(s) de contato |
| `carteirinha` | string | - | Número da carteirinha |
| `medico` | string | - | Médico responsável |
| `forms_row_id` | string | - | ID da linha no Forms (para auditoria) |

### Exemplo de Requisição

```json
{
  "paciente": "Maria da Silva Santos",
  "maternidade": "Hospital Maternidade São José",
  "data_dum": "15/03/2024",
  "dum_confiavel": true,
  "data_primeiro_usg": "10/05/2024",
  "semanas_usg": 8,
  "dias_usg": 2,
  "diagnostico_materno": "diabetes gestacional controlado",
  "diagnostico_fetal": null,
  "indicacao": "DM gestacional",
  "procedimento": "Cesárea",
  "telefone": "(85) 99999-9999",
  "carteirinha": "12345678901",
  "medico": "Dr. João Silva",
  "forms_row_id": "abc123xyz"
}
```

### Resposta de Sucesso

**Status**: `201 Created`

```json
{
  "success": true,
  "id": "uuid-do-agendamento",
  "paciente": "Maria da Silva Santos",
  "maternidade": "Hospital Maternidade São José",
  "source_type": "forms",
  "forms_row_id": "abc123xyz",
  "pipeline": {
    "metodo_ig": "DUM",
    "justificativa": "DUM confiável dentro do intervalo aceitável com USG",
    "ig_ideal": "38s",
    "ig_ideal_semanas": 38,
    "categoria_diagnostico": "diagnostico_materno",
    "diagnostico_encontrado": "dmg sem insulina controlado(39s)",
    "data_agendada": "2024-11-15",
    "ig_na_data": "38s 2d",
    "dias_adiados": 0,
    "status_vaga": "disponivel",
    "dia_semana": "Sexta-feira",
    "dpp_calculado": "2024-12-20"
  },
  "error": null
}
```

### Resposta de Erro - Validação

**Status**: `400 Bad Request`

```json
{
  "success": false,
  "error": "Campos obrigatórios ausentes: paciente, maternidade"
}
```

### Resposta de Erro - Processamento

**Status**: `200 OK` (com success: false)

```json
{
  "success": false,
  "id": "uuid-do-agendamento",
  "paciente": "Maria da Silva Santos",
  "maternidade": "Hospital Maternidade São José",
  "source_type": "forms",
  "forms_row_id": "abc123xyz",
  "pipeline": {
    "metodo_ig": "ERRO",
    "justificativa": "DUM e USG ausentes ou inválidos",
    "ig_ideal": "",
    "ig_ideal_semanas": 0,
    "categoria_diagnostico": "",
    "diagnostico_encontrado": "",
    "data_agendada": null,
    "ig_na_data": "",
    "dias_adiados": 0,
    "status_vaga": "erro",
    "dia_semana": "",
    "dpp_calculado": null
  },
  "error": "DUM e USG ausentes ou inválidos"
}
```

### Resposta de Erro - Servidor

**Status**: `500 Internal Server Error`

```json
{
  "success": false,
  "error": "Erro interno ao processar agendamento",
  "message": "Detalhes do erro (apenas em desenvolvimento)"
}
```

## Endpoints Auxiliares

### GET /api/pendentes

Lista agendamentos pendentes de aprovação.

**Parâmetros de Query**:
- `status` (string, opcional): Filtrar por status (default: "pendente")
- `maternidade` (string, opcional): Filtrar por maternidade
- `startDate` (string, opcional): Data inicial (YYYY-MM-DD)
- `endDate` (string, opcional): Data final (YYYY-MM-DD)

**Resposta**: Array de agendamentos pendentes

```json
[
  {
    "id": "uuid",
    "paciente": "Maria da Silva Santos",
    "maternidade": "Hospital Maternidade São José",
    "metodoIg": "DUM",
    "igIdeal": "38s",
    "dataAgendada": "2024-11-15",
    "igNaData": "38s 2d",
    "statusVaga": "disponivel",
    "diagnosticoEncontrado": "dmg sem insulina controlado(39s)",
    "status": "pendente",
    "criadoEm": "2024-10-15T10:30:00Z"
  }
]
```

### GET /api/pendentes/:id

Busca um agendamento pendente específico.

**Parâmetros de URL**:
- `id` (string): UUID do agendamento

**Resposta**: Objeto do agendamento pendente

### PATCH /api/pendentes/:id

Atualiza status de um agendamento pendente (aprovar/rejeitar).

**Parâmetros de URL**:
- `id` (string): UUID do agendamento

**Body**:
```json
{
  "status": "aprovado",
  "aprovadoPor": 123
}
```

**Resposta**: Objeto atualizado do agendamento pendente

## Fluxo do Pipeline Obstétrico

O webhook executa automaticamente o seguinte pipeline:

1. **Comparação DUM vs USG**
   - Verifica tolerância entre DUM e USG
   - Define método de datação (DUM/USG/ERRO)

2. **Identificação de IG Ideal**
   - Analisa diagnósticos maternos e fetais
   - Consulta tabela PT-AON-097
   - Seleciona IG ideal mais conservadora

3. **Cálculo de Data de Agendamento**
   - Calcula data para atingir IG ideal
   - Ajusta para não cair em domingo
   - Verifica capacidade da maternidade

4. **Cálculo de IG na Data**
   - Calcula IG que a paciente terá na data agendada
   - Valida se está dentro dos limites protocolar

5. **Cálculo de DPP**
   - Data Provável do Parto (280 dias após referência)

## Formatos de Data Suportados

O webhook aceita datas nos seguintes formatos:

- **Brasileiro**: `DD/MM/YYYY` (ex: `15/03/2024`)
- **ISO**: `YYYY-MM-DD` (ex: `2024-03-15`)

As datas são normalizadas internamente para ISO antes do processamento.

## Segurança

### Recomendações

1. **HTTPS**: Use sempre HTTPS em produção
2. **Autenticação**: Implemente autenticação via token no Power Automate
3. **Rate Limiting**: Configure rate limiting no servidor
4. **Validação**: Valide dados no Forms antes de enviar
5. **Logs**: Monitore logs de webhook para detecção de anomalias

### Headers Recomendados

```
Content-Type: application/json
Authorization: Bearer seu-token-aqui (se implementado)
```

## Monitoramento

### Logs

Todos os webhooks são registrados com:
- Timestamp de recebimento
- Payload completo (primeiros 500 caracteres no console)
- Resultado do pipeline
- ID do agendamento criado
- Erros (se houver)

### Health Check

Verificar status do serviço:

```
GET /api/health
```

Resposta:
```json
{
  "status": "ok",
  "timestamp": "2024-10-15T10:30:00Z"
}
```

## Suporte

Para problemas ou dúvidas sobre a integração:

1. Verifique os logs do servidor
2. Valide o formato dos dados enviados
3. Teste com dados de exemplo deste documento
4. Consulte a equipe de desenvolvimento

## Changelog

- **v1.0.0** (2024-12): Implementação inicial do webhook de Forms
  - Pipeline completo PT-AON-097
  - Suporte a múltiplos formatos de data
  - Normalização de campos do Forms
  - Armazenamento em `agendamentos_pendentes`
