// priority: 2000
// ==========================================
// 🔢 常量定义与初始化脚本
// ==========================================

global.foodlist = []; //食物列表初始化

// 遍历所有物品，将可食用物品加入 global.foodlist
Ingredient.all.itemIds.forEach(itemId => {
    const item = Item.of(itemId).item;
    if (item.foodProperties) {
        global.foodlist.push(itemId);
    }
});
console.log(`食物列表初始化：${global.foodlist.length}`)