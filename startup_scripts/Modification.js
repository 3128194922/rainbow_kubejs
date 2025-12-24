// priority: 0
// 火盆匣挖掘速度修改
BlockEvents.modification(event => {
    event.modify('netherexp:brazier_chest', block => {
        block.destroySpeed = 0.5
    })
})

// 物品属性修改
ItemEvents.modification(event => {
    /*  event.modify(['hmag:iron_spear','minecraft:wooden_sword','savage_and_ravage:cleaver_of_beheading'],item=>{
        item.addAttribute("minecraft:generic.movement_speed", "d685b34c-8e34-4f4c-be7a-3e306e6656ee", "Sus speed", 1, "addition")
    
        //item.addAttribute("forge:entity_gravity", "1f12ad16-2bc8-40c1-952d-19412bb666ac", "Sus gravity", 20, "multiply_total")
      })*/
});