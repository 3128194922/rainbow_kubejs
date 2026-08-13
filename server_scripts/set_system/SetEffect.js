// priority: 0
// ==========================================
// 🛡️ 套装效果系统 (Set Effect System)
// 参考: Visual-Set-Edit 套装效果实现逻辑
// 结构: 注册表模式 (参考 curios_skill_system/Skillwheel.js)
// 特性: 槽位条件式匹配 / 多阶段递进 / 属性+药水+命令三种效果
//       装备变更即时评估 + tick 兜底 + 内存存储
// ==========================================

// --- Java 类加载（本系统专用类；getCuriosInventorySafe 来自 Utils_Curios.js）---
const $SetAttributeModifier = Java.loadClass('net.minecraft.world.entity.ai.attributes.AttributeModifier')
const $SetOperation = Java.loadClass('net.minecraft.world.entity.ai.attributes.AttributeModifier$Operation')
const $SetUUID = Java.loadClass('java.util.UUID')
const $SetString = Java.loadClass('java.lang.String')
const $SetMobEffectInstance = Java.loadClass('net.minecraft.world.effect.MobEffectInstance')

// --- 全局状态（内存存储，重启后由登录/tick 自动重算）---
// uuid -> [{setId, phaseIndex}]  当前激活的阶段列表
let ActiveSetTracker = {}
// uuid -> equipmentHash           装备快照哈希（用于跳过未变化的重复评估）
let SnapshotCache = {}
// tag -> Ingredient               标签 Ingredient 缓存
let TagIngredientCache = {}

// ==========================================
// 🧰 工具函数
// ==========================================

function pid(player) {
    return player.getUuid().toString()
}

// 由 setId+phaseIndex+effectIdx 生成稳定 UUID（保证 add/remove 配对）
function setEffectKey(setId, phaseIndex, eIdx) {
    return 'set_' + setId + '_p' + phaseIndex + '_e' + eIdx
}
function setEffectUuid(key) {
    return $SetUUID.nameUUIDFromBytes($SetString.valueOf(key).getBytes())
}

// 操作字符串 -> Operation 枚举
function parseOperation(op) {
    if (op === 'MULTIPLY_BASE' || op === 1) return $SetOperation.MULTIPLY_BASE
    if (op === 'MULTIPLY_TOTAL' || op === 2) return $SetOperation.MULTIPLY_TOTAL
    return $SetOperation.ADDITION
}

// 标签 -> Ingredient（带缓存）
function getTagIngredient(tag) {
    if (!TagIngredientCache[tag]) {
        try { TagIngredientCache[tag] = Ingredient.of('#' + tag) }
        catch (e) { TagIngredientCache[tag] = Ingredient.of('minecraft:air') }
    }
    return TagIngredientCache[tag]
}

// ==========================================
// 🎒 装备收集与快照哈希
// ==========================================

// 收集玩家当前装备（原版六槽 + 所有 curios 槽）
function collectEquipped(player) {
    let vanilla = {
        'HEAD': player.getItemBySlot('head'),
        'CHEST': player.getItemBySlot('chest'),
        'LEGS': player.getItemBySlot('legs'),
        'FEET': player.getItemBySlot('feet'),
        'MAINHAND': player.getItemBySlot('mainhand'),
        'OFFHAND': player.getItemBySlot('offhand'),
    }
    let curios = []
    let inv = getCuriosInventorySafe(player)
    if (inv) {
        try {
            let it = inv.getCurios().entrySet().iterator()
            while (it.hasNext()) {
                let entry = it.next()
                let slotType = String(entry.getKey())
                let handler = entry.getValue()
                let stacks = handler.getStacks()
                let size = stacks.getSlots()
                for (let i = 0; i < size; i++) {
                    curios.push({ type: slotType, index: i, stack: stacks.getStackInSlot(i) })
                }
            }
        } catch (e) {
            console.error('[套装系统] 收集 curios 装备失败: ' + e)
        }
    }
    return { vanilla: vanilla, curios: curios }
}

function hashFromEquipped(eq) {
    let parts = []
    let order = ['HEAD', 'CHEST', 'LEGS', 'FEET', 'MAINHAND', 'OFFHAND']
    for (let s of order) {
        let st = eq.vanilla[s]
        parts.push(s + ':' + (st && !st.isEmpty() ? st.getId().toString() : '0'))
    }
    for (let c of eq.curios) {
        parts.push('C:' + c.type + '#' + c.index + ':' + (c.stack && !c.stack.isEmpty() ? c.stack.getId().toString() : '0'))
    }
    return parts.join('|')
}

// ==========================================
// 🧩 槽位条件匹配与阶段判定
// ==========================================

// 单个槽位条件匹配：cond 可含 item('modid:item') 或 tag('modid:tag')，二者皆无则匹配任意物品
function matchesSlotCondition(stack, cond) {
    if (!stack || stack.isEmpty()) return false
    if (cond.tag) {
        try { if (!getTagIngredient(cond.tag).test(stack)) return false }
        catch (e) { return false }
    } else if (cond.item) {
        if (stack.getId().toString() !== cond.item) return false
    }
    return true
}

// 判定某阶段是否激活（多阶段递进：满足 requiredCount 即激活，高阶段不排斥低阶段）
function isPhaseActive(eq, phase, setSlots) {
    if (!setSlots || setSlots.length === 0) return false

    // 构建槽位键列表（每个槽位带 used 标志，防止一件装备被多个条件重复计数）
    let slotKeys = []
    let order = ['HEAD', 'CHEST', 'LEGS', 'FEET', 'MAINHAND', 'OFFHAND']
    for (let s of order) slotKeys.push({ key: s, stack: eq.vanilla[s], used: false })
    for (let c of eq.curios) slotKeys.push({ key: 'curios:' + c.type + '#' + c.index, stack: c.stack, used: false })

    let matched = 0
    for (let cond of setSlots) {
        // 确定该条件的候选槽位
        let candidates = []
        if (cond.slot) {
            if (cond.slot.indexOf('curios:') === 0) {
                let type = cond.slot.substring(7)
                for (let k of slotKeys) if (k.key.indexOf('curios:' + type + '#') === 0) candidates.push(k)
            } else {
                for (let k of slotKeys) if (k.key === cond.slot) candidates.push(k)
            }
        } else {
            // 未指定 slot → 任意槽位
            for (let k of slotKeys) candidates.push(k)
        }
        // 在候选中找一个未使用且匹配的
        for (let k of candidates) {
            if (k.used) continue
            if (matchesSlotCondition(k.stack, cond)) {
                k.used = true
                matched++
                break
            }
        }
    }
    return matched >= (phase.requiredCount || 1)
}

// ==========================================
// ✨ 效果应用 / 移除
// ==========================================

function applyAttribute(player, effect, key) {
    let attr = player.getAttribute(effect.attribute)
    if (!attr) return
    let uuid = setEffectUuid(key)
    if (attr.getModifier(uuid)) return // 已存在
    let opEnum = parseOperation(effect.operation)
    try {
        attr.addPermanentModifier(new $SetAttributeModifier(uuid, key, effect.amount, opEnum))
    } catch (e) {
        console.error('[套装系统] 应用属性修饰符失败 ' + effect.attribute + ': ' + e)
    }
    // 最大生命下降时夹紧当前生命
    if (effect.attribute === 'minecraft:generic.max_health' && player.getHealth() > player.getMaxHealth()) {
        player.setHealth(player.getMaxHealth())
    }
}

function removeAttribute(player, effect, key) {
    let attr = player.getAttribute(effect.attribute)
    if (!attr) return
    let uuid = setEffectUuid(key)
    try { attr.removeModifier(uuid) } catch (e) {}
    if (effect.attribute === 'minecraft:generic.max_health' && player.getHealth() > player.getMaxHealth()) {
        player.setHealth(player.getMaxHealth())
    }
}

// 以玩家为执行源运行命令（@s/@p 解析为该玩家）
function runSetCommands(player, cmds) {
    if (!cmds || cmds.length === 0) return
    let server = player.server
    if (!server) return
    let pname = player.getName().getString()
    for (let cmd of cmds) {
        if (!cmd || String(cmd).trim() === '') continue
        let c = String(cmd).trim()
        if (c.charAt(0) === '/') c = c.substring(1)
        // execute 嵌套合法：execute as <玩家> at @s run <用户命令>
        server.runCommandSilent('execute as ' + pname + ' at @s run ' + c)
    }
}

// 应用单个效果（阶段激活时调用）
function applyEffect(player, effect, setId, phaseIndex, eIdx) {
    let key = setEffectKey(setId, phaseIndex, eIdx)
    if (effect.type === 'attribute') {
        applyAttribute(player, effect, key)
    } else if (effect.type === 'potion') {
        // SELF 在激活时施加；ATTACK_TARGET 由 hurt 事件处理；IMMUNE 由 tick 维护
        if ((effect.target || 'SELF') === 'SELF') applyPotionSelf(player, effect)
    } else if (effect.type === 'command') {
        runSetCommands(player, effect.activate)
    }
}

// 移除单个效果（阶段失效时调用）
function removeEffect(player, effect, setId, phaseIndex, eIdx) {
    let key = setEffectKey(setId, phaseIndex, eIdx)
    if (effect.type === 'attribute') {
        removeAttribute(player, effect, key)
    } else if (effect.type === 'potion') {
        if ((effect.target || 'SELF') === 'SELF') removePotionSelf(player, effect)
        // ATTACK_TARGET / IMMUNE 无需在失效时处理
    } else if (effect.type === 'command') {
        runSetCommands(player, effect.deactivate)
    }
}

function applyPotionSelf(player, effect) {
    if (!effect.effect) return
    let amplifier = effect.amplifier || 0
    let particles = effect.particles !== false
    if (effect.duration === -1) {
        if (!player.hasEffect(effect.effect)) {
            player.potionEffects.add(effect.effect, -1, amplifier, false, particles)
        }
    } else {
        let dur = (effect.duration || 1) * 20
        player.potionEffects.add(effect.effect, dur, amplifier, false, particles)
    }
}

function removePotionSelf(player, effect) {
    if (!effect.effect) return
    // 永久与限时 SELF 都移除（限时提前结束，避免套装卸下后仍残留）
    try { player.potionEffects.remove(effect.effect) } catch (e) {}
}

// ==========================================
// 🔄 核心评估逻辑
// ==========================================

function phasesEqual(a, b) {
    if (a.length !== b.length) return false
    let setA = a.map(x => x.setId + ':' + x.phaseIndex)
    for (let x of b) if (setA.indexOf(x.setId + ':' + x.phaseIndex) === -1) return false
    return true
}

// 对比新旧阶段差异，仅对变化部分 apply/remove
function applySetDiff(player, oldPhases, newPhases) {
    let oldMap = {}
    for (let o of oldPhases) oldMap[o.setId + ':' + o.phaseIndex] = o
    let newMap = {}
    for (let n of newPhases) newMap[n.setId + ':' + n.phaseIndex] = n

    // 失效阶段 → 移除效果
    for (let key in oldMap) {
        if (!newMap[key]) {
            let entry = oldMap[key]
            let set = SetRegistry[entry.setId]
            if (!set) continue
            let phase = set.phases[entry.phaseIndex]
            for (let eIdx = 0; eIdx < phase.effects.length; eIdx++) {
                removeEffect(player, phase.effects[eIdx], entry.setId, entry.phaseIndex, eIdx)
            }
            notifyDeactivate(player, set, phase)
        }
    }
    // 新激活阶段 → 应用效果
    for (let key in newMap) {
        if (!oldMap[key]) {
            let entry = newMap[key]
            let set = SetRegistry[entry.setId]
            if (!set) continue
            let phase = set.phases[entry.phaseIndex]
            for (let eIdx = 0; eIdx < phase.effects.length; eIdx++) {
                applyEffect(player, phase.effects[eIdx], entry.setId, entry.phaseIndex, eIdx)
            }
            notifyActivate(player, set, phase)
        }
    }
}

// 根据当前装备计算激活阶段并应用差异
function doMatchAndApply(player, eq) {
    let id = pid(player)
    let newPhases = []
    for (let setId in SetRegistry) {
        let set = SetRegistry[setId]
        if (!set || !set.phases) continue
        for (let i = 0; i < set.phases.length; i++) {
            try {
                if (isPhaseActive(eq, set.phases[i], set.slots)) {
                    newPhases.push({ setId: setId, phaseIndex: i })
                }
            } catch (e) {
                console.error('[套装系统] 阶段判定异常 ' + setId + ' p' + i + ': ' + e)
            }
        }
    }
    let old = ActiveSetTracker[id] || []
    if (!phasesEqual(old, newPhases)) {
        applySetDiff(player, old, newPhases)
        ActiveSetTracker[id] = newPhases
    }
}

// tick 轮询：装备快照变化时才重新评估
function pollAndReevaluate(player) {
    let id = pid(player)
    let eq = collectEquipped(player)
    let hash = hashFromEquipped(eq)
    if (SnapshotCache[id] === hash) return
    SnapshotCache[id] = hash
    doMatchAndApply(player, eq)
}

// 强制重新评估（装备变更/登录立即触发）
function reevaluateSetsForce(player) {
    let id = pid(player)
    let eq = collectEquipped(player)
    SnapshotCache[id] = hashFromEquipped(eq)
    doMatchAndApply(player, eq)
}

// 周期维护已激活效果（补回被牛奶/清除的永久药水、免疫药水、循环命令、属性兜底）
function maintainActiveEffects(player) {
    let active = ActiveSetTracker[pid(player)]
    if (!active || active.length === 0) return
    let gameTime = player.level.gameTime
    for (let entry of active) {
        let set = SetRegistry[entry.setId]
        if (!set) continue
        let phase = set.phases[entry.phaseIndex]
        for (let eIdx = 0; eIdx < phase.effects.length; eIdx++) {
            let effect = phase.effects[eIdx]
            let key = setEffectKey(entry.setId, entry.phaseIndex, eIdx)

            if (effect.type === 'attribute') {
                applyAttribute(player, effect, key) // 内部已判重
            } else if (effect.type === 'potion') {
                let target = effect.target || 'SELF'
                if (!effect.effect) continue
                if (target === 'SELF') {
                    // 永久/限时都需保持，缺失则补回
                    if (!player.hasEffect(effect.effect)) {
                        applyPotionSelf(player, effect)
                    }
                } else if (target === 'IMMUNE') {
                    if (player.hasEffect(effect.effect)) {
                        try { player.potionEffects.remove(effect.effect) } catch (e) {}
                    }
                }
            } else if (effect.type === 'command' && effect.repeat && effect.repeat > 0) {
                let cdKey = 'setrep_' + key
                let pData = player.persistentData
                let last = pData.getLong(cdKey)
                let interval = effect.repeat * 20
                if (last === 0) {
                    pData.putLong(cdKey, gameTime)
                } else if (gameTime - last >= interval) {
                    runSetCommands(player, effect.repeatCommands)
                    pData.putLong(cdKey, gameTime)
                }
            }
        }
    }
}

// 清除玩家所有已激活效果（死亡/下线时调用）
function clearAllActiveEffects(player) {
    let id = pid(player)
    let active = ActiveSetTracker[id]
    if (!active) return
    for (let entry of active) {
        let set = SetRegistry[entry.setId]
        if (!set) continue
        let phase = set.phases[entry.phaseIndex]
        for (let eIdx = 0; eIdx < phase.effects.length; eIdx++) {
            try { removeEffect(player, phase.effects[eIdx], entry.setId, entry.phaseIndex, eIdx) } catch (e) {}
        }
    }
}

function notifyActivate(player, set, phase) {
    if (set.silent) return
    let phaseName = phase.name || (phase.requiredCount + '件套')
    player.tell('§6[套装] §f' + set.name + ' §a' + phaseName + ' §a已激活')
}
function notifyDeactivate(player, set, phase) {
    if (set.silent) return
    let phaseName = phase.name || (phase.requiredCount + '件套')
    player.tell('§6[套装] §f' + set.name + ' §7' + phaseName + ' §7已失效')
}

// ==========================================
// 📋 套装注册表
// ==========================================

let SetRegistry = {}

/**
 * 注册套装
 * @param {string} id 套装唯一ID
 * @param {object} config 套装配置
 *   config.name            套装显示名
 *   config.silent          可选，true 时不发送激活/失效提示
 *   config.slots           套装成员槽位条件数组，每项 {slot, item, tag}
 *                         - slot: HEAD/CHEST/LEGS/FEET/MAINHAND/OFFHAND/curios:类型名(如 curios:ring)
 *                                 省略则任意槽位
 *                         - item: 'modid:item'  与 tag 二选一，皆省略则匹配任意物品
 *                         - tag : 'modid:tag'
 *   config.phases          阶段数组（递进：满足件数即激活，高阶段与低阶段效果叠加）
 *     phase.requiredCount  激活所需件数
 *     phase.name           可选，阶段显示名
 *     phase.effects        效果数组，每项:
 *       { type:'attribute', attribute:'minecraft:generic.max_health', amount:4, operation:'ADDITION' }
 *         operation: ADDITION(默认) / MULTIPLY_BASE / MULTIPLY_TOTAL
 *       { type:'potion', effect:'minecraft:speed', amplifier:0, duration:-1, target:'SELF', particles:false }
 *         duration: -1=永久 / 正数=秒
 *         target  : SELF(自身) / ATTACK_TARGET(攻击目标,即时) / IMMUNE(免疫该效果)
 *       { type:'command', activate:[...], deactivate:[...], repeat:5, repeatCommands:[...] }
 *         activate/deactivate: 激活/失效时执行(以玩家为 @s)
 *         repeat(秒)+repeatCommands: 激活期间循环执行
 */
function registerSet(id, config) {
    SetRegistry[id] = config
}

// ==========================================
// 📝 套装定义区域 —— 新增套装在此添加，高可见性
// ==========================================

// ✅ 示例套装：铁甲套装（可修改或删除）
registerSet('iron_armor_example', {
    name: '铁甲套装',
    slots: [
        { slot: 'HEAD', item: 'minecraft:iron_helmet' },
        { slot: 'CHEST', item: 'minecraft:iron_chestplate' },
        { slot: 'LEGS', item: 'minecraft:iron_leggings' },
        { slot: 'FEET', item: 'minecraft:iron_boots' },
    ],
    phases: [
        {
            requiredCount: 2,
            name: '2件套',
            effects: [
                { type: 'attribute', attribute: 'minecraft:generic.max_health', amount: 4, operation: 'ADDITION' },
            ]
        },
        {
            requiredCount: 4,
            name: '4件套',
            effects: [
                { type: 'attribute', attribute: 'minecraft:generic.armor', amount: 4, operation: 'ADDITION' },
                { type: 'potion', effect: 'minecraft:strength', amplifier: 0, duration: -1, target: 'SELF', particles: false },
            ]
        }
    ]
})

/* ───────── 完整效果类型参考模板（复制改用）─────────
registerSet('my_set', {
    name: '我的套装',
    silent: false,
    slots: [
        // 限定槽位 + 物品
        { slot: 'HEAD',  item: 'mymod:helm_a' },
        { slot: 'CHEST', item: 'mymod:chest_a' },
        // 限定槽位 + 标签
        { slot: 'LEGS',  tag: 'mymod:set_a_legs' },
        // curios 槽位
        { slot: 'curios:ring', item: 'mymod:ring_a' },
        { slot: 'curios:ring', item: 'mymod:ring_b' },
        // 任意槽位 + 物品
        { item: 'mymod:relic' },
    ],
    phases: [
        {
            requiredCount: 2,
            name: '2件套',
            effects: [
                { type: 'attribute', attribute: 'minecraft:generic.movement_speed', amount: 0.1, operation: 'MULTIPLY_BASE' },
                { type: 'potion', effect: 'minecraft:speed', amplifier: 1, duration: -1, target: 'SELF', particles: false },
            ]
        },
        {
            requiredCount: 4,
            name: '4件套',
            effects: [
                // 攻击目标时附加凋零
                { type: 'potion', effect: 'minecraft:wither', amplifier: 1, duration: 5, target: 'ATTACK_TARGET', particles: true },
                // 免疫中毒
                { type: 'potion', effect: 'minecraft:poison', target: 'IMMUNE' },
                // 激活/失效时执行命令
                { type: 'command', activate: ['particle minecraft:flame ~ ~1 ~ 0.5 0.5 0.5 0.05 20'],
                  deactivate: ['particle minecraft:smoke ~ ~1 ~ 0.5 0.5 0.5 0.05 20'] },
                // 激活期间每 10 秒循环执行
                { type: 'command', repeat: 10, repeatCommands: ['effect give @s minecraft:regeneration 5 0 true'] },
            ]
        }
    ]
})
───────────────────────────────────────── */

// ==========================================
// 🎮 事件入口
// ==========================================

// 登录：延迟 5 tick 评估（curios 在登录瞬间可能尚未就绪）
PlayerEvents.loggedIn(event => {
    let p = event.player
    if (!p || p.level.isClientSide()) return
    p.server.scheduleInTicks(5, () => {
        try { reevaluateSetsForce(p) } catch (e) { console.error('[套装系统] 登录评估失败: ' + e) }
    })
})

// 装备变更（原版背包/盔甲）→ 即时强制评估
PlayerEvents.inventoryChanged(event => {
    let p = event.player
    if (!p || p.level.isClientSide()) return
    try { reevaluateSetsForce(p) } catch (e) {}
})

// tick 兜底：每 5 tick 轮询装备快照（捕获 curios 变更），每 20 tick 维护已激活效果
PlayerEvents.tick(event => {
    let p = event.player
    if (!p || p.level.isClientSide()) return
    try {
        if (p.age % 5 === 0) pollAndReevaluate(p)
        if (p.age % 20 === 0) maintainActiveEffects(p)
    } catch (e) {
        console.error('[套装系统] tick 异常: ' + e)
    }
})

// 攻击目标 → APPLY ATTACK_TARGET 药水效果
EntityEvents.hurt(event => {
    let target = event.entity
    let attacker = event.source.player
    if (!attacker || !target || !target.isLiving()) return
    let active = ActiveSetTracker[pid(attacker)]
    if (!active) return
    for (let entry of active) {
        let set = SetRegistry[entry.setId]
        if (!set) continue
        let phase = set.phases[entry.phaseIndex]
        for (let effect of phase.effects) {
            if (effect.type === 'potion' && (effect.target || 'SELF') === 'ATTACK_TARGET') {
                if (!effect.effect) continue
                let dur = effect.duration === -1 ? -1 : (effect.duration || 1) * 20
                try { target.potionEffects.add(effect.effect, dur, effect.amplifier || 0, false, effect.particles !== false) }
                catch (e) {}
            }
        }
    }
})

// 玩家死亡：清除已激活效果（属性/永久药水），清空追踪状态（重生后由 tick 重算）
EntityEvents.death('minecraft:player', event => {
    let p = event.entity
    if (!p) return
    try { clearAllActiveEffects(p) } catch (e) {}
    let id = pid(p)
    delete ActiveSetTracker[id]
    delete SnapshotCache[id]
})

// 下线：清理内存追踪
PlayerEvents.loggedOut(event => {
    let id = pid(event.player)
    delete ActiveSetTracker[id]
    delete SnapshotCache[id]
})

console.log('[套装系统] SetEffect.js 已加载，已注册套装数: ' + Object.keys(SetRegistry).length)
