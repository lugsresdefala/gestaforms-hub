#!/bin/bash
# Script para testar o webhook de Forms com curl
# Uso: ./test-webhook-curl.sh [URL_BASE]

URL_BASE="${1:-http://localhost:5000}"

echo "🧪 Testando Webhook de Forms"
echo "URL Base: $URL_BASE"
echo ""

# Teste 1: Caso completo com sucesso
echo "📋 Teste 1: POST completo com DUM + USG + diagnóstico"
curl -X POST "${URL_BASE}/api/webhook/forms" \
  -H "Content-Type: application/json" \
  -d '{
    "paciente": "Maria da Silva Santos",
    "maternidade": "Hospital Maternidade São José",
    "data_dum": "15/03/2024",
    "dum_confiavel": true,
    "data_primeiro_usg": "10/05/2024",
    "semanas_usg": 8,
    "dias_usg": 2,
    "diagnostico_materno": "diabetes gestacional controlado",
    "telefone": "(85) 99999-9999",
    "carteirinha": "12345678901",
    "medico": "Dr. João Silva",
    "forms_row_id": "test_001"
  }' | jq '.'

echo -e "\n\n"

# Teste 2: Apenas campos obrigatórios
echo "📋 Teste 2: Apenas campos obrigatórios"
curl -X POST "${URL_BASE}/api/webhook/forms" \
  -H "Content-Type: application/json" \
  -d '{
    "paciente": "Ana Costa",
    "maternidade": "Hospital Guarulhos"
  }' | jq '.'

echo -e "\n\n"

# Teste 3: Campos ausentes (deve retornar erro 400)
echo "📋 Teste 3: Campos obrigatórios ausentes (esperado: erro 400)"
curl -X POST "${URL_BASE}/api/webhook/forms" \
  -H "Content-Type: application/json" \
  -d '{
    "telefone": "85999999999"
  }' | jq '.'

echo -e "\n\n"

# Teste 4: Listar pendentes
echo "📋 Teste 4: GET /api/pendentes (listar pendentes)"
curl -X GET "${URL_BASE}/api/pendentes?status=pendente" | jq '.'

echo -e "\n\n"

# Teste 5: Health check
echo "📋 Teste 5: GET /api/health (verificar se servidor está funcionando)"
curl -X GET "${URL_BASE}/api/health" | jq '.'

echo -e "\n\n✅ Testes concluídos!"
