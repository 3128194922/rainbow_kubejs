// priority: 2000
global.foodlist = []; //食物列表初始化
Ingredient.all.itemIds.forEach(itemId => {
    const item = Item.of(itemId).item;
    if (item.foodProperties) {
        global.foodlist.push(itemId);
    }
});
console.log(`食物列表初始化：${global.foodlist.length}`)