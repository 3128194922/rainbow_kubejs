StartupEvents.registry('item', event => {
    for (let i = 0; i < 14; i++) {
        event.create(`rainbow:hormone_${i}`)
            .displayName(`九龙${i}型`)
            .texture(`minecraft:item/potion_overlay`) 
            .color(0xFF00FF) 
    }
})

// 【前端变前台，后端变后厨，python送到家，Java炒米粉】
