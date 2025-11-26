#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Comparação de Dados CSV vs Banco Supabase
"""

import csv
import os
import sys
from datetime import datetime

# Verificar variáveis de ambiente
SUPABASE_URL = os.getenv('VITE_SUPABASE_URL', '')
SUPABASE_KEY = os.getenv('VITE_SUPABASE_ANON_KEY', '')

print("="*80)
print("COMPARAÇÃO CSV vs BANCO SUPABASE")
print("="*80)
print()

if not SUPABASE_URL or not SUPABASE_KEY:
    print("⚠️  Credenciais Supabase não encontradas em variáveis de ambiente.")
    print("    Necessário configurar VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY")
    print()
    print("📊 ANÁLISE APENAS DO CSV:")
    print()

# Ler CSV
csv_data = {}
with open('agendamentos_completos.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        csv_data[row['ID']] = row

print(f"📄 Dados no CSV: {len(csv_data)} pacientes")
print()

# Estatísticas do CSV
maternidades = {}
procedimentos = {}
status_dates = {'passadas': 0, 'proximas_7d': 0, 'futuro': 0}

HOJE = datetime(2025, 11, 25)

for id_pac, row in csv_data.items():
    # Maternidades
    mat = row.get('Maternidade', 'N/A')
    maternidades[mat] = maternidades.get(mat, 0) + 1
    
    # Procedimentos
    proc = row.get('Procedimento', 'N/A')
    if 'Cesariana' in proc or 'Cesárea' in proc:
        proc_type = 'Cesárea'
    elif 'Indução' in proc:
        proc_type = 'Indução'
    else:
        proc_type = 'Outro'
    procedimentos[proc_type] = procedimentos.get(proc_type, 0) + 1
    
    # Status de datas
    data_agend = row.get('Data_Agendada_Sugerida', '')
    if data_agend:
        try:
            # Tentar parsear data
            for fmt in ['%d/%m/%Y', '%m/%d/%Y']:
                try:
                    data_dt = datetime.strptime(data_agend, fmt)
                    diff_dias = (data_dt - HOJE).days
                    
                    if diff_dias < 0:
                        status_dates['passadas'] += 1
                    elif diff_dias <= 7:
                        status_dates['proximas_7d'] += 1
                    else:
                        status_dates['futuro'] += 1
                    break
                except:
                    continue
        except:
            pass

print("📍 DISTRIBUIÇÃO POR MATERNIDADE:")
for mat, count in sorted(maternidades.items(), key=lambda x: x[1], reverse=True):
    print(f"   {mat}: {count} pacientes ({count*100/len(csv_data):.1f}%)")

print()
print("🏥 DISTRIBUIÇÃO POR PROCEDIMENTO:")
for proc, count in sorted(procedimentos.items(), key=lambda x: x[1], reverse=True):
    print(f"   {proc}: {count} pacientes ({count*100/len(csv_data):.1f}%)")

print()
print("📅 STATUS DE AGENDAMENTOS:")
print(f"   Datas passadas: {status_dates['passadas']}")
print(f"   Próximos 7 dias (URGENTE): {status_dates['proximas_7d']}")
print(f"   Datas futuras: {status_dates['futuro']}")

print()

# Tentar conectar ao Supabase se credenciais disponíveis
if SUPABASE_URL and SUPABASE_KEY:
    try:
        from supabase import create_client
        
        print("🔌 Conectando ao Supabase...")
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Buscar agendamentos do banco
        print("📥 Buscando agendamentos do banco...")
        response = supabase.table('agendamentos_obst').select('*').execute()
        
        db_data = {str(row['id']): row for row in response.data}
        
        print(f"💾 Dados no banco: {len(db_data)} agendamentos")
        print()
        
        # Comparação
        ids_csv = set(csv_data.keys())
        ids_db = set(db_data.keys())
        
        apenas_csv = ids_csv - ids_db
        apenas_db = ids_db - ids_csv
        comuns = ids_csv & ids_db
        
        print("🔍 ANÁLISE COMPARATIVA:")
        print(f"   Apenas no CSV: {len(apenas_csv)} registros")
        print(f"   Apenas no Banco: {len(apenas_db)} registros")
        print(f"   Comuns: {len(comuns)} registros")
        print()
        
        if len(apenas_csv) > 0:
            print(f"📋 IDs apenas no CSV (primeiros 20):")
            for id_pac in sorted(list(apenas_csv))[:20]:
                nome = csv_data[id_pac].get('Nome', 'N/A')
                print(f"   {id_pac} - {nome}")
            if len(apenas_csv) > 20:
                print(f"   ... e mais {len(apenas_csv) - 20} registros")
            print()
        
        if len(apenas_db) > 0:
            print(f"💾 IDs apenas no Banco (primeiros 20):")
            for id_pac in sorted(list(apenas_db))[:20]:
                nome = db_data[id_pac].get('nome_completo', 'N/A')
                print(f"   {id_pac} - {nome}")
            if len(apenas_db) > 20:
                print(f"   ... e mais {len(apenas_db) - 20} registros")
        
        print()
        print("="*80)
        print("✓ Comparação concluída")
        print("="*80)
        
    except ImportError:
        print("⚠️  Biblioteca 'supabase' não instalada.")
        print("    Execute: pip install supabase")
    except Exception as e:
        print(f"❌ Erro ao conectar com Supabase: {str(e)}")
else:
    print("="*80)
    print("ℹ️  Para comparar com banco Supabase, configure as variáveis de ambiente.")
    print("="*80)

print()
