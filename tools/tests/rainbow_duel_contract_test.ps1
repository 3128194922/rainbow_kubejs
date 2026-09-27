$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '../..')
$registry = Get-Content -Raw (Join-Path $root 'startup_scripts/Registry/Registry_item.js')
$attack = Get-Content -Raw (Join-Path $root 'startup_scripts/ForgeEvents/handleAttackWeapon.js')
$weapon = Get-Content -Raw (Join-Path $root 'startup_scripts/ForgeEvents/handleWeaponEffects.js')
$duelMainPath = Join-Path $root 'startup_scripts/rainbow/duel/main.js'
$tooltip = Get-Content -Raw (Join-Path $root 'client_scripts/tooltips.js')
$tables = Get-Content -Raw (Join-Path $root 'startup_scripts/ForgeEvents/tables.js')

if ($registry -notmatch 'event\.create\("rainbow:duel"[\s\S]*?modifyAttribute\("attributeslib:dodge_chance"\s*,\s*"duel_dodge_chance"\s*,\s*0\.2\s*,\s*"addition"\)') {
    throw 'duel main-hand dodge attribute is missing'
}
if ($weapon -notmatch 'getUuid\(\)\.toString\(\)' -or $weapon -notmatch 'putString\("target_uuid"') {
    throw 'duel target UUID tracking is missing'
}
if ($weapon -match 'Nbt\.type|victim\.getType\(\)') {
    throw 'duel still tracks target type instead of UUID'
}
if ($attack -match 'rainbow:duel|case 3') {
    throw 'duel still has obsolete attack-time type initialization'
}
if ($tables -match '"rainbow:duel"') {
    throw 'duel still has obsolete attack dispatch mapping'
}
if (-not (Test-Path $duelMainPath)) {
    throw 'duel dodge callback script is missing'
}
$duelMain = Get-Content -Raw $duelMainPath
if ($duelMain -notmatch 'com\.morecallback\.event\.ApothicDodgeEvent') {
    throw 'Apothic dodge callback listener is missing'
}
if ($duelMain -notmatch 'instanceof\s+Player' -or $duelMain -notmatch 'getItemInHand\("main_hand"\)' -or $duelMain -notmatch 'rainbow:duel' -or $duelMain -notmatch '\.heal\(4\)') {
    throw 'duel dodge callback does not heal players for 4'
}
if ($duelMain -notmatch 'ExtremeEvasionTriggeredEvent' -or $duelMain -notmatch 'potionEffects\.add\("minecraft:strength"\s*,\s*60\s*,\s*0\s*,\s*false\s*,\s*false\)') {
    throw 'duel extreme dodge strength effect is missing'
}
if ($tooltip -notmatch 'rainbow:duel' -or $tooltip -notmatch '20%.*闪避' -or $tooltip -notmatch 'UUID' -or $tooltip -notmatch '被动闪避.*4.*生命' -or $tooltip -notmatch '极限闪避.*力量.*3.*秒') {
    throw 'duel tooltip does not describe the updated mechanics'
}

Write-Output 'rainbow duel contract: PASS'
