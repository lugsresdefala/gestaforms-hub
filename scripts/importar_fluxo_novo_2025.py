#!/usr/bin/env python3
"""
Script para importar Forms de parto - Fluxo novo 2.025 (2).CSV
Processa 55 pacientes com IDs 2550-2604 + 1 registro incompleto
"""

import os
import sys
import csv
from datetime import datetime
from supabase import create_client, Client

# Configuração Supabase
SUPABASE_URL = 'https://uoyzfzzjzhvcxfmpmufz.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVveXpmenpqemh2Y3hmbXBtdWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MjE0NzQsImV4cCI6MjA3Nzk5NzQ3NH0.jcvNzZddNUZAguCxiJTDjFLbyq2viLrb2MKs0-y2fNE'

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Caminho do arquivo CSV (consolidado no workspace)
CSV_PATH = "/workspaces/gestaforms-hub/public/csv-temp/fluxo_novo_2025_CONSOLIDADO.csv"

def parse_date(date_str):
    """Converte string de data em formato ISO"""
    if not date_str or date_str.strip() == '':
        return None
    
    # Formatos: DD/MM/YYYY ou MM/DD/YYYY
    for fmt in ['%d/%m/%Y', '%m/%d/%Y', '%d/%m/%y', '%m/%d/%y']:
        try:
            return datetime.strptime(date_str.strip(), fmt).date().isoformat()
        except:
            continue
    return None

def clean_text(text):
    """Remove caracteres especiais e normaliza texto"""
    if not text:
        return None
    return text.strip() if text.strip() else None

def parse_ig_formatada(ig_str):
    """Extrai semanas e dias de IG formatada (ex: '34s 0d' -> 34 semanas, 0 dias)"""
    if not ig_str:
        return None, None
    
    # Padrão: "34s 0d" ou "34s0d"
    import re
    match = re.search(r'(\d+)s\s*(\d+)d', ig_str.lower())
    if match:
        return int(match.group(1)), int(match.group(2))
    
    # Padrão: apenas semanas "34s"
    match = re.search(r'(\d+)s', ig_str.lower())
    if match:
        return int(match.group(1)), 0
    
    return None, None

def processar_csv():
    """Processa CSV e importa para Supabase"""
    
    print(f"📂 Lendo arquivo: {CSV_PATH}")
    
    if not os.path.exists(CSV_PATH):
        print(f"❌ Arquivo não encontrado: {CSV_PATH}")
        return
    
    registros_processados = 0
    registros_inseridos = 0
    erros = []
    
    with open(CSV_PATH, 'r', encoding='utf-8-sig', errors='replace') as f:
        # Detecta delimitador (semicolon)
        reader = csv.DictReader(f, delimiter=';')
        
        for idx, row in enumerate(reader, start=2):  # linha 2 = primeira após header
            
            # Pula linhas vazias
            if not row.get('ID') or row.get('ID').strip() == '':
                continue
            
            # Pula registro incompleto COSMERIA (sem ID)
            if row.get('Nome completo da paciente', '').strip().upper() == 'COSMERIA RIBEIRO DE SANTANA':
                if not row.get('ID'):
                    print(f"⚠️  Linha {idx}: COSMERIA sem ID - pulando")
                    continue
            
            registros_processados += 1
            
            try:
                # Extrai dados principais
                id_form = clean_text(row.get('ID'))
                nome_paciente = clean_text(row.get('Nome completo da paciente'))
                data_nascimento = parse_date(row.get('Data de nascimento da gestante'))
                carteirinha = clean_text(row.get('CARTEIRINHA (tem na guia que sai do sistema - não inserir CPF)'))
                
                # Paridade
                gestacoes = clean_text(row.get('Número de Gestações'))
                cesareas = clean_text(row.get('Número de Partos Cesáreas'))
                normais = clean_text(row.get('Número de Partos Normais'))
                abortos = clean_text(row.get('Número de Abortos'))
                
                # Contato
                telefones = clean_text(row.get('Informe dois telefones de contato com o paciente para que ele seja contato pelo hospital'))
                email = clean_text(row.get('E-mail da paciente'))
                
                # Procedimento
                procedimento = clean_text(row.get('Informe o procedimento(s) que será(ão) realizado(s)'))
                
                # DUM e USG
                dum_confiavel = clean_text(row.get('DUM'))
                data_dum = parse_date(row.get('Data da DUM'))
                data_usg = parse_date(row.get('Data do Primeiro USG'))
                usg_semanas = clean_text(row.get('Numero de semanas no primeiro USG (inserir apenas o numero) - considerar o exame entre 8 e 12 semanas, embrião com BCF'))
                usg_dias = clean_text(row.get('Numero de dias no primeiro USG (inserir apenas o numero)- considerar o exame entre 8 e 12 semanas, embrião com BCF'))
                
                # Diagnósticos
                indicacao = clean_text(row.get('Informe a indicação do procedimento'))
                medicacoes = clean_text(row.get('Indique qual medicação e dosagem que a paciente utiliza.'))
                diagnosticos_maternos = clean_text(row.get('Indique os Diagnósticos Obstétricos Maternos ATUAIS ( ex. DMG com/sem insulina, Pre-eclampsia, Hipertensão gestacional, TPP na gestação atual, RPMO na gestação atual, hipotireoidismo gestacional, etc)'))
                diagnosticos_fetais = clean_text(row.get('Indique os Diagnósticos Fetais (ex: RCF, Oligo/Polidramnio, Macrossomia, malformação fetal - especificar, cardiopatia fetal - especificar, etc)'))
                historia_obstetrica = clean_text(row.get('Informe História Obstétrica Prévia Relevante e Diagnósticos clínicos cirúrgicos (ex. Aborto tardio, parto prematuro, óbito fetal, DMG, macrossomia, eclampsia, pré eclampsia precoce, cardiopatia - esp'))
                
                # Maternidade
                maternidade = clean_text(row.get('Maternidade que a paciente deseja'))
                medico_responsavel = clean_text(row.get('Médico responsável pelo agendamento'))
                
                # DPP
                dpp_dum = parse_date(row.get('DPP DUM'))
                dpp_usg = parse_date(row.get('DPP USG'))
                
                # Dados calculados
                ig_atual_dias = clean_text(row.get('IG_Atual_Dias'))
                ig_atual_formatada = clean_text(row.get('IG_Atual_Formatada'))
                metodo_ig = clean_text(row.get('Metodo_IG'))
                ig_recomendada_dias = clean_text(row.get('IG_Recomendada_Dias'))
                data_ideal_calculada = parse_date(row.get('Data_Ideal_Calculada'))
                data_agendada = parse_date(row.get('Data_Agendada'))
                status_verificacao = clean_text(row.get('Status_Verificacao'))
                
                # Observações
                observacoes = clean_text(row.get('Observações'))
                
                # Parse IG atual
                ig_semanas, ig_dias = parse_ig_formatada(ig_atual_formatada)
                
                # Monta registro para Supabase
                registro = {
                    'carteirinha': carteirinha,
                    'nome_completo': nome_paciente,
                    'data_nascimento': data_nascimento,
                    'numero_gestacoes': int(gestacoes) if gestacoes and gestacoes.isdigit() else 0,
                    'numero_partos_cesareas': int(cesareas) if cesareas and cesareas.isdigit() else 0,
                    'numero_partos_normais': int(normais) if normais and normais.isdigit() else 0,
                    'numero_abortos': int(abortos) if abortos and abortos.isdigit() else 0,
                    'telefones': telefones or 'Não informado',
                    'procedimentos': [procedimento] if procedimento else ['Não informado'],
                    'dum_status': dum_confiavel or 'Não sabe',
                    'data_dum': data_dum,
                    'data_primeiro_usg': data_usg or data_dum,
                    'semanas_usg': int(usg_semanas) if usg_semanas and usg_semanas.isdigit() else 0,
                    'dias_usg': int(usg_dias) if usg_dias and usg_dias.isdigit() and int(usg_dias) <= 6 else 0,
                    'usg_recente': clean_text(row.get('USG mais recente (Inserir data, apresentação, PFE com percentil, ILA/MBV e doppler)')) or 'Não informado',
                    'ig_pretendida': clean_text(row.get('Informe IG pretendida para o procedimento')) or 'Não informado',
                    'indicacao_procedimento': indicacao or 'Não informado',
                    'medicacao': medicacoes,
                    'diagnosticos_maternos': diagnosticos_maternos,
                    'placenta_previa': 'Não',
                    'diagnosticos_fetais': diagnosticos_fetais,
                    'historia_obstetrica': historia_obstetrica,
                    'necessidade_uti_materna': 'Não',
                    'necessidade_reserva_sangue': 'Não',
                    'maternidade': maternidade or 'Não informado',
                    'medico_responsavel': medico_responsavel or 'Não informado',
                    'centro_clinico': maternidade or 'Não informado',
                    'email_paciente': email or 'nao.informado@email.com',
                    'data_agendamento_calculada': data_ideal_calculada or data_agendada,
                    'idade_gestacional_calculada': ig_atual_formatada,
                    'observacoes_agendamento': observacoes,
                    'created_at': datetime.now().isoformat()
                }
                
                # Insere no Supabase
                result = supabase.table('agendamentos_obst').insert(registro).execute()
                
                if result.data:
                    registros_inseridos += 1
                    print(f"✅ Linha {idx}: {nome_paciente} (ID {id_form}) - {maternidade}")
                else:
                    erros.append(f"Linha {idx}: Erro ao inserir {nome_paciente}")
                    print(f"❌ Linha {idx}: Falha ao inserir {nome_paciente}")
                
            except Exception as e:
                erros.append(f"Linha {idx}: {str(e)}")
                print(f"❌ Linha {idx}: ERRO - {str(e)}")
    
    # Relatório final
    print("\n" + "="*60)
    print(f"📊 RELATÓRIO DE IMPORTAÇÃO")
    print("="*60)
    print(f"✅ Registros processados: {registros_processados}")
    print(f"✅ Registros inseridos: {registros_inseridos}")
    print(f"❌ Erros: {len(erros)}")
    
    if erros:
        print("\n🔴 ERROS DETALHADOS:")
        for erro in erros[:10]:  # Primeiros 10 erros
            print(f"  - {erro}")

if __name__ == '__main__':
    print("🚀 Iniciando importação: Fluxo novo 2.025")
    print("="*60)
    processar_csv()
