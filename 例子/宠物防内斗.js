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
 * Maps entity types to the item required to tame them.
 *
 * This list controls which mobs can be tamed during gameplay and
 * what item is needed to tame each.
 *
 * ⚠️ Note: A similar list exists in the startup script (`tameableMobs` array used in `EntityJSEvents.modifyEntity`).
 * If you add or remove entries here, you should update the startup script as well
 * to ensure custom behaviors (like riding, sitting, or attacking logic) are correctly applied.
 */


let tameableMobs = {
    "alexsmobs:soul_vulture": "kubejs:testing",
    "alexsmobs:anaconda": "kubejs:testing",
    "alexsmobs:moose": "kubejs:testing",
    "alexsmobs:rattlesnake": "kubejs:testing",
    "alexsmobs:rhinoceros": "kubejs:testing",
    "alexsmobs:tiger": "kubejs:testing",
    "alexsmobs:tusklin": "kubejs:testing",
    "alexsmobs:snow_leopard": "kubejs:testing",
    "alexscaves:teletor": "kubejs:testing",
    "alexsmobs:bone_serpent": "kubejs:testing",
    "alexsmobs:enderiophage": "kubejs:testing",
    "alexsmobs:emu": "kubejs:testing",
    "iceandfire:dread_scuttler": "kubejs:testing",
    "alexsmobs:crow": "kubejs:testing",
    "alexsmobs:bald_eagle": "kubejs:testing",
    "alexsmobs:capuchin_monkey": "kubejs:testing",
    "alexsmobs:tarantula_hawk": "kubejs:testing",
    "alexsmobs:komodo_dragon": "kubejs:testing",
    "alexsmobs:kangaroo": "kubejs:testing",
    "alexsmobs:gorilla": "kubejs:testing",
    "alexsmobs:crocodile": "kubejs:testing",
    "alexsmobs:grizzly_bear": "kubejs:testing",
    "alexsmobs:caiman": "kubejs:testing",
}

/**
 * Resets and reapplies the defensive targeting behavior for tamed mobs.
 *
 * - Removes existing `NearestAttackableTargetGoal`s to prevent unwanted aggression.
 * - Re-adds a filtered goal that only targets:
 *   - The last mob attacked by the owner.
 *   - The last mob that attacked the owner.
 * - Ignores other tamed mobs and the owner.
 *
 * Also called on entity spawn to restore tame behavior.
 */
function reviseTamedPetGoals(mob) {
    if (mob instanceof PathfinderMob) {
        // simply stop all goals to reset aggro
        mob.targetSelector.getRunningGoals().forEach(goal => goal.stop())
        // here we remove all nearest attackable target goals so it doesnt attack us or other mobs on sight
        // the entity goal to remove will vary depending on the mob tamed, so you may need to add more cases for other mobs
        mob.targetSelector.removeAllGoals(goal => goal instanceof NearestAttackableTargetGoal)
        if (mob.goalSelector.availableGoals.some(goal => goal.goal instanceof MeleeAttackGoal)) {
            // re-add the NearestAttackableTargetGoal & HurtByTargetGoal to make it only attack the last entity the player attacked
            mob.server.scheduleInTicks(1, () => {
                mob.targetSelector.addGoal(1, new NearestAttackableTargetGoal(mob, LivingEntity, 1, true, false, t => {
                    if (mob.persistentData.OwnerName) {
                        let owner = mob.server.getPlayer(mob.persistentData.OwnerName)
                        if (owner) {
                            let lastAttackedId = owner.persistentData.LastAttackedMobId
                            let lastAttackedMeId = owner.persistentData.LastMobToAttackMe
                            if (lastAttackedId) {
                                let entityRef = mob.level.getEntities().filter(e => e.getUuid().toString() == lastAttackedId)[0]
                                if (entityRef) {
                                    if (entityRef.persistentData.OwnerName == owner.getUuid().toString() ||
                                        (t instanceof TamableAnimal && t.isOwnedBy(owner)) || isAlly(owner, entityRef)
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
                    let fallback = t instanceof Player && mob.persistentData.OwnerName != t.getUuid().toString()
                    return fallback
                }))
            })
        }
    }
}
EntityEvents.spawned(event => {
    let { entity } = event
    let tamingItem = tameableMobs[entity.type]
    if (tamingItem && entity.persistentData.OwnerName)
        reviseTamedPetGoals(entity)
})

/**
 * Handles taming, saddling, and sitting for custom tameable mobs.
 *
 * - Right-click with the taming item: 50% chance to tame if unowned.
 * - Right-click with saddle (if owner): equips the mob with a saddle.
 * - Shift-right-click (if owner): toggles sitting state.
 *
 * Consumes items as needed and cancels default interaction behavior where appropriate.
 */
ItemEvents.entityInteracted(event => {
    let { target, player, player: { mainHandItem } } = event
    if (event.hand != "main_hand") return
    if (!target.persistentData.HasSaddle) target.persistentData.HasSaddle = 0
    if (target.persistentData.OwnerName &&
        target.persistentData.OwnerName == player.getUuid().toString() &&
        mainHandItem.id == "minecraft:saddle") {
        if (target.persistentData.HasSaddle == 0) {
            target.persistentData.HasSaddle = 1
            player.swing("main_hand")
            mainHandItem.count--
            event.cancel()
        }
    }
    if (target.persistentData.OwnerName &&
        target.persistentData.OwnerName == player.getUuid().toString() &&
        player.isShiftKeyDown()
    ) {
        let current = target.persistentData.Sitting || 0
        target.persistentData.Sitting = current == 0 ? 1 : 0
        event.cancel()
    }

})
Object.keys(tameableMobs).forEach(id => {
    EntityJSEvents.addGoalSelectors(id, event => {
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
                        owner.distanceToEntity(e) >= 10) {
                        e.navigation.moveTo(owner, 1)
                    }
                }
            })
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
 * Tracks combat interactions to support retaliatory targeting by tamed mobs.
 *
 * - Sets `LastAttackedMobId` on the attacking player when they damage a mob,
 *   unless the mob is their own tamed pet.
 *
 * - Sets `LastMobToAttackMe` on the player when they are attacked,
 *   unless the attacker is their own tamed pet.
 *
 * These values can be used in a `NearestAttackableTargetGoal` to let
 * tamed mobs automatically retaliate when their owner is hurt or when
 * the owner attacks something.
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
            attacker.targetSelector.getRunningGoals().forEach(goal => goal.stop())
            event.cancel()
        }
        if (!(attacker instanceof TamableAnimal && attacker.isOwnedBy(entity)))
            entity.persistentData.LastMobToAttackMe = attacker.getUuid().toString()
    }
})
/**
 * Prevents infighting between tamed mobs by canceling damage events
 * when a mob attempts to hurt its owner or another mob owned by the same player.
 * Also stops attack goals for pathfinding mobs to prevent aggressive behavior.
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



/**
 * Instantly tames any mob listed in `tameableMobs` for the given player.
 *
 * @param {Internal.Player}  player               – New owner.
 * @param {Internal.Entity}  mob                  – Mob to tame.
 * @returns {boolean}                             – true = success, false = nothing happened.
 */
function specialMobTame(player, mob) {
    // Basic sanity checks
    if (!player || !mob || player.level.isClientSide()) return false;
    if (mob.persistentData?.OwnerName) return false;               // already tamed
    const tamingItem = tameableMobs[mob.type];
    if (!tamingItem) return false;                                 // not on whitelist

    // Vanilla tamables get the real tame flag; others fall back to OwnerName NBT
    if (mob instanceof TamableAnimal) {
        mob.setTame(true);
        mob.setOwnerUUID(player.getUuid());
    }
    mob.persistentData.OwnerName = player.getUuid().toString();

    // Cosmetics: name, sound, particles
    player.level.playSound(null, mob.x, mob.y, mob.z,
        "minecraft:entity.generic.eat", "players", 0.5, 0.9);
    mob.level.spawnParticles('minecraft:heart', true,
        mob.x + 0.5, mob.y + 1.05, mob.z + 0.5,
        0, 0.3, 0, 2, 0.1);

    // Reset + apply pet goals so it behaves like your click-tamed pets
    reviseTamedPetGoals(mob);
    mob.tags.add('Owner:'+player.username)
    mob.tags.add('tamed_beast')
    return true;
}

/**
 * ItemEvents.rightClicked('stick', event => {
    let creature = event.level.createEntity('alexsmobs:rattlesnake')
    creature.setPos(event.player.x, event.player.y, event.player.z)
    creature.spawn()
    Utils.server.scheduleInTicks(1, () => {
        specialMobTame(event.player, creature)
    })

})
 * 
 */
