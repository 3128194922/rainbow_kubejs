// [PET_SYSTEM_DISABLED] // priority: 0
// [PET_SYSTEM_DISABLED] // ==========================================
// [PET_SYSTEM_DISABLED] // 🐾 自定义实体驯服与AI行为系统
// [PET_SYSTEM_DISABLED] // ==========================================
// [PET_SYSTEM_DISABLED] 
// [PET_SYSTEM_DISABLED] /**
// [PET_SYSTEM_DISABLED]  * 驯服物品映射表
// [PET_SYSTEM_DISABLED]  * 定义了哪些实体可以被驯服，以及需要使用什么物品。
// [PET_SYSTEM_DISABLED]  * 格式: "实体ID": "驯服物品ID"
// [PET_SYSTEM_DISABLED]  */
// [PET_SYSTEM_DISABLED] let tameableMobs = {
// [PET_SYSTEM_DISABLED]     "minecraft:iron_golem": 'create:transmitter',
// [PET_SYSTEM_DISABLED]     "minecraft:zombie": 'rainbow:gauntlet',
// [PET_SYSTEM_DISABLED]     'minecraft:drowned':'rainbow:gauntlet',
// [PET_SYSTEM_DISABLED]     'dungeonsdelight:rotten_zombie': 'rainbow:gauntlet',
// [PET_SYSTEM_DISABLED]     'minecraft:husk': 'rainbow:gauntlet',
// [PET_SYSTEM_DISABLED]     'windswept:chilled': 'rainbow:gauntlet'
// [PET_SYSTEM_DISABLED] }
// [PET_SYSTEM_DISABLED] 
// [PET_SYSTEM_DISABLED] /**
// [PET_SYSTEM_DISABLED]  * 重置并重新应用驯服生物的目标选择逻辑
// [PET_SYSTEM_DISABLED]  * 
// [PET_SYSTEM_DISABLED]  * - 移除原有的攻击目标，防止误伤。
// [PET_SYSTEM_DISABLED]  * - 添加自定义的攻击目标逻辑：
// [PET_SYSTEM_DISABLED]  *   - 攻击主人最后攻击的目标。
// [PET_SYSTEM_DISABLED]  *   - 攻击最后攻击主人的目标。
// [PET_SYSTEM_DISABLED]  * - 忽略其他被同一主人驯服的生物。
// [PET_SYSTEM_DISABLED]  */
// [PET_SYSTEM_DISABLED] function reviseTamedPetGoals(mob) {
// [PET_SYSTEM_DISABLED]     if (mob instanceof PathfinderMob) {
// [PET_SYSTEM_DISABLED]         // 停止当前所有目标
// [PET_SYSTEM_DISABLED]         mob.targetSelector.getRunningGoals().forEach(goal => goal.stop())
// [PET_SYSTEM_DISABLED]         // 移除所有 NearestAttackableTargetGoal，防止主动攻击
// [PET_SYSTEM_DISABLED]         mob.targetSelector.removeAllGoals(goal => goal instanceof NearestAttackableTargetGoal)
// [PET_SYSTEM_DISABLED]         
// [PET_SYSTEM_DISABLED]         if (mob.goalSelector.availableGoals.some(goal => goal.goal instanceof MeleeAttackGoal)) {
// [PET_SYSTEM_DISABLED]             // 延迟1tick添加自定义目标选择器
// [PET_SYSTEM_DISABLED]             mob.server.scheduleInTicks(1, () => {
// [PET_SYSTEM_DISABLED]                 mob.targetSelector.addGoal(1, new NearestAttackableTargetGoal(mob, LivingEntity, 1, true, false, t => {
// [PET_SYSTEM_DISABLED]                     if (mob.persistentData.OwnerName) {
// [PET_SYSTEM_DISABLED]                         let owner = mob.server.getPlayer(mob.persistentData.OwnerName)
// [PET_SYSTEM_DISABLED]                         if (owner) {
// [PET_SYSTEM_DISABLED]                             let lastAttackedId = owner.persistentData.LastAttackedMobId
// [PET_SYSTEM_DISABLED]                             let lastAttackedMeId = owner.persistentData.LastMobToAttackMe
// [PET_SYSTEM_DISABLED] 
// [PET_SYSTEM_DISABLED]                             // 性能优化：谓词参数 t 即当前候选实体，直接与记录的 UUID 比较即可命中，
// [PET_SYSTEM_DISABLED]                             // 不再 getEntities() 全量遍历 + 每实体分配 UUID 字符串（原写法为全脚本最大单项开销）
// [PET_SYSTEM_DISABLED]                             // 攻击主人攻击的目标
// [PET_SYSTEM_DISABLED]                             if (lastAttackedId) {
// [PET_SYSTEM_DISABLED]                                 if (t.getUuid().toString() == lastAttackedId) {
// [PET_SYSTEM_DISABLED]                                     // 不攻击主人自己的宠物
// [PET_SYSTEM_DISABLED]                                     if (t.persistentData.OwnerName == owner.getUuid().toString() ||
// [PET_SYSTEM_DISABLED]                                         (t instanceof TamableAnimal && t.isOwnedBy(owner))
// [PET_SYSTEM_DISABLED]                                     ) {
// [PET_SYSTEM_DISABLED]                                         // 修正：本段处理 LastAttackedMobId，应移除该键（原误移除 LastMobToAttackMe）
// [PET_SYSTEM_DISABLED]                                         owner.persistentData.remove("LastAttackedMobId")
// [PET_SYSTEM_DISABLED]                                         return false
// [PET_SYSTEM_DISABLED]                                     }
// [PET_SYSTEM_DISABLED]                                     if (t.distanceToEntity(mob) <= 15) {
// [PET_SYSTEM_DISABLED]                                         return true
// [PET_SYSTEM_DISABLED]                                     } else {
// [PET_SYSTEM_DISABLED]                                         owner.persistentData.remove("LastAttackedMobId")
// [PET_SYSTEM_DISABLED]                                     }
// [PET_SYSTEM_DISABLED]                                 }
// [PET_SYSTEM_DISABLED]                             }
// [PET_SYSTEM_DISABLED] 
// [PET_SYSTEM_DISABLED]                             // 攻击攻击主人的目标
// [PET_SYSTEM_DISABLED]                             if (lastAttackedMeId) {
// [PET_SYSTEM_DISABLED]                                 if (t.getUuid().toString() == lastAttackedMeId) {
// [PET_SYSTEM_DISABLED]                                     if (t.persistentData.OwnerName == owner.getUuid().toString() ||
// [PET_SYSTEM_DISABLED]                                         (t instanceof TamableAnimal && t.isOwnedBy(owner))
// [PET_SYSTEM_DISABLED]                                     ) {
// [PET_SYSTEM_DISABLED]                                         owner.persistentData.remove("LastMobToAttackMe")
// [PET_SYSTEM_DISABLED]                                         return false
// [PET_SYSTEM_DISABLED]                                     }
// [PET_SYSTEM_DISABLED]                                     if (t.distanceToEntity(mob) <= 15) {
// [PET_SYSTEM_DISABLED]                                         return true
// [PET_SYSTEM_DISABLED]                                     } else {
// [PET_SYSTEM_DISABLED]                                         owner.persistentData.remove("LastMobToAttackMe")
// [PET_SYSTEM_DISABLED]                                     }
// [PET_SYSTEM_DISABLED]                                 }
// [PET_SYSTEM_DISABLED]                             }
// [PET_SYSTEM_DISABLED]                         }
// [PET_SYSTEM_DISABLED]                     }
// [PET_SYSTEM_DISABLED]                     // 默认不攻击主人
// [PET_SYSTEM_DISABLED]                     let fallback = t instanceof Player && mob.persistentData.OwnerName != t.getUuid().toString()
// [PET_SYSTEM_DISABLED]                     return fallback
// [PET_SYSTEM_DISABLED]                 }))
// [PET_SYSTEM_DISABLED]             })
// [PET_SYSTEM_DISABLED]         }
// [PET_SYSTEM_DISABLED]     }
// [PET_SYSTEM_DISABLED] }
// [PET_SYSTEM_DISABLED] 
// [PET_SYSTEM_DISABLED] // 实体生成时应用驯服逻辑（如果是已驯服的实体）
// [PET_SYSTEM_DISABLED] EntityEvents.spawned(event => {
// [PET_SYSTEM_DISABLED]     let { entity } = event
// [PET_SYSTEM_DISABLED]     let tamingItem = tameableMobs[entity.type]
// [PET_SYSTEM_DISABLED]     if (tamingItem && entity.persistentData.OwnerName)
// [PET_SYSTEM_DISABLED]         reviseTamedPetGoals(entity)
// [PET_SYSTEM_DISABLED] })
// [PET_SYSTEM_DISABLED] 
// [PET_SYSTEM_DISABLED] /**
// [PET_SYSTEM_DISABLED]  * 远程控制飞行宠物坐下/起立
// [PET_SYSTEM_DISABLED]  * 玩家潜行并手持驯服物品右键，可远程切换宠物的坐下状态
// [PET_SYSTEM_DISABLED]  */
// [PET_SYSTEM_DISABLED] ItemEvents.rightClicked(event => {
// [PET_SYSTEM_DISABLED]     let { player, item, level, target } = event
// [PET_SYSTEM_DISABLED]     if (target && target.entity) return
// [PET_SYSTEM_DISABLED]     if (level.isClientSide()) return
// [PET_SYSTEM_DISABLED]     let reach = 40
// [PET_SYSTEM_DISABLED]     let eyePos = player.getEyePosition(1.0)
// [PET_SYSTEM_DISABLED]     let lookVec = player.getLookAngle()
// [PET_SYSTEM_DISABLED]     let end = eyePos.add(lookVec.x() * reach, lookVec.y() * reach, lookVec.z() * reach)
// [PET_SYSTEM_DISABLED]     let blockHit = level.clip(new ClipContext(
// [PET_SYSTEM_DISABLED]         eyePos,
// [PET_SYSTEM_DISABLED]         end,
// [PET_SYSTEM_DISABLED]         ClipContext.Block.OUTLINE,
// [PET_SYSTEM_DISABLED]         ClipContext.Fluid.NONE,
// [PET_SYSTEM_DISABLED]         player
// [PET_SYSTEM_DISABLED]     ))
// [PET_SYSTEM_DISABLED]     if (blockHit.getType() != HitResultType.MISS) {
// [PET_SYSTEM_DISABLED]         end = blockHit.getLocation()
// [PET_SYSTEM_DISABLED]     }
// [PET_SYSTEM_DISABLED]     // Java.loadClass 返回原生 AABB 类时，使用六参数构造器兼容 Forge 1.20.1 的 Rhino 重载解析。
// [PET_SYSTEM_DISABLED]     let aabb = new AABB(eyePos.x(), eyePos.y(), eyePos.z(), end.x(), end.y(), end.z()).inflate(1)
// [PET_SYSTEM_DISABLED]     let closestDistance = reach
// [PET_SYSTEM_DISABLED]     level.getEntitiesWithin(aabb).forEach(entity => {
// [PET_SYSTEM_DISABLED]         if (entity != player) {
// [PET_SYSTEM_DISABLED]             let dist = eyePos.distanceTo(entity.getEyePosition(1.0))
// [PET_SYSTEM_DISABLED]             if (dist < closestDistance) {
// [PET_SYSTEM_DISABLED]                 if (entity.persistentData.OwnerName &&
// [PET_SYSTEM_DISABLED]                     entity.persistentData.OwnerName == player.getUuid().toString()
// [PET_SYSTEM_DISABLED]                 ) {
// [PET_SYSTEM_DISABLED]                     if (entity instanceof FlyingMob) {
// [PET_SYSTEM_DISABLED]                         let tameItem = tameableMobs[entity.type]
// [PET_SYSTEM_DISABLED]                         if (player.isShiftKeyDown() && tameItem == player.mainHandItem.id) {
// [PET_SYSTEM_DISABLED]                             let current = entity.persistentData.Sitting || 0
// [PET_SYSTEM_DISABLED]                             entity.persistentData.Sitting = current == 0 ? 1 : 0
// [PET_SYSTEM_DISABLED]                         }
// [PET_SYSTEM_DISABLED]                     }
// [PET_SYSTEM_DISABLED] 
// [PET_SYSTEM_DISABLED]                 }
// [PET_SYSTEM_DISABLED]             }
// [PET_SYSTEM_DISABLED]         }
// [PET_SYSTEM_DISABLED]     })
// [PET_SYSTEM_DISABLED] })
// [PET_SYSTEM_DISABLED] 
// [PET_SYSTEM_DISABLED] /**
// [PET_SYSTEM_DISABLED]  * 实体交互逻辑：驯服、装鞍、坐下
// [PET_SYSTEM_DISABLED]  * 
// [PET_SYSTEM_DISABLED]  * - 手持驯服物品右键未驯服实体：50% 概率驯服。
// [PET_SYSTEM_DISABLED]  * - 手持鞍右键已驯服实体：装备鞍。
// [PET_SYSTEM_DISABLED]  * - 潜行右键已驯服实体：切换坐下/跟随状态。
// [PET_SYSTEM_DISABLED]  */
// [PET_SYSTEM_DISABLED] ItemEvents.entityInteracted(event => {
// [PET_SYSTEM_DISABLED]     let { target, player, player: { mainHandItem } } = event
// [PET_SYSTEM_DISABLED]     let tamingItem = tameableMobs[target.type]
// [PET_SYSTEM_DISABLED]     if (event.hand != "main_hand") return
// [PET_SYSTEM_DISABLED]     if (!target.persistentData.HasSaddle) target.persistentData.HasSaddle = 0
// [PET_SYSTEM_DISABLED]     
// [PET_SYSTEM_DISABLED]     // 驯服逻辑
// [PET_SYSTEM_DISABLED]     if (tamingItem && mainHandItem.id == tamingItem) {
// [PET_SYSTEM_DISABLED]         let randomChancetoFail = Math.random()
// [PET_SYSTEM_DISABLED]         if (!target.persistentData.OwnerName) {
// [PET_SYSTEM_DISABLED]             player.level.playSound(null, target.x, target.y, target.z, "minecraft:entity.generic.eat", "players", 0.5, 0.9)
// [PET_SYSTEM_DISABLED]             // 50% 失败概率
// [PET_SYSTEM_DISABLED]             if (randomChancetoFail < 0.5) {
// [PET_SYSTEM_DISABLED]                 target.level.spawnParticles('minecraft:campfire_cosy_smoke', true, target.x + 0.5, target.y + 1.05, target.z + 0.5, 0, 0.3, 0, 2, 0.1)
// [PET_SYSTEM_DISABLED]                 mainHandItem.count--
// [PET_SYSTEM_DISABLED]                 return
// [PET_SYSTEM_DISABLED]             }
// [PET_SYSTEM_DISABLED]             // 成功驯服
// [PET_SYSTEM_DISABLED]             target.level.spawnParticles('minecraft:heart', true, target.x + 0.5, target.y + 1.05, target.z + 0.5, 0, 0.3, 0, 2, 0.1)
// [PET_SYSTEM_DISABLED]             target.persistentData.OwnerName = player.getUuid().toString()
// [PET_SYSTEM_DISABLED]             mainHandItem.count--
// [PET_SYSTEM_DISABLED]             player.swing("main_hand")
// [PET_SYSTEM_DISABLED]             reviseTamedPetGoals(target)
// [PET_SYSTEM_DISABLED]         }
// [PET_SYSTEM_DISABLED]     } 
// [PET_SYSTEM_DISABLED]     // 装鞍逻辑
// [PET_SYSTEM_DISABLED]     else if (target.persistentData.OwnerName &&
// [PET_SYSTEM_DISABLED]         target.persistentData.OwnerName == player.getUuid().toString() &&
// [PET_SYSTEM_DISABLED]         mainHandItem.id == "minecraft:saddle") {
// [PET_SYSTEM_DISABLED]         if (target.persistentData.HasSaddle == 0) {
// [PET_SYSTEM_DISABLED]             target.persistentData.HasSaddle = 1
// [PET_SYSTEM_DISABLED]             player.swing("main_hand")
// [PET_SYSTEM_DISABLED]             mainHandItem.count--
// [PET_SYSTEM_DISABLED]             event.cancel()
// [PET_SYSTEM_DISABLED]         }
// [PET_SYSTEM_DISABLED]     }
// [PET_SYSTEM_DISABLED]     // 坐下逻辑
// [PET_SYSTEM_DISABLED]     if (target.persistentData.OwnerName &&
// [PET_SYSTEM_DISABLED]         target.persistentData.OwnerName == player.getUuid().toString() &&
// [PET_SYSTEM_DISABLED]         player.isShiftKeyDown()
// [PET_SYSTEM_DISABLED]     ) {
// [PET_SYSTEM_DISABLED]         let current = target.persistentData.Sitting || 0
// [PET_SYSTEM_DISABLED]         target.persistentData.Sitting = current == 0 ? 1 : 0
// [PET_SYSTEM_DISABLED]         event.cancel()
// [PET_SYSTEM_DISABLED]     }
// [PET_SYSTEM_DISABLED] 
// [PET_SYSTEM_DISABLED] })
// [PET_SYSTEM_DISABLED] 
// [PET_SYSTEM_DISABLED] // 为可驯服生物添加自定义AI目标
// [PET_SYSTEM_DISABLED] Object.keys(tameableMobs).forEach(id => {
// [PET_SYSTEM_DISABLED]     EntityJSEvents.addGoalSelectors(id, event => {
// [PET_SYSTEM_DISABLED]         // 目标：跟随主人
// [PET_SYSTEM_DISABLED]         event.customGoal("follow_owner",
// [PET_SYSTEM_DISABLED]             3,
// [PET_SYSTEM_DISABLED]             e => e.persistentData.OwnerName != undefined &&
// [PET_SYSTEM_DISABLED]                 e.persistentData.Sitting != 1,
// [PET_SYSTEM_DISABLED]             e => e.persistentData.OwnerName != undefined &&
// [PET_SYSTEM_DISABLED]                 e.server.getPlayer(e.persistentData.OwnerName) != null &&
// [PET_SYSTEM_DISABLED]                 e.persistentData.Sitting != 1,
// [PET_SYSTEM_DISABLED]             true,
// [PET_SYSTEM_DISABLED]             e => { },
// [PET_SYSTEM_DISABLED]             e => { },
// [PET_SYSTEM_DISABLED]             true,
// [PET_SYSTEM_DISABLED]             /**@param {Internal.PathfinderMob} e */ e => {
// [PET_SYSTEM_DISABLED]                 let owner = e.server.getPlayer(e.persistentData.OwnerName)
// [PET_SYSTEM_DISABLED]                 if (owner) {
// [PET_SYSTEM_DISABLED]                     // dimension 为 ResourceKey 对象，改用 toString() 字符串比较（== 会走 Rhino Java包装对象慢路径）
// [PET_SYSTEM_DISABLED]                     if (owner.level.dimension.toString() == e.level.dimension.toString() &&
// [PET_SYSTEM_DISABLED]                         owner.distanceToEntity(e) >= 16) {
// [PET_SYSTEM_DISABLED]                         e.navigation.moveTo(owner, 1)
// [PET_SYSTEM_DISABLED]                     }
// [PET_SYSTEM_DISABLED]                 }
// [PET_SYSTEM_DISABLED]             })
// [PET_SYSTEM_DISABLED]         
// [PET_SYSTEM_DISABLED]         // 目标：坐下/停留
// [PET_SYSTEM_DISABLED]         event.customGoal("pet_sit", 0,
// [PET_SYSTEM_DISABLED]             e => e.persistentData.OwnerName != undefined,
// [PET_SYSTEM_DISABLED]             e => e.persistentData.OwnerName != undefined,
// [PET_SYSTEM_DISABLED]             true,
// [PET_SYSTEM_DISABLED]             e => { },
// [PET_SYSTEM_DISABLED]             e => { },
// [PET_SYSTEM_DISABLED]             true,
// [PET_SYSTEM_DISABLED]             /**@param {Internal.PathfinderMob} e */
// [PET_SYSTEM_DISABLED]             e => {
// [PET_SYSTEM_DISABLED]                 try {
// [PET_SYSTEM_DISABLED]                     if (e.persistentData.Sitting != 1) {
// [PET_SYSTEM_DISABLED]                         if (e instanceof FlyingMob && e.persistentData.LandTarget) {
// [PET_SYSTEM_DISABLED]                             e.persistentData.remove("LandTarget")
// [PET_SYSTEM_DISABLED]                         }
// [PET_SYSTEM_DISABLED]                         return
// [PET_SYSTEM_DISABLED]                     }
// [PET_SYSTEM_DISABLED]                     // 飞行生物的降落逻辑
// [PET_SYSTEM_DISABLED]                     if (e instanceof FlyingMob) {
// [PET_SYSTEM_DISABLED]                         if (!e.persistentData.LandTarget) {
// [PET_SYSTEM_DISABLED]                             let level = e.level
// [PET_SYSTEM_DISABLED]                             let mapHeight = e.level.getHeightmapPos("world_surface", e.block.pos)
// [PET_SYSTEM_DISABLED]                             let block = level.getBlock(mapHeight)
// [PET_SYSTEM_DISABLED]                             if (block && block.blockState.fluidState.empty
// [PET_SYSTEM_DISABLED]                             ) {
// [PET_SYSTEM_DISABLED]                                 e.persistentData.LandTarget = { x: mapHeight.x + 0.5, y: mapHeight.y + 1, z: mapHeight.z + 0.5 }
// [PET_SYSTEM_DISABLED]                             }
// [PET_SYSTEM_DISABLED]                         }
// [PET_SYSTEM_DISABLED]                         let target = e.persistentData.LandTarget
// [PET_SYSTEM_DISABLED]                         if (!target) return
// [PET_SYSTEM_DISABLED]                         let dx = target.x - e.x
// [PET_SYSTEM_DISABLED]                         let dy = target.y - e.y
// [PET_SYSTEM_DISABLED]                         let dz = target.z - e.z
// [PET_SYSTEM_DISABLED]                         let totalDist = Math.sqrt(dx * dx + dy * dy + dz * dz)
// [PET_SYSTEM_DISABLED]                         if (totalDist < 0.4) {
// [PET_SYSTEM_DISABLED]                             e["moveTo(double,double,double)"](target.x, target.y, target.z)
// [PET_SYSTEM_DISABLED]                             e.setMotion(0, 0, 0)
// [PET_SYSTEM_DISABLED]                             e.setYaw(e.yaw)
// [PET_SYSTEM_DISABLED]                             e.setPitch(90)
// [PET_SYSTEM_DISABLED]                         } else {
// [PET_SYSTEM_DISABLED]                             let speed = 0.5
// [PET_SYSTEM_DISABLED]                             let direction = new Vec3d(dx, dy, dz)
// [PET_SYSTEM_DISABLED]                             let length = Math.sqrt(dx * dx + dy * dy + dz * dz)
// [PET_SYSTEM_DISABLED] 
// [PET_SYSTEM_DISABLED]                             if (length > 0) {
// [PET_SYSTEM_DISABLED]                                 let motion = new Vec3d(
// [PET_SYSTEM_DISABLED]                                     (direction.x() / length) * speed,
// [PET_SYSTEM_DISABLED]                                     (direction.y() / length) * speed,
// [PET_SYSTEM_DISABLED]                                     (direction.z() / length) * speed
// [PET_SYSTEM_DISABLED]                                 )
// [PET_SYSTEM_DISABLED]                                 e.setMotion(motion.x(), motion.y(), motion.z())
// [PET_SYSTEM_DISABLED]                             }
// [PET_SYSTEM_DISABLED]                             let yaw = Math.atan2(dz, dx) * (180 / MATH_PI) - 90
// [PET_SYSTEM_DISABLED]                             let pitch = -Math.atan2(dy, Math.sqrt(dx * dx + dz * dz)) * (180 / MATH_PI)
// [PET_SYSTEM_DISABLED]                             e.setYaw(yaw)
// [PET_SYSTEM_DISABLED]                             e.setPitch(pitch)
// [PET_SYSTEM_DISABLED]                         }
// [PET_SYSTEM_DISABLED]                     } else {
// [PET_SYSTEM_DISABLED]                         // 地面生物停止移动
// [PET_SYSTEM_DISABLED]                         e.targetSelector.availableGoals.forEach(goal => {
// [PET_SYSTEM_DISABLED]                             if (!(goal.goal instanceof CustomGoal)) {
// [PET_SYSTEM_DISABLED]                                 goal.stop()
// [PET_SYSTEM_DISABLED]                             }
// [PET_SYSTEM_DISABLED]                         })
// [PET_SYSTEM_DISABLED]                         e.goalSelector.availableGoals.forEach(goal => {
// [PET_SYSTEM_DISABLED]                             if (!(goal.goal instanceof CustomGoal)) {
// [PET_SYSTEM_DISABLED]                                 goal.stop()
// [PET_SYSTEM_DISABLED]                             }
// [PET_SYSTEM_DISABLED]                         })
// [PET_SYSTEM_DISABLED]                         e.navigation.moveTo(e.x, e.y, e.z, 1.0)
// [PET_SYSTEM_DISABLED]                     }
// [PET_SYSTEM_DISABLED]                 } catch (error) {
// [PET_SYSTEM_DISABLED]                     console.log(error)
// [PET_SYSTEM_DISABLED]                 }
// [PET_SYSTEM_DISABLED]             }
// [PET_SYSTEM_DISABLED]         )
// [PET_SYSTEM_DISABLED]     })
// [PET_SYSTEM_DISABLED] })
// [PET_SYSTEM_DISABLED] 
// [PET_SYSTEM_DISABLED] /**
// [PET_SYSTEM_DISABLED]  * 记录战斗状态，用于宠物复仇逻辑
// [PET_SYSTEM_DISABLED]  * 
// [PET_SYSTEM_DISABLED]  * - 记录玩家攻击的目标。
// [PET_SYSTEM_DISABLED]  * - 记录攻击玩家的生物。
// [PET_SYSTEM_DISABLED]  */
// [PET_SYSTEM_DISABLED] EntityEvents.hurt(event => {
// [PET_SYSTEM_DISABLED]     let { entity, source } = event
// [PET_SYSTEM_DISABLED]     let attacker = source.actual
// [PET_SYSTEM_DISABLED]     if (!attacker) return
// [PET_SYSTEM_DISABLED]     if (attacker.isPlayer()) {
// [PET_SYSTEM_DISABLED]         if (!(entity instanceof TamableAnimal && entity.isOwnedBy(attacker)))
// [PET_SYSTEM_DISABLED]             attacker.persistentData.LastAttackedMobId = entity.getUuid().toString()
// [PET_SYSTEM_DISABLED]     }
// [PET_SYSTEM_DISABLED]     if (entity.isPlayer()) {
// [PET_SYSTEM_DISABLED]         if (
// [PET_SYSTEM_DISABLED]             attacker.persistentData.OwnerName && attacker.persistentData.OwnerName == entity.getUuid().toString()
// [PET_SYSTEM_DISABLED]         ) {
// [PET_SYSTEM_DISABLED]             // 防止宠物攻击主人
// [PET_SYSTEM_DISABLED]             attacker.targetSelector.getRunningGoals().forEach(goal => goal.stop())
// [PET_SYSTEM_DISABLED]             event.cancel()
// [PET_SYSTEM_DISABLED]         }
// [PET_SYSTEM_DISABLED]         if (!(attacker instanceof TamableAnimal && attacker.isOwnedBy(entity)))
// [PET_SYSTEM_DISABLED]             entity.persistentData.LastMobToAttackMe = attacker.getUuid().toString()
// [PET_SYSTEM_DISABLED]     }
// [PET_SYSTEM_DISABLED] })
// [PET_SYSTEM_DISABLED] 
// [PET_SYSTEM_DISABLED] /**
// [PET_SYSTEM_DISABLED]  * 防止友军伤害（PVP保护）
// [PET_SYSTEM_DISABLED]  * - 宠物不能攻击主人。
// [PET_SYSTEM_DISABLED]  * - 宠物不能攻击同一主人的其他宠物。
// [PET_SYSTEM_DISABLED]  */
// [PET_SYSTEM_DISABLED] EntityEvents.hurt(event => {
// [PET_SYSTEM_DISABLED]     let { entity, source } = event
// [PET_SYSTEM_DISABLED]     let attacker = source.actual
// [PET_SYSTEM_DISABLED]     let tamingItem = tameableMobs[entity.type]
// [PET_SYSTEM_DISABLED]     if (!attacker) return
// [PET_SYSTEM_DISABLED]     if (tamingItem && entity.persistentData.OwnerName) {
// [PET_SYSTEM_DISABLED]         let ownerUuid = entity.persistentData.OwnerName
// [PET_SYSTEM_DISABLED]         let attackerUuid = attacker.getUuid().toString()
// [PET_SYSTEM_DISABLED]         let isSameOwner =
// [PET_SYSTEM_DISABLED]             ownerUuid == attackerUuid ||
// [PET_SYSTEM_DISABLED]             attacker.persistentData.OwnerName == ownerUuid
// [PET_SYSTEM_DISABLED]         let isTamedPet =
// [PET_SYSTEM_DISABLED]             attacker instanceof TamableAnimal &&
// [PET_SYSTEM_DISABLED]             attacker.owner &&
// [PET_SYSTEM_DISABLED]             attacker.owner.getUuid().toString() == ownerUuid
// [PET_SYSTEM_DISABLED]         if (isSameOwner || isTamedPet) {
// [PET_SYSTEM_DISABLED]             if (attacker instanceof PathfinderMob) {
// [PET_SYSTEM_DISABLED]                 attacker.targetSelector.getRunningGoals().forEach(goal => goal.stop())
// [PET_SYSTEM_DISABLED]             }
// [PET_SYSTEM_DISABLED]             event.cancel()
// [PET_SYSTEM_DISABLED]         }
// [PET_SYSTEM_DISABLED]         entity.persistentData.Sitting = 0
// [PET_SYSTEM_DISABLED]     } else if (
// [PET_SYSTEM_DISABLED]         entity instanceof TamableAnimal &&
// [PET_SYSTEM_DISABLED]         entity.owner &&
// [PET_SYSTEM_DISABLED]         attacker.persistentData.OwnerName == entity.owner.getUuid().toString()
// [PET_SYSTEM_DISABLED]     ) {
// [PET_SYSTEM_DISABLED]         if (attacker instanceof PathfinderMob) {
// [PET_SYSTEM_DISABLED]             attacker.targetSelector.getRunningGoals().forEach(goal => goal.stop())
// [PET_SYSTEM_DISABLED]         }
// [PET_SYSTEM_DISABLED]         event.cancel()
// [PET_SYSTEM_DISABLED]     }
// [PET_SYSTEM_DISABLED] })
