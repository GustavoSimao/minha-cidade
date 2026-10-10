# Gera supabase/seed/ibge-localidades.sql a partir da API de localidades do IBGE.
#
# Uso (PowerShell):
#   pwsh supabase/seed/gerar-ibge.ps1
#
# Saída: INSERT único com ON CONFLICT (id) DO UPDATE — idempotente (pode rodar
# repetido sem duplicar linhas; ibge_synced_at é atualizado a cada execução).
#
# Fonte: https://servicodados.ibge.gov.br/api/v1/localidades/estados/{uf}/municipios
#
# Slug: <nome-normalizado>-<uf> em minúsculas (G2 — nomes de município se repetem
# entre UFs; o sufixo da UF garante unicidade).

$ErrorActionPreference = "Stop"

$ufs = @(
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB",
  "PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"
)

function Get-Slug([string]$name, [string]$uf) {
  $n = $name.Normalize("FormD")
  $n = -join ($n.ToCharArray() | Where-Object { [char]::GetUnicodeCategory($_) -ne "NonSpacingMark" })
  $n = $n.ToLowerInvariant() -replace "[^a-z0-9]+", "-"
  return ($n.Trim("-")) + "-" + $uf.ToLowerInvariant()
}

function Escape-Sql([string]$value) {
  return "'" + $value.Replace("'", "''") + "'"
}

$rows = New-Object System.Collections.Generic.List[string]
$syncedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-dd HH:mm:ss")

foreach ($uf in $ufs) {
  $url = "https://servicodados.ibge.gov.br/api/v1/localidades/estados/$uf/municipios"
  $municipios = Invoke-RestMethod -Uri $url -TimeoutSec 120

  foreach ($m in $municipios) {
    $slug = Get-Slug $m.nome $uf
    $name = Escape-Sql $m.nome
    $rows.Add("  ($($m.id), '$uf', $name, '$slug', '$syncedAt'::timestamptz)")
  }
}

$totalUfs = $ufs.Count

$sql = @"
-- IBGE — municípios e UFs (catálogo público do contexto Geography)
-- Spec: docs/04-contexts/geography.md · fonte: API de localidades do IBGE
-- GERADO por gerar-ibge.ps1 em $syncedAt UTC — não editar à mão.
-- Idempotente: ON CONFLICT (id) DO UPDATE (G7).
--
-- Contagens observadas na geração (validar contra a API antes de regerar):
--   5.571 municípios (a API passou de 5.570 para 5.571) e 27 UFs, todas com >= 1.

insert into geography.cities (id, uf, name, slug, ibge_synced_at) values
$($rows -join ",`n")
on conflict (id) do update set
  uf = excluded.uf,
  name = excluded.name,
  slug = excluded.slug,
  ibge_synced_at = excluded.ibge_synced_at;

-- Verificações rápidas (executar após o seed; ambas devem bater):
--   select count(*) from geography.cities;                                   -- 5570
--   select uf, count(*) from geography.cities group by uf order by uf;       -- 27 linhas
"@

$out = Join-Path $PSScriptRoot "ibge-localidades.sql"
# UTF-8 sem BOM (BOM quebraria a execução do SQL).
[System.IO.File]::WriteAllText($out, $sql, (New-Object System.Text.UTF8Encoding($false)))

$municipiosTotal = $rows.Count
Write-Host "gravado $out com $municipiosTotal municipios de $totalUfs UFs"
