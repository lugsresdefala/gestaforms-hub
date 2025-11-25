# Script PowerShell para limpar e consolidar CSV
# Encoding: UTF-8

$arquivoEntrada = "C:\Users\t_tiago.oliveira\Downloads\Forms de parto - anteriores.CSV"
$arquivoSaida = "C:\Users\t_tiago.oliveira\Downloads\Forms_CONSOLIDADO.csv"

Write-Host "🔄 Iniciando limpeza e consolidação de CSV...`n" -ForegroundColor Cyan

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

function Padronizar-Procedimento {
    param($proc)
    if ([string]::IsNullOrWhiteSpace($proc)) { return "Não especificado" }
    
    $procLower = $proc.ToLower()
    
    if ($procLower -match 'cesár|cesar') {
        if ($procLower -match 'laq|lt|diu') {
            return "Cesárea + Laqueadura"
        }
        return "Cesárea"
    }
    elseif ($procLower -match 'indu') { return "Indução Programada" }
    elseif ($procLower -match 'laq') { return "Laqueadura tubária" }
    elseif ($procLower -match 'cerc') { return "Cerclagem" }
    
    return Limpar-Texto $proc
}

function Padronizar-Maternidade {
    param($mat)
    if ([string]::IsNullOrWhiteSpace($mat)) { return "Não especificada" }
    
    $matLower = $mat.ToLower()
    
    if ($matLower -match 'notre') { return "NotreCare" }
    if ($matLower -match 'salva') { return "Salvalus" }
    if ($matLower -match 'cruz') { return "Cruzeiro do Sul" }
    if ($matLower -match 'guarulhos') { return "Guarulhos" }
    if ($matLower -match 'ros.*rio') { return "Rosário" }
    
    return Limpar-Texto $mat
}

Write-Host "📂 Lendo: $arquivoEntrada`n" -ForegroundColor Yellow

# Ler arquivo
$conteudo = Get-Content $arquivoEntrada -Encoding UTF8 -Raw
$linhas = $conteudo -split "`n"

$registros = @()
$linha_num = 1

foreach ($linha in $linhas[1..($linhas.Count-1)]) {
    $linha_num++
    if ([string]::IsNullOrWhiteSpace($linha)) { continue }
    
    $cols = $linha -split ';'
    if ($cols.Count -lt 40 -or [string]::IsNullOrWhiteSpace($cols[0])) { continue }
    
    try {
        $idForm = $cols[0].Trim()
        $nome = Limpar-Texto $cols[5]
        $carteirinha = Limpar-Texto $cols[7]
        
        if ([string]::IsNullOrWhiteSpace($nome) -or [string]::IsNullOrWhiteSpace($carteirinha)) {
            Write-Host "Linha $linha_num : Nome ou carteirinha ausente - IGNORADO" -ForegroundColor DarkYellow
            continue
        }
        
        $registro = [PSCustomObject]@{
            id = "FORMS-$idForm"
            nome_completo = $nome
            carteirinha = $carteirinha
            data_nascimento = Padronizar-Data $cols[6]
            telefones = ($cols[12] -replace '[^\d/]', '')
            email = Limpar-Texto $cols[33]
            gestacoes = if ($cols[8]) { $cols[8].Trim() } else { "0" }
            partos_cesareas = if ($cols[9]) { $cols[9].Trim() } else { "0" }
            partos_normais = if ($cols[10]) { $cols[10].Trim() } else { "0" }
            abortos = if ($cols[11]) { $cols[11].Trim() } else { "0" }
            procedimento = Padronizar-Procedimento $cols[13]
            maternidade = Padronizar-Maternidade $cols[30]
            medico_responsavel = Limpar-Texto $cols[31]
            centro_clinico = Limpar-Texto $cols[32]
            indicacao = if ($cols[22]) { Limpar-Texto $cols[22] } else { "Não informado" }
            diagnosticos_maternos = if ($cols[24]) { Limpar-Texto $cols[24] } else { "Não informado" }
            diagnosticos_fetais = if ($cols[26]) { Limpar-Texto $cols[26] } else { "Não informado" }
            dum_status = Limpar-Texto $cols[14]
            data_dum = Padronizar-Data $cols[15]
            data_primeiro_usg = Padronizar-Data $cols[16]
            data_agendada = if ($cols.Count -gt 37) { Padronizar-Data $cols[37] } else { "" }
            origem = "Forms de Parto"
        }
        
        $registros += $registro
        Write-Host "Linha $linha_num : $nome - OK" -ForegroundColor Green
    }
    catch {
        Write-Host "Linha $linha_num : ERRO - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Gerar CSV consolidado
Write-Host "`n✅ Gerando CSV consolidado..." -ForegroundColor Cyan
$registros | Export-Csv -Path $arquivoSaida -Encoding UTF8 -NoTypeInformation

Write-Host "   Arquivo gerado: $arquivoSaida" -ForegroundColor Green
Write-Host "   Total de registros: $($registros.Count)`n" -ForegroundColor Green

# Relatório
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host "RELATÓRIO DE CONSOLIDAÇÃO" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan

Write-Host "`n📊 Total de registros: $($registros.Count)" -ForegroundColor White

$maternidades = $registros | Group-Object -Property maternidade | Sort-Object Count -Descending
Write-Host "`n🏥 Por Maternidade:" -ForegroundColor Yellow
foreach ($m in $maternidades) {
    Write-Host "   $($m.Name): $($m.Count)" -ForegroundColor White
}

$procedimentos = $registros | Group-Object -Property procedimento | Sort-Object Count -Descending
Write-Host "`n💉 Por Procedimento:" -ForegroundColor Yellow
foreach ($p in $procedimentos) {
    Write-Host "   $($p.Name): $($p.Count)" -ForegroundColor White
}

$comData = ($registros | Where-Object { $_.data_agendada -ne "" }).Count
$percData = [math]::Round(($comData / $registros.Count * 100), 1)
Write-Host "`n📅 Com data agendada: $comData ($percData%)" -ForegroundColor White

$comEmail = ($registros | Where-Object { $_.email -ne "" }).Count
$percEmail = [math]::Round(($comEmail / $registros.Count * 100), 1)
Write-Host "📧 Com email: $comEmail ($percEmail%)" -ForegroundColor White

Write-Host "`n$("=" * 60)" -ForegroundColor Cyan
Write-Host "✅ CONCLUÍDO!" -ForegroundColor Green
