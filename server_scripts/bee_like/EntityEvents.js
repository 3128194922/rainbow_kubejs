//实体生成事件
EntityEvents.spawned(event => {
    let entity = event.getEntity();
    let level = event.getLevel();
    if (level.isClientSide()) return;
    if (!entity) return;

    let id = entity.getEncodeId();
    if (id == null) return;

    if(id.toString() == "minecraft:bee")
        {
            entity.persistentData.putString("like_food",Item.of(global.foodlist[Math.floor(randomInRange(0,global.foodlist.length - 1))]).getDisplayName().getString())
        }
})