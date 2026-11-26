// priority: 0
// ==========================================
// 🛡️ 共生徽章 (Symbiosis Badge) - Server Script
// 包含右键交互逻辑
// ==========================================

const SymbiosisServerConfig = {
    // 骑乘黑名单 (禁止骑乘这些生物)
    BLACKLIST: [
        'minecraft:wither',
        'minecraft:ender_dragon'
    ]
}

// 踩踩背 (共生徽章) - 右键骑乘逻辑
ItemEvents.entityInteracted("rainbow:ccb", event => {
    // 真物品交互时，不做任何销毁处理，防止玩家手持真物品骑乘时误删
    handleRide(event)
})

// 共生徽章只在玩家骑乘时工作；由玩家 tick 驱动，不再扫描全部生物。
PlayerEvents.tick(event => {
    if (typeof global.symbiosisBadgePlayerTick !== 'function') return
    global.perfTime('symbiosis-badge-playerTick', () => global.symbiosisBadgePlayerTick(event))
})

function handleRide(event) {
    let player = event.player
    let level = player.level
    let target = event.target
    
    // 只在主手触发时执行
    if (event.hand != "MAIN_HAND") return
    
    // 获取真实饰品 (active curios mechanism is automatic right-click triggers fake item)
    // 必须获取玩家身上实际装备的饰品才能正确写入 NBT
    let realItem = getCuriosItem(player, "rainbow:ccb")
    if (!realItem) {
        player.tell(Text.red("你必须装备共生徽章才能使用！"))
        return
    }

    // 允许骑乘任何活体生物
    if (target.isLiving()) {
        
        // 黑名单检查
        let entityType = target.type.toString()
        if (SymbiosisServerConfig.BLACKLIST.includes(entityType)) {
            player.tell(Text.red("该生物无法被寄生！"))
            return
        }

        // === 清理上一个生物的属性加成 ===
        // 防止因直接切换坐骑导致上一个生物的属性加成残留
        // 数据源改为玩家的 persistentData
        let lastUUID = player.persistentData.getString("SymbiosisLastVehicleUUID")
        
        let HEALTH_UUID = UUID.fromString("c8c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c801")
        let ARMOR_UUID = UUID.fromString("c8c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c802")
        let DAMAGE_UUID = UUID.fromString("c8c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c803")

        if (lastUUID) {
            try {
                let oldTarget = level.getEntity(UUID.fromString(lastUUID))
                if (oldTarget && oldTarget.isLiving()) {
                    let hAttr = oldTarget.getAttribute("minecraft:generic.max_health")
                    if (hAttr) hAttr.removeModifier(HEALTH_UUID)
                    let aAttr = oldTarget.getAttribute("minecraft:generic.armor")
                    if (aAttr) aAttr.removeModifier(ARMOR_UUID)
                    let dAttr = oldTarget.getAttribute("minecraft:generic.attack_damage")
                    if (dAttr) dAttr.removeModifier(DAMAGE_UUID)
                }
            } catch (e) {}
        }

        // === 立即写入新的 NBT ===
        // 确保 curioTick 能正确识别当前状态
        // 改为写入玩家 persistentData，不再操作物品 NBT
        player.persistentData.putString("SymbiosisLastVehicleUUID", target.getUuid().toString())

        // === 延迟执行骑乘逻辑 ===
        // 关键修复：直接在 ItemEvents 中执行 startRiding 会导致玩家状态改变，
        // 从而打断 Curios 的假物品清理流程，导致刷出无 NBT 的假物品。
        // 将骑乘逻辑延迟 1 tick 执行，确保当前物品交互事件正常结束，Curios 能正确回收假物品。
        player.server.scheduleInTicks(1, callback => {
            let p = level.getPlayerByUUID(player.uuid)
            let t = level.getEntity(target.uuid)
            if (p && t && t.isAlive()) {
                 p.startRiding(t, true)
            }
        })
    }
}

// 监听实体伤害事件：实现仇恨跟随逻辑
// 当玩家骑乘生物A攻击生物B时，让A对B产生仇恨
EntityEvents.hurt(event => {
    let target = event.entity // 被攻击者 (生物B)
    let source = event.source.actual // 攻击源 (玩家)

    if (!source || !source.isPlayer()) return
    
    // 检查玩家是否骑乘着生物
    let vehicle = source.vehicle
    if (!vehicle || !vehicle.isLiving()) return

    // 检查玩家是否佩戴共生徽章
    let realItem = getCuriosItem(source, "rainbow:ccb")
    if (!realItem) return

    // 检查黑名单
    if (SymbiosisServerConfig.BLACKLIST.includes(vehicle.type.toString())) return

    // 让坐骑对目标产生仇恨
    try {
        vehicle.setTarget(target)
    } catch (e) {
        // 部分生物可能不支持 setTarget
    }
})
