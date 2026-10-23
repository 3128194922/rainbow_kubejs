# 使用当前整合包 Rhino 2001.2.3（无需安装测试依赖），外部实体接口为测试替身。
$ErrorActionPreference = 'Stop'
$apostleRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$apostleMods = Join-Path $apostleRoot '../mods'
$apostleLibraries = Join-Path $apostleRoot '../../../libraries'
$apostleRhino = Get-ChildItem -LiteralPath $apostleMods -Filter '*rhino-forge-2001.2.3-build.10.jar' | Select-Object -First 1
if ($null -eq $apostleRhino) { throw 'Missing installed Rhino 2001.2.3 build 10' }
$apostleDependencies = @(& rg --files $apostleLibraries -g '*fastutil*.jar' -g '*gson*.jar' -g '*log4j-api*.jar' -g '*guava*.jar' -g '*commons-lang3*.jar')
$apostleClasspath = (@($apostleRhino.FullName) + $apostleDependencies) -join [IO.Path]::PathSeparator
Push-Location $apostleRoot
try {
    & java -cp $apostleClasspath tools/tests/ApostleRhinoCheck.java tests/apostle_harness.js startup_scripts/apostle/main.js server_scripts/apostle/main.js tests/apostle_damage_checks.js tests/apostle_actions_checks.js
    if ($LASTEXITCODE -ne 0) { throw 'Apostle Rhino regression check failed' }
} finally {
    Pop-Location
}
