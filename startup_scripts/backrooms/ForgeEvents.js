// priority: 0
// 玩家放置方块事件
ForgeEvents.onEvent("net.minecraftforge.event.level.BlockEvent$EntityPlaceEvent", event => {
    let block = event.getPlacedBlock()
    let player = event.getEntity();
    // 禁止在 backroom 维度放置方块
    if (player.level.name.getString() === "backroom:backroom") {
        event.setCanceled(true);
    }
})

// 玩家破坏方块速度事件
ForgeEvents.onEvent("net.minecraftforge.event.entity.player.PlayerEvent$BreakSpeed", event => {
    // 禁止在 backroom 维度挖掘
    if (entity.level.name.getString() === "backroom:backroom") {
        event.newSpeed = 0 * event.originalSpeed;
    }
})