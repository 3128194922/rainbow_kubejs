// priority: 0
// ==========================================
// 🐝 蜜蜂实体事件处理脚本
// ==========================================
/*
// 实体生成事件
EntityEvents.spawned(event => {
    let entity = event.getEntity();
    let level = event.getLevel();
    if (level.isClientSide()) return;
    if (!entity) return;

    let id = entity.getEncodeId();
    if (id == null) return;

    // 为生成的蜜蜂随机分配一个喜欢的食物
    if(id.toString() == "minecraft:bee")
        {
            // 从全局食物列表中随机选择一个
            entity.persistentData.putString("like_food",Item.of(global.foodlist[Math.floor(randomInRange(0,global.foodlist.length - 1))]).getDisplayName().getString())
        }
})*/