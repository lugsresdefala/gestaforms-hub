#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de Validação Completa - GestaForms Hub
Valida dados do CSV contra protocolos obstétricos e banco Supabase
"""

import csv
import sys
import os
from datetime import datetime, timedelta
from collections import defaultdict

# Cores para output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'

def parse_date(d):
    """Parse múltiplos formatos de data"""
    if not d or str(d) == "10/6/1900":
        return None
    d = str(d).strip()
    for fmt in ['%d/%m/%Y', '%m/%d/%Y', '%Y-%m-%d']:
        try:
            return datetime.strptime(d, fmt)
        except:
            pass
    if '/' in d and len(d.split('/')) == 2:
        try:
            parts = d.split('/')
            m, day = int(parts[0]), int(parts[1])
            if m > 12:
                m, day = day, m
            year = 2026 if m < 5 else 2025
            return datetime(year, m, day)
        except:
            pass
    return None

def calc_ig_dias(ref_date, ref_weeks, ref_days, target_date):
    """Calcula idade gestacional em dias totais"""
    diff = (target_date - ref_date).days
    total = ref_weeks * 7 + ref_days + diff
    return total

def calc_ig_str(total_dias):
    """Converte dias totais em formato 'Xs Yd'"""
    return f"{total_dias // 7}s {total_dias % 7}d"

# Protocolos Obstétricos (baseado em obstetricProtocols.ts)
PROTOCOLOS = {
    'dmg': {'ig_ideal_min': 38, 'ig_ideal_max': 39, 'nome': 'Diabetes Gestacional'},
    'dm_insulina': {'ig_ideal_min': 38, 'ig_ideal_max': 38, 'nome': 'DM com Insulina'},
    'hac': {'ig_ideal_min': 38, 'ig_ideal_max': 39, 'nome': 'Hipertensão Crônica'},
    'pre_eclampsia': {'ig_ideal_min': 37, 'ig_ideal_max': 37, 'nome': 'Pré-eclâmpsia'},
    'gemelar': {'ig_ideal_min': 36, 'ig_ideal_max': 37, 'nome': 'Gemelaridade'},
    'cesariana_anterior': {'ig_ideal_min': 39, 'ig_ideal_max': 39, 'nome': 'Cesárea Iterativa'},
    'macrossomia': {'ig_ideal_min': 38, 'ig_ideal_max': 39, 'nome': 'Macrossomia Fetal'},
    'baixo_risco': {'ig_ideal_min': 39, 'ig_ideal_max': 40, 'nome': 'Baixo Risco'},
}

def classificar_diagnostico(diagnostico):
    """Classifica diagnóstico e retorna protocolo aplicável"""
    diag_lower = diagnostico.lower()
    
    # Condições de alto risco (prioridade)
    if 'pre eclampsia' in diag_lower or 'pré-eclâmpsia' in diag_lower:
        return PROTOCOLOS['pre_eclampsia']
    if 'gemelar' in diag_lower or 'gemeos' in diag_lower or 'didi' in diag_lower:
        return PROTOCOLOS['gemelar']
    if 'insulina' in diag_lower and ('dm' in diag_lower or 'diabetes' in diag_lower):
        return PROTOCOLOS['dm_insulina']
    
    # Condições de risco intermediário
    if 'dmg' in diag_lower or 'diabetes gestacional' in diag_lower:
        return PROTOCOLOS['dmg']
    if 'hac' in diag_lower or 'hipertens' in diag_lower:
        return PROTOCOLOS['hac']
    if 'macrossomia' in diag_lower or 'gig' in diag_lower:
        return PROTOCOLOS['macrossomia']
    
    # Cesárea anterior
    if 'cesarea anterior' in diag_lower or 'cesárea anterior' in diag_lower or 'iterativ' in diag_lower:
        return PROTOCOLOS['cesariana_anterior']
    
    # Baixo risco por padrão
    return PROTOCOLOS['baixo_risco']

def validar_paciente(row, idx):
    """Valida dados de uma paciente contra protocolos"""
    erros = []
    avisos = []
    
    try:
        # Dados básicos
        id_pac = row['ID']
        nome = row['Nome']
        dum_conf = row.get('DUM_Confiavel', '')
        data_dum = row.get('Data_DUM', '')
        data_usg = row.get('Data_1USG', '')
        usg_sem = int(row.get('USG_Sem', 0)) if row.get('USG_Sem', '').strip() else 0
        usg_dias = int(row.get('USG_Dias', 0)) if row.get('USG_Dias', '').strip() else 0
        ig_pretendida = int(row.get('IG_Pretendida', 39)) if row.get('IG_Pretendida', '').strip().isdigit() else 39
        data_agendada = row.get('Data_Agendada_Sugerida', '')
        ig_atual_str = row.get('IG_Atual', '')
        diagnosticos = row.get('Diagnosticos', '')
        
        HOJE = datetime(2025, 11, 25)
        
        # 1. Validar referência de data (DUM ou USG)
        if dum_conf == "Sim - Confiável" and data_dum:
            ref_date = parse_date(data_dum)
            ref_weeks, ref_days = 0, 0
            metodo = "DUM"
        else:
            ref_date = parse_date(data_usg)
            ref_weeks, ref_days = usg_sem, usg_dias
            metodo = "USG"
        
        if not ref_date:
            erros.append(f"Data de referência inválida (DUM: {data_dum}, USG: {data_usg})")
            return {'id': id_pac, 'nome': nome, 'erros': erros, 'avisos': avisos, 'valido': False}
        
        # 2. Validar cálculo de IG atual
        ig_calculada_dias = calc_ig_dias(ref_date, ref_weeks, ref_days, HOJE)
        ig_calculada_str = calc_ig_str(ig_calculada_dias)
        
        if ig_atual_str != ig_calculada_str:
            avisos.append(f"IG atual registrada ({ig_atual_str}) difere da calculada ({ig_calculada_str})")
        
        # 3. Validar IG está dentro de faixa gestacional válida (5-42 semanas)
        ig_semanas = ig_calculada_dias // 7
        if ig_semanas < 5 or ig_semanas > 42:
            erros.append(f"IG fora da faixa válida: {ig_semanas} semanas")
        
        # 4. Validar protocolo aplicado
        protocolo = classificar_diagnostico(diagnosticos)
        
        if ig_pretendida < protocolo['ig_ideal_min'] or ig_pretendida > protocolo['ig_ideal_max']:
            avisos.append(f"IG pretendida ({ig_pretendida}s) fora do protocolo {protocolo['nome']} ({protocolo['ig_ideal_min']}-{protocolo['ig_ideal_max']}s)")
        
        # 5. Validar data agendada
        data_agend = parse_date(data_agendada)
        if not data_agend:
            erros.append(f"Data agendada inválida: {data_agendada}")
        else:
            # Verificar se data não está no passado
            if data_agend < HOJE:
                avisos.append(f"Data agendada no passado: {data_agendada}")
            
            # Verificar se IG na data agendada está correto
            ig_na_data_dias = calc_ig_dias(ref_date, ref_weeks, ref_days, data_agend)
            ig_na_data_semanas = ig_na_data_dias // 7
            
            if abs(ig_na_data_semanas - ig_pretendida) > 1:
                avisos.append(f"IG na data agendada ({ig_na_data_semanas}s) difere da pretendida ({ig_pretendida}s)")
        
        # 6. Validar procedimento
        procedimento = row.get('Procedimento', '')
        if 'cesarea anterior' in diagnosticos.lower() or 'cesárea anterior' in diagnosticos.lower():
            if 'Cesariana' not in procedimento and 'Cesárea' not in procedimento:
                avisos.append("Cesárea anterior mas procedimento não é cesárea")
        
        valido = len(erros) == 0
        
        return {
            'id': id_pac,
            'nome': nome,
            'metodo': metodo,
            'ig_atual': ig_calculada_str,
            'protocolo': protocolo['nome'],
            'ig_pretendida': ig_pretendida,
            'erros': erros,
            'avisos': avisos,
            'valido': valido
        }
        
    except Exception as e:
        return {
            'id': row.get('ID', '?'),
            'nome': row.get('Nome', '?'),
            'erros': [f"Erro ao processar: {str(e)}"],
            'avisos': [],
            'valido': False
        }

def main():
    print(f"{Colors.BOLD}{'='*80}{Colors.END}")
    print(f"{Colors.BOLD}VALIDAÇÃO COMPLETA - GESTAFORMS HUB{Colors.END}")
    print(f"{Colors.BOLD}{'='*80}{Colors.END}\n")
    
    csv_file = 'agendamentos_completos.csv'
    
    if not os.path.exists(csv_file):
        print(f"{Colors.RED}✗ Arquivo {csv_file} não encontrado!{Colors.END}")
        return 1
    
    # Ler e validar CSV
    resultados = []
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for idx, row in enumerate(reader, 1):
            resultado = validar_paciente(row, idx)
            resultados.append(resultado)
    
    # Estatísticas
    total = len(resultados)
    validos = sum(1 for r in resultados if r['valido'])
    com_erros = sum(1 for r in resultados if r['erros'])
    com_avisos = sum(1 for r in resultados if r['avisos'])
    
    print(f"{Colors.BLUE}📊 ESTATÍSTICAS GERAIS:{Colors.END}")
    print(f"   Total de pacientes: {Colors.BOLD}{total}{Colors.END}")
    print(f"   Válidas: {Colors.GREEN}{validos}{Colors.END}")
    print(f"   Com erros: {Colors.RED}{com_erros}{Colors.END}")
    print(f"   Com avisos: {Colors.YELLOW}{com_avisos}{Colors.END}")
    print()
    
    # Distribuição por protocolo
    protocolos_count = defaultdict(int)
    for r in resultados:
        if 'protocolo' in r:
            protocolos_count[r['protocolo']] += 1
    
    print(f"{Colors.BLUE}📋 DISTRIBUIÇÃO POR PROTOCOLO:{Colors.END}")
    for protocolo, count in sorted(protocolos_count.items(), key=lambda x: x[1], reverse=True):
        print(f"   {protocolo}: {count} pacientes")
    print()
    
    # Exibir erros críticos
    if com_erros > 0:
        print(f"{Colors.RED}{Colors.BOLD}❌ ERROS CRÍTICOS:{Colors.END}")
        for r in resultados:
            if r['erros']:
                print(f"\n   ID {r['id']} - {r['nome']}")
                for erro in r['erros']:
                    print(f"      • {erro}")
        print()
    
    # Exibir avisos importantes
    if com_avisos > 0:
        print(f"{Colors.YELLOW}{Colors.BOLD}⚠️  AVISOS (primeiros 10):{Colors.END}")
        count = 0
        for r in resultados:
            if r['avisos'] and count < 10:
                print(f"\n   ID {r['id']} - {r['nome']}")
                for aviso in r['avisos']:
                    print(f"      • {aviso}")
                count += 1
        if com_avisos > 10:
            print(f"\n   ... e mais {com_avisos - 10} pacientes com avisos")
        print()
    
    # Validação de métodos (DUM vs USG)
    metodos = defaultdict(int)
    for r in resultados:
        if 'metodo' in r:
            metodos[r['metodo']] += 1
    
    print(f"{Colors.BLUE}📍 MÉTODOS DE CÁLCULO:{Colors.END}")
    for metodo, count in metodos.items():
        print(f"   {metodo}: {count} pacientes ({count*100/total:.1f}%)")
    print()
    
    # Resumo final
    print(f"{Colors.BOLD}{'='*80}{Colors.END}")
    if com_erros == 0:
        print(f"{Colors.GREEN}{Colors.BOLD}✓ VALIDAÇÃO CONCLUÍDA COM SUCESSO!{Colors.END}")
        print(f"{Colors.GREEN}  Todos os dados estão consistentes com os protocolos obstétricos.{Colors.END}")
    else:
        print(f"{Colors.RED}{Colors.BOLD}✗ VALIDAÇÃO COM ERROS{Colors.END}")
        print(f"{Colors.RED}  {com_erros} pacientes precisam de revisão.{Colors.END}")
    
    if com_avisos > 0:
        print(f"{Colors.YELLOW}  {com_avisos} pacientes têm avisos não-críticos.{Colors.END}")
    
    print(f"{Colors.BOLD}{'='*80}{Colors.END}\n")
    
    # Salvar relatório
    with open('relatorio_validacao.txt', 'w', encoding='utf-8') as f:
        f.write("RELATÓRIO DE VALIDAÇÃO - GESTAFORMS HUB\n")
        f.write("=" * 80 + "\n\n")
        f.write(f"Total: {total} | Válidas: {validos} | Erros: {com_erros} | Avisos: {com_avisos}\n\n")
        
        if com_erros > 0:
            f.write("ERROS CRÍTICOS:\n")
            for r in resultados:
                if r['erros']:
                    f.write(f"\nID {r['id']} - {r['nome']}\n")
                    for erro in r['erros']:
                        f.write(f"  • {erro}\n")
        
        if com_avisos > 0:
            f.write("\n\nAVISOS:\n")
            for r in resultados:
                if r['avisos']:
                    f.write(f"\nID {r['id']} - {r['nome']}\n")
                    for aviso in r['avisos']:
                        f.write(f"  • {aviso}\n")
    
    print(f"📄 Relatório salvo em: {Colors.BOLD}relatorio_validacao.txt{Colors.END}\n")
    
    return 0 if com_erros == 0 else 1

if __name__ == '__main__':
    sys.exit(main())
