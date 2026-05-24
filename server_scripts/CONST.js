// priority: 2000
// ==========================================
// 🔢 常量定义与初始化脚本
// ==========================================

const Integer = Java.loadClass("java.lang.Integer");
const ForgeRegistries = Java.loadClass("net.minecraftforge.registries.ForgeRegistries");
const Vec3 = Java.loadClass("net.minecraft.world.phys.Vec3");
const FlameProjectileEntity = Java.loadClass("dev.hexnowloading.dungeonnowloading.entity.projectile.FlameProjectileEntity");
const DNLEntityTypes = Java.loadClass("dev.hexnowloading.dungeonnowloading.registry.DNLEntityTypes");
//const ResourceLocation = Java.loadClass('net.minecraft.resources.ResourceLocation')
const BackpackHelper = Java.loadClass('com.mrcrayfish.backpacked.BackpackHelper')
const ResourceLocation = Java.loadClass('net.minecraft.resources.ResourceLocation')
const ItemStack = Java.loadClass('net.minecraft.world.item.ItemStack')
const ItemEntity = Java.loadClass('net.minecraft.world.entity.item.ItemEntity')
const Registries = Java.loadClass("net.minecraft.core.registries.Registries");
const Mob = Java.loadClass('net.minecraft.world.entity.Mob')


global.foodlist = []; //食物列表初始化
global.swordlist = []; //剑列表初始化

// 物品同化配置
/*global.UNIFIED_ITEMS = [
    {
        tag: 'rainbow:pomegranate',
        items: ['collectorsreap:pomegranate', 'fruitfulfun:pomegranate']
    }
    // 可以在这里继续添加其他需要同化的物品组
];*/

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

global.attributes = []; //玩家属性大全

let attributes = ForgeRegistries.ATTRIBUTES.getValues();

attributes.forEach(attr=>{
    let key = ForgeRegistries.ATTRIBUTES.getKey(attr);
    if (key) {
        global.attributes.push(key.toString());
    }
})
console.log(`属性列表初始化：${global.attributes.length}`)