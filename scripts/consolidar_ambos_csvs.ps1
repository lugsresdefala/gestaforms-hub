# Script PowerShell para consolidar AMBOS os arquivos CSV
# Encoding: UTF-8

$arquivo1 = "C:\Users\t_tiago.oliveira\Downloads\Forms de parto - anteriores.CSV"
$arquivo2 = "C:\Users\t_tiago.oliveira\Downloads\Forms de parto - Fluxo novo 2.025 (2).CSV"
$arquivoSaida = "C:\Users\t_tiago.oliveira\Downloads\Forms_CONSOLIDADO_COMPLETO.csv"

Write-Host "`n🔄 CONSOLIDANDO AMBOS OS ARQUIVOS CSV`n" -ForegroundColor Cyan

# Funções auxiliares
function Limpar-Texto {
    param($texto)
    if ([string]::IsNullOrWhiteSpace($texto)) { return "" }
    $texto = $texto.Trim()
    $texto = $texto -replace '^[?¿�]+|[?¿�]+$', ''
    $texto = $texto -replace '\s+', ' '
    return $texto.Trim()
}

function Padronizar-Data {
    param($dataStr)
    if ([string]::IsNullOrWhiteSpace($dataStr) -or $dataStr -eq '#VALOR!' -or $dataStr -eq 'ERRO') {
        return ""
    }
    
    if ($dataStr -match '(\d{1,2})/(\d{1,2})/(\d{4})') {
        $dia = $Matches[1]
        $mes = $Matches[2]
        $ano = $Matches[3]
        
        if ([int]$mes -gt 12) {
            $temp = $dia
            $dia = $mes
            $mes = $temp
        }
        
        return "$($dia.PadLeft(2,'0'))/$($mes.PadLeft(2,'0'))/$ano"
    }
    
    return $dataStr
}

$todosRegistros = @()

# ============================================================
# PROCESSAR ARQUIVO 1 - Forms de parto - anteriores.CSV
# ============================================================
Write-Host "📂 Processando: Forms de parto - anteriores.CSV" -ForegroundColor Yellow

$conteudo1 = Get-Content $arquivo1 -Encoding UTF8 -Raw
$linhas1 = $conteudo1 -split "`n"
$contador1 = 0

foreach ($linha in $linhas1[1..($linhas1.Count-1)]) {
    if ([string]::IsNullOrWhiteSpace($linha)) { continue }
    
    $cols = $linha -split ';'
    if ($cols.Count -lt 40 -or [string]::IsNullOrWhiteSpace($cols[0])) { continue }
    
    try {
        $id = "ANT-" + $cols[0].Trim()
        $nome = Limpar-Texto $cols[5]
        $carteirinha = Limpar-Texto $cols[7]
        
        if ([string]::IsNullOrWhiteSpace($nome) -or [string]::IsNullOrWhiteSpace($carteirinha)) {
            continue
        }
        
        $registro = [PSCustomObject]@{
            ID = $id
            Nome_Completo = $nome
            Carteirinha = $carteirinha
            Numero_Gestacoes = if ($cols[8]) { $cols[8].Trim() } else { "0" }
            Numero_Partos_Cesareas = if ($cols[9]) { $cols[9].Trim() } else { "0" }
            Numero_Partos_Normais = if ($cols[10]) { $cols[10].Trim() } else { "0" }
            Numero_Abortos = if ($cols[11]) { $cols[11].Trim() } else { "0" }
            Telefones = ($cols[12] -replace '[^\d/\s]', '').Trim()
            Procedimentos = Limpar-Texto $cols[13]
            DUM_Status = Limpar-Texto $cols[14]
            Data_DUM = Padronizar-Data $cols[15]
            Data_Primeiro_USG = Padronizar-Data $cols[16]
            Semanas_USG = if ($cols[17]) { $cols[17].Trim() } else { "" }
            Dias_USG = if ($cols[18]) { $cols[18].Trim() } else { "" }
            USG_Recente = Limpar-Texto $cols[19]
            Indicacao = Limpar-Texto $cols[22]
            Medicacao = Limpar-Texto $cols[23]
            Diagnosticos_Maternos = Limpar-Texto $cols[24]
            Placenta_Previa = Limpar-Texto $cols[25]
            Diagnosticos_Fetais = Limpar-Texto $cols[26]
            Historia_Obstetrica = Limpar-Texto $cols[27]
            Necessidade_UTI = Limpar-Texto $cols[28]
            Necessidade_Sangue = Limpar-Texto $cols[29]
            Maternidade = Limpar-Texto $cols[30]
            Email = Limpar-Texto $cols[33]
            DPP_DUM = if ($cols.Count -gt 34) { Padronizar-Data $cols[34] } else { "" }
            DPP_USG = if ($cols.Count -gt 35) { Padronizar-Data $cols[35] } else { "" }
            IG_Atual = ""
            Metodo_IG = ""
            IG_Recomendada = ""
            Data_Ideal_Inicio = ""
            Data_Ideal_Limite = ""
            Data_Agendada = if ($cols.Count -gt 37) { Padronizar-Data $cols[37] } else { "" }
            IG_na_Data_Agendada = ""
            Intervalo = ""
            Status_Verificacao = "Pendente"
            Origem = "Arquivo Anterior"
        }
        
        $todosRegistros += $registro
        $contador1++
        
    } catch {
        continue
    }
}

Write-Host "   ✅ $contador1 registros processados`n" -ForegroundColor Green

# ============================================================
# PROCESSAR ARQUIVO 2 - Fluxo novo 2.025
# ============================================================
Write-Host "📂 Processando: Forms de parto - Fluxo novo 2.025 (2).CSV" -ForegroundColor Yellow

$conteudo2 = Get-Content $arquivo2 -Encoding UTF8 -Raw
$linhas2 = $conteudo2 -split "`n"
$contador2 = 0

foreach ($linha in $linhas2[1..($linhas2.Count-1)]) {
    if ([string]::IsNullOrWhiteSpace($linha)) { continue }
    
    $cols = $linha -split ';'
    if ($cols.Count -lt 50 -or [string]::IsNullOrWhiteSpace($cols[0])) { continue }
    
    try {
        $id = "NOVO-" + $cols[0].Trim()
        $nome = Limpar-Texto $cols[5]
        $carteirinha = Limpar-Texto $cols[7]
        
        if ([string]::IsNullOrWhiteSpace($nome) -or [string]::IsNullOrWhiteSpace($carteirinha)) {
            continue
        }
        
        # Extrair IG_Atual (coluna 47 = IG_Atual_Formatada)
        $igAtual = if ($cols.Count -gt 47) { Limpar-Texto $cols[47] } else { "" }
        
        # Extrair Metodo_IG (coluna 48)
        $metodoIG = if ($cols.Count -gt 48) { Limpar-Texto $cols[48] } else { "" }
        
        # Extrair IG_Recomendada (coluna 50)
        $igRecomendada = if ($cols.Count -gt 50) { Limpar-Texto $cols[50] } else { "" }
        
        # Data_Ideal_Calculada (coluna 51)
        $dataIdeal = if ($cols.Count -gt 51) { Padronizar-Data $cols[51] } else { "" }
        
        # Data_Agendada (coluna 52)
        $dataAgendada = if ($cols.Count -gt 52) { Padronizar-Data $cols[52] } else { "" }
        
        # IG_na_Data_Agendada (coluna 53)
        $igNaData = if ($cols.Count -gt 53) { Limpar-Texto $cols[53] } else { "" }
        
        # Intervalo (coluna 54)
        $intervalo = if ($cols.Count -gt 54) { Limpar-Texto $cols[54] } else { "" }
        
        # Status_Verificacao (coluna 55)
        $status = if ($cols.Count -gt 55) { Limpar-Texto $cols[55] } else { "Pendente" }
        
        $registro = [PSCustomObject]@{
            ID = $id
            Nome_Completo = $nome
            Carteirinha = $carteirinha
            Numero_Gestacoes = if ($cols[8]) { $cols[8].Trim() } else { "0" }
            Numero_Partos_Cesareas = if ($cols[9]) { $cols[9].Trim() } else { "0" }
            Numero_Partos_Normais = if ($cols[10]) { $cols[10].Trim() } else { "0" }
            Numero_Abortos = if ($cols[11]) { $cols[11].Trim() } else { "0" }
            Telefones = ($cols[12] -replace '[^\d/\s]', '').Trim()
            Procedimentos = Limpar-Texto $cols[13]
            DUM_Status = Limpar-Texto $cols[14]
            Data_DUM = Padronizar-Data $cols[15]
            Data_Primeiro_USG = Padronizar-Data $cols[16]
            Semanas_USG = if ($cols[17]) { $cols[17].Trim() } else { "" }
            Dias_USG = if ($cols[18]) { $cols[18].Trim() } else { "" }
            USG_Recente = Limpar-Texto $cols[19]
            Indicacao = Limpar-Texto $cols[22]
            Medicacao = Limpar-Texto $cols[23]
            Diagnosticos_Maternos = Limpar-Texto $cols[24]
            Placenta_Previa = Limpar-Texto $cols[25]
            Diagnosticos_Fetais = Limpar-Texto $cols[26]
            Historia_Obstetrica = Limpar-Texto $cols[27]
            Necessidade_UTI = Limpar-Texto $cols[28]
            Necessidade_Sangue = Limpar-Texto $cols[29]
            Maternidade = Limpar-Texto $cols[30]
            Email = Limpar-Texto $cols[31]
            DPP_DUM = if ($cols.Count -gt 32) { Padronizar-Data $cols[32] } else { "" }
            DPP_USG = if ($cols.Count -gt 33) { Padronizar-Data $cols[33] } else { "" }
            IG_Atual = $igAtual
            Metodo_IG = $metodoIG
            IG_Recomendada = $igRecomendada
            Data_Ideal_Inicio = $dataIdeal
            Data_Ideal_Limite = ""
            Data_Agendada = $dataAgendada
            IG_na_Data_Agendada = $igNaData
            Intervalo = $intervalo
            Status_Verificacao = $status
            Origem = "Fluxo Novo 2025"
        }
        
        $todosRegistros += $registro
        $contador2++
        
    } catch {
        continue
    }
}

Write-Host "   ✅ $contador2 registros processados`n" -ForegroundColor Green

# ============================================================
# GERAR CSV CONSOLIDADO
# ============================================================
Write-Host "💾 Gerando CSV consolidado..." -ForegroundColor Cyan

$todosRegistros | Export-Csv -Path $arquivoSaida -Encoding UTF8 -NoTypeInformation

Write-Host "   ✅ Arquivo gerado: $arquivoSaida`n" -ForegroundColor Green

# ============================================================
# RELATÓRIO
# ============================================================
Write-Host ("=" * 70) -ForegroundColor Cyan
Write-Host "RELATÓRIO DE CONSOLIDAÇÃO" -ForegroundColor Cyan
Write-Host ("=" * 70) -ForegroundColor Cyan

Write-Host "`n📊 TOTAIS:" -ForegroundColor White
Write-Host "   Arquivo Anterior: $contador1 registros" -ForegroundColor Yellow
Write-Host "   Fluxo Novo 2025: $contador2 registros" -ForegroundColor Yellow
Write-Host "   TOTAL CONSOLIDADO: $($todosRegistros.Count) registros`n" -ForegroundColor Green

$porMaternidade = $todosRegistros | Group-Object -Property Maternidade | Sort-Object Count -Descending
Write-Host "🏥 Por Maternidade:" -ForegroundColor Yellow
foreach ($m in $porMaternidade) {
    Write-Host "   $($m.Name): $($m.Count)" -ForegroundColor White
}

$porOrigem = $todosRegistros | Group-Object -Property Origem
Write-Host "`n📁 Por Origem:" -ForegroundColor Yellow
foreach ($o in $porOrigem) {
    Write-Host "   $($o.Name): $($o.Count)" -ForegroundColor White
}

$comDataAgendada = ($todosRegistros | Where-Object { $_.Data_Agendada -ne "" }).Count
$percData = [math]::Round(($comDataAgendada / $todosRegistros.Count * 100), 1)
Write-Host "`n📅 Com data agendada: $comDataAgendada ($percData%)" -ForegroundColor White

$verificados = ($todosRegistros | Where-Object { $_.Status_Verificacao -eq "Verificado" }).Count
$pendentes = ($todosRegistros | Where-Object { $_.Status_Verificacao -eq "Pendente" }).Count
Write-Host "✅ Verificados: $verificados" -ForegroundColor Green
Write-Host "⏳ Pendentes: $pendentes" -ForegroundColor Yellow

Write-Host "`n$("=" * 70)" -ForegroundColor Cyan
Write-Host "✅ CONSOLIDAÇÃO CONCLUÍDA!" -ForegroundColor Green
Write-Host "`nArquivo salvo em: $arquivoSaida`n" -ForegroundColor Cyan
