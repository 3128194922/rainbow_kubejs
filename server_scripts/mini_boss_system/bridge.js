// priority: 0
// ==========================================
// MiniBoss mod <-> KubeJS 薄桥接
// ==========================================
// 原 KubeJS 迷你Boss 实现已整体停用并保留为 *.js.disabled。
// 血月/其他脚本仍可调用 global.convertToMiniBoss(entity)，
// 实际转化、词条、AI Goal、伤害、掉落全部由 MiniBoss mod 处理。

let miniBossApiMissingLogged = false

global.convertToMiniBoss = function (entity) {
    try {
        if (entity === null || entity === undefined) return false
        if (MiniBossApi === null || MiniBossApi === undefined) {
            if (!miniBossApiMissingLogged) {
                miniBossApiMissingLogged = true
                console.log('[MiniBoss] 未找到 MiniBoss mod，转化已跳过')
            }
            return false
        }
        return MiniBossApi.convert(entity)
    } catch (error) {
        console.log('[MiniBoss] 桥接转化失败: ' + error)
        return false
    }
}

global.isMiniBoss = function (entity) {
    try {
        if (entity === null || entity === undefined) return false
        if (MiniBossApi === null || MiniBossApi === undefined) return false
        return MiniBossApi.isMiniBoss(entity)
    } catch (error) {
        return false
    }
}

console.log('[MiniBoss] KubeJS 桥接已加载（旧 mini_boss_system 已停用）')
