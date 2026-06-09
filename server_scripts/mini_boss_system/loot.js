// priority: 0
// 迷你Boss额外战利品掉落

ServerEvents.genericLootTables(event => {
    event.addGeneric('rainbow:mini_boss_extra', loot => {
        loot.addPool(pool => {
            pool.setUniformRolls(1, 3)
            pool.addItem('minecraft:diamond', 8, [1, 3])
            pool.addItem('minecraft:emerald', 8, [2, 5])
            pool.addItem('minecraft:gold_ingot', 10, [2, 6])
            pool.addItem('minecraft:iron_ingot', 10, [4, 10])
            pool.addItem('minecraft:experience_bottle', 6, [1, 3])
            pool.addItem('minecraft:ender_pearl', 5, [1, 2])
            pool.addItem('minecraft:obsidian', 4, [2, 6])
            pool.addItem('rainbow:super_mechanism', 3, [1, 2])
            pool.addItem('rainbow:miracle', 2, 1)
            pool.addItem('minecraft:netherite_scrap', 3, [1, 2])
        })
    })
})

LootJS.modifiers(event => {
    event
        .addLootTypeModifier(LootType.ENTITY)
        .entityPredicate(entity => entity.persistentData.isMiniBoss)
        .addLoot(LootEntry.ofJson({ type: 'minecraft:loot_table', name: 'rainbow:mini_boss_extra' }))
})
