// priority: 900
// ==========================================
// ☢ 纳垢之剑命中：附着一层纳垢赐福
// ==========================================
// 只处理玩家近战（DamageSource msgId = player），避免 TheBuff 周期伤害
// （thebuff.buff）或弹射物伤害反向叠层。

const URANIUM_SWORD_ID = 'rainbow:uranium_sword'
const URANIUM_SWORD_RADIATION_DURATION = 20

EntityEvents.hurt(event => {
    try {
        let source = event.source
        if (source == null) {
            return
        }
        // KubeJS 的 DamageSource 包装没有 getMsgId()；现有项目脚本统一用 getType() 读取伤害类型。
        let attacker = source.player
        if (attacker == null) {
            return
        }
        let stack = attacker.getMainHandItem()
        if (stack == null || stack.id != URANIUM_SWORD_ID) {
            return
        }
        // 只处理玩家近战，挡掉纳垢赐福自身的周期伤害（thebuff.buff）。
        if (String(source.getType()) != 'player') {
            return
        }
        let target = event.entity
        if (target == null || !target.isAlive()) {
            return
        }
        global.applyRadiation(target, attacker, URANIUM_SWORD_RADIATION_DURATION)
    }
    catch (err) {
        console.log('[radiation] 纳垢之剑命中处理失败: ' + err)
    }
})
