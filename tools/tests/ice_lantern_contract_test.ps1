$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '../..')
$skillwheel = Get-Content -Raw (Join-Path $root 'server_scripts/curios_skill_system/Skillwheel.js')
$tags = Get-Content -Raw (Join-Path $root 'server_scripts/Tag.js')
$tooltip = Get-Content -Raw (Join-Path $root 'client_scripts/tooltips.js')

if ($skillwheel -match 'Java\.extend\(') { throw 'Skillwheel still uses unsupported Java.extend' }
if ($skillwheel -notmatch 'new JavaAdapter\(ITeleporter') { throw 'whistle teleporter does not use KubeJS 6 JavaAdapter' }

$skillStart = $skillwheel.IndexOf('// --- 冰灯 ---')
$handlerStart = $skillwheel.IndexOf("registerSkill('windswept:ice_lantern'", $skillStart)
$skillEnd = $skillwheel.IndexOf("registerSkill('", $handlerStart + 1)
if ($skillStart -lt 0 -or $skillEnd -le $skillStart) { throw 'ice lantern skill block is missing' }
$skill = $skillwheel.Substring($skillStart, $skillEnd - $skillStart)

if ($skill -notmatch 'player\.level\.isClientSide\(\)') { throw 'ice lantern does not use the KubeJS 6 client-side check' }
if ($skill -notmatch '(boundingBox\.inflate\(4\)|getBoundingBox\(\)\.inflate\(radius\))' -or $skill -notmatch 'getEntitiesWithin') { throw 'ice lantern radius-4 entity scan is missing' }
if ($skill -notmatch 'entity == player') { throw 'ice lantern does not exclude the caster' }
if ($skill -notmatch 'ICE_LANTERN_FREEZE_TICKS\s*=\s*15\s*\*\s*20' -or $skill -notmatch 'setTicksFrozen\(Math\.max\(') { throw 'ice lantern does not apply 15 seconds of vanilla freeze time' }
if ($skill -notmatch '/dyeing area add scale') { throw 'ice lantern Dyeing release effect is missing' }
if ($skill -notmatch 'addCooldown\(' -or $skill -notmatch 'SecoundToTick\(15\)') { throw 'ice lantern cooldown is missing' }

if ($tags -notmatch "'windswept:ice_lantern'" ) { throw 'ice lantern is not in the skillwheel item tag' }
if ($tooltip -notmatch "event\.addAdvanced\('windswept:ice_lantern'") { throw 'ice lantern tooltip is missing' }

Write-Output 'ice lantern contract: PASS'
