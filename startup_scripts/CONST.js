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
const ClickAction = Java.loadClass('net.minecraft.world.inventory.ClickAction')
const EquipmentSlot = Java.loadClass('net.minecraft.world.entity.EquipmentSlot')
const SoundEvents = Java.loadClass('net.minecraft.sounds.SoundEvents')
const SoundSource = Java.loadClass('net.minecraft.sounds.SoundSource')
const AABB = Java.loadClass('net.minecraft.world.phys.AABB')
const ResourceLocation = Java.loadClass('net.minecraft.resources.ResourceLocation')
const BlockPos = Java.loadClass('net.minecraft.core.BlockPos')
const Direction = Java.loadClass('net.minecraft.core.Direction')
const Mob = Java.loadClass('net.minecraft.world.entity.monster.Monster');
const LivingEntity = Java.loadClass("net.minecraft.world.entity.LivingEntity")
const Difficulty = Java.loadClass("net.minecraft.world.Difficulty")
const Vec2 = Java.loadClass("net.minecraft.world.phys.Vec2")
const FlyingMob = Java.loadClass("net.minecraft.world.entity.FlyingMob")
const WaterAnimal = Java.loadClass("net.minecraft.world.entity.animal.WaterAnimal")
const WallClimberNavigation = Java.loadClass("net.minecraft.world.entity.ai.navigation.WallClimberNavigation")
const isClient = Platform.isClientEnvironment()
const Minecraft = isClient ? Java.loadClass("net.minecraft.client.Minecraft") : null
const Animal = Java.loadClass("net.minecraft.world.entity.animal.Animal")
// 肩甲骑乘强化使用 AbstractHorse 覆盖马、驴、骡及其马类变种。
const AbstractHorse = Java.loadClass("net.minecraft.world.entity.animal.horse.AbstractHorse")
const Villager = Java.loadClass("net.minecraft.world.entity.npc.Villager")
const Entitys = Java.loadClass('net.minecraft.world.entity.Entity')
const AttributeModifier = Java.loadClass('net.minecraft.world.entity.ai.attributes.AttributeModifier');
// 基因系统需要显式选择 AttributeModifier 的操作枚举重载。
const AttributeModifierOperation = Java.loadClass('net.minecraft.world.entity.ai.attributes.AttributeModifier$Operation');
const JavaString = Java.loadClass("java.lang.String");

const CleaverEntity = Java.tryLoadClass('net.yirmiri.dungeonsdelight.common.entity.misc.CleaverEntity')
const DDEntities = Java.tryLoadClass('net.yirmiri.dungeonsdelight.core.registry.DDEntities')
const DDSounds = Java.tryLoadClass('net.yirmiri.dungeonsdelight.core.registry.DDSounds')

const AbstractArrow = Java.loadClass('net.minecraft.world.entity.projectile.AbstractArrow')
const Player = Java.loadClass('net.minecraft.world.entity.player.Player')
const Stats = Java.loadClass('net.minecraft.stats.Stats')
const EnchantmentHelper = Java.loadClass('net.minecraft.world.item.enchantment.EnchantmentHelper')
const Enchantments = Java.loadClass('net.minecraft.world.item.enchantment.Enchantments')

// SoundEvents / SoundSource 已在上方集中声明，避免重复类加载。
// 伤害类型标签（用于判定抛射体伤害 IS_PROJECTILE 等）
const DamageTypeTags = Java.loadClass('net.minecraft.tags.DamageTypeTags')
// 自定义伤害类型（极限闪避围巾反击伤害等）：构造 DamageSource 使用
const DamageSource = Java.loadClass('net.minecraft.world.damagesource.DamageSource')
const Registries = Java.loadClass('net.minecraft.core.registries.Registries')
const ResourceKey = Java.loadClass('net.minecraft.resources.ResourceKey')
const LootParams = Java.loadClass('net.minecraft.world.level.storage.loot.LootParams')
const LootContextParams = Java.loadClass('net.minecraft.world.level.storage.loot.parameters.LootContextParams')
const LootContextParamSets = Java.loadClass('net.minecraft.world.level.storage.loot.parameters.LootContextParamSets')

const ItemTags = Java.loadClass('net.minecraft.tags.ItemTags')
const PotionBuilder = Java.loadClass("dev.latvian.mods.kubejs.misc.PotionBuilder")
const DeferredRegisterCreate = Java.loadClass("net.minecraftforge.registries.DeferredRegister")[
    "create(net.minecraftforge.registries.IForgeRegistry,java.lang.String)"
]
const EntityType = Java.loadClass('net.minecraft.world.entity.EntityType')

// 第一阶段规范整理：启动端类名统一使用无 $ 前缀，并集中在本文件加载。
const SlotAttribute = Java.tryLoadClass('top.theillusivec4.curios.api.SlotAttribute')
const CuriosApi = Java.tryLoadClass('top.theillusivec4.curios.api.CuriosApi')
const RangedAttribute = Java.loadClass('net.minecraft.world.entity.ai.attributes.RangedAttribute')
let _DefaultAttributes = null
const KeyMapping = isClient ? Java.tryLoadClass('net.minecraft.client.KeyMapping') : null
const MATH_PI = 3.141592653589793

// DefaultAttributes 会在类初始化时读取实体属性注册表，必须等 Forge 属性阶段完成后再加载。
function getDefaultAttributesClass() {
    try {
        if (_DefaultAttributes == null) {
            _DefaultAttributes = Java.loadClass('net.minecraft.world.entity.ai.attributes.DefaultAttributes')
        }
        return _DefaultAttributes
    } catch (e) {
        console.log('DefaultAttributes 懒加载失败: ' + e)
        return null
    }
}

// Tide 运行时类统一由启动常量文件懒加载，避免在 startup 阶段提前触发 mod 注册流程。
function getTideClass(name) {
    try {
        if (global._tideClasses == null) global._tideClasses = {};
        if (global._tideClasses[name] != null) return global._tideClasses[name];
        let cls = Java.tryLoadClass(name);
        global._tideClasses[name] = cls;
        if (cls == null) console.log("getTideClass 未加载到类: " + name);
        return cls;
    } catch (e) {
        console.log("getTideClass 加载失败(" + name + "): " + e);
        return null;
    }
}

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

// FarmersDelight 背刺附魔判定类（静态方法 isLookingBehindTarget 判断攻击者是否在目标背后）
const BackstabbingEnchantment = Java.tryLoadClass('vectorwing.farmersdelight.common.item.enchantment.BackstabbingEnchantment')

// Dyeing mod
const DyeingMod = Java.loadClass('com.example.dyeing.DyeingMod')
const PaintData = Java.loadClass('com.example.dyeing.data.PaintData')

// ParticleJS 通用文本粒子已迁移到 startup_scripts/damage_indicators/main.js；不再加载已删除的旧文本类。
// MysticArtifacts 武士刀格挡粒子读取的完美格挡窗口配置；粒子脚本会在类缺失时回退默认值。
const MysticArtifactsConfig = Java.tryLoadClass('com.uniye.mysticartifacts.Config')

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
