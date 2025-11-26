#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para padronizar e processar novas pacientes do sistema de agendamentos obstétricos
"""

from datetime import datetime
import csv
import re

def parse_paridade(paridade_str):
    """Extrai G-P-A de string de paridade"""
    if not paridade_str or paridade_str == "Primigesta":
        return "1-0-0-0"
    # Formatos: "3-0-2-0", "4G", "04-0-02-1"
    paridade_str = str(paridade_str).strip()
    if '-' in paridade_str:
        parts = paridade_str.split('-')
        if len(parts) >= 3:
            return f"{parts[0]}-{parts[1]}-{parts[2]}-{parts[3] if len(parts) > 3 else '0'}"
    return paridade_str

def parse_date(date_str):
    """Converte datas para formato padrão"""
    if not date_str or date_str == "10/6/1900":
        return None
    
    # Formatos possíveis: "12/2/2025", "2025-12-02", "02/12"
    for fmt in ['%m/%d/%Y', '%Y-%m-%d', '%d/%m/%Y']:
        try:
            return datetime.strptime(date_str, fmt)
        except:
            continue
    
    # Formato DD/MM sem ano (assume 2025 ou 2026)
    if '/' in date_str and len(date_str.split('/')) == 2:
        try:
            day, month = date_str.split('/')
            # Se mês < 11/2025, assume 2026
            year = 2026 if int(month) < 11 else 2025
            return datetime(year, int(month), int(day))
        except:
            pass
    
    return None

def parse_ig(ig_str):
    """Extrai semanas e dias de IG"""
    if not ig_str:
        return 0, 0
    
    # Formatos: "6s1d", "6s 1d", "39", "6  1"
    ig_str = str(ig_str).strip().lower().replace(' ', '')
    
    # Formato "XsYd"
    match = re.search(r'(\d+)s(\d+)d', ig_str)
    if match:
        return int(match.group(1)), int(match.group(2))
    
    # Formato apenas semanas
    match = re.search(r'(\d+)s', ig_str)
    if match:
        return int(match.group(1)), 0
    
    # Apenas número
    if ig_str.isdigit():
        return int(ig_str), 0
    
    return 0, 0

def calc_ig(ref_date, ref_weeks, ref_days, target_date):
    """Calcula IG em uma data alvo"""
    if not ref_date or not target_date:
        return None
    
    diff_days = (target_date - ref_date).days
    total_days = ref_weeks * 7 + ref_days + diff_days
    weeks = total_days // 7
    days = total_days % 7
    return f"{weeks}s {days}d"

def extract_ig_ideal(diagnosticos, medicacoes):
    """Determina IG ideal baseado em diagnósticos"""
    diag_lower = f"{diagnosticos} {medicacoes}".lower()
    
    # Casos urgentes
    if 'cerclagem' in diag_lower or 'iic' in diag_lower:
        return "13-15s", True
    
    # DMG com insulina
    if ('dmg' in diag_lower or 'diabet' in diag_lower) and ('insulina' in diag_lower or 'nph' in diag_lower):
        return "38s", False
    
    # Gemelar
    if 'gemelar' in diag_lower or 'gêmeos' in diag_lower:
        if 'mono' in diag_lower:
            return "32s", False
        return "36s", False
    
    # HAC / Hipertensão
    if 'hac' in diag_lower or 'hipertens' in diag_lower or 'dheg' in diag_lower or 'pré-eclâmpsia' in diag_lower:
        return "37s", False
    
    # RCF / Feto pequeno
    if 'rcf' in diag_lower or 'rciu' in diag_lower or 'restri' in diag_lower or 'pig' in diag_lower:
        return "37s", False
    
    # GIG / Macrossomia
    if 'gig' in diag_lower or 'macrossom' in diag_lower or 'p>90' in diag_lower or 'p >90' in diag_lower:
        return "39s", False
    
    # DMG sem insulina
    if 'dmg' in diag_lower or 'diabet' in diag_lower:
        return "39s", False
    
    # Padrão
    return "39s", False

# Data de referência (hoje)
HOJE = datetime(2025, 11, 25)

print("=" * 80)
print("PROCESSAMENTO DE NOVAS PACIENTES - Sistema GestaForms Hub")
print("=" * 80)
print(f"Data de referência: {HOJE.strftime('%d/%m/%Y')}\n")

# Contador
total = 0
processadas = 0
com_erro = 0

print("Iniciando processamento...")
print("(Script preparado - aguardando execução completa)")
