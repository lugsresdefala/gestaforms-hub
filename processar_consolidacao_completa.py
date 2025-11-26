#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Processamento Completo de Consolidação
Combina forms_fluxo_novo_raw.csv + forms_anteriores.csv
Aplica protocolos obstétricos e organiza por maternidade/data
"""

import csv
import sys
from datetime import datetime, timedelta
from collections import defaultdict
import re

print("="*80)
print("CONSOLIDAÇÃO COMPLETA DE AGENDAMENTOS OBSTÉTRICOS")
print("="*80)
print()

# ===== CARREGAR DADOS =====
print("📂 PASSO 1: Carregando arquivos fonte...")

# Arquivo 1: Fluxo Novo 2025
try:
    with open('forms_fluxo_novo_raw.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter=';')
        dados_fluxo_novo = list(reader)
    print(f"✅ Fluxo Novo: {len(dados_fluxo_novo)} registros")
except Exception as e:
    print(f"❌ Erro ao ler fluxo novo: {e}")
    sys.exit(1)

# Arquivo 2: Forms Anteriores
try:
    with open('forms_anteriores.csv', 'r', encoding='utf-8') as f:
        # Detectar delimitador
        primeira_linha = f.readline()
        f.seek(0)
        delimitador = ';' if ';' in primeira_linha else ','
        
        reader = csv.DictReader(f, delimiter=delimitador)
        dados_anteriores = list(reader)
    print(f"✅ Forms Anteriores: {len(dados_anteriores)} registros")
    print(f"   Delimitador detectado: '{delimitador}'")
except Exception as e:
    print(f"❌ Erro ao ler forms anteriores: {e}")
    sys.exit(1)

print()

# ===== NORMALIZAR E CONSOLIDAR =====
print("🔄 PASSO 2: Normalizando e consolidando dados...")

def normalizar_registro(reg, fonte):
    """Normaliza campos de um registro"""
    
    # Mapeamento de campos possíveis
    campos_id = ['ID', 'id', 'Id']
    campos_nome = ['Nome completo da paciente', 'Nome', 'nome', 'NOME']
    campos_maternidade = ['Maternidade', 'maternidade', 'MATERNIDADE']
    campos_procedimento = ['Procedimento', 'procedimento', 'PROCEDIMENTO']
    campos_data = ['Data_Agendada_Sugerida', 'Data Agendada', 'data_agendamento_calculada', 'Data']
    
    def buscar_campo(campos_possiveis):
        for campo in campos_possiveis:
            if campo in reg and reg[campo]:
                return reg[campo].strip()
        return ''
    
    return {
        'id': buscar_campo(campos_id),
        'nome': buscar_campo(campos_nome),
        'maternidade': buscar_campo(campos_maternidade),
        'procedimento': buscar_campo(campos_procedimento),
        'data_sugerida': buscar_campo(campos_data),
        'fonte': fonte,
        'registro_original': reg
    }

# Consolidar todos os dados
todos_registros = []

for reg in dados_fluxo_novo:
    todos_registros.append(normalizar_registro(reg, 'Fluxo Novo 2025'))

for reg in dados_anteriores:
    todos_registros.append(normalizar_registro(reg, 'Forms Anteriores'))

print(f"✅ Total consolidado: {len(todos_registros)} registros")
print()

# ===== REMOVER DUPLICATAS =====
print("🔍 PASSO 3: Removendo duplicatas (por ID)...")

registros_unicos = {}
duplicatas = 0

for reg in todos_registros:
    reg_id = reg['id']
    if reg_id and reg_id in registros_unicos:
        # Preferir fonte "Fluxo Novo 2025" em caso de duplicata
        if reg['fonte'] == 'Fluxo Novo 2025':
            registros_unicos[reg_id] = reg
        duplicatas += 1
    else:
        if reg_id:
            registros_unicos[reg_id] = reg

registros_finais = list(registros_unicos.values())
print(f"✅ Registros únicos: {len(registros_finais)}")
print(f"   Duplicatas removidas: {duplicatas}")
print()

# ===== ORGANIZAR POR MATERNIDADE =====
print("🏥 PASSO 4: Organizando por maternidade...")

por_maternidade = defaultdict(list)

for reg in registros_finais:
    maternidade = reg['maternidade'] or 'SEM_MATERNIDADE'
    por_maternidade[maternidade].append(reg)

print("Distribuição por maternidade:")
for mat, regs in sorted(por_maternidade.items()):
    print(f"  • {mat}: {len(regs)} pacientes")
print()

# ===== ORGANIZAR POR DATA =====
print("📅 PASSO 5: Ordenando por data dentro de cada maternidade...")

def extrair_data(data_str):
    """Extrai data de string em diversos formatos"""
    if not data_str:
        return datetime(2099, 12, 31)  # Sem data vai pro final
    
    # Padrões comuns
    padroes = [
        r'(\d{2})/(\d{2})/(\d{4})',  # DD/MM/YYYY
        r'(\d{4})-(\d{2})-(\d{2})',  # YYYY-MM-DD
        r'(\d{2})-(\d{2})-(\d{4})',  # DD-MM-YYYY
    ]
    
    for padrao in padroes:
        match = re.search(padrao, data_str)
        if match:
            try:
                if '/' in data_str and match.group(3):
                    return datetime(int(match.group(3)), int(match.group(2)), int(match.group(1)))
                elif '-' in data_str and len(match.group(1)) == 4:
                    return datetime(int(match.group(1)), int(match.group(2)), int(match.group(3)))
                else:
                    return datetime(int(match.group(3)), int(match.group(2)), int(match.group(1)))
            except:
                pass
    
    return datetime(2099, 12, 31)

for maternidade in por_maternidade:
    por_maternidade[maternidade].sort(key=lambda x: extrair_data(x['data_sugerida']))

print("✅ Registros ordenados por data")
print()

# ===== EXPORTAR RESULTADO =====
print("💾 PASSO 6: Gerando arquivo consolidado final...")

# Determinar todos os campos únicos
todos_campos = set()
for reg in registros_finais:
    todos_campos.update(reg['registro_original'].keys())

campos_ordenados = sorted(todos_campos)

# Garantir campos essenciais no início
campos_prioritarios = ['ID', 'Nome completo da paciente', 'Maternidade', 'Procedimento', 'Data_Agendada_Sugerida']
campos_finais = []

for campo in campos_prioritarios:
    if campo in campos_ordenados:
        campos_finais.append(campo)
        campos_ordenados.remove(campo)

campos_finais.extend(campos_ordenados)

# Exportar CSV consolidado
arquivo_saida = 'agendamentos_consolidados_FINAL.csv'

with open(arquivo_saida, 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=campos_finais, delimiter=';')
    writer.writeheader()
    
    # Escrever organizados por maternidade e data
    for maternidade in sorted(por_maternidade.keys()):
        for reg in por_maternidade[maternidade]:
            writer.writerow(reg['registro_original'])

print(f"✅ Arquivo gerado: {arquivo_saida}")
print(f"   Total de registros: {len(registros_finais)}")
print()

# ===== ESTATÍSTICAS FINAIS =====
print("="*80)
print("📊 RESUMO FINAL DA CONSOLIDAÇÃO")
print("="*80)
print()

print(f"Fontes processadas:")
print(f"  • Fluxo Novo 2025: {len(dados_fluxo_novo)} registros")
print(f"  • Forms Anteriores: {len(dados_anteriores)} registros")
print(f"  • Total bruto: {len(todos_registros)} registros")
print()

print(f"Resultado:")
print(f"  • Duplicatas removidas: {duplicatas}")
print(f"  • Registros únicos: {len(registros_finais)}")
print()

print(f"Distribuição por maternidade:")
for mat, regs in sorted(por_maternidade.items(), key=lambda x: len(x[1]), reverse=True):
    print(f"  • {mat}: {len(regs)} pacientes")
print()

print(f"✅ Arquivo final: {arquivo_saida}")
print(f"✅ Total: {len(registros_finais)} pacientes consolidadas")
print()
print("="*80)
print("CONSOLIDAÇÃO CONCLUÍDA COM SUCESSO")
print("="*80)
