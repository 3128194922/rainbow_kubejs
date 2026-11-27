// priority: 1000
// ==========================================
// ☢ 纳垢赐福：叠层、时长继承与动态上限
// ==========================================
// 规则：
// 1. 单次附着基础时长 20 tick；已有纳垢赐福时，新时长 = 20 + 旧剩余 × 30%。
// 2. 层数 = amplifier + 1；每次附着 +1，基础上限 10。
// 3. 上限动态增加：目标每有 1 个 HARMFUL 药水效果，上限 +1。
// 4. 超出上限的层数不保留，按“多出的层数”立即结算一次纳垢赐福伤害。

const RADIATION_ID = 'thebuff:radiation'
const RADIATION_BASE_DURATION = 20
const RADIATION_INHERIT_RATE = 0.3
const RADIATION_BASE_CAP = 10

// 键为实体 id，值为本次附着需要立即结算的辐射伤害；由 startup 的 onApply 同步消费。
global.RADIATION_PENDING_DAMAGE = {}

// 统计目标身上的负面（HARMFUL）药水效果数量，用于动态提升纳垢赐福上限。
function countHarmfulEffects(entity) {
    let count = 0
    let effects = entity.getActiveEffects()
    if (effects == null) {
        return 0
    }
    let iterator = effects.iterator()
    while (iterator.hasNext()) {
        let instance = iterator.next()
        if (instance == null) {
            continue
        }
        let effect = instance.getEffect()
        if (effect == null) {
            continue
        }
        let category = effect.getCategory()
        if (category != null && String(category) == 'HARMFUL') {
            count++
        }
    }
    return count
}

// 对目标附着一层纳垢赐福；source 为附着者（玩家），用于 thebuff:buff 的伤害归属。
function applyRadiation(target, source, baseDuration) {
    if (target == null || !target.isAlive()) {
        return false
    }

    let existing = TheBuff.getInstance(target, RADIATION_ID)
    let oldStacks = 0
    let oldRemaining = 0
    let wasPermanent = false
    if (existing != null) {
        oldStacks = existing.amplifier + 1
        oldRemaining = existing.duration
        wasPermanent = existing.isPermanent()
    }

    // 上限至少不低于当前层数，避免负面药水效果消失后已叠层数被动下降。
    let cap = RADIATION_BASE_CAP + countHarmfulEffects(target)
    if (cap < oldStacks) {
        cap = oldStacks
    }

    let newStacks = oldStacks + 1
    let excess = 0
    if (newStacks > cap) {
        excess = newStacks - cap
        newStacks = cap
    }

    let duration = baseDuration
    if (existing != null) {
        if (wasPermanent) {
            duration = -1
        }
        else if (oldRemaining > 0) {
            duration = baseDuration + Math.floor(oldRemaining * RADIATION_INHERIT_RATE)
        }
    }

    // TheBuff.apply 对已有状态取 max(旧值, 新值)，所以附着后再显式写入计算出的时长。
    let entityId = target.getId()
    if (excess > 0) {
        global.RADIATION_PENDING_DAMAGE[entityId] = excess
    }
    let applied = false
    try {
        applied = TheBuff.apply(target, RADIATION_ID, duration, newStacks - 1, source)
        if (applied) {
            TheBuff.setDuration(target, RADIATION_ID, duration)
        }
    }
    catch (err) {
        console.log('[radiation] 附着失败: ' + err)
    }
    finally {
        delete global.RADIATION_PENDING_DAMAGE[entityId]
    }
    return applied
}

global.applyRadiation = applyRadiation

// 由 startup_scripts/radiation/main.js 的 onApply 调用。
// ctx.damage 使用纳垢赐福自身的 thebuff:buff 伤害类型，并按附着者 UUID 归属。
global.consumeRadiationExcess = function (ctx) {
    if (ctx == null || ctx.entity == null) {
        return
    }
    let entityId = ctx.entity.getId()
    let amount = global.RADIATION_PENDING_DAMAGE[entityId]
    if (amount == null || amount <= 0) {
        return
    }
    delete global.RADIATION_PENDING_DAMAGE[entityId]
    ctx.damage(amount)
}
