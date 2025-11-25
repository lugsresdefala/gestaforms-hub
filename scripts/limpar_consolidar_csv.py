#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para limpar, padronizar e consolidar arquivos CSV de agendamentos
Autor: Sistema GestaForms
Data: 2025-11-25
"""

import csv
import re
from datetime import datetime
from pathlib import Path

def limpar_texto(texto):
    """Remove caracteres especiais e limpa o texto"""
    if not texto:
        return ""
    # Remove ? e � no início/fim
    texto = texto.strip()
    texto = re.sub(r'^[?¿�]+|[?¿�]+$', '', texto)
    # Remove múltiplos espaços
    texto = re.sub(r'\s+', ' ', texto)
    return texto.strip()

def padronizar_data(data_str):
    """Padroniza datas para formato DD/MM/YYYY"""
    if not data_str or data_str in ['', '#VALOR!', 'ERRO']:
        return ""
    
    # Tenta vários formatos
    formatos = [
        r'(\d{1,2})/(\d{1,2})/(\d{4})',  # DD/MM/YYYY ou MM/DD/YYYY
        r'(\d{4})-(\d{2})-(\d{2})',      # YYYY-MM-DD
    ]
    
    for formato in formatos:
        match = re.match(formato, data_str)
        if match:
            if formato == formatos[0]:  # DD/MM/YYYY
                dia, mes, ano = match.groups()
                # Se mês > 12, inverter
                if int(mes) > 12:
                    dia, mes = mes, dia
                return f"{dia.zfill(2)}/{mes.zfill(2)}/{ano}"
            elif formato == formatos[1]:  # YYYY-MM-DD
                ano, mes, dia = match.groups()
                return f"{dia}/{mes}/{ano}"
    
    return data_str

def padronizar_telefone(telefone):
    """Padroniza telefones removendo caracteres especiais"""
    if not telefone:
        return ""
    # Remove tudo exceto números e /
    telefone = re.sub(r'[^\d/]', '', telefone)
    return telefone

def padronizar_procedimento(proc):
    """Padroniza nomes de procedimentos"""
    if not proc:
        return "Não especificado"
    
    proc_lower = proc.lower()
    
    if 'cesár' in proc_lower or 'cesar' in proc_lower:
        if 'laq' in proc_lower or 'lt' in proc_lower or 'diu' in proc_lower:
            return "Cesárea + Laqueadura"
        return "Cesárea"
    elif 'indu' in proc_lower:
        return "Indução Programada"
    elif 'laq' in proc_lower:
        return "Laqueadura tubária"
    elif 'cerc' in proc_lower:
        return "Cerclagem"
    
    return limpar_texto(proc)

def padronizar_maternidade(mat):
    """Padroniza nomes de maternidades"""
    if not mat:
        return "Não especificada"
    
    mat_lower = mat.lower()
    
    if 'notre' in mat_lower:
        return "NotreCare"
    elif 'salva' in mat_lower:
        return "Salvalus"
    elif 'cruz' in mat_lower:
        return "Cruzeiro do Sul"
    elif 'guarulhos' in mat_lower:
        return "Guarulhos"
    elif 'ros' in mat_lower and 'rio' in mat_lower:
        return "Rosário"
    
    return limpar_texto(mat)

def processar_forms_parto(arquivo_entrada):
    """Processa o arquivo Forms de Parto"""
    registros = []
    
    with open(arquivo_entrada, 'r', encoding='utf-8', errors='ignore') as f:
        leitor = csv.reader(f, delimiter=';')
        cabecalho = next(leitor)  # Pula cabeçalho
        
        for idx, linha in enumerate(leitor, start=2):
            if len(linha) < 40 or not linha[0]:
                continue
            
            try:
                # Extrai e limpa dados
                id_form = linha[0].strip()
                nome = limpar_texto(linha[5])
                carteirinha = limpar_texto(linha[7])
                
                if not nome or not carteirinha:
                    print(f"Linha {idx}: Nome ou carteirinha ausente - IGNORADO")
                    continue
                
                data_nasc = padronizar_data(linha[6])
                telefones = padronizar_telefone(linha[12])
                procedimento = padronizar_procedimento(linha[13])
                maternidade = padronizar_maternidade(linha[30])
                medico = limpar_texto(linha[31])
                centro_clinico = limpar_texto(linha[32])
                email = limpar_texto(linha[33])
                indicacao = limpar_texto(linha[22])
                diag_maternos = limpar_texto(linha[24])
                diag_fetais = limpar_texto(linha[26])
                
                # Datas
                dum_status = limpar_texto(linha[14])
                data_dum = padronizar_data(linha[15])
                data_usg = padronizar_data(linha[16])
                data_agendada = padronizar_data(linha[37] if len(linha) > 37 else "")
                
                # Números
                gestacoes = linha[8].strip() or "0"
                cesareas = linha[9].strip() or "0"
                normais = linha[10].strip() or "0"
                abortos = linha[11].strip() or "0"
                
                registro = {
                    'id': f"FORMS-{id_form}",
                    'nome_completo': nome,
                    'carteirinha': carteirinha,
                    'data_nascimento': data_nasc,
                    'telefones': telefones,
                    'email': email,
                    'gestacoes': gestacoes,
                    'partos_cesareas': cesareas,
                    'partos_normais': normais,
                    'abortos': abortos,
                    'procedimento': procedimento,
                    'maternidade': maternidade,
                    'medico_responsavel': medico,
                    'centro_clinico': centro_clinico,
                    'indicacao': indicacao or "Não informado",
                    'diagnosticos_maternos': diag_maternos or "Não informado",
                    'diagnosticos_fetais': diag_fetais or "Não informado",
                    'dum_status': dum_status,
                    'data_dum': data_dum,
                    'data_primeiro_usg': data_usg,
                    'data_agendada': data_agendada,
                    'origem': 'Forms de Parto'
                }
                
                registros.append(registro)
                print(f"Linha {idx}: {nome} - OK")
                
            except Exception as e:
                print(f"Linha {idx}: ERRO - {str(e)}")
                continue
    
    return registros

def gerar_csv_consolidado(registros, arquivo_saida):
    """Gera CSV consolidado e limpo"""
    campos = [
        'id', 'nome_completo', 'carteirinha', 'data_nascimento', 'telefones', 'email',
        'gestacoes', 'partos_cesareas', 'partos_normais', 'abortos',
        'procedimento', 'maternidade', 'medico_responsavel', 'centro_clinico',
        'indicacao', 'diagnosticos_maternos', 'diagnosticos_fetais',
        'dum_status', 'data_dum', 'data_primeiro_usg', 'data_agendada', 'origem'
    ]
    
    with open(arquivo_saida, 'w', encoding='utf-8', newline='') as f:
        escritor = csv.DictWriter(f, fieldnames=campos)
        escritor.writeheader()
        escritor.writerows(registros)
    
    print(f"\n✅ Arquivo consolidado gerado: {arquivo_saida}")
    print(f"   Total de registros: {len(registros)}")

def gerar_relatorio(registros):
    """Gera relatório estatístico"""
    print("\n" + "="*60)
    print("RELATÓRIO DE CONSOLIDAÇÃO")
    print("="*60)
    
    print(f"\n📊 Total de registros: {len(registros)}")
    
    # Por maternidade
    maternidades = {}
    for reg in registros:
        mat = reg['maternidade']
        maternidades[mat] = maternidades.get(mat, 0) + 1
    
    print("\n🏥 Por Maternidade:")
    for mat, qtd in sorted(maternidades.items(), key=lambda x: x[1], reverse=True):
        print(f"   {mat}: {qtd}")
    
    # Por procedimento
    procedimentos = {}
    for reg in registros:
        proc = reg['procedimento']
        procedimentos[proc] = procedimentos.get(proc, 0) + 1
    
    print("\n💉 Por Procedimento:")
    for proc, qtd in sorted(procedimentos.items(), key=lambda x: x[1], reverse=True):
        print(f"   {proc}: {qtd}")
    
    # Com data agendada
    com_data = sum(1 for r in registros if r['data_agendada'])
    print(f"\n📅 Com data agendada: {com_data} ({com_data/len(registros)*100:.1f}%)")
    
    # Com email
    com_email = sum(1 for r in registros if r['email'])
    print(f"📧 Com email: {com_email} ({com_email/len(registros)*100:.1f}%)")
    
    print("\n" + "="*60)

if __name__ == "__main__":
    print("🔄 Iniciando limpeza e consolidação de CSV...")
    print()
    
    # Arquivo de entrada (você pode mudar o caminho)
    arquivo_entrada = r"C:\Users\t_tiago.oliveira\Downloads\Forms de parto - anteriores.CSV"
    arquivo_saida = r"C:\Users\t_tiago.oliveira\Downloads\Forms_CONSOLIDADO.csv"
    
    # Processa
    print(f"📂 Lendo: {arquivo_entrada}")
    registros = processar_forms_parto(arquivo_entrada)
    
    # Gera CSV consolidado
    gerar_csv_consolidado(registros, arquivo_saida)
    
    # Gera relatório
    gerar_relatorio(registros)
    
    print("\n✅ CONCLUÍDO!")
