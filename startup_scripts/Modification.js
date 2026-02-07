// priority: 0
// ==========================================
// 方块与物品属性修改
// Block & Item Modification
// ==========================================
// 修改方块（如挖掘速度）和物品的属性
// Modifies block (e.g., destroy speed) and item attributes

// 修改方块属性
BlockEvents.modification(event => {
    // 增加火盆匣的挖掘速度
    event.modify('netherexp:brazier_chest', block => {
        block.destroySpeed = 0.5
    })
})

// 修改物品属性
ItemEvents.modification(event => {
    // 幻觉效果食物 (gimmethat:hallucinating)
    event.modify(['collectorsreap:portobello_quiche_slice', 'collectorsreap:portobello_burger'], item => {
        item.foodProperties = food => {
            food.effect('gimmethat:hallucinating', 300, 0, 1.0)
        }
    })

    // 苦涩效果食物 (gimmethat:bitterness)
    event.modify('atmospheric:yucca_fruit', item => {
        item.foodProperties = food => {
            food.effect('rainbow:bitter', 300, 0, 1.0)
        }
    })

    // 幽匿相关食物 (gimmethat:resonance)
    event.modify([
        'dungeonsdelight:sculk_dogapple',
        'dungeonsdelight:sculk_tart_slice',
        'dungeonsdelight:sculk_apple',
        'dungeonsdelight:sculk_catblueberry',
        'dungeonsdelight:sculk_mayo'
    ], item => {
        item.foodProperties = food => {
            food.effect('gimmethat:resonance', 300, 0, 1.0)
        }
    })

    // 水上行走效果食物 (runiclib:water_walking)
    event.modify(['tide:cooked_fish'], item => {
        item.foodProperties = food => {
            food.effect('runiclib:water_walking', 6000, 0, 1.0)
        }
    })

    // 岩浆行走效果食物 (runiclib:lava_walking)
    event.modify(['cavedelight:volcanic_chop', 'cavedelight:cooked_dino_cut'], item => {
        item.foodProperties = food => {
            food.effect('runiclib:lava_walking', 6000, 0, 1.0)
        }
    })

    /*  event.modify(['hmag:iron_spear','minecraft:wooden_sword','savage_and_ravage:cleaver_of_beheading'],item=>{
        item.addAttribute("minecraft:generic.movement_speed", "d685b34c-8e34-4f4c-be7a-3e306e6656ee", "Sus speed", 1, "addition")
    
        //item.addAttribute("forge:entity_gravity", "1f12ad16-2bc8-40c1-952d-19412bb666ac", "Sus gravity", 20, "multiply_total")
      })*/
});
//修改生物类型
/*EntityJSEvents.modifyEntity(event => {
    event.modify("minecraft:warden", modifyBuilder => {
        modifyBuilder.mobType('undead')
    })
})*/