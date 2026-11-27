// priority: 0
// ==========================================================
// Curios 槽位初始化（每名玩家只执行一次）
// 配置格式：[保留的槽位类型, 数量]
//   - 列出的槽位调整为指定数量；
//   - 未列出的已注册槽位一律收缩到 0 格。
// 当前保留：head=1、back=1、charm=4
// 修改保留配置后，提升 CURIO_INIT_STORE 的版本号，老玩家才会重新初始化。
// ==========================================================

const CURIO_INIT_STORE = 'curios_slots_initialized_v1'
const CURIO_KEEP_SLOTS = [
    ['head', 1],
    ['back', 1],
    ['charm', 4],
]

function getCurioSlotSize(player, slotType) {
    return CuriosApi.getSlotHelper().getSlotsForType(player, slotType)
}

// 一次性标记存主世界 persistentData：玩家死亡重建实体时不会丢失。
function getCurioInitStore(player) {
    return player.server.overworld().persistentData.getCompound(CURIO_INIT_STORE)
}

function isCurioInitialized(player) {
    return getCurioInitStore(player).getBoolean(String(player.uuid))
}

function markCurioInitialized(player) {
    let worldData = player.server.overworld().persistentData
    let store = worldData.getCompound(CURIO_INIT_STORE)
    store.putBoolean(String(player.uuid), true)
    worldData.put(CURIO_INIT_STORE, store)
}

function setCurioSlotSize(player, slotType, size) {
    CuriosApi.getSlotHelper().setSlotsForType(slotType, player, size)
}

function isKeepCurioSlot(slotType) {
    for (let i = 0; i < CURIO_KEEP_SLOTS.length; i++) {
        if (CURIO_KEEP_SLOTS[i][0] === slotType) return true
    }
    return false
}

// 调整单个槽位并校验结果；无变化返回 null。
function resizeCurioSlot(player, slotType, size) {
    let before = getCurioSlotSize(player, slotType)
    if (before === size) return null

    setCurioSlotSize(player, slotType, size)

    let after = getCurioSlotSize(player, slotType)
    if (after !== size) {
        throw new Error('目标 ' + size + '，实际 ' + after)
    }
    return slotType + ':' + before + '->' + after
}

// 返回 { changes, errors }；单个槽位失败不阻断其他槽位。
function initCurioSlots(player) {
    let changes = []
    let errors = []

    for (let i = 0; i < CURIO_KEEP_SLOTS.length; i++) {
        let slotType = CURIO_KEEP_SLOTS[i][0]
        let size = CURIO_KEEP_SLOTS[i][1]
        try {
            let change = resizeCurioSlot(player, slotType, size)
            if (change != null) changes.push(change)
        } catch (error) {
            errors.push(slotType + ' 保留失败: ' + error)
        }
    }

    let slotTypes = getCuriosSlotTypes(player)
    if (slotTypes.length === 0) {
        errors.push('未取得 Curios 槽位列表')
    } else {
        for (let i = 0; i < slotTypes.length; i++) {
            let slotType = slotTypes[i]
            if (isKeepCurioSlot(slotType)) continue
            try {
                let change = resizeCurioSlot(player, slotType, 0)
                if (change != null) changes.push(change)
            } catch (error) {
                errors.push(slotType + ' 清除失败: ' + error)
            }
        }
    }

    return { changes: changes, errors: errors }
}

PlayerEvents.loggedIn(event => {
    if (event.level != null && event.level.isClientSide()) return

    let player = event.player
    if (player == null) return

    // 已初始化过的玩家直接跳过，避免每次登录重复收缩槽位。
    if (isCurioInitialized(player)) return

    try {
        let result = initCurioSlots(player)
        if (result.errors.length > 0) {
            console.log('[CuriosInit] ' + player.username + ' 初始化未完成: ' + result.errors.join('; '))
            return
        }

        // 只有全部槽位处理成功才落标记，失败的玩家下次登录会重试。
        markCurioInitialized(player)

        if (result.changes.length > 0) {
            console.log('[CuriosInit] ' + player.username + ' 首次初始化: ' + result.changes.join(', '))
        } else {
            console.log('[CuriosInit] ' + player.username + ' 首次初始化完成，槽位已是目标配置')
        }
    } catch (error) {
        console.log('[CuriosInit] 玩家 ' + player.username + ' 饰品初始化失败: ' + error)
    }
})
