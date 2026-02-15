// priority: 20000
// ==========================================
// 全局常量定义
// Global Constants Definition
// ==========================================

const Tiers = Java.loadClass("net.minecraft.world.item.Tiers")
const UUID = Java.loadClass("java.util.UUID");
const ItemStack = Java.loadClass("net.minecraft.world.item.ItemStack")
const Vec3 = Java.loadClass('net.minecraft.world.phys.Vec3');

global.CURIONUMBER = 4
global.CURSES = [
    "minecraft:binding_curse",
    "minecraft:vanishing_curse",
    "mynethersdelight:poaching",
    "allurement:ascension_curse",
    "allurement:fleeting_curse",
    "domesticationinnovation:undead_curse",
    "domesticationinnovation:infamy_curse",
    "domesticationinnovation:blight_curse",
    "domesticationinnovation:immaturity_curse",
    "imbuence:curse_of_the_dragon_palace"
]
global.NEWFILENUMBER = 3;
global.MAX_STORAGE = 20; // 限制最多收容数量
global.biomelist = [];

//超构建产出概率
global.SUPER_MECHAISM = Math.random().toFixed(2);
console.log(`超构建概率：${global.SUPER_MECHAISM}`)

global.COLORS = {
    白: [1.00, 1.00, 1.00],
    红: [1.00, 0.25, 0.25],
    橙: [1.00, 0.63, 0.25],
    黄: [1.00, 1.00, 0.25],
    绿: [0.25, 1.00, 0.25],
    蓝: [0.25, 1.00, 1.00],
    靛: [0.25, 0.25, 1.00],
    紫: [1.00, 0.25, 1.00],
    黑: [0.06, 0.06, 0.06]
  }
  