$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '../..')
$serverMain = Get-Content -Raw (Join-Path $root 'server_scripts/power_sword/main.js')
$tables = Get-Content -Raw (Join-Path $root 'startup_scripts/ForgeEvents/tables.js')
$attack = Get-Content -Raw (Join-Path $root 'startup_scripts/ForgeEvents/handleAttackWeapon.js')
$forgeMain = Get-Content -Raw (Join-Path $root 'startup_scripts/ForgeEvents/main.js')
$properties = Get-Content -Raw (Join-Path $root 'startup_scripts/ItemProperties.js')
$tooltip = Get-Content -Raw (Join-Path $root 'client_scripts/tooltips.js')
$activeRegistry = [regex]::Replace((Get-Content -Raw (Join-Path $root 'startup_scripts/Registry/Registry_item.js')), '(?s)/\*.*?\*/', '')

if ($activeRegistry -match 'event\.create\("rainbow:power_sword"') { throw 'power_sword is still actively registered' }
if ($activeRegistry -match '(?m)^\s*event\.create\("rainbow:baseball_') { throw 'legacy baseball item is still actively registered' }
if ($serverMain -notmatch '(?s)/\*.*ItemEvents\.rightClicked.*\*/') { throw 'power_sword right-click handler is not preserved in a block comment' }
$activeTables = [regex]::Replace($tables, '(?s)//[^\r\n]*|/\*.*?\*/', '')
if ($activeTables -match '"rainbow:power_sword"\s*:') { throw 'power_sword attack table mapping is still active' }
if ($attack -match '(?m)^\s*case\s+2\s*:') { throw 'power_sword attack case is still active' }
if ($properties -match '(?m)^\s*event\.register\("rainbow:power_sword"') { throw 'power_sword model property is still active' }
if ($tooltip -match '(?m)^\s*event\.addAdvanced\(''rainbow:power_sword''') { throw 'power_sword tooltip is still active' }
if ($forgeMain -match 'level\.clientSide') { throw 'invalid clientSide property remains in Forge attack entry' }
if (Test-Path (Join-Path $root 'assets/rainbow/textures/item/baseball_bat.png')) { throw 'legacy normal texture remains' }
if (Test-Path (Join-Path $root 'assets/rainbow/textures/item/baseball_power.png')) { throw 'legacy field texture remains' }

Write-Output 'power sword disabled contract: PASS'
