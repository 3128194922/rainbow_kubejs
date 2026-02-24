// priority: 100
// ==========================================
// 🛡️ 共生徽章 (Symbiosis Badge) - Startup Script
// 包含物品注册、Curios逻辑、实体控制逻辑
// ==========================================

const SymbiosisConfig = {
    // 骑乘黑名单 (禁止骑乘这些生物)
    BLACKLIST: [
        'minecraft:wither',
        'minecraft:ender_dragon'
    ]
}

// 注册物品
StartupEvents.registry('item', event => {
    event.create('rainbow:ccb')
        .displayName('共生徽章')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create()
                .curioTick((slotContext, stack) => {
                    let player = slotContext.entity()
                    if (!player || player.level.isClientSide()) return

                    let lastUUID = player.persistentData.getString("SymbiosisLastVehicleUUID")
                    let vehicle = player.vehicle

                    // 定义属性 UUID
                    let HEALTH_UUID = UUID.fromString("c8c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c801")
                    let ARMOR_UUID = UUID.fromString("c8c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c802")
                    let DAMAGE_UUID = UUID.fromString("c8c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c803")
                    let OP = AttributeModifier.Operation.ADDITION

                    // 清理函数
                    let cleanUp = (uuidStr) => {
                        try {
                            let target = player.level.getEntity(UUID.fromString(uuidStr))
                            if (target && target.isLiving()) {
                                let hAttr = target.getAttribute("minecraft:generic.max_health")
                                if (hAttr) hAttr.removeModifier(HEALTH_UUID)
                                let aAttr = target.getAttribute("minecraft:generic.armor")
                                if (aAttr) aAttr.removeModifier(ARMOR_UUID)
                                let dAttr = target.getAttribute("minecraft:generic.attack_damage")
                                if (dAttr) dAttr.removeModifier(DAMAGE_UUID)
                                
                                // 清除仇恨
                                target.setTarget(null)
                            }
                        } catch (e) {}
                    }

                    if (vehicle && vehicle.isLiving()) {
                        let currentUUID = vehicle.uuid.toString()

                        if (lastUUID !== currentUUID) {
                            if (lastUUID) cleanUp(lastUUID)
                            player.persistentData.putString("SymbiosisLastVehicleUUID", currentUUID)
                        }

                        // 添加/检查属性
                        let hAttr = vehicle.getAttribute("minecraft:generic.max_health")
                        if (hAttr && !hAttr.getModifier(HEALTH_UUID)) {
                            hAttr.addPermanentModifier(new AttributeModifier(HEALTH_UUID, "ccb_health", 20, OP))
                            vehicle.heal(20)
                        }
                        
                        let aAttr = vehicle.getAttribute("minecraft:generic.armor")
                        if (aAttr && !aAttr.getModifier(ARMOR_UUID)) {
                            aAttr.addPermanentModifier(new AttributeModifier(ARMOR_UUID, "ccb_armor", 10, OP))
                        }

                        let dAttr = vehicle.getAttribute("minecraft:generic.attack_damage")
                        if (dAttr && !dAttr.getModifier(DAMAGE_UUID)) {
                            dAttr.addPermanentModifier(new AttributeModifier(DAMAGE_UUID, "ccb_damage", 5, OP))
                        }

                    } else {
                        if (lastUUID) {
                            cleanUp(lastUUID)
                            player.persistentData.remove("SymbiosisLastVehicleUUID")
                        }
                    }
                })
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity();
                    if (!entity) return false;

                    // 限制同一玩家不能装备多个
                    if (hasCurios(entity, 'rainbow:ccb')) {
                        return false;
                    }
                    return true;
                })
                .canEquipFromUse((slotContext, stack) => {
                    return false;
                })
                .onUnequip((slotContext, newStack, stack) => {
                    let player = slotContext.entity()
                    if (!player || player.level.isClientSide()) return
                    
                    let lastUUID = player.persistentData.getString("SymbiosisLastVehicleUUID")
                    
                    let HEALTH_UUID = UUID.fromString("c8c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c801")
                    let ARMOR_UUID = UUID.fromString("c8c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c802")
                    let DAMAGE_UUID = UUID.fromString("c8c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c803")

                    if (lastUUID) {
                        try {
                            let target = player.level.getEntity(UUID.fromString(lastUUID))
                            if (target && target.isLiving()) {
                                let hAttr = target.getAttribute("minecraft:generic.max_health")
                                if (hAttr) hAttr.removeModifier(HEALTH_UUID)
                                let aAttr = target.getAttribute("minecraft:generic.armor")
                                if (aAttr) aAttr.removeModifier(ARMOR_UUID)
                                let dAttr = target.getAttribute("minecraft:generic.attack_damage")
                                if (dAttr) dAttr.removeModifier(DAMAGE_UUID)
                            }
                        } catch (e) {}
                        player.persistentData.remove("SymbiosisLastVehicleUUID")
                    }
                })
        )
})

// ==========================================
// 🕹️ 实体控制逻辑 (Entity Control Logic)
// ==========================================

// 获取玩家输入并转换为移动向量 (复制自 MobTameStartup.js)
function getRiddenInput(player) {
    let strafe = player.xxa * 0.5
    let forward = player.zza
    let vehicle = player.vehicle
    let isJumping = isClient && Minecraft.getInstance().player.input.jumping
    
    if (forward <= 0.0) {
        forward *= 0.25
    }
    
    let yawRad = (player.yRotO * Math.PI) / 180
    let sin = Math.sin(yawRad)
    let cos = Math.cos(yawRad)
    let x = strafe * cos - forward * sin
    let z = strafe * sin + forward * cos
    
    let isWaterAnimalInWater = vehicle instanceof WaterAnimal && vehicle.inWater
    let jump = 0.0
    
    if (vehicle instanceof FlyingMob || isWaterAnimalInWater) {
        if (isJumping && player.xRotO > 40) {
            jump = 0
        } else if (isJumping) {
            jump = isWaterAnimalInWater ? 0.07 : 0.035
        } else if (player.xRotO > 40) {
            jump = isWaterAnimalInWater ? -0.07 : -0.035
        }
    } else if (vehicle.onGround() && isJumping) {
        jump = 0.58
    } else if (vehicle.inWater && isJumping) {
        jump = 0.04
    } else if (vehicle.navigation instanceof WallClimberNavigation && vehicle.horizontalCollision) {
        jump = 0.09
    }
    
    let airborne = vehicle && !vehicle.onGround() &&
        !(vehicle instanceof FlyingMob) &&
        !(vehicle instanceof WaterAnimal && vehicle.inWater)
        
    let xSpeed = airborne ? x * 0.03 : vehicle instanceof FlyingMob ? x * 0.08 : x * 0.2
    let zSpeed = airborne ? z * 0.03 : vehicle instanceof FlyingMob ? z * 0.08 : z * 0.2
    
    return new Vec3d(xSpeed, jump, zSpeed)
}

// 控制实体移动
function controlEntity(entity, player) {
    if (!player) return
    if (!entity.isAlive()) return
    
    // 如果是飞行生物，清除降落目标
    let landTarget = entity.persistentData.LandTarget
    if (entity instanceof FlyingMob && landTarget) {
        entity.persistentData.remove("LandTarget")
    }
    
    let vec3 = getRiddenInput(player)
    let vec2 = new Vec2(player.pitch * 0.5, player.yaw)
    
    entity.setRotation(vec2.y, vec2.x)
    entity.yRotO = entity.yBodyRot = entity.yHeadRot = entity.yaw
    
    if (entity instanceof WaterAnimal || entity instanceof FlyingMob) {
        entity.yRotO = entity.yBodyRot = entity.yHeadRot = entity.yaw
        let pitch = -player.xRotO * 0.5
        entity.xRotO = entity.pitch = pitch
    }
    
    entity.addMotion(vec3.x(), vec3.y(), vec3.z())
    
    // 强制更新位置，防止服务器回弹 (可选，视情况而定)
    // entity.hasImpulse = true
}

// 监听实体 Tick 事件，实现全局控制
ForgeEvents.onEvent('net.minecraftforge.event.entity.living.LivingEvent$LivingTickEvent', event => {
    let entity = event.entity
    if (entity.level.isClientSide()) return
    
    // 检查是否有乘客
    if (!entity.isVehicle()) return
    
    let passengers = entity.getPassengers()
    if (passengers.isEmpty()) return
    
    // 获取控制者 (通常是第一个乘客)
    let passenger = passengers.get(0)
    if (!passenger.isPlayer()) return
    
    // 检查玩家是否佩戴共生徽章 (使用 Curios API 检查)
    // 注意：这里需要确保 hasCurios 函数可用，或者手动检查 NBT/Tag
    // 由于 Curios API 可能会变动，这里使用 Tag 检查更稳妥，或者依赖 Utils.js 中的 hasCurios
    // 假设 Utils.js 中的 hasCurios 是全局的
    if (typeof hasCurios !== 'undefined' && hasCurios(passenger, 'rainbow:ccb')) {
        
        // 黑名单检查
        let entityType = entity.type.toString()
        if (SymbiosisConfig.BLACKLIST.includes(entityType)) return
        
        // 玩家特殊处理：只加成，不控制
        if (entity instanceof Player) return
        
        // 执行控制逻辑
        controlEntity(entity, passenger)
    }
})
