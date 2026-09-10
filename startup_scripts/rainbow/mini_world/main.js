// 小宇宙物品注册：右键进入玩家个人世界。
const MINI_WORLD_ITEM_ID = 'rainbow:mini_world'

StartupEvents.registry('item', event => {
    try {
        event.create(MINI_WORLD_ITEM_ID, 'basic')
            .displayName('小宇宙')
            .rarity('epic')
            .maxStackSize(1)
            .texture('rainbow:item/mini_world')
    } catch (error) {
        console.log('[小宇宙] 物品注册失败: ' + error)
    }
})
