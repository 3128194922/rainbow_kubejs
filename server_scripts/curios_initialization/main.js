// priority: 0
// ==========================================================
// Curios 槽位初始化
// 玩家每次登录时：
//   1. 头部槽位固定为 1 格；
//   2. 历史遗留/非本包使用的自定义槽位收缩到 0 格。
// 直接调用 CuriosApi 的槽位接口，不再逐个拼接 `/curios` 命令：
//   - 避免显示名被当作实体选择器（昵称、队伍前缀会导致命令失败）；
//   - 单个槽位异常不会中断后续槽位；
//   - 日志只在确实发生变化时输出，避免每次登录刷屏。
// ==========================================================

const CURIO_HEAD_SLOT = 'head'
const CURIO_HEAD_SLOT_SIZE = 1
// 需要清零的历史槽位类型；已去重。
const CURIO_LEGACY_SLOTS = [
    'body', 'belt', 'bracelet', 'curio', 'hands',
    'necklace', 'ring', 'rings', 'feet',
    'legs', 'heart', 'waist', 'talisman', 'informational',
]

// 把指定槽位调整为 size 格；与 `/curios set` 使用同一套 CuriosApi。
function setCurioSlotSize(player, slotType, size) {
    CuriosApi.getSlotHelper().setSlotsForType(slotType, player, size)
}

// 返回调整前的槽位数量，用于判断是否需要写入以及输出变更日志。
function getCurioSlotSize(player, slotType) {
    return CuriosApi.getSlotHelper().getSlotsForType(player, slotType)
}

// 重置单个历史槽位；失败只记录该槽位，不影响其他槽位。
function resetLegacyCurioSlot(player, slotType) {
    try {
        let before = getCurioSlotSize(player, slotType)
        if (before <= 0) return null
        setCurioSlotSize(player, slotType, 0)
        return slotType + ':' + before + '->0'
    } catch (error) {
        console.log('[CuriosInit] 槽位 ' + slotType + ' 重置失败: ' + error)
        return null
    }
}

// 初始化玩家 Curios 槽位，返回本次实际发生变化的槽位描述。
function initCurioSlots(player) {
    let changes = []

    let headBefore = getCurioSlotSize(player, CURIO_HEAD_SLOT)
    if (headBefore !== CURIO_HEAD_SLOT_SIZE) {
        setCurioSlotSize(player, CURIO_HEAD_SLOT, CURIO_HEAD_SLOT_SIZE)
        changes.push(CURIO_HEAD_SLOT + ':' + headBefore + '->' + CURIO_HEAD_SLOT_SIZE)
    }

    for (let i = 0; i < CURIO_LEGACY_SLOTS.length; i++) {
        let change = resetLegacyCurioSlot(player, CURIO_LEGACY_SLOTS[i])
        if (change != null) changes.push(change)
    }

    return changes
}

PlayerEvents.loggedIn(event => {
    // loggedIn 本身只在服务端触发；event.level 可能为空，保留显式判断兼容事件包装差异。
    if (event.level != null && event.level.isClientSide()) return

    let player = event.player
    if (player == null) return

    try {
        let changes = initCurioSlots(player)
        if (changes.length > 0) {
            console.log('[CuriosInit] ' + player.username + ' 槽位已初始化: ' + changes.join(', '))
        }
    } catch (error) {
        console.log('[CuriosInit] 玩家 ' + player.username + ' 饰品初始化失败: ' + error)
    }
})
