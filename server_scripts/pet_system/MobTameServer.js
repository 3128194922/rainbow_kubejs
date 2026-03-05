// priority: 0
// ==========================================
// 🐾 自定义实体驯服与AI行为系统
// ==========================================

let NearestAttackableTargetGoal = Java.loadClass("net.minecraft.world.entity.ai.goal.target.NearestAttackableTargetGoal")
let SpiderTargetGoal = Java.loadClass("net.minecraft.world.entity.monster.Spider$SpiderTargetGoal")
let HurtByTargetGoal = Java.loadClass("net.minecraft.world.entity.ai.goal.target.HurtByTargetGoal")
let MeleeAttackGoal = Java.loadClass("net.minecraft.world.entity.ai.goal.MeleeAttackGoal")
let PathfinderMob = Java.loadClass("net.minecraft.world.entity.PathfinderMob")
let IronGolem = Java.loadClass("net.minecraft.world.entity.animal.IronGolem")
let LivingEntity = Java.loadClass("net.minecraft.world.entity.LivingEntity")
let CustomGoal = Java.loadClass("net.liopyu.entityjs.util.ai.CustomGoal")
let Player = Java.loadClass("net.minecraft.world.entity.player.Player")
let FlyingMob = Java.loadClass("net.minecraft.world.entity.FlyingMob")
let TamableAnimal = Java.loadClass("net.minecraft.world.entity.TamableAnimal")
let ClipContext = Java.loadClass("net.minecraft.world.level.ClipContext")
let HitResultType = Java.loadClass("net.minecraft.world.phys.HitResult$Type")

/**
 * 驯服物品映射表
 * 定义了哪些实体可以被驯服，以及需要使用什么物品。
 * 格式: "实体ID": "驯服物品ID"
 */
let tameableMobs = {
    "minecraft:iron_golem": 'create:transmitter',
    "minecraft:zombie": 'rainbow:gauntlet',
    'minecraft:drowned':'rainbow:gauntlet',
    'dungeonsdelight:rotten_zombie': 'rainbow:gauntlet',
    'minecraft:husk': 'rainbow:gauntlet',
    'windswept:chilled': 'rainbow:gauntlet',
    'player_mobs:player_mob': 'rainbow:gauntlet'
}

/**
 * 重置并重新应用驯服生物的目标选择逻辑
 * 
 * - 移除原有的攻击目标，防止误伤。
 * - 添加自定义的攻击目标逻辑：
 *   - 攻击主人最后攻击的目标。
 *   - 攻击最后攻击主人的目标。
 * - 忽略其他被同一主人驯服的生物。
 */
function reviseTamedPetGoals(mob) {
    if (mob instanceof PathfinderMob) {
        // 停止当前所有目标
        mob.targetSelector.getRunningGoals().forEach(goal => goal.stop())
        // 移除所有 NearestAttackableTargetGoal，防止主动攻击
        mob.targetSelector.removeAllGoals(goal => goal instanceof NearestAttackableTargetGoal)
        
        if (mob.goalSelector.availableGoals.some(goal => goal.goal instanceof MeleeAttackGoal)) {
            // 延迟1tick添加自定义目标选择器
            mob.server.scheduleInTicks(1, () => {
                mob.targetSelector.addGoal(1, new NearestAttackableTargetGoal(mob, LivingEntity, 1, true, false, t => {
                    if (mob.persistentData.OwnerName) {
                        let owner = mob.server.getPlayer(mob.persistentData.OwnerName)
                        if (owner) {
                            let lastAttackedId = owner.persistentData.LastAttackedMobId
                            let lastAttackedMeId = owner.persistentData.LastMobToAttackMe
                            
                            // 攻击主人攻击的目标
                            if (lastAttackedId) {
                                let entityRef = mob.level.getEntities().filter(e => e.getUuid().toString() == lastAttackedId)[0]
                                if (entityRef) {
                                    // 不攻击主人自己的宠物
                                    if (entityRef.persistentData.OwnerName == owner.getUuid().toString() ||
                                        (t instanceof TamableAnimal && t.isOwnedBy(owner))
                                    ) {
                                        owner.persistentData.remove("LastMobToAttackMe")
                                        return false
                                    }
                                    if (entityRef.distanceToEntity(mob) <= 15) {
                                        return entityRef.getUuid().toString() == t.getUuid().toString()
                                    } else {
                                        owner.persistentData.remove("LastAttackedMobId")
                                    }
                                } else {
                                    owner.persistentData.remove("LastAttackedMobId")
                                }
                            }
                            
                            // 攻击攻击主人的目标
                            if (lastAttackedMeId) {
                                let entityRef = mob.level.getEntities().filter(e => e.getUuid().toString() == lastAttackedMeId)[0]
                                if (entityRef) {
                                    if (entityRef.persistentData.OwnerName == owner.getUuid().toString() ||
                                        (t instanceof TamableAnimal && t.isOwnedBy(owner))
                                    ) {
                                        owner.persistentData.remove("LastMobToAttackMe")
                                        return false
                                    }
                                    if (entityRef.distanceToEntity(mob) <= 15) {
                                        return entityRef.getUuid().toString() == t.getUuid().toString()
                                    } else {
                                        owner.persistentData.remove("LastMobToAttackMe")
                                    }
                                } else {
                                    owner.persistentData.remove("LastMobToAttackMe")
                                }
                            }
                        }
                    }
                    // 默认不攻击主人
                    let fallback = t instanceof Player && mob.persistentData.OwnerName != t.getUuid().toString()
                    return fallback
                }))
            })
        }
    }
}

// 实体生成时应用驯服逻辑（如果是已驯服的实体）
EntityEvents.spawned(event => {
    let { entity } = event
    let tamingItem = tameableMobs[entity.type]
    if (tamingItem && entity.persistentData.OwnerName)
        reviseTamedPetGoals(entity)
})

/**
 * 远程控制飞行宠物坐下/起立
 * 玩家潜行并手持驯服物品右键，可远程切换宠物的坐下状态
 */
ItemEvents.rightClicked(event => {
    let { player, item, level, target } = event
    if (target && target.entity) return
    if (level.isClientSide()) return
    let reach = 40
    let eyePos = player.getEyePosition(1.0)
    let lookVec = player.getLookAngle()
    let end = eyePos.add(lookVec.x() * reach, lookVec.y() * reach, lookVec.z() * reach)
    let blockHit = level.clip(new ClipContext(
        eyePos,
        end,
        ClipContext.Block.OUTLINE,
        ClipContext.Fluid.NONE,
        player
    ))
    if (blockHit.getType() != HitResultType.MISS) {
        end = blockHit.getLocation()
    }
    let aabb = AABB.of(eyePos.x(), eyePos.y(), eyePos.z(), end.x(), end.y(), end.z()).inflate(1)
    let closestDistance = reach
    level.getEntitiesWithin(aabb).forEach(entity => {
        if (entity != player) {
            let dist = eyePos.distanceTo(entity.getEyePosition(1.0))
            if (dist < closestDistance) {
                if (entity.persistentData.OwnerName &&
                    entity.persistentData.OwnerName == player.getUuid().toString()
                ) {
                    if (entity instanceof FlyingMob) {
                        let tameItem = tameableMobs[entity.type]
                        if (player.isShiftKeyDown() && tameItem == player.mainHandItem.id) {
                            let current = entity.persistentData.Sitting || 0
                            entity.persistentData.Sitting = current == 0 ? 1 : 0
                        }
                    }

                }
            }
        }
    })
})

/**
 * 实体交互逻辑：驯服、装鞍、坐下
 * 
 * - 手持驯服物品右键未驯服实体：50% 概率驯服。
 * - 手持鞍右键已驯服实体：装备鞍。
 * - 潜行右键已驯服实体：切换坐下/跟随状态。
 */
ItemEvents.entityInteracted(event => {
    let { target, player, player: { mainHandItem } } = event
    let tamingItem = tameableMobs[target.type]
    if (event.hand != "main_hand") return
    if (!target.persistentData.HasSaddle) target.persistentData.HasSaddle = 0
    
    // 驯服逻辑
    if (tamingItem && mainHandItem.id == tamingItem) {
        let randomChancetoFail = Math.random()
        if (!target.persistentData.OwnerName) {
            player.level.playSound(null, target.x, target.y, target.z, "minecraft:entity.generic.eat", "players", 0.5, 0.9)
            // 50% 失败概率
            if (randomChancetoFail < 0.5) {
                target.level.spawnParticles('minecraft:campfire_cosy_smoke', true, target.x + 0.5, target.y + 1.05, target.z + 0.5, 0, 0.3, 0, 2, 0.1)
                mainHandItem.count--
                return
            }
            // 成功驯服
            target.level.spawnParticles('minecraft:heart', true, target.x + 0.5, target.y + 1.05, target.z + 0.5, 0, 0.3, 0, 2, 0.1)
            target.persistentData.OwnerName = player.getUuid().toString()
            mainHandItem.count--
            player.swing("main_hand")
            reviseTamedPetGoals(target)
        }
    } 
    // 装鞍逻辑
    else if (target.persistentData.OwnerName &&
        target.persistentData.OwnerName == player.getUuid().toString() &&
        mainHandItem.id == "minecraft:saddle") {
        if (target.persistentData.HasSaddle == 0) {
            target.persistentData.HasSaddle = 1
            player.swing("main_hand")
            mainHandItem.count--
            event.cancel()
        }
    }
    // 坐下逻辑
    if (target.persistentData.OwnerName &&
        target.persistentData.OwnerName == player.getUuid().toString() &&
        player.isShiftKeyDown()
    ) {
        let current = target.persistentData.Sitting || 0
        target.persistentData.Sitting = current == 0 ? 1 : 0
        event.cancel()
    }

})

// 为可驯服生物添加自定义AI目标
Object.keys(tameableMobs).forEach(id => {
    EntityJSEvents.addGoalSelectors(id, event => {
        // 目标：跟随主人
        event.customGoal("follow_owner",
            3,
            e => e.persistentData.OwnerName != undefined &&
                e.persistentData.Sitting != 1,
            e => e.persistentData.OwnerName != undefined &&
                e.server.getPlayer(e.persistentData.OwnerName) != null &&
                e.persistentData.Sitting != 1,
            true,
            e => { },
            e => { },
            true,
            /**@param {Internal.PathfinderMob} e */ e => {
                let owner = e.server.getPlayer(e.persistentData.OwnerName)
                if (owner) {
                    if (owner.level.dimension == e.level.dimension &&
                        owner.distanceToEntity(e) >= 16) {
                        e.navigation.moveTo(owner, 1)
                    }
                }
            })
        
        // 目标：坐下/停留
        event.customGoal("pet_sit", 0,
            e => e.persistentData.OwnerName != undefined,
            e => e.persistentData.OwnerName != undefined,
            true,
            e => { },
            e => { },
            true,
            /**@param {Internal.PathfinderMob} e */
            e => {
                try {
                    if (e.persistentData.Sitting != 1) {
                        if (e instanceof FlyingMob && e.persistentData.LandTarget) {
                            e.persistentData.remove("LandTarget")
                        }
                        return
                    }
                    // 飞行生物的降落逻辑
                    if (e instanceof FlyingMob) {
                        if (!e.persistentData.LandTarget) {
                            let level = e.level
                            let mapHeight = e.level.getHeightmapPos("world_surface", e.block.pos)
                            let block = level.getBlock(mapHeight)
                            if (block && block.blockState.fluidState.empty
                            ) {
                                e.persistentData.LandTarget = { x: mapHeight.x + 0.5, y: mapHeight.y + 1, z: mapHeight.z + 0.5 }
                            }
                        }
                        let target = e.persistentData.LandTarget
                        if (!target) return
                        let dx = target.x - e.x
                        let dy = target.y - e.y
                        let dz = target.z - e.z
                        let totalDist = Math.sqrt(dx * dx + dy * dy + dz * dz)
                        if (totalDist < 0.4) {
                            e["moveTo(double,double,double)"](target.x, target.y, target.z)
                            e.setMotion(0, 0, 0)
                            e.setYaw(e.yaw)
                            e.setPitch(90)
                        } else {
                            let speed = 0.5
                            let direction = new Vec3d(dx, dy, dz)
                            let length = Math.sqrt(dx * dx + dy * dy + dz * dz)

                            if (length > 0) {
                                let motion = new Vec3d(
                                    (direction.x() / length) * speed,
                                    (direction.y() / length) * speed,
                                    (direction.z() / length) * speed
                                )
                                e.setMotion(motion.x(), motion.y(), motion.z())
                            }
                            let yaw = Math.atan2(dz, dx) * (180 / JavaMath.PI) - 90
                            let pitch = -Math.atan2(dy, Math.sqrt(dx * dx + dz * dz)) * (180 / JavaMath.PI)
                            e.setYaw(yaw)
                            e.setPitch(pitch)
                        }
                    } else {
                        // 地面生物停止移动
                        e.targetSelector.availableGoals.forEach(goal => {
                            if (!(goal.goal instanceof CustomGoal)) {
                                goal.stop()
                            }
                        })
                        e.goalSelector.availableGoals.forEach(goal => {
                            if (!(goal.goal instanceof CustomGoal)) {
                                goal.stop()
                            }
                        })
                        e.navigation.moveTo(e.x, e.y, e.z, 1.0)
                    }
                } catch (error) {
                    console.log(error)
                }
            }
        )
    })
})

/**
 * 记录战斗状态，用于宠物复仇逻辑
 * 
 * - 记录玩家攻击的目标。
 * - 记录攻击玩家的生物。
 */
EntityEvents.hurt(event => {
    let { entity, source } = event
    let attacker = source.actual
    if (!attacker) return
    if (attacker.isPlayer()) {
        if (!(entity instanceof TamableAnimal && entity.isOwnedBy(attacker)))
            attacker.persistentData.LastAttackedMobId = entity.getUuid().toString()
    }
    if (entity.isPlayer()) {
        if (
            attacker.persistentData.OwnerName && attacker.persistentData.OwnerName == entity.getUuid().toString()
        ) {
            // 防止宠物攻击主人
            attacker.targetSelector.getRunningGoals().forEach(goal => goal.stop())
            event.cancel()
        }
        if (!(attacker instanceof TamableAnimal && attacker.isOwnedBy(entity)))
            entity.persistentData.LastMobToAttackMe = attacker.getUuid().toString()
    }
})

/**
 * 防止友军伤害（PVP保护）
 * - 宠物不能攻击主人。
 * - 宠物不能攻击同一主人的其他宠物。
 */
EntityEvents.hurt(event => {
    let { entity, source } = event
    let attacker = source.actual
    let tamingItem = tameableMobs[entity.type]
    if (!attacker) return
    if (tamingItem && entity.persistentData.OwnerName) {
        let ownerUuid = entity.persistentData.OwnerName
        let attackerUuid = attacker.getUuid().toString()
        let isSameOwner =
            ownerUuid == attackerUuid ||
            attacker.persistentData.OwnerName == ownerUuid
        let isTamedPet =
            attacker instanceof TamableAnimal &&
            attacker.owner &&
            attacker.owner.getUuid().toString() == ownerUuid
        if (isSameOwner || isTamedPet) {
            if (attacker instanceof PathfinderMob) {
                attacker.targetSelector.getRunningGoals().forEach(goal => goal.stop())
            }
            event.cancel()
        }
        entity.persistentData.Sitting = 0
    } else if (
        entity instanceof TamableAnimal &&
        entity.owner &&
        attacker.persistentData.OwnerName == entity.owner.getUuid().toString()
    ) {
        if (attacker instanceof PathfinderMob) {
            attacker.targetSelector.getRunningGoals().forEach(goal => goal.stop())
        }
        event.cancel()
    }
})
