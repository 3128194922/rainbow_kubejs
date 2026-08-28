// priority: 0

// 实体生成事件
EntityEvents.spawned(event => {
    let entity = event.getEntity();
    let level = event.getLevel();
    // 禁止生成的实体列表
    let inControl = ["species:treeper"]
    if (level.isClientSide()) return;
    if (!entity) return;

    let id = entity.getEncodeId();
    if (id == null) return;

    // --- 禁止特定实体生成 ---
    if (inControl.indexOf(id.toString()) != -1) 
        {
            let pos = entity.getBlock().pos;   // 实体位置
            event.cancel();                   // 取消原始实体生成
        }
});
