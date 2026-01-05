// priority: 0
// ==========================================
// 实体驯服与骑乘逻辑
// Entity Taming & Riding Logic
// ==========================================
// 修改特定生物（如铁傀儡）使其可被驯服和骑乘
// Modifies specific mobs (e.g., Iron Golem) to be tameable and rideable

let tameableMobs = [
    "minecraft:iron_golem",
]
let LivingEntity = Java.loadClass("net.minecraft.world.entity.LivingEntity")
let Difficulty = Java.loadClass("net.minecraft.world.Difficulty")
let Player = Java.loadClass("net.minecraft.world.entity.player.Player")
let Vec2 = Java.loadClass("net.minecraft.world.phys.Vec2")
let FlyingMob = Java.loadClass("net.minecraft.world.entity.FlyingMob")
let WaterAnimal = Java.loadClass("net.minecraft.world.entity.animal.WaterAnimal")
let WallClimberNavigation = Java.loadClass("net.minecraft.world.entity.ai.navigation.WallClimberNavigation")
let isClient = Platform.isClientEnvironment()
let Minecraft = isClient ? Java.loadClass("net.minecraft.client.Minecraft") : null

EntityJSEvents.modifyEntity(event => {
    tameableMobs.forEach(id => {
        event.modify(id, modifyBuilder => {
            modifyBuilder
                .onInteract(context => {
                    let { entity, player } = context
                    if (entity.persistentData.OwnerName != player.getUuid().toString()) return
                    if (entity.persistentData.HasSaddle == 1
                    ) {
                        if (!player.isShiftKeyDown()) {
                            player.startRiding(entity)
                        } else if (player.mainHandItem.id == "minecraft:air") {
                            player.swing()
                            entity.persistentData.HasSaddle = 0
                            entity.block.popItem("minecraft:saddle")
                        }
                    }
                })
                .tick(entity => {
                    global.travelRidden(entity, entity.getControllingPassenger())
                })
                .controlledByFirstPassenger(true)
                .myRidingOffset(entity => 1)
                .canAddPassenger(context => {
                    let { entity, passenger } = context
                    return entity.persistentData.HasSaddle == 1 && entity.persistentData.OwnerName == passenger.getUuid().toString()
                })
                .canAttack(/**@param {Internal.ContextUtils$LivingEntityContext}context */  context => {
                    let { entity, target } = context
                    try {
                        let superCall = target instanceof Player && entity.level.getDifficulty() == Difficulty.PEACEFUL ? false : target.canBeSeenAsEnemy()
                        return (entity.persistentData.OwnerName != undefined &&
                            entity.persistentData.OwnerName == target.getUuid().toString()) || (entity.persistentData.Sitting == 1)
                            ? false : superCall
                    } catch (error) {
                        console.log(error)
                        return false
                    }
                })
        })
    })
})
/**
 * 
 * @param {Internal.PathfinderMob} entity 
 * @param {Internal.Player} player 
 */
global.travelRidden = (entity, player) => {
    if (!player) return
    let vec3
    if (!entity.isAlive()) return
    let landTarget = entity.persistentData.LandTarget
    if (entity instanceof FlyingMob &&
        landTarget &&
        player
    ) {
        entity.persistentData.remove("LandTarget")
    }
    vec3 = getRiddenInput(player)
    let vec2 = new Vec2(player.pitch * 0.5, player.yaw)
    entity.setRotation(vec2.y, vec2.x)
    entity.yRotO = entity.yBodyRot = entity.yHeadRot = entity.yaw
    if (entity instanceof WaterAnimal ||
        entity instanceof FlyingMob
    ) {
        entity.yRotO = entity.yBodyRot = entity.yHeadRot = entity.yaw
        let pitch = -player.xRotO * 0.5
        entity.xRotO = entity.pitch = pitch
    }
    entity.addMotion(vec3.x(), vec3.y(), vec3.z())
}

/**
 * @param {Internal.Player} player
 */
function getRiddenInput(player) {
    let strafe = player.xxa * 0.5
    let forward = player.zza
    let vehicle = player.vehicle
    let isJumping = isClient && Minecraft.getInstance().player.input.jumping
    if (forward <= 0.0) {
        forward *= 0.25
    }
    let yawRad = (player.yRotO * JavaMath.PI) / 180
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