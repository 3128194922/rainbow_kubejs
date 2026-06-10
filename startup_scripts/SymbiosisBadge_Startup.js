// priority: 100
// ==========================================
// 🛡️ 共生徽章 (Symbiosis Badge) - Startup Script
// ==========================================

const SymbiosisConfig = Object.freeze({
    BLACKLIST: Object.freeze(['minecraft:wither', 'minecraft:ender_dragon'])
})

const SYM_ATTRS = Object.freeze([
    { id: 'minecraft:generic.max_health',    uuid: UUID.fromString('c8c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c801'), name: 'ccb_health', value: 20 },
    { id: 'minecraft:generic.armor',         uuid: UUID.fromString('c8c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c802'), name: 'ccb_armor',  value: 10 },
    { id: 'minecraft:generic.attack_damage', uuid: UUID.fromString('c8c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c803'), name: 'ccb_damage', value: 5  }
])
const SYM_OP = AttributeModifier.Operation.ADDITION

function removeSymbiosisModifiers(entity) {
    if (!entity?.isLiving()) return
    for (const attr of SYM_ATTRS) {
        const inst = entity.getAttribute(attr.id)
        if (inst) inst.removeModifier(attr.uuid)
    }
    entity.setTarget(null)
}

function applySymbiosisModifiers(entity) {
    if (!entity?.isLiving()) return
    let isNewHealth = false
    for (const attr of SYM_ATTRS) {
        const inst = entity.getAttribute(attr.id)
        if (inst && !inst.getModifier(attr.uuid)) {
            inst.addPermanentModifier(new AttributeModifier(attr.uuid, attr.name, attr.value, SYM_OP))
            if (attr === SYM_ATTRS[0]) isNewHealth = true
        }
    }
    if (isNewHealth) entity.heal(20)
}

StartupEvents.registry('item', event => {
    event.create('rainbow:ccb')
        .displayName('共生徽章')
        .rarity("epic")
        .maxStackSize(1)
        .tag("curios:charm")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create()
                .curioTick((slotContext, stack) => {
                    const player = slotContext.entity()
                    if (!player || player.level.isClientSide()) return

                    const lastUUID = player.persistentData.getString("SymbiosisLastVehicleUUID")
                    const vehicle = player.vehicle

                    if (vehicle?.isLiving()) {
                        const vehicleUUID = vehicle.uuid.toString()
                        if (lastUUID && lastUUID !== vehicleUUID) {
                            removeSymbiosisModifiers(player.level.getEntity(UUID.fromString(lastUUID)))
                        }
                        if (lastUUID !== vehicleUUID) {
                            player.persistentData.putString("SymbiosisLastVehicleUUID", vehicleUUID)
                        }
                        applySymbiosisModifiers(vehicle)
                    } else if (lastUUID) {
                        removeSymbiosisModifiers(player.level.getEntity(UUID.fromString(lastUUID)))
                        player.persistentData.remove("SymbiosisLastVehicleUUID")
                    }
                })
                .canEquip((slotContext, stack) => {
                    const entity = slotContext.entity()
                    return entity ? !hasCurios(entity, 'rainbow:ccb') : false
                })
                .canEquipFromUse((slotContext, stack) => false)
                .onUnequip((slotContext, newStack, stack) => {
                    const player = slotContext.entity()
                    if (!player || player.level.isClientSide()) return
                    const lastUUID = player.persistentData.getString("SymbiosisLastVehicleUUID")
                    if (lastUUID) {
                        removeSymbiosisModifiers(player.level.getEntity(UUID.fromString(lastUUID)))
                        player.persistentData.remove("SymbiosisLastVehicleUUID")
                    }
                })
        )
})

// ==========================================
// 🕹️ 实体控制逻辑
// ==========================================

function getRiddenInput(player) {
    const strafe = player.xxa * 0.5
    const forward = player.zza
    const vehicle = player.vehicle
    const isJumping = isClient && Minecraft.getInstance().player.input.jumping
    const speed = forward <= 0.0 ? forward * 0.25 : forward

    const angle = (player.yRotO * Math.PI) / 180
    const sin = Math.sin(angle)
    const cos = Math.cos(angle)
    const x = strafe * cos - speed * sin
    const z = strafe * sin + speed * cos

    const isWaterAnimalInWater = vehicle instanceof WaterAnimal && vehicle.inWater
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

    const airborne = vehicle && !vehicle.onGround() &&
        !(vehicle instanceof FlyingMob) &&
        !(vehicle instanceof WaterAnimal && vehicle.inWater)

    const xSpeed = airborne ? x * 0.03 : vehicle instanceof FlyingMob ? x * 0.08 : x * 0.2
    const zSpeed = airborne ? z * 0.03 : vehicle instanceof FlyingMob ? z * 0.08 : z * 0.2

    return new Vec3d(xSpeed, jump, zSpeed)
}

function controlEntity(entity, player) {
    if (!player || !entity.isAlive()) return

    if (entity instanceof FlyingMob && entity.persistentData.LandTarget) {
        entity.persistentData.remove("LandTarget")
    }

    const vec3 = getRiddenInput(player)
    const vec2 = new Vec2(player.pitch * 0.5, player.yaw)

    entity.setRotation(vec2.y, vec2.x)
    entity.yRotO = entity.yBodyRot = entity.yHeadRot = entity.yaw

    if (entity instanceof WaterAnimal || entity instanceof FlyingMob) {
        entity.yRotO = entity.yBodyRot = entity.yHeadRot = entity.yaw
        entity.xRotO = entity.pitch = -player.xRotO * 0.5
    }

    entity.addMotion(vec3.x(), vec3.y(), vec3.z())
}

ForgeEvents.onEvent('net.minecraftforge.event.entity.living.LivingEvent$LivingTickEvent', event => {
    const entity = event.entity
    if (entity.level.isClientSide()) return
    if (!entity.isVehicle()) return

    const passengers = entity.getPassengers()
    if (passengers.isEmpty()) return

    const passenger = passengers.get(0)
    if (!passenger.isPlayer()) return
    if (entity instanceof Player) return

    if (typeof hasCurios !== 'undefined' && hasCurios(passenger, 'rainbow:ccb')) {
        if (SymbiosisConfig.BLACKLIST.includes(entity.type.toString())) return
        controlEntity(entity, passenger)
    }
})
