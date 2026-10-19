$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '../..')
$serverMainPath = Join-Path $root 'server_scripts/rainbow/ancientaegis/main.js'
$startupMainPath = Join-Path $root 'startup_scripts/rainbow/ancientaegis/main.js'
$damage = Get-Content -Raw (Join-Path $root 'startup_scripts/ForgeEvents/onPlayerHurt.js')
$itemEvents = Get-Content -Raw (Join-Path $root 'server_scripts/ItemEvents.js')
$registry = Get-Content -Raw (Join-Path $root 'startup_scripts/Registry/Registry_curios.js')
$tooltip = Get-Content -Raw (Join-Path $root 'client_scripts/tooltips.js')

if (-not (Test-Path $serverMainPath)) { throw 'ancientaegis server main is missing' }
if (-not (Test-Path $startupMainPath)) { throw 'ancientaegis startup main is missing' }

$serverMain = Get-Content -Raw $serverMainPath
$startupMain = Get-Content -Raw $startupMainPath

if ($serverMain -match 'TeamJS|TeamJSEvents') { throw 'ancientaegis still depends on TeamJS' }
if ($serverMain -notmatch 'ancientAegisGetMineTeamName') { throw 'ancientaegis MineTeam team lookup is missing' }
if ($serverMain -notmatch 'ServerEvents\.loaded') { throw 'ancientaegis does not initialize MineTeam teams in existing worlds' }
if ($serverMain -notmatch "team add '\s*\+ color") { throw 'ancientaegis MineTeam team bootstrap is missing' }
if ($serverMain -notmatch "teamName === 'white'") { throw 'white MineTeam default team is not treated as no team' }
if ($serverMain -notmatch 'getPlayerList\(\)\.getPlayers\(\)') { throw 'ancientaegis does not scan online MineTeam members' }
if ($serverMain -notmatch 'global\.ancientAegisIsInTeam') { throw 'ancientaegis team bridge is missing' }
if ($serverMain -notmatch "teamName !== 'white'") { throw 'ancientaegis does not require a non-white MineTeam team' }
if ($registry -notmatch 'rainbow:ancientaegis' -or $registry -notmatch '\.canEquip\(ancientAegisCanEquip\)') { throw 'ancientaegis equip restriction is missing' }
if ($registry -notmatch '\.canEquipFromUse\(') { throw 'ancientaegis right-click auto-equip is not disabled' }
if ($damage -notmatch 'ancientAegis') { throw 'ancientaegis damage handler is missing' }
if ($damage -notmatch 'getAncientAegisDamageTargets') { throw 'ancientaegis team damage target bridge is missing' }
if ($damage -notmatch 'damageSources\(\)\.magic\(\)') { throw 'ancientaegis transferred damage is not magic damage' }
if ($damage -notmatch 'ancientAegisRedirecting') { throw 'ancientaegis recursion guard is missing' }
if ($damage -notmatch 'originalAmount\s*/\s*targets\.length') { throw 'ancientaegis damage is not divided by wearer count' }
if ($damage -notmatch 'event\.setAmount\(sharedAmount\)') { throw 'ancientaegis victim share is missing' }
if ($damage -match 'UUID\.fromString|item\.nbt\.getString\("UUID"\)') { throw 'ancientaegis still uses legacy bound UUID transfer' }
if ($itemEvents -match '远古之庇护：绑定UUID|item\.nbt\.putString\("UUID"') { throw 'legacy ancient aegis entity binding remains' }
if ($tooltip -notmatch 'MineTeam' -or $tooltip -notmatch '非白色队伍') { throw 'ancientaegis tooltip is not updated' }

Write-Output 'ancient aegis contract: PASS'
