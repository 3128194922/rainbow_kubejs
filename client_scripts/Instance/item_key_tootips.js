// priority: 1000
// ==========================================
// 悬赏物品坐标提示
// Bounty Item Coordinate Tooltips
// ==========================================
// 为 'bountiful:bounty' 物品添加高级提示
// 显示关联副本的坐标信息
// Adds advanced tooltips to 'bountiful:bounty' items
// Shows coordinate information for the associated dungeon instance

ItemEvents.tooltip(event => {
    event.addAdvanced("bountiful:bounty", (item, advanced, text) => {
        let nbt = item.nbt;
        if (!nbt) return;

        let instance = nbt.get("instance");
        if (!instance) return;
        if (instance.type != "instance") return;

        let x = instance.x;
        let z = instance.z;

        // 只显示坐标
        text.add(1, `§c[!] 在对应坐标 §eX: ${x}, Y: ~, Z: ${z} §6附近50格内`);
        text.add(2, `§a右键开启对应副本`);
    });
});