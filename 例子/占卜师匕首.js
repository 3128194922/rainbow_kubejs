const $SpiritHarvestHandler = Java.loadClass("com.sammy.malum.core.handlers.SpiritHarvestHandler")
const $UUIDUtil = Java.loadClass("net.minecraft.core.UUIDUtil")

function colectSpirit(player, itemStack) {
    $SpiritHarvestHandler.pickupSpirit(player, itemStack)
}

function spawnSpirit(spirit, player, target) {
    $SpiritHarvestHandler.spawnItemAsSpirit(spirit, target, player)
}

EntityEvents.hurt(event => {
    if (!event.source.actual) return
    if (event.source.actual.isPlayer()) {
        spawnSpirit(Item.of('malum:sacred_spirit'), event.entity, event.source.actual)
        let uuid = event.source.actual.uuid.toString()
        event.entity.persistentData.spiritPlayer = uuid
    }
})

EntityEvents.spawned('malum:natural_spirit', event => {
    if (!event.level.getEntity($UUIDUtil.uuidFromIntArray(event.entity.nbt.ownerUUID.asIntArray)).isPlayer()) {
        event.server.scheduleInTicks(5, callback => {
            let entity = event.level.getEntity($UUIDUtil.uuidFromIntArray(event.entity.nbt.ownerUUID.asIntArray))
            let spirit = event.level.getEntity(event.entity.uuid)
            if (!spirit && entity) {
                if (event.level.getEntity(entity.persistentData.spiritPlayer)) {
                    global.playerAttack(event.level.getEntity(entity.persistentData.spiritPlayer), entity, 'player_attack', 5)
                    entity.invulnerableTime = 0
                }
                callback.repeating = false
            } else if (!spirit && !entity) {
                callback.repeating = false
            } else if (spirit && !entity) {
                spirit.kill()
                callback.repeating = false
            } else {
                callback.repeating = true
            }
        })
    }
})

/**
 * 
 * @param {Internal.Player} player 
 * @param {Internal.LivingEntity} entity 
 * @param {Internal.DamageType_} damageType 
 * @param {Number} damageValue 
 */
global.playerAttack = (player, entity, damageType, damageValue) => {
    const $ResourceKey = Java.loadClass("net.minecraft.resources.ResourceKey")
    const DAMAGE_TYPE = $ResourceKey.createRegistryKey("damage_type")
    
    const resourceKey = $ResourceKey.create(DAMAGE_TYPE, Utils.id(damageType))
    const holder = player.level.registryAccess().registryOrThrow(DAMAGE_TYPE).getHolderOrThrow(resourceKey)

    let source = new DamageSource(holder, entity, player)
    entity.attack(source, damageValue)
}