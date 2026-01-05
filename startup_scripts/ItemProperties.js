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
    // 棒球棍：根据 NBT 中的 poweroff 值改变模型
    event.register("rainbow:baseball_bat", "poweroff", (itemStack, level, entity, seed) => {
        return itemStack.nbt.getDouble("poweroff") == 1.0 ? 1.0 : 0.0;
    });
});