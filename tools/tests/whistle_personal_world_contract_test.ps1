$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '../..')
$utf8 = New-Object System.Text.UTF8Encoding($false)
$skillwheel = [System.IO.File]::ReadAllText((Join-Path $root 'server_scripts/curios_skill_system/Skillwheel.js'), $utf8)
$tooltip = [System.IO.File]::ReadAllText((Join-Path $root 'client_scripts/tooltips.js'), $utf8)

$skillStart = $skillwheel.IndexOf('const WHISTLE_PERSONAL_WORLD_RADIUS')
$skillEnd = $skillwheel.IndexOf("registerSkill('alexsmobs:void_worm_eye'")
if ($skillStart -lt 0 -or $skillEnd -le $skillStart) { throw 'whistle skill block is missing' }
$whistle = $skillwheel.Substring($skillStart, $skillEnd - $skillStart)

if ($whistle -notmatch 'MiniWorldApi\.ensureWorld') { throw 'whistle does not ensure the owner personal world' }
if ($whistle -notmatch 'MiniWorldApi\.enter\(player\)') { throw 'whistle does not teleport the owner' }
if ($whistle -match 'server\.getLevel\(dimensionKey\)') { throw 'whistle still calls ambiguous MinecraftServer.getLevel(ResourceKey)' }
if ($whistle -notmatch 'destination\s*=\s*player\.level') { throw 'whistle does not reuse the owner current level as destination' }
if ($whistle -notmatch 'getEntitiesWithin' -or $whistle -notmatch '8') { throw 'whistle nearby entity scan is missing' }
if ($whistle -notmatch 'changeDimension') { throw 'whistle does not transfer non-player entities across dimensions' }
if ($whistle -notmatch 'MiniWorldApi\.enter\([^\n]+true') { throw 'whistle does not transfer nearby players into the owner world' }
if ($whistle -match 'endtick|dyeing area add|EntityEvents\.hurt') { throw 'whistle legacy damage field remains active' }
if ($whistle -notmatch 'player\.level\.isClientSide\(\)') { throw 'whistle does not use the KubeJS 6 client-side check' }
if ($tooltip.IndexOf("event.addAdvanced('rainbow:whistle'") -lt 0 -or $tooltip -notmatch '8') { throw 'whistle tooltip is not updated' }

Write-Output 'whistle personal world contract: PASS'
