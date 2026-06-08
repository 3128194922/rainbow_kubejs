// priority: 20000
// ==========================================
// 全局常量定义
// Global Constants Definition
// ==========================================

const Tiers = Java.loadClass("net.minecraft.world.item.Tiers")
const UUID = Java.loadClass("java.util.UUID");
const ItemStack = Java.loadClass("net.minecraft.world.item.ItemStack")
const Vec3 = Java.loadClass('net.minecraft.world.phys.Vec3');
const ForgeRegistries = Java.loadClass('net.minecraftforge.registries.ForgeRegistries')
const InteractionHand = Java.loadClass('net.minecraft.world.InteractionHand')
const InteractionResult = Java.loadClass('net.minecraft.world.InteractionResult')
const EquipmentSlot = Java.loadClass('net.minecraft.world.entity.EquipmentSlot')
const SoundEvents = Java.loadClass('net.minecraft.sounds.SoundEvents')
const SoundSource = Java.loadClass('net.minecraft.sounds.SoundSource')
//const LivingEntity = Java.loadClass('net.minecraft.world.entity.LivingEntity')
//const Player = Java.loadClass('net.minecraft.world.entity.player.Player')
const AABB = Java.loadClass('net.minecraft.world.phys.AABB')
const ResourceLocation = Java.loadClass('net.minecraft.resources.ResourceLocation')
const BlockPos = Java.loadClass('net.minecraft.core.BlockPos')
const Direction = Java.loadClass('net.minecraft.core.Direction')
const Mob = Java.loadClass('net.minecraft.world.entity.monster.Monster');
const LivingEntity = Java.loadClass("net.minecraft.world.entity.LivingEntity")
const Difficulty = Java.loadClass("net.minecraft.world.Difficulty")
//const Player = Java.loadClass("net.minecraft.world.entity.player.Player")
const Vec2 = Java.loadClass("net.minecraft.world.phys.Vec2")
const FlyingMob = Java.loadClass("net.minecraft.world.entity.FlyingMob")
const WaterAnimal = Java.loadClass("net.minecraft.world.entity.animal.WaterAnimal")
const WallClimberNavigation = Java.loadClass("net.minecraft.world.entity.ai.navigation.WallClimberNavigation")
const isClient = Platform.isClientEnvironment()
const Minecraft = isClient ? Java.loadClass("net.minecraft.client.Minecraft") : null
const $LivingEntity = Java.loadClass("net.minecraft.world.entity.LivingEntity")
const $Animal = Java.loadClass("net.minecraft.world.entity.animal.Animal")
const $Player = Java.loadClass("net.minecraft.world.entity.player.Player")
const $Villager = Java.loadClass("net.minecraft.world.entity.npc.Villager")


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
  

//获取全部附魔
global.allEnchantments = []

ForgeRegistries.ENCHANTMENTS.getKeys().forEach(id => {
  global.allEnchantments.push(new ResourceLocation(id.toString()))
})