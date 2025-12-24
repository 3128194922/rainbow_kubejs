let weightedBlocks = [
    ['minecraft:grass', 3],
    ['minecraft:fern', 3],
    ['minecraft:dandelion', 1],
    ['minecraft:poppy', 1],
    ['minecraft:azure_bluet', 3],
    ['minecraft:allium', 3],
    ['minecraft:blue_orchid', 3],
    ['minecraft:oxeye_daisy', 3],
    ['minecraft:red_tulip', 3],
    ['minecraft:orange_tulip', 3],
    ['minecraft:white_tulip', 3],
    ['minecraft:pink_tulip', 3],
    ['minecraft:cornflower', 3],
    ['minecraft:lily_of_the_valley', 3],
    ['minecraft:azalea', 1],
    ['minecraft:flowering_azalea', 1],
    ['minecraft:moss_carpet', 4],
    ['minecraft:wither_rose', 1],
    ['minecraft:air', 13]
]
const useVanillaBonemeal = true
const radius = 20
let BoneMealableBlock = Java.loadClass("net.minecraft.world.level.block.BonemealableBlock")
let ForgeEventFactory = Java.loadClass("net.minecraftforge.event.ForgeEventFactory")
BlockEvents.rightClicked(event => {
    let { player, item, block, level, hand } = event
    if (item.id != 'minecraft:bone_meal') return
    if (!['minecraft:moss_block', 'minecraft:grass_block'].includes(block.id)) return
    let center = block.pos
    let didConsume = false
    let spawnedParticles = new Set()
    // this is an optional hook to let other mods cancel the bonemeal event via their current bonemeal logic
    let hook = ForgeEventFactory.onApplyBonemeal(player, level, center, block.blockState, item);
    if (hook != 0) {
        return hook > 0 ?? event.cancel()
    }
    let blockPool = []
    for (let i = 0; i < weightedBlocks.length; i++) {
        let [blockId, weight] = weightedBlocks[i]
        for (let j = 0; j < weight; j++) {
            blockPool.push(blockId)
        }
    }
    function spawnBonemealParticles(pos) {
        let key = pos.x + ':' + pos.z
        if (spawnedParticles.has(key)) return
        spawnedParticles.add(key)
        let count = 2 + Math.floor(Math.random() * 2)
        for (let i = 0; i < count; i++) {
            let dx = (Math.random() - 0.5) * 0.6
            let dy = Math.random() * 0.6 + 0.1
            let dz = (Math.random() - 0.5) * 0.6
            level.spawnParticles(
                'minecraft:happy_villager',
                true,
                pos.x + 0.5,
                pos.y + 1.2 + Math.random() * 0.3,
                pos.z + 0.5,
                0,
                dx,
                dy + 1,
                dz + 5,
                0.1
            )
        }
    }
    function applyBonemealLikeVanilla(pos) {
        let state = level.getBlock(pos).blockState
        let blockRaw = state.block
        if (!blockRaw || !(['minecraft:moss_block', 'minecraft:grass_block'].includes(blockRaw.id))) return
        if (blockRaw.isValidBonemealTarget(level, pos, state, false)) {
            if (blockRaw.isBonemealSuccess(level, level.getRandom(), pos, state)) {
                blockRaw.performBonemeal(level, level.getRandom(), pos, state)
                if (Math.random() < 0.12) {
                    spawnBonemealParticles(pos)
                }
                didConsume = true
            }
        }
    }
    let blockSetQueue = []
    for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -3; dy <= 3; dy++) {
            for (let dz = -radius; dz <= radius; dz++) {
                let pos = center.offset(dx, dy, dz)
                let base = level.getBlock(pos)
                let distSq = dx * dx + dy * dy + dz * dz
                let maxDistSq = radius * radius
                let falloff = 1 - Math.min(distSq / maxDistSq, 1)

                if (useVanillaBonemeal) {
                    if (Math.random() < falloff) {
                        applyBonemealLikeVanilla(pos)
                    }
                } else {
                    if (base.id == 'minecraft:grass_block') {
                        let above = base.up
                        if (above.id == 'minecraft:air' && Math.random() < (0.5 * falloff)) {
                            let chosen = blockPool[Math.floor(Math.random() * blockPool.length)]
                            blockSetQueue.push({ pos: above, block: chosen })
                            didConsume = true
                            if (Math.random() < 0.12) {
                                spawnBonemealParticles(pos)
                            }
                        }
                    }
                }
            }
        }
    }
    for (let i = 0; i < blockSetQueue.length; i++) {
        let entry = blockSetQueue[i]
        entry.pos.set(entry.block)
    }

    if (didConsume) {
        player.level.playSound(null, block.x, block.y, block.z, "item.bone_meal.use", "blocks", 1, 1)
        player.swing()
        if (!player.creative)
            item.shrink(1)
    }
    event.cancel()
})