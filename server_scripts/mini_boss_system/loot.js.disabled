// priority: 0
// 迷你Boss额外战利品掉落

LootJS.modifiers(event => {
    event
        .addLootTypeModifier(LootType.ENTITY)
        .entityPredicate(entity => entity.persistentData.getBoolean("isMiniBoss"))
        .addWeightedLoot(
            [1, 3],
            [
                Item.of('minecraft:diamond').withChance(8),
                Item.of('minecraft:emerald').withChance(8),
                Item.of('minecraft:gold_ingot').withChance(10),
                Item.of('minecraft:iron_ingot').withChance(10),
                Item.of('minecraft:experience_bottle').withChance(6),
                Item.of('minecraft:ender_pearl').withChance(5),
                Item.of('minecraft:obsidian').withChance(4),
                Item.of('rainbow:super_mechanism').withChance(3),
                Item.of('rainbow:miracle').withChance(2),
                Item.of('minecraft:netherite_scrap').withChance(3),
            ]
        )
})