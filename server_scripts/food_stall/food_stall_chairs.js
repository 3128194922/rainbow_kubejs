// priority: 1000
// ==========================================
// 🍽️ 帕瓦椅子(rainbow:food_stall_chairs) 交互逻辑
// ==========================================
// 功能：
//   1. 方块无法被破坏（硬度 -1 已保证常规挖掘/爆炸无效，这里再拦截破坏事件兜底）
//   2. 潜行 + 右键 → 收回椅子（移除方块并归还物品）
//   3. 普通右键 → 坐上椅子（生成一个不可见 marker 盔甲架作为座位实体，玩家骑乘）
//   4. 坐在椅子上的玩家始终处于无敌状态（骑乘我们的座位时免疫所有伤害）
// 说明：座位实体用一个不可见、无 AI、无重力、无碰撞(marker)的盔甲架实现，
//       并写入 persistentData 标记 rainbowChair 以便识别与清理。

const CHAIR_BLOCK = 'rainbow:food_stall_chairs'
const CHAIR_SEAT_TAG = 'rainbowChair'

// 座位在方块内的位置：方块中心，y 略微抬离地面（可微调）
const SEAT_Y_OFFSET = 0.5

// ==========================================
// 常量：Java 类加载
// ==========================================
const $UUID = Java.loadClass('java.util.UUID')

// ==========================================
// 工具函数
// ==========================================

// 判断某个(骑乘物)实体是否为我们的椅子座位
function isChairSeat(entity) {
    if (!entity) return false
    try {
        return entity.persistentData.getBoolean(CHAIR_SEAT_TAG)
    } catch (e) {
        return false
    }
}

// 移除座位实体（其乘客会被原版自动甩下）
function removeSeat(seat) {
    try {
        if (seat != null) seat.discard()
    } catch (e) {}
}

// 玩家是否正骑乘在椅子的座位上
function isSittingOnChair(player) {
    const v = player.vehicle
    return isChairSeat(v)
}

// 让玩家坐上椅子
function sitPlayer(player, level, chairPos) {
    try {
        // 已在椅子上：再次右键时不下车（交给 toggle 处理），此处不重复生成
        if (isSittingOnChair(player)) return

        var stand = level.createEntity('minecraft:armor_stand')
        stand.mergeNbt({
            NoAI: true,
            NoGravity: true,
            Invisible: true,
            Marker: true,
            Invulnerable: true,
            Silent: true
        })
        stand.setPosition(
            chairPos.x + 0.5,
            chairPos.y + SEAT_Y_OFFSET,
            chairPos.z + 0.5
        )
        stand.spawn()

        // 座位标记 + 记录椅子的方块坐标（供清理时校验方块是否仍在）
        stand.persistentData.putBoolean(CHAIR_SEAT_TAG, true)
        stand.persistentData.putInt('ChairX', chairPos.x)
        stand.persistentData.putInt('ChairY', chairPos.y)
        stand.persistentData.putInt('ChairZ', chairPos.z)

        // 记录玩家本次骑乘的座位 UUID
        player.persistentData.putString('rainbowChairSeat', stand.uuid.toString())

        // 让玩家骑乘座位
        player.startRiding(stand, true)
    } catch (e) {
        console.log('[food_stall_chairs] 坐上椅子失败: ' + e)
    }
}

// 潜行右键收回：移除方块并归还物品
function recallChair(block, player) {
    block.set('minecraft:air') // 不触发 broken 事件，因而无法破坏约束不受影响
    player.give(Item.of(CHAIR_BLOCK))
    player.tell(Text.gold('已收回帕瓦椅子'))
}

// ==========================================
// 右键交互
// ==========================================
BlockEvents.rightClicked(CHAIR_BLOCK, event => {
    let { block, player, level } = event
    if (level.isClientSide()) return
    let pos = block.pos

    // 潜行 + 右键 → 收回椅子
    if (player.isCrouching()) {
        recallChair(block, player)
        event.cancel()
        return
    }

    // 普通右键 → 坐上椅子
    if (player.vehicle) {
        // 已骑乘其它实体：若正骑在椅子上则下车，否则不响应
        if (isChairSeat(player.vehicle)) {
            player.stopRiding()
            // 座位清理由下方 tick 统一处理
        }
        event.cancel()
        return
    }

    sitPlayer(player, level, pos)
    event.cancel()
})

// ==========================================
// 无法破坏兜底：拦截所有破坏事件（仅能通过潜行右键收回）
// ==========================================
BlockEvents.broken(CHAIR_BLOCK, event => {
    if(event.player.isCreative()) return // 创造模式允许破坏
    event.cancel()
    //event.player.tell(Text.red('帕瓦椅子无法破坏，请潜行 + 右键收回'))
})

// ==========================================
// 坐在椅子上的玩家 → 无敌（免疫所有伤害）
// ==========================================
EntityEvents.hurt(event => {
    let entity = event.entity
    if (!entity || !entity.isPlayer()) return
    if (isSittingOnChair(entity)) {
        event.cancel()
    }
})

// ==========================================
// 座位实体生命周期清理
// ==========================================
// 每个玩家每 10 tick（按 age 轮询）检查一次自己的"椅子座位"：
//   - 玩家已下车 / 座位不存在 / 椅子方块已被移除 → 移除座位实体并清除标记
// 写法对齐项目已验证模式（SetEffect.js 的 PlayerEvents.tick、Skillwheel.js 的
// player.level.getEntity(UUID.fromString(...)) / player.level.getBlock(x,y,z)）
// 注意：玩家骑乘中跨维度移动属极端情况，届时旧座位可能遗留（不可见 marker，无副作用）
PlayerEvents.tick(event => {
    let player = event.player
    if (!player || !player.level || player.level.isClientSide()) return
    if (player.age % 10 !== 0) return

    // 所有变量都声明在函数作用域，避免 Rhino 对 try 块内 const/let 的作用域 bug
    let seatUuid, vehicle, seat, cx, cy, cz, chairBlock
    try {
        seatUuid = player.persistentData.getString('rainbowChairSeat')
        if (!seatUuid) return

        vehicle = player.vehicle
        // 玩家已下车，或正在乘坐的不是我们的座位
        if (!isChairSeat(vehicle)) {
            // 在玩家当前维度找回旧座位并移除，防止遗留
            seat = player.level.getEntity($UUID.fromString(seatUuid))
            removeSeat(seat)
            player.persistentData.remove('rainbowChairSeat')
            return
        }

        // 正在坐：校验椅子方块是否仍然存在（用生成时记录的方块坐标）
        cx = vehicle.persistentData.getInt('ChairX')
        cy = vehicle.persistentData.getInt('ChairY')
        cz = vehicle.persistentData.getInt('ChairZ')
        chairBlock = vehicle.level.getBlock(cx, cy, cz)
        if (!chairBlock || chairBlock.id !== CHAIR_BLOCK) {
            removeSeat(vehicle) // discard 会自动甩下玩家
            player.persistentData.remove('rainbowChairSeat')
        }
    } catch (e) {
        console.log('[food_stall_chairs] 座位清理失败: ' + e)
    }
})