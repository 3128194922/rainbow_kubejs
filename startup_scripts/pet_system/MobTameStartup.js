// [PET_SYSTEM_DISABLED] // priority: 0
// [PET_SYSTEM_DISABLED] // ==========================================
// [PET_SYSTEM_DISABLED] // 实体驯服与骑乘逻辑
// [PET_SYSTEM_DISABLED] // Entity Taming & Riding Logic
// [PET_SYSTEM_DISABLED] // ==========================================
// [PET_SYSTEM_DISABLED] // 修改特定生物（如铁傀儡）使其可被驯服和骑乘
// [PET_SYSTEM_DISABLED] // Modifies specific mobs (e.g., Iron Golem) to be tameable and rideable
// [PET_SYSTEM_DISABLED] 
// [PET_SYSTEM_DISABLED] let tameableMobs = [
// [PET_SYSTEM_DISABLED]     "minecraft:iron_golem",
// [PET_SYSTEM_DISABLED] ]
// [PET_SYSTEM_DISABLED] 
// [PET_SYSTEM_DISABLED] EntityJSEvents.modifyEntity(event => {
// [PET_SYSTEM_DISABLED]     tameableMobs.forEach(id => {
// [PET_SYSTEM_DISABLED]         event.modify(id, modifyBuilder => {
// [PET_SYSTEM_DISABLED]             modifyBuilder
// [PET_SYSTEM_DISABLED]                 .onInteract(context => {
// [PET_SYSTEM_DISABLED]                     let { entity, player } = context
// [PET_SYSTEM_DISABLED]                     if (entity.persistentData.OwnerName != player.getUuid().toString()) return
// [PET_SYSTEM_DISABLED]                     if (entity.persistentData.HasSaddle == 1
// [PET_SYSTEM_DISABLED]                     ) {
// [PET_SYSTEM_DISABLED]                         if (!player.isShiftKeyDown()) {
// [PET_SYSTEM_DISABLED]                             player.startRiding(entity)
// [PET_SYSTEM_DISABLED]                         } else if (player.mainHandItem.id == "minecraft:air") {
// [PET_SYSTEM_DISABLED]                             player.swing()
// [PET_SYSTEM_DISABLED]                             entity.persistentData.HasSaddle = 0
// [PET_SYSTEM_DISABLED]                             entity.block.popItem("minecraft:saddle")
// [PET_SYSTEM_DISABLED]                         }
// [PET_SYSTEM_DISABLED]                     }
// [PET_SYSTEM_DISABLED]                 })
// [PET_SYSTEM_DISABLED]                 .tick(entity => {
// [PET_SYSTEM_DISABLED]                     global.travelRidden(entity, entity.getControllingPassenger())
// [PET_SYSTEM_DISABLED]                 })
// [PET_SYSTEM_DISABLED]                 .controlledByFirstPassenger(true)
// [PET_SYSTEM_DISABLED]                 .myRidingOffset(entity => 1)
// [PET_SYSTEM_DISABLED]                 .canAddPassenger(context => {
// [PET_SYSTEM_DISABLED]                     let { entity, passenger } = context
// [PET_SYSTEM_DISABLED]                     return entity.persistentData.HasSaddle == 1 && entity.persistentData.OwnerName == passenger.getUuid().toString()
// [PET_SYSTEM_DISABLED]                 })
// [PET_SYSTEM_DISABLED]                 .canAttack(/**@param {Internal.ContextUtils$LivingEntityContext}context */  context => {
// [PET_SYSTEM_DISABLED]                     let { entity, target } = context
// [PET_SYSTEM_DISABLED]                     try {
// [PET_SYSTEM_DISABLED]                         let superCall = target instanceof Player && entity.level.getDifficulty() == Difficulty.PEACEFUL ? false : target.canBeSeenAsEnemy()
// [PET_SYSTEM_DISABLED]                         return (entity.persistentData.OwnerName != undefined &&
// [PET_SYSTEM_DISABLED]                             entity.persistentData.OwnerName == target.getUuid().toString()) || (entity.persistentData.Sitting == 1)
// [PET_SYSTEM_DISABLED]                             ? false : superCall
// [PET_SYSTEM_DISABLED]                     } catch (error) {
// [PET_SYSTEM_DISABLED]                         console.log(error)
// [PET_SYSTEM_DISABLED]                         return false
// [PET_SYSTEM_DISABLED]                     }
// [PET_SYSTEM_DISABLED]                 })
// [PET_SYSTEM_DISABLED]         })
// [PET_SYSTEM_DISABLED]     })
// [PET_SYSTEM_DISABLED] })
// [PET_SYSTEM_DISABLED] /**
// [PET_SYSTEM_DISABLED]  * 
// [PET_SYSTEM_DISABLED]  * @param {Internal.PathfinderMob} entity 
// [PET_SYSTEM_DISABLED]  * @param {Internal.Player} player 
// [PET_SYSTEM_DISABLED]  */
// [PET_SYSTEM_DISABLED] global.travelRidden = (entity, player) => {
// [PET_SYSTEM_DISABLED]     if (!player) return
// [PET_SYSTEM_DISABLED]     let vec3
// [PET_SYSTEM_DISABLED]     if (!entity.isAlive()) return
// [PET_SYSTEM_DISABLED]     let landTarget = entity.persistentData.LandTarget
// [PET_SYSTEM_DISABLED]     if (entity instanceof FlyingMob &&
// [PET_SYSTEM_DISABLED]         landTarget &&
// [PET_SYSTEM_DISABLED]         player
// [PET_SYSTEM_DISABLED]     ) {
// [PET_SYSTEM_DISABLED]         entity.persistentData.remove("LandTarget")
// [PET_SYSTEM_DISABLED]     }
// [PET_SYSTEM_DISABLED]     vec3 = getRiddenInput(player)
// [PET_SYSTEM_DISABLED]     let vec2 = new Vec2(player.pitch * 0.5, player.yaw)
// [PET_SYSTEM_DISABLED]     entity.setRotation(vec2.y, vec2.x)
// [PET_SYSTEM_DISABLED]     entity.yRotO = entity.yBodyRot = entity.yHeadRot = entity.yaw
// [PET_SYSTEM_DISABLED]     if (entity instanceof WaterAnimal ||
// [PET_SYSTEM_DISABLED]         entity instanceof FlyingMob
// [PET_SYSTEM_DISABLED]     ) {
// [PET_SYSTEM_DISABLED]         entity.yRotO = entity.yBodyRot = entity.yHeadRot = entity.yaw
// [PET_SYSTEM_DISABLED]         let pitch = -player.xRotO * 0.5
// [PET_SYSTEM_DISABLED]         entity.xRotO = entity.pitch = pitch
// [PET_SYSTEM_DISABLED]     }
// [PET_SYSTEM_DISABLED]     entity.addMotion(vec3.x(), vec3.y(), vec3.z())
// [PET_SYSTEM_DISABLED] }
// [PET_SYSTEM_DISABLED] 
// [PET_SYSTEM_DISABLED] /**
// [PET_SYSTEM_DISABLED]  * @param {Internal.Player} player
// [PET_SYSTEM_DISABLED]  */
// [PET_SYSTEM_DISABLED] function getRiddenInput(player) {
// [PET_SYSTEM_DISABLED]     let strafe = player.xxa * 0.5
// [PET_SYSTEM_DISABLED]     let forward = player.zza
// [PET_SYSTEM_DISABLED]     let vehicle = player.vehicle
// [PET_SYSTEM_DISABLED]     let isJumping = isClient && Minecraft.getInstance().player.input.jumping
// [PET_SYSTEM_DISABLED]     if (forward <= 0.0) {
// [PET_SYSTEM_DISABLED]         forward *= 0.25
// [PET_SYSTEM_DISABLED]     }
// [PET_SYSTEM_DISABLED]     let yawRad = (player.yRotO * MATH_PI) / 180
// [PET_SYSTEM_DISABLED]     let sin = Math.sin(yawRad)
// [PET_SYSTEM_DISABLED]     let cos = Math.cos(yawRad)
// [PET_SYSTEM_DISABLED]     let x = strafe * cos - forward * sin
// [PET_SYSTEM_DISABLED]     let z = strafe * sin + forward * cos
// [PET_SYSTEM_DISABLED]     let isWaterAnimalInWater = vehicle instanceof WaterAnimal && vehicle.inWater
// [PET_SYSTEM_DISABLED]     let jump = 0.0
// [PET_SYSTEM_DISABLED]     if (vehicle instanceof FlyingMob || isWaterAnimalInWater) {
// [PET_SYSTEM_DISABLED]         if (isJumping && player.xRotO > 40) {
// [PET_SYSTEM_DISABLED]             jump = 0
// [PET_SYSTEM_DISABLED]         } else if (isJumping) {
// [PET_SYSTEM_DISABLED]             jump = isWaterAnimalInWater ? 0.07 : 0.035
// [PET_SYSTEM_DISABLED]         } else if (player.xRotO > 40) {
// [PET_SYSTEM_DISABLED]             jump = isWaterAnimalInWater ? -0.07 : -0.035
// [PET_SYSTEM_DISABLED]         }
// [PET_SYSTEM_DISABLED]     } else if (vehicle.onGround() && isJumping) {
// [PET_SYSTEM_DISABLED]         jump = 0.58
// [PET_SYSTEM_DISABLED]     } else if (vehicle.inWater && isJumping) {
// [PET_SYSTEM_DISABLED]         jump = 0.04
// [PET_SYSTEM_DISABLED]     } else if (vehicle.navigation instanceof WallClimberNavigation && vehicle.horizontalCollision) {
// [PET_SYSTEM_DISABLED]         jump = 0.09
// [PET_SYSTEM_DISABLED]     }
// [PET_SYSTEM_DISABLED]     let airborne = vehicle && !vehicle.onGround() &&
// [PET_SYSTEM_DISABLED]         !(vehicle instanceof FlyingMob) &&
// [PET_SYSTEM_DISABLED]         !(vehicle instanceof WaterAnimal && vehicle.inWater)
// [PET_SYSTEM_DISABLED]     let xSpeed = airborne ? x * 0.03 : vehicle instanceof FlyingMob ? x * 0.08 : x * 0.2
// [PET_SYSTEM_DISABLED]     let zSpeed = airborne ? z * 0.03 : vehicle instanceof FlyingMob ? z * 0.08 : z * 0.2
// [PET_SYSTEM_DISABLED]     return new Vec3d(xSpeed, jump, zSpeed)
// [PET_SYSTEM_DISABLED] }
