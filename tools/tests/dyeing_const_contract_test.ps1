$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '../..')
$utf8 = New-Object System.Text.UTF8Encoding($false)
$startupConst = [System.IO.File]::ReadAllText((Join-Path $root 'startup_scripts/CONST.js'), $utf8)
$serverConst = [System.IO.File]::ReadAllText((Join-Path $root 'server_scripts/CONST.js'), $utf8)

foreach ($content in @($startupConst, $serverConst)) {
    if ($content -match 'com\.example\.dyeing') { throw 'placeholder Dyeing package remains in CONST.js' }
    if ($content -notmatch "Java\.loadClass\('com\.dyeing\.DyeingMod'\)") { throw 'actual DyeingMod class is not loaded' }
}
if ($startupConst -notmatch "Java\.loadClass\('com\.dyeing\.data\.PaintData'\)") { throw 'actual PaintData class is not loaded in startup CONST.js' }

Write-Output 'dyeing CONST contract: PASS'
