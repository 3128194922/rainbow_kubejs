# 使用整合包的实际 Rhino 测试 Java NBT 返回值，不需要启动游戏或安装依赖。
$ErrorActionPreference = 'Stop'
$whistleRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$whistleRhino = Get-ChildItem -LiteralPath (Join-Path $whistleRoot '../mods') -Filter '*rhino-forge-2001.2.3-build.10.jar' | Select-Object -First 1
if ($null -eq $whistleRhino) { throw 'Missing installed Rhino 2001.2.3 build 10' }
$whistleDependencies = @(& rg --files (Join-Path $whistleRoot '../../../libraries') -g '*fastutil*.jar' -g '*gson*.jar' -g '*log4j-api*.jar' -g '*guava*.jar' -g '*commons-lang3*.jar')
$whistleClasspath = (@($whistleRhino.FullName) + $whistleDependencies) -join [IO.Path]::PathSeparator
Push-Location $whistleRoot
try {
    & java -cp $whistleClasspath tools/tests/WhistleRhinoCheck.java server_scripts/curios_skill_system/Skillwheel.js
    if ($LASTEXITCODE -ne 0) { throw 'Whistle Rhino regression check failed' }
} finally {
    Pop-Location
}
