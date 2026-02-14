// priority: 500
// ==========================================
// 自定义火焰附魔逻辑
// Custom Fire Enchantment Logic
// ==========================================
// 实现生灵火和末影火的附魔效果，攻击时给予目标特殊的火焰效果
// Implements custom fire enchantment effects (Living Fire, Ender Fire), applying special fire effects to targets on attack

let $EnchantmentHelper = Java.loadClass("net.minecraft.world.item.enchantment.EnchantmentHelper");
let FireManager = Java.loadClass("it.crystalnest.soul_fire_d.api.FireManager");
let ResourceLocation = Java.loadClass("net.minecraft.resources.ResourceLocation");
let ForgeRegistries = Java.loadClass("net.minecraftforge.registries.ForgeRegistries");

// =======================
// 工具函数
// =======================

// 点燃实体（自定义火）
function igniteEntity(entity, fireType, durationSeconds) {
    if (!entity || !fireType || durationSeconds <= 0) return;
    FireManager.setOnFire(entity, durationSeconds, new ResourceLocation(fireType));
}

// 获取附魔对象
function getEnch(id) {
    return ForgeRegistries.ENCHANTMENTS.getValue(new ResourceLocation(id));
}

// 获取物品附魔等级
function getLevel(id, item) {
    if (!item) return 0;
    let ench = getEnch(id);
    if (!ench) return 0;
    return $EnchantmentHelper.getItemEnchantmentLevel(ench, item);
}

// =======================
// 近战附魔触发
// =======================
ForgeEvents.onEvent("net.minecraftforge.event.entity.player.AttackEntityEvent", event => {
    let player = event.entity;
    let target = event.target;
    if (!player || !target || !target.isLiving()) return;

    let stack = player.getMainHandItem();
    if (!stack) return;

    // 生灵火附加
    let livingLvl = getLevel("rainbow:living_fire_aspect", stack);
    if (livingLvl > 0) igniteEntity(target, "dungeonsdelight:living", 4 + 2 * (livingLvl - 1));

    // 末影火附加
    let enderLvl = getLevel("rainbow:ender_fire_aspect", stack);
    if (enderLvl > 0) igniteEntity(target, "endergetic:ender", 4 + 2 * (enderLvl - 1));
});