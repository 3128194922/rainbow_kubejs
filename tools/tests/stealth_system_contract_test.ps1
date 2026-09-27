$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '../..')
$clientMain = Get-Content -Raw (Join-Path $root 'client_scripts/stealth_system/main.js')
$activeClientMain = [regex]::Replace($clientMain, '(?m)^\s*//.*$', '')

# 回归测试：KubeJS 网络事件的 event.data 是 CompoundTag，隐匿状态必须使用 getBoolean 读取。
if ($clientMain -notmatch 'data\.getBoolean\(["'']isStealth["'']\)') {
    throw 'stealth client does not read isStealth from CompoundTag#getBoolean'
}

if ($activeClientMain -match 'data\.isStealth') {
    throw 'stealth client still reads isStealth as a JavaScript property'
}

Write-Output 'stealth system contract: PASS'
