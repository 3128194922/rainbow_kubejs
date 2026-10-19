$ErrorActionPreference = 'Stop'

# 木剑镶嵌系统契约测试：校验配置、事件接线、NBT 结构、提示与规范约束。
$root = Resolve-Path (Join-Path $PSScriptRoot '../..')
$config = Get-Content -Raw (Join-Path $root 'startup_scripts/wooden_sword_inlay/config.js')
$main = Get-Content -Raw (Join-Path $root 'startup_scripts/wooden_sword_inlay/main.js')
# 断言只针对有效代码：先剥离块注释与行注释，避免注释里的示例写法误伤
$mainCode = [regex]::Replace($main, '(?s)/\*.*?\*/', '')
$mainCode = [regex]::Replace($mainCode, '(?m)//.*$', '')
$startupConst = Get-Content -Raw (Join-Path $root 'startup_scripts/CONST.js')
$tooltip = Get-Content -Raw (Join-Path $root 'client_scripts/tooltips.js')
$readme = Get-Content -Raw (Join-Path $root 'README.md')

# 1. 配置对象：目标物品、材料、上限、费用、种子与槽位键
if ($config -notmatch 'global\.WOODEN_SWORD_INLAY_CONFIG\s*=') { throw 'inlay config object is missing' }
if ($config -notmatch 'swordId:\s*"minecraft:wooden_sword"') { throw 'inlay sword id is wrong' }
if ($config -notmatch 'materialId:\s*"rainbow:miracle"') { throw 'inlay material id is wrong' }
if ($config -notmatch 'maxSockets:\s*5') { throw 'inlay socket cap is not 5' }
if ($config -notmatch 'RainbowInlayCount' -or $config -notmatch 'RainbowInlaySeed' -or $config -notmatch 'prefix:\s*"RainbowInlay"') { throw 'inlay NBT keys are incomplete' }

# 2. 九个属性与区间字段齐全
$attributeIds = @(
    'attributeslib:crit_chance', 'attributeslib:crit_damage', 'minecraft:generic.armor',
    'minecraft:generic.attack_damage', 'minecraft:generic.max_health', 'attributeslib:armor_pierce',
    'attributeslib:healing_received', 'caverns_and_chasms:experience_boost', 'minecraft:generic.attack_knockback'
)
foreach ($id in $attributeIds) {
    if ($config -notmatch [regex]::Escape($id)) { throw "inlay attribute $id is missing" }
}
$rangeFields = [regex]::Matches($config, 'min:\s*[\d.]+\s*,\s*max:\s*[\d.]+\s*,\s*step:\s*[\d.]+')
if ($rangeFields.Count -ne $attributeIds.Count) { throw "inlay attribute ranges are incomplete: $($rangeFields.Count)/$($attributeIds.Count)" }
# 5 个槽位 UUID 必须两两不同，否则同名属性会因 UUID 重复报错
$uuids = [regex]::Matches($config, '"([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})"') | ForEach-Object { $_.Groups[1].Value }
if ($uuids.Count -ne 5) { throw "inlay slot uuids should be 5, got $($uuids.Count)" }
if (($uuids | Sort-Object -Unique).Count -ne 5) { throw 'inlay slot uuids are not unique' }

# 3. 事件接线：铁砧产出 + 物品属性修饰器
if ($mainCode -notmatch "ForgeEvents\.onEvent\('net\.minecraftforge\.event\.AnvilUpdateEvent'") { throw 'anvil update listener is missing' }
if ($mainCode -notmatch "ForgeEvents\.onEvent\('net\.minecraftforge\.event\.ItemAttributeModifierEvent'") { throw 'item attribute modifier listener is missing' }
if ($mainCode -notmatch 'event\.setMaterialCost\(1\)') { throw 'miracle consumption per inlay is missing' }
if ($mainCode -notmatch 'event\.setCost\(') { throw 'anvil level cost is missing' }
if ($mainCode -notmatch 'putLong\(cfg\.nbt\.seed, seed\)' -or $mainCode -notmatch 'contains\(cfg\.nbt\.seed\)') { throw 'inlay seed persistence is missing' }
if ($mainCode -notmatch 'slotType\.getName\(\)') { throw 'equipment slot check must read EquipmentSlot#getName()' }
if ($mainCode -match 'slotType\s*===\s*["'']mainhand["'']') { throw 'string compare against EquipmentSlot is invalid in KubeJS' }
if ($mainCode -notmatch 'AttributeModifierOperation\.ADDITION') { throw 'attribute modifier operation is missing' }

# 4. 规范：新文件不得出现 Java.loadClass / 可选链 / Math.PI
if (($config + $mainCode) -match 'Java\.loadClass') { throw 'java classes must be declared in CONST.js only' }
if (($config + $mainCode) -match '\?\.') { throw 'optional chaining is forbidden in this project' }
if (($config + $mainCode) -match 'Math\.PI') { throw 'Math.PI is undefined in KubeJS Rhino' }
if ($startupConst -notmatch 'const JavaRandom = Java\.loadClass\(.java\.util\.Random.\)') { throw 'JavaRandom is not declared in startup CONST.js' }
if ($startupConst -notmatch 'const Component = Java\.loadClass\(.net\.minecraft\.network\.chat\.Component.\)') { throw 'Component is not declared in startup CONST.js' }

# 5. 客户端提示与文档
if ($tooltip -notmatch "addAdvanced\('minecraft:wooden_sword'") { throw 'wooden sword tooltip is missing' }
if ($tooltip -notmatch 'global\.WOODEN_SWORD_INLAY_CONFIG') { throw 'wooden sword tooltip does not read the inlay config' }
if ($readme -notmatch '木剑镶嵌系统') { throw 'README does not document the inlay system' }
if (-not (Test-Path (Join-Path $root 'tests/wooden_sword_inlay.test.cjs'))) { throw 'inlay logic test is missing' }

Write-Output 'wooden sword inlay contract: PASS'
