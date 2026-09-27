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

if ($serverMain -notmatch 'TeamJS\.openGui') { throw 'ancientaegis does not open TeamJS GUI' }
if ($serverMain -notmatch 'TeamJS\.of\(player\)') { throw 'ancientaegis does not query TeamJS membership' }
if ($serverMain -notmatch 'global\.ancientAegisIsInTeam') { throw 'ancientaegis team bridge is missing' }
if ($serverMain -notmatch 'TeamJSEvents\.memberLeft') { throw 'ancientaegis leave-team cleanup is missing' }
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
if ($tooltip -notmatch '加入小队后右键打开队伍界面' -or $tooltip -notmatch '同队伍') { throw 'ancientaegis tooltip is not updated' }

Write-Output 'ancient aegis contract: PASS'
