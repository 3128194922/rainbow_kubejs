// priority: 0
// ==========================================
// 📦 战利品表修改脚本
// ==========================================

// 钓鱼战利品修改 (已注释)
/*ServerEvents.genericLootTables(e=>{
    e.modify("netherdepthsupgrade:gameplay/nether_fishing/treasure",loot=>{
        let json = [{
            "type":"minecraft:item",
            "name":"netherexp:brazier_chest",
            "weight":1
        }]
        let poolArr = loot.pools.get(0).asJsonObject.get("entries").asJsonArray
        poolArr.addAll(json)
    })
})*/

// 猫的晨礼：添加粑粑
ServerEvents.genericLootTables(e => {
    e.modify("minecraft:gameplay/cat_morning_gift", loot => {
        let json = [{
            "type": "minecraft:item",
            "name": "alexscaves:guano",
            "weight": 10
        }]
        let poolArr = loot.pools.get(0).asJsonObject.get("entries").asJsonArray
        poolArr.addAll(json)
    })
})

// 修改堆肥配方：粑粑可以堆肥
ServerEvents.compostableRecipes((e) => {
    const recipes = [
        {
            input: 'alexscaves:guano',
            chance: 1.0,
        }
    ];

    recipes.forEach((recipe) => {
        e.add(recipe.input, recipe.chance);
    });
});

/*
// 幸运方块（rainbow:luckyblock）战利品表
ServerEvents.blockLootTables(e => {
    e.modifyBlock('rainbow:luckyblock', loot => {
        // 定义幸运方块可能掉落的物品池
        let pool = [{
            "type": "minecraft:item",
            "name": "rainbow:pistol_blue"

        },
        {
            "type": "minecraft:item",
            "name": "rainbow:rifle_blue"

        }
        ]
        let arr = loot.pools.get(0).asJsonObject.get("entries").asJsonArray
        arr.addAll(pool)
    })
})*/

// 村民礼物：根据职业添加额外礼物
/*ServerEvents.genericLootTables(event => {
    // 覆盖战利品表event.addGeneric(战利品表id, loot => {})
    event.addGeneric('minecraft:gameplay/hero_of_the_village/fletcher_gift', loot => {
        loot.addPool(pool => {
            pool.addItem('alexsmobs:shark_tooth_arrow')
        })
    })
    event.addGeneric('minecraft:gameplay/hero_of_the_village/butcher_gift', loot => {
        loot.addPool(pool => {
            pool.addItem('youkaishomecoming:flesh_chocolate_mousse')
        })
    })
    event.addGeneric('minecraft:gameplay/hero_of_the_village/cleric_gift', loot => {
        loot.addPool(pool => {
            pool.addItem('minecraft:enchanted_golden_apple')
        })
    })
    event.addGeneric('minecraft:gameplay/hero_of_the_village/farmer_gift', loot => {
        loot.addPool(pool => {
            pool.addItem("rainbow:tengzou_noodles")
        })
    })
    event.addGeneric('minecraft:gameplay/hero_of_the_village/fisherman_gift', loot => {
        loot.addPool(pool => {
            pool.addItem('minecraft:scute')
        })
    })
    event.addGeneric('minecraft:gameplay/hero_of_the_village/leatherworker_gift', loot => {
        loot.addPool(pool => {
            pool.addItem('alexsmobs:bear_fur')
        })
    })
    event.addGeneric('minecraft:gameplay/hero_of_the_village/librarian_gift', loot => {
        loot.addPool(pool => {
            pool.addItem(Item.of('minecraft:enchanted_book').enchant('minecraft:silk_touch', 1))
        })
    })
    event.addGeneric('minecraft:gameplay/hero_of_the_village/mason_gift', loot => {
        loot.addPool(pool => {
            pool.addItem('rainbow:hero_charm')
        })
    })
    event.addGeneric('minecraft:gameplay/hero_of_the_village/weaponsmith_gift', loot => {
        loot.addPool(pool => {
            //pool.addItem('rainbow:glass_sword')
            pool.addItem('rainbow:purified_cloth')
        })
    })
    event.addGeneric('minecraft:gameplay/hero_of_the_village/toolsmith_gift', loot => {
        loot.addPool(pool => {
            pool.addItem('rainbow:slime_rod')
        })
    })
})
*/

//钓鱼战利品
ServerEvents.fishingLootTables(event=>{
    event.modify("minecraft:fish",loot=>{
        loot.addPool(pool=>{
            pool.addItem("rainbow:ccb").count(1)
            pool.addEmpty(10)
        })
    })
})

// 添加生物战利品
ServerEvents.entityLootTables(event => {
    // 疣猪掉mod火腿
    event.modifyEntity('minecraft:hoglin', Loot => {
        Loot.addPool(pool => {
            pool.addItem('netherexp:hogham').lootingEnchant(1, 2)
        })
    })
    // 流浪商人掉绿宝石
    event.modifyEntity('minecraft:wandering_trader', Loot => {
        Loot.addPool(pool => {
            pool.addItem('minecraft:emerald').weight(1).count([1, 2]).lootingEnchant(1, 5)
        })
    })
    // 蟑螂掉落粑粑
    event.modifyEntity('alexsmobs:cockroach', Loot => {
        Loot.addPool(pool => {
            pool.addItem('alexscaves:guano')
                .weight(1) // 基础掉落权重
                .count([0, 1]) // 基础掉落数量范围
                .lootingEnchant(1, 5)
        })
    })
    // 笼头怪掉落废料
    event.modifyEntity('spawnerhead:spawner_head', Loot => {
        Loot.addPool(pool => {
            pool.addItem('dungeonsdelight:stained_scrap')
                .weight(1) // 基础掉落权重
                .count([1, 2]) // 基础掉落数量范围
                .lootingEnchant(1, 5)
        })
    })
    // 女仆妖精掉落糖果
/*    event.modifyEntity('touhou_little_maid:fairy', Loot => {
        Loot.addPool(pool => {
            pool.addItem('youkaishomecoming:fairy_candy')
                .weight(1) // 糖果权重 = 1
                .count(1)
                .lootingEnchant(1, 3)
            pool.addEmpty(19)
        });
    });*/
    // 女巫帽子
    event.modifyEntity('minecraft:witch', Loot => {
        Loot.addPool(pool => {
            pool.addItem('gimmethat:which_armor_helmet')
            .weight(1)
            .count([0,1])
        })
    })
    // 腐烂之心
    event.modifyEntity('minecraft:zombie', Loot => {
        Loot.addPool(pool => {
            pool.addItem('rainbow:rotten_heart')
            .weight(1)
            .count([0,1])
            pool.addEmpty(10)
        })
    })
    // 沙蚀之心
    event.modifyEntity('minecraft:husk', Loot => {
        Loot.addPool(pool => {
            pool.addItem('rainbow:gritty_heart')
            .weight(1)
            .count([0,1])
            pool.addEmpty(10)
        })
    })
    // 溺尸之心
    event.modifyEntity('minecraft:drowned', Loot => {
        Loot.addPool(pool => {
            pool.addItem('rainbow:drowned_heart')
            .weight(1)
            .count([0,1])
            pool.addEmpty(10)
        })
    })
    // 霜冻之心
    event.modifyEntity('windswept:chilled', Loot => {
        Loot.addPool(pool => {
            pool.addItem('rainbow:frozen_heart')
            .weight(1)
            .count([0,1])
            pool.addEmpty(10)
        })
    })
    // 粘液僵尸
    event.modifyEntity('dungeonsdelight:rotten_zombie', Loot => {
        Loot.addPool(pool => {
            pool.addItem('rainbow:gunk_heart')
            .weight(1)
            .count([0,1])
            pool.addEmpty(10)
        })
    })
/*
    //覆盖战利品 (已注释)
    //利维坦
    event.addEntity("cataclysm:the_leviathan", loot => {
        loot.addPool(pool => {
            pool.addItem('cataclysm:chain_of_soul_binding').weight(1)
        })
    })
    //末影傀儡
    event.addEntity("cataclysm:ender_golem", loot => {
        loot.addPool(pool => {
            pool.addItem('cataclysm:enderite_ingot').weight(1).count([3, 4])
        })
    })*/ 
})

// 方块战利品
ServerEvents.blockLootTables(event => {
    // 旗帜工作台掉落
    event.addBlock('betsyross:embroidery_table', loot => {
        loot.addPool(pool => {
            // 添加战利品
            pool.addItem('betsyross:embroidery_table')
        })
    })
    //松露挖屎
    /*    event.modifyBlock('environmental:buried_truffle',loot=>{
            let pool = [
            {
                "type":"minecraft:item",
                "name":"rainbow:shit"
            }]
            let arr = loot.pools.get(0).asJsonObject.get("entries").asJsonArray
            arr.addAll(pool)
        })*/
    // 末影篝火
    event.modifyBlock('endergetic:ender_campfire',loot=>{
        let pool = [
        {
            "type":"minecraft:item",
            "name":"minecraft:end_stone"
        }]
        let arr = loot.pools.get(0).asJsonObject.get("entries").asJsonArray
        arr.addAll(pool)
    })
    // 始冰
    event.addBlock('rainbow:origin_ice_ore', loot => {
        loot.addPool(pool => {
            // 添加战利品
            pool.addItem('legendary_monsters:primal_ice_shard')
        })
    })
    // 末地矿
    event.addBlock('rainbow:end_ore', loot => {
        loot.addPool(pool => {
            // 添加战利品
            pool.addItem('rainbow:raw_endore')
        })
    })
})

// 通用战利品表：彩虹箱子
ServerEvents.genericLootTables(event => {
    event.addGeneric("rainbow_chest", loot => {
        loot.addPool(item => {
            item.addItem("apple")
        })
    })
})

// 佣兵无掉落逻辑（如果被驯服，则不掉落任何物品）
LootJS.modifiers((event) => {
    let tameableMobs = ["minecraft:iron_golem","minecraft:zombie",'minecraft:drowned','dungeonsdelight:rotten_zombie','minecraft:husk','windswept:chilled']
    tameableMobs.forEach(entityid=>{
        event
        .addEntityLootModifier(entityid)
        .entityPredicate((entity) => entity.persistentData.OwnerName != null)
        .removeLoot(Ingredient.all)
    })
});

// 灵脂蜡块战利品：根据实体 docker 数据添加掉落
LootJS.modifiers((event) => {
    event
        .addLootTypeModifier(LootType.ENTITY)
        .entityPredicate((entity) => entity.persistentData.docker != null && entity.getNbt().get("forge:spawn_type") == "MOB_SUMMONED")
        .addAlternativesLoot(
            LootEntry.of('gimmethat:mandel_brick').when((c) => c.randomChance(0.5)),
            LootEntry.of('gimmethat:quantum_key').when((c) => c.randomChance(0.5))
        );
});