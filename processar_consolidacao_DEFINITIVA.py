#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CONSOLIDAÇÃO FINAL - Processamento Completo
Arquivos:
1. forms_fluxo_novo_raw.csv (40 registros)
2. public/csv-temp/forms_parto.csv (93 registros)
"""

import csv
import sys
from datetime import datetime
from collections import defaultdict
import re

print("="*80)
print("CONSOLIDAÇÃO COMPLETA DE AGENDAMENTOS OBSTÉTRICOS")
print("GestaForms Hub - Processamento Final")
print("="*80)
print()

# ===== CARREGAR FONTE 1: Fluxo Novo 2025 =====
print("📂 FONTE 1: Fluxo Novo 2025")
try:
    with open('forms_fluxo_novo_raw.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter=';')
        fluxo_novo = list(reader)
    print(f"   ✅ {len(fluxo_novo)} registros carregados")
    print(f"   IDs: {fluxo_novo[0]['ID']} até {fluxo_novo[-1]['ID']}")
except Exception as e:
    print(f"   ❌ ERRO: {e}")
    sys.exit(1)

print()

# ===== CARREGAR FONTE 2: Forms Anteriores =====
print("📂 FONTE 2: Forms Anteriores (forms_parto.csv)")
try:
    with open('public/csv-temp/forms_parto.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        forms_anteriores = list(reader)
    print(f"   ✅ {len(forms_anteriores)} registros carregados")
    if forms_anteriores:
        print(f"   IDs: {forms_anteriores[0]['ID']} até {forms_anteriores[-1]['ID']}")
except Exception as e:
    print(f"   ❌ ERRO: {e}")
    sys.exit(1)

print()
print("="*80)
print(f"TOTAL BRUTO: {len(fluxo_novo) + len(forms_anteriores)} registros")
print("="*80)
print()

# ===== NORMALIZAÇÃO =====
print("🔄 Normalizando dados...")

def normalizar_registro(reg, fonte):
    """Extrai campos essenciais de cada registro"""
    
    # Mapeamento flexível de campos
    id_val = reg.get('ID', '').strip()
    
    # Nome
    nome = (reg.get('Nome completo da paciente') or 
            reg.get('Nome') or 
            reg.get('nome') or '').strip()
    
    # Maternidade
    maternidade = (reg.get('Maternidade que a paciente deseja') or
                   reg.get('Maternidade') or
                   reg.get('maternidade') or '').strip()
    
    # Procedimento
    procedimento = (reg.get('Informe o procedimento(s) que será(ão) realizado(s)') or
                    reg.get('Procedimento') or
                    reg.get('procedimento') or '').strip()
    
    # Data
    data = (reg.get('DATA AGENDADA') or
            reg.get('Data_Agendada_Sugerida') or
            reg.get('Data Agendada') or '').strip()
    
    # Médico
    medico = (reg.get('Médico responsável pelo agendamento') or
              reg.get('Médico') or
              reg.get('Medico') or '').strip()
    
    return {
        'ID': id_val,
        'Nome': nome,
        'Maternidade': maternidade,
        'Procedimento': procedimento,
        'Data_Agendada': data,
        'Medico': medico,
        'Fonte': fonte,
        '_original': reg
    }

# Processar todos os registros
registros_normalizados = []

for reg in fluxo_novo:
    registros_normalizados.append(normalizar_registro(reg, 'Fluxo Novo 2025'))

for reg in forms_anteriores:
    # Filtrar linhas vazias - ID deve existir E ter conteúdo
    try:
        id_val = str(reg.get('ID', '')).strip()
        if id_val and id_val != '':
            registros_normalizados.append(normalizar_registro(reg, 'Forms Anteriores'))
    except Exception as e:
        continue  # Ignorar linhas com problemas

print(f"   ✅ {len(registros_normalizados)} registros normalizados")
print()

# ===== REMOVER DUPLICATAS POR ID =====
print("🔍 Removendo duplicatas por ID...")

registros_unicos = {}
duplicatas_encontradas = []

for reg in registros_normalizados:
    id_val = reg['ID']
    if not id_val:
        continue
    
    if id_val in registros_unicos:
        # Duplicata encontrada
        duplicatas_encontradas.append({
            'ID': id_val,
            'fonte_original': registros_unicos[id_val]['Fonte'],
            'fonte_duplicata': reg['Fonte']
        })
        # Preferir Fluxo Novo 2025 em caso de conflito
        if reg['Fonte'] == 'Fluxo Novo 2025':
            registros_unicos[id_val] = reg
    else:
        registros_unicos[id_val] = reg

print(f"   ✅ {len(registros_unicos)} registros únicos")
print(f"   ⚠️  {len(duplicatas_encontradas)} duplicatas removidas")

if duplicatas_encontradas:
    print("\n   Duplicatas removidas:")
    for dup in duplicatas_encontradas[:10]:
        print(f"      - ID {dup['ID']}: {dup['fonte_original']} vs {dup['fonte_duplicata']}")
    if len(duplicatas_encontradas) > 10:
        print(f"      ... e mais {len(duplicatas_encontradas)-10} duplicatas")

print()

# ===== ORGANIZAR POR MATERNIDADE =====
print("🏥 Organizando por maternidade...")

por_maternidade = defaultdict(list)

for reg in registros_unicos.values():
    mat = reg['Maternidade'] or 'SEM_MATERNIDADE'
    por_maternidade[mat].append(reg)

print(f"\n   Distribuição por maternidade:")
for mat in sorted(por_maternidade.keys()):
    count = len(por_maternidade[mat])
    print(f"      • {mat}: {count} pacientes")

print()

# ===== ORDENAR POR DATA =====
print("📅 Ordenando por data dentro de cada maternidade...")

def extrair_data_para_sort(data_str):
    """Converte string de data para objeto datetime para ordenação"""
    if not data_str:
        return datetime(2099, 12, 31)
    
    # Padrões de data
    padroes = [
        (r'(\d{1,2})/(\d{1,2})/(\d{4})', lambda m: datetime(int(m.group(3)), int(m.group(2)), int(m.group(1)))),
        (r'(\d{4})-(\d{2})-(\d{2})', lambda m: datetime(int(m.group(1)), int(m.group(2)), int(m.group(3)))),
        (r'(\d{1,2})-(\d{1,2})-(\d{4})', lambda m: datetime(int(m.group(3)), int(m.group(2)), int(m.group(1)))),
    ]
    
    for padrao, converter in padroes:
        match = re.search(padrao, data_str)
        if match:
            try:
                return converter(match)
            except:
                pass
    
    return datetime(2099, 12, 31)

# Ordenar cada maternidade
for mat in por_maternidade:
    por_maternidade[mat].sort(key=lambda x: extrair_data_para_sort(x['Data_Agendada']))

print("   ✅ Registros ordenados por data")
print()

# ===== EXPORTAR RESULTADO CONSOLIDADO =====
print("💾 Gerando arquivo consolidado final...")

# Determinar todos os campos únicos dos registros originais
todos_campos = set()
for reg in registros_unicos.values():
    todos_campos.update(reg['_original'].keys())

# Ordenar campos
campos_lista = sorted(todos_campos)

# Priorizar campos essenciais
campos_prioritarios = ['ID', 'Nome completo da paciente', 'Maternidade que a paciente deseja', 
                       'Informe o procedimento(s) que será(ão) realizado(s)', 'DATA AGENDADA',
                       'Médico responsável pelo agendamento']

campos_finais = []
for campo in campos_prioritarios:
    if campo in campos_lista:
        campos_finais.append(campo)
        campos_lista.remove(campo)

campos_finais.extend(campos_lista)

# Escrever CSV consolidado
arquivo_saida = 'AGENDAMENTOS_CONSOLIDADO_FINAL.csv'

with open(arquivo_saida, 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=campos_finais, delimiter=';', extrasaction='ignore')
    writer.writeheader()
    
    # Escrever organizados por maternidade e data
    for mat in sorted(por_maternidade.keys()):
        for reg in por_maternidade[mat]:
            writer.writerow(reg['_original'])

print(f"   ✅ Arquivo gerado: {arquivo_saida}")
print(f"   Total: {len(registros_unicos)} pacientes")
print()

# ===== RESUMO FINAL =====
print("="*80)
print("📊 RESUMO FINAL DA CONSOLIDAÇÃO")
print("="*80)
print()

print("Fontes processadas:")
print(f"   • Fluxo Novo 2025: {len(fluxo_novo)} registros")
print(f"   • Forms Anteriores: {len(forms_anteriores)} registros")
print(f"   • Total bruto: {len(registros_normalizados)} registros")
print()

print("Resultado:")
print(f"   • Duplicatas removidas: {len(duplicatas_encontradas)}")
print(f"   • Registros únicos: {len(registros_unicos)}")
print()

print("Distribuição por maternidade:")
for mat, regs in sorted(por_maternidade.items(), key=lambda x: len(x[1]), reverse=True):
    print(f"   • {mat}: {len(regs)} pacientes")
print()

print("="*80)
print(f"✅ CONSOLIDAÇÃO CONCLUÍDA COM SUCESSO")
print(f"✅ Arquivo: {arquivo_saida}")
print(f"✅ Total: {len(registros_unicos)} pacientes consolidadas")
print("="*80)
