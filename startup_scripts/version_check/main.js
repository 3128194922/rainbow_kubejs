// priority: 10000
// ==========================================
// 版本检测系统
// 读取 global._VERSION_CHECKS 配置，
// 检查对应模组版本并存储警告信息
// ==========================================

try {
    let checks = global._VERSION_CHECKS
    if (!checks || checks.length === 0) {
        console.log('[VersionCheck] 未配置版本检测项')
    } else {
        let warnings = []
        checks.forEach(function (check) {
            let mod = Platform.mods[check.modId]
            if (mod) {
                let version = mod.version
                if (version !== check.expectedVersion) {
                    let msg = check.warningText
                        .replace('{current}', version)
                        .replace('{expected}', check.expectedVersion)
                    warnings.push(msg)
                    console.log('[VersionCheck] ' + check.modId + ' 版本不匹配: 当前 ' + version + '，期望 ' + check.expectedVersion)
                } else {
                    console.log('[VersionCheck] ' + check.modId + ' 版本验证通过: ' + version)
                }
            } else {
                let msg = '未找到模组 §e' + check.modId + '§r！相关系统可能无法正常工作！'
                warnings.push(msg)
                console.log('[VersionCheck] 未找到模组: ' + check.modId)
            }
        })
        if (warnings.length > 0) {
            global._VERSION_WARNINGS = warnings
        }
    }
} catch (err) {
    console.log('[VersionCheck] 版本检测出错: ' + err)
    global._VERSION_WARNINGS = ['版本检测系统出错: ' + err]
}
