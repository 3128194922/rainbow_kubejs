// priority: 0
// ==========================================
// MiniBoss mod <-> KubeJS 薄桥接
// ==========================================
// 原 KubeJS 迷你Boss 实现已整体停用并保留为 *.js.disabled。
// MiniBoss mod 只负责转化、词条、AI Goal 和伤害/死亡事件；
// 负幸运、血月、额外掉落、Dyeing 外观都在 KubeJS 侧实现。

let miniBossApiMissingLogged = false
const MINI_BOSS_DYEING_ENABLED = true

function applyMiniBossDyeing(entity) {
    try {
        if (!MINI_BOSS_DYEING_ENABLED) return
        if (!Platform.isLoaded('dyeing')) return
        if (entity.server === null || entity.server === undefined) return
        entity.server.runCommandSilent(
            '/dyeing uv add scroll mini_boss_creeper_armor ' + entity.getUuid().toString()
            + ' rainbow:textures/miniboss/miniboss_armor.png 0.01 0.01 1'
        )
    } catch (error) {
        console.log('[MiniBoss] Dyeing 外观失败: ' + error)
    }
}

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
        let converted = MiniBossApi.convert(entity)
        if (converted) applyMiniBossDyeing(entity)
        return converted
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
