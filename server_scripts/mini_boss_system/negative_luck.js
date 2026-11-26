// priority: 0
// ==========================================
// 负幸运转化（KubeJS 负责）
// ==========================================
// MiniBoss mod 只提供转化 API；触发条件、概率和黑名单入口留在 KubeJS。
// 与原实现一致：只有玩家造成伤害、玩家幸运 < 0 时，按 |luck| / 100 的概率转化目标。

EntityEvents.hurt(event => {
    try {
        let target = event.entity
        if (target === null || target === undefined) return
        if (target.isPlayer()) return
        if (target instanceof TamableAnimal) return
        if (target.persistentData === null || target.persistentData === undefined) return

        let source = event.source
        let player = source == null ? null : source.player
        if (player === null || player === undefined) return

        let luck = player.getAttribute("minecraft:generic.luck").getValue()
        if (luck >= 0) return
        if (Math.random() >= Math.abs(luck) / 100) return

        global.convertToMiniBoss(target)
    } catch (error) {
        console.log('[MiniBoss] 负幸运转化失败: ' + error)
    }
})
