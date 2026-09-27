// priority: 0
// ==========================================
// 物品模型属性注册
// Item Model Properties Registration
// ==========================================
// 注册物品的模型属性，允许在客户端根据 NBT 数据改变物品模型
// Registers item model properties, allowing item models to change on the client based on NBT data

// 注册物品模型属性，用于在客户端渲染时改变物品模型
ItemEvents.modelProperties(event => {
    // 泰拉刃：根据 NBT 中的 power 值改变模型
    event.register("rainbow:terasword", "powers", (itemStack, level, entity, seed) => {
        return itemStack.nbt.getDouble("power") >= 1.0 ? 1.0 : 0.0;
    });
    // 先驱者动力剑：根据分解立场截止时间切换模型，过期状态不显示立场贴图。
    event.register("rainbow:power_sword", "decomposition_field", (itemStack, level, entity, seed) => {
        try {
            let powerSwordTag = itemStack.getNbt();
            if (powerSwordTag == null || level == null) return 0.0;
            return powerSwordTag.getBoolean("DecompositionField")
                && powerSwordTag.getLong("DecompositionFieldUntil") > level.getTime() ? 1.0 : 0.0;
        }
        catch (e) {
            console.log("先驱者动力剑模型属性读取出错：");
            console.log(e);
            return 0.0;
        }
    });

    // 小嘀嗒：根据 NBT 中的 Energy 值改变模型 (0-100 -> 0.0-1.0)
    event.register("rainbow:short_core", "energy", (itemStack, level, entity, seed) => {
        return (itemStack.nbt ? itemStack.nbt.getFloat("Energy") : 0.0) / 100.0;
    });

    // 装填核心：能量充能机制已移除，不再注册 energy 模型属性（模型恒为基础款）

    // 狂怒面具：根据 NBT 中的 Energy 值改变模型 (0-100 -> 0.0-1.0)
    event.register("rainbow:fury_mask", "energy", (itemStack, level, entity, seed) => {
        return (itemStack.nbt ? itemStack.nbt.getFloat("Energy") : 0.0) / 100.0;
    });

    //觉之瞳
    event.register("rainbow:eye_of_satori", "is_open", (itemStack, level, entity, seed) => {
        if(!itemStack.nbt)
            {
                return 1.0;
            }
        return itemStack.nbt.getBoolean("is_open") ? 1.0 : 0.0;
    });

    // 寻友护符：在线玩家 > 1 时进入激活状态，切换为已激活图标
    event.register("rainbow:player_doll", "active", (itemStack, level, entity, seed) => {
        return itemStack.nbt && itemStack.nbt.getBoolean("active") ? 1.0 : 0.0;
    });
});
