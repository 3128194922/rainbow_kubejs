// priority: 2000
// ==========================================
// 🔢 常量定义与初始化脚本
// ==========================================

global.foodlist = []; //食物列表初始化
global.swordlist = []; //剑列表初始化

// 遍历所有物品，将可食用物品加入 global.foodlist
Ingredient.all.itemIds.forEach(itemId => {
    const item = Item.of(itemId).item;
    if (item.foodProperties) {
        global.foodlist.push(itemId);
    }
    // 检查是否为剑（通过类判断）
    if (item instanceof Java.loadClass("net.minecraft.world.item.SwordItem")) {
        global.swordlist.push(itemId);
    }
});
console.log(`食物列表初始化：${global.foodlist.length}`)
console.log(`剑列表初始化：${global.swordlist.length}`)