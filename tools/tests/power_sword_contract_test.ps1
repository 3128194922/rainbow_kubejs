$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '../..')
$registry = Get-Content -Raw (Join-Path $root 'startup_scripts/Registry/Registry_item.js')
$activeRegistry = [regex]::Replace($registry, '(?s)/\*.*?\*/', '')
$serverMain = Get-Content -Raw (Join-Path $root 'server_scripts/power_sword/main.js')
$tables = Get-Content -Raw (Join-Path $root 'startup_scripts/ForgeEvents/tables.js')
$attack = Get-Content -Raw (Join-Path $root 'startup_scripts/ForgeEvents/handleAttackWeapon.js')
$forgeMain = Get-Content -Raw (Join-Path $root 'startup_scripts/ForgeEvents/main.js')
$properties = Get-Content -Raw (Join-Path $root 'startup_scripts/ItemProperties.js')
$tooltip = Get-Content -Raw (Join-Path $root 'client_scripts/tooltips.js')
$model = Get-Content -Raw (Join-Path $root 'assets/rainbow/models/item/power_sword.json')
$fieldModel = Get-Content -Raw (Join-Path $root 'assets/rainbow/models/item/power_sword_field.json')

if ($registry -notmatch '(?m)^\s*event\.create\("rainbow:power_sword"') { throw 'power_sword is not registered' }
if ($activeRegistry -match '(?m)^\s*event\.create\("rainbow:baseball_') { throw 'legacy baseball item is still actively registered' }
if ($serverMain -notmatch 'ItemEvents\.rightClicked' -or $serverMain -notmatch 'rainbow:power_sword') { throw 'power_sword right-click handler is missing' }
if ($serverMain -notmatch 'DecompositionFieldUntil' -or $serverMain -notmatch '200') { throw 'timed decomposition field state is missing' }
if ($tables -notmatch '"rainbow:power_sword"\s*:\s*2') { throw 'attack table does not map power_sword' }
if ($tables -match '"rainbow:baseball_power"\s*:') { throw 'legacy baseball attack mapping remains' }
if ($attack -notmatch 'rainbow:power_sword' -or $attack -notmatch 'DecompositionFieldUntil') { throw 'attack handler does not use power_sword field state' }
if ($attack -notmatch 'POWER_SWORD_ATTACK_FIELD_REDUCTION_TICKS\s*=\s*2\s*\*\s*20') { throw 'power_sword attack duration reduction is missing' }
if ($attack -notmatch 'DecompositionFieldUntil.*-\s*POWER_SWORD_ATTACK_FIELD_REDUCTION_TICKS') { throw 'power_sword attack handler does not reduce field duration' }
if ($forgeMain -match 'level\.clientSide') { throw 'invalid clientSide property remains in Forge attack entry' }
if ($properties -notmatch 'rainbow:power_sword' -or $properties -notmatch 'decomposition_field') { throw 'power_sword model property is missing' }
if ($tooltip -notmatch 'rainbow:power_sword') { throw 'power_sword tooltip is missing' }
if ($tooltip -notmatch '10 秒分解立场') { throw 'power_sword tooltip does not describe the timed field' }
if ($model -notmatch 'kubejs:decomposition_field' -or $model -notmatch 'power_sword_field') { throw 'power_sword model override is missing' }
if ($model -match 'rainbow:decomposition_field') { throw 'power_sword model uses the wrong property namespace' }
if ($fieldModel -notmatch 'rainbow:item/power_sword_field') { throw 'power_sword field texture model is missing' }
if (-not (Test-Path (Join-Path $root 'assets/rainbow/textures/item/power_sword.png'))) { throw 'power_sword texture is missing' }
if (-not (Test-Path (Join-Path $root 'assets/rainbow/textures/item/power_sword_field.png'))) { throw 'power_sword field texture is missing' }
if (Test-Path (Join-Path $root 'assets/rainbow/textures/item/baseball_bat.png')) { throw 'legacy normal texture remains' }
if (Test-Path (Join-Path $root 'assets/rainbow/textures/item/baseball_power.png')) { throw 'legacy field texture remains' }

Write-Output 'power sword contract: PASS'
