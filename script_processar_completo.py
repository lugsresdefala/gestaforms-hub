#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Processador de novas pacientes para GestaForms Hub
Adapta novos dados ao formato existente verificado
"""

from datetime import datetime, timedelta
import csv
import re

HOJE = datetime(2025, 11, 25)

def parse_paridade(g, p, a, ab):
    """Padroniza paridade"""
    g = str(g).strip() if g else "1"
    p = str(p).strip() if p else "0"
    a = str(a).strip() if a else "0"
    ab = str(ab).strip() if ab else "0"
    
    # Remove letras
    g = re.sub(r'[^0-9]', '', g) or "1"
    p = re.sub(r'[^0-9]', '', p) or "0"
    a = re.sub(r'[^0-9]', '', a) or "0"
    ab = re.sub(r'[^0-9]', '', ab) or "0"
    
    return f"{g}-{p}-{a}-{ab}"

def parse_ig(sem, dias):
    """Extrai IG"""
    try:
        s = int(re.sub(r'[^0-9]', '', str(sem))) if sem else 0
        d = int(re.sub(r'[^0-9]', '', str(dias))) if dias else 0
        return s, d
    except:
        return 0, 0

def parse_date(d):
    """Parse datas"""
    if not d or d == "10/6/1900": return None
    d = str(d).strip()
    
    for fmt in ['%m/%d/%Y', '%d/%m/%Y', '%Y-%m-%d']:
        try: return datetime.strptime(d, fmt)
        except: pass
    
    # DD/MM
    if '/' in d and len(d.split('/')) == 2:
        try:
            parts = d.split('/')
            m, day = int(parts[0]), int(parts[1])
            if m > 12: m, day = day, m
            year = 2026 if m < 5 else 2025
            return datetime(year, m, day)
        except: pass
    return None

def calc_ig(ref_date, ref_weeks, ref_days, target_date):
    """Calcula IG"""
    if not ref_date or not target_date: return "0s 0d"
    diff = (target_date - ref_date).days
    total = ref_weeks * 7 + ref_days + diff
    return f"{total // 7}s {total % 7}d"

def determinar_ig_ideal(diag, med, proc):
    """Determina IG ideal e urgência"""
    txt = f"{diag} {med} {proc}".lower()
    
    if 'cerclage' in txt or 'iic' in txt or 'istmo' in txt:
        return "13-15", True
    
    if 'gemelar' in txt or 'gêmeo' in txt:
        if 'mono' in txt: return "32", False
        if 'di' in txt: return "34-36", False
        return "36", False
    
    if ('dmg' in txt or 'dm2' in txt or 'diabet' in txt) and ('insulina' in txt or 'nph' in txt):
        return "38", False
    
    if 'hac' in txt or 'hipertens' in txt or 'dheg' in txt or 'eclâmpsia' in txt:
        return "37", False
    
    if 'rcf' in txt or 'rciu' in txt or 'restriç' in txt or 'pig' in txt:
        return "37", False
    
    if 'gig' in txt or 'macrossom' in txt or 'p>90' in txt or 'p90' in txt:
        return "39", False
    
    if 'pélv' in txt or 'pelv' in txt or 'córm' in txt or 'transvers' in txt:
        return "38", False
    
    if 'dmg' in txt: return "39", False
    
    return "39", False

def calc_data_ideal(dum_date, usg_date, usg_sem, usg_dias, ig_ideal_sem, dum_confiavel):
    """Calcula data de agendamento ideal"""
    try:
        ig_target = int(re.sub(r'[^0-9]', '', ig_ideal_sem.split('-')[0]))
    except:
        ig_target = 39
    
    if dum_confiavel and dum_confiavel.startswith("Sim") and dum_date:
        data_ideal = dum_date + timedelta(weeks=ig_target)
        return data_ideal
    elif usg_date:
        dias_desde_usg = (ig_target * 7) - (usg_sem * 7 + usg_dias)
        data_ideal = usg_date + timedelta(days=dias_desde_usg)
        return data_ideal
    
    return None

print("="*80)
print("PROCESSADOR DE NOVAS PACIENTES - GestaForms Hub")
print("="*80)
print(f"Data de referência: {HOJE.strftime('%d/%m/%Y')}\n")

# Ler CSV existente
pacientes_existentes = []
try:
    with open('agendamentos_completos.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        pacientes_existentes = list(reader)
    print(f"✓ {len(pacientes_existentes)} pacientes existentes carregadas")
except:
    print("✗ Erro ao ler arquivo existente")

# Preparar saída
print(f"\n{'ID':<6} {'Nome':<35} {'IG Atual':<10} {'Data Agend':<12} {'Maternidade':<12}")
print("-"*80)

print("\n[Script preparado - execute para processar todos os dados]")
