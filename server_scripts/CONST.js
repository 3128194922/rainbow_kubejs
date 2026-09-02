// priority: 2000
// ==========================================
// 🔢 常量定义与初始化脚本
// ==========================================

const Integer = Java.loadClass("java.lang.Integer");
const ForgeRegistries = Java.loadClass("net.minecraftforge.registries.ForgeRegistries");
const Vec3 = Java.loadClass("net.minecraft.world.phys.Vec3");
//const FlameProjectileEntity = Java.loadClass("dev.hexnowloading.dungeonnowloading.entity.projectile.FlameProjectileEntity");
//const DNLEntityTypes = Java.loadClass("dev.hexnowloading.dungeonnowloading.registry.DNLEntityTypes");
//const BackpackHelper = Java.loadClass('com.mrcrayfish.backpacked.BackpackHelper')
const ResourceLocation = Java.loadClass('net.minecraft.resources.ResourceLocation')
const ItemStack = Java.loadClass('net.minecraft.world.item.ItemStack')
const ItemEntity = Java.loadClass('net.minecraft.world.entity.item.ItemEntity')
const Registries = Java.loadClass("net.minecraft.core.registries.Registries");
const Mob = Java.loadClass('net.minecraft.world.entity.Mob')
const AABB = Java.loadClass('net.minecraft.world.phys.AABB')
const MobEffects = Java.loadClass('net.minecraft.world.effect.MobEffects')
const InteractionHand = Java.loadClass('net.minecraft.world.InteractionHand')
const TamableAnimal = Java.loadClass('net.minecraft.world.entity.TamableAnimal');
const NearestAttackableTargetGoal = Java.loadClass("net.minecraft.world.entity.ai.goal.target.NearestAttackableTargetGoal")
const SpiderTargetGoal = Java.loadClass("net.minecraft.world.entity.monster.Spider$SpiderTargetGoal")
const HurtByTargetGoal = Java.loadClass("net.minecraft.world.entity.ai.goal.target.HurtByTargetGoal")
const MeleeAttackGoal = Java.loadClass("net.minecraft.world.entity.ai.goal.MeleeAttackGoal")
const PathfinderMob = Java.loadClass("net.minecraft.world.entity.PathfinderMob")
const IronGolem = Java.loadClass("net.minecraft.world.entity.animal.IronGolem")
const LivingEntity = Java.loadClass("net.minecraft.world.entity.LivingEntity")
const CustomGoal = Java.loadClass("net.liopyu.entityjs.util.ai.CustomGoal")
const FlyingMob = Java.loadClass("net.minecraft.world.entity.FlyingMob")
const ClipContext = Java.loadClass("net.minecraft.world.level.ClipContext")
const HitResultType = Java.loadClass("net.minecraft.world.phys.HitResult$Type")
const Pickarang = Java.loadClass("org.violetmoon.quark.content.tools.entity.rang.Pickarang");
const ServerPlayer = Java.loadClass("net.minecraft.server.level.ServerPlayer");
const PickarangModule = Java.loadClass("org.violetmoon.quark.content.tools.module.PickarangModule");

const ServerLevel = Java.loadClass('net.minecraft.server.level.ServerLevel')
const Attributes = Java.loadClass('net.minecraft.world.entity.ai.attributes.Attributes')
const TagKey = Java.loadClass('net.minecraft.tags.TagKey')
const Registry = Java.loadClass('net.minecraft.core.Registry')
const SpeciesDamageTypes = Java.loadClass('com.ninni.species.registry.SpeciesDamageTypes')
const SpeciesParticles = Java.loadClass('com.ninni.species.registry.SpeciesParticles')
const SpeciesSoundEvents = Java.loadClass('com.ninni.species.registry.SpeciesSoundEvents')
const SoundSource = Java.loadClass('net.minecraft.sounds.SoundSource')
const Monster = Java.loadClass('net.minecraft.world.entity.monster.Monster')
const DeathLaserBeam = Java.loadClass('com.github.L_Ender.cataclysm.entity.projectile.Death_Laser_Beam_Entity')
const RemovalReason = Java.loadClass('net.minecraft.world.entity.Entity$RemovalReason')
const DEFAULT_IGNORE_TAG = TagKey.create(Registries.ENTITY_TYPE, new ResourceLocation("species", "cant_be_damaged_by_dummy"))

const Spectre = Java.loadClass('com.ninni.species.server.entity.mob.update_3.Spectre');
const BlockPos = Java.loadClass('net.minecraft.core.BlockPos');
const DoubleArgumentType = Java.loadClass('com.mojang.brigadier.arguments.DoubleArgumentType')
const Component = Java.loadClass('net.minecraft.network.chat.Component')
const CompoundTag = Java.loadClass('net.minecraft.nbt.CompoundTag')
const ListTag = Java.loadClass('net.minecraft.nbt.ListTag')
const Direction = Java.loadClass('net.minecraft.core.Direction')
const DirectionAxisDirection = Java.loadClass('net.minecraft.core.Direction$AxisDirection')
const DirectionAxis = Java.loadClass('net.minecraft.core.Direction$Axis')
// CBC 瞄准: 炮塔基座方块状态属性 (VERTICAL_DIRECTION: down=正立/up=倒置)
const BlockStateProperties = Java.loadClass('net.minecraft.world.level.block.state.properties.BlockStateProperties')

// Dyeing mod: UV/油漆/公告板/屏幕覆盖层等实体染色数据入口（服务端）
const DyeingMod = Java.loadClass('com.example.dyeing.DyeingMod')
const BillboardSavedData = Java.loadClass('com.example.dyeing.data.BillboardSavedData')

// 通灵卷轴技能: 可投掷物判定类（弹射体类层次）
const ThrowableItemProjectile = Java.loadClass('net.minecraft.world.entity.projectile.ThrowableItemProjectile')
const AbstractArrow = Java.loadClass('net.minecraft.world.entity.projectile.AbstractArrow')
const Projectile = Java.loadClass('net.minecraft.world.entity.projectile.Projectile')

// 第一阶段规范整理：服务端所有 Java 类统一在本文件加载，并使用无 $ 前缀变量。
const SwordItem = Java.loadClass('net.minecraft.world.item.SwordItem')
const EnchantmentHelper = Java.loadClass('net.minecraft.world.item.enchantment.EnchantmentHelper')
const UUID = Java.loadClass('java.util.UUID')
const ResourceKey = Java.loadClass('net.minecraft.resources.ResourceKey')
const Player = Java.loadClass('net.minecraft.world.entity.player.Player')
const CuriosApi = Java.loadClass('top.theillusivec4.curios.api.CuriosApi')
const FreezableMob = Java.loadClass('com.li64.tide.data.FreezableMob')
const DispenserBlock = Java.loadClass('net.minecraft.world.level.block.DispenserBlock')
const MobCategory = Java.loadClass('net.minecraft.world.entity.MobCategory')
const SimpleMenuProvider = Java.loadClass('net.minecraft.world.SimpleMenuProvider')
const CraftingMenu = Java.loadClass('net.minecraft.world.inventory.CraftingMenu')
const ChestMenu = Java.loadClass('net.minecraft.world.inventory.ChestMenu')
const Optional = Java.loadClass('java.util.Optional')
const JavaBoolean = Java.loadClass('java.lang.Boolean')
const AttributeModifier = Java.loadClass('net.minecraft.world.entity.ai.attributes.AttributeModifier')
const AttributeModifierOperation = Java.loadClass('net.minecraft.world.entity.ai.attributes.AttributeModifier$Operation')
const JavaString = Java.loadClass('java.lang.String')
const MobEffectInstance = Java.loadClass('net.minecraft.world.effect.MobEffectInstance')
const FluidTags = Java.loadClass('net.minecraft.tags.FluidTags')
const BuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
const MATH_PI = 3.141592653589793

// 可选模组类：用 tryLoadClass 保持原脚本的缺失模组容错行为。
const CombatRoll = Java.tryLoadClass('net.combatroll.CombatRoll')
const CombatRollEnchantments = Java.tryLoadClass('net.combatroll.api.Enchantments_CombatRoll')
const FieldGuideProgressManager = Java.tryLoadClass('com.evandev.fieldguide.server.progress.FieldGuideProgressManager')
const FieldGuidePlayerProgress = Java.tryLoadClass('com.evandev.fieldguide.server.progress.PlayerFieldGuideProgress')
const FieldGuideServerManager = Java.tryLoadClass('com.evandev.fieldguide.server.ServerFieldGuideManager')
const TideUtils = Java.tryLoadClass('com.li64.tide.util.TideUtils')
const ThermometerItem = Java.tryLoadClass('galena.oreganized.content.item.ThermometerItem')
const FireManager = Java.loadClass('it.crystalnest.soul_fire_d.api.FireManager')
const Fire = Java.loadClass('it.crystalnest.soul_fire_d.api.Fire')
const BiConsumer = Java.loadClass('java.util.function.BiConsumer')
const FireTyped = Java.loadClass('it.crystalnest.soul_fire_d.api.type.FireTyped')
const CombatRollResourceLocation = ResourceLocation
const CombatRollEnchantmentHelper = EnchantmentHelper
const CombatRollAttributes = Attributes
const CombatRollLivingEntity = LivingEntity

// 先驱者系统使用的 Forge/Cataclysm 类集中加载，避免在功能脚本内重复加载。
const LivingTickEvent = Java.loadClass('net.minecraftforge.event.entity.living.LivingEvent$LivingTickEvent')
const LivingDamageEvent = Java.loadClass('net.minecraftforge.event.entity.living.LivingDamageEvent')
const WitherHomingMissile = Java.loadClass('com.github.L_Ender.cataclysm.entity.projectile.Wither_Homing_Missile_Entity')
const IAnimatedEntity = Java.loadClass('com.github.L_Ender.lionfishapi.server.animation.IAnimatedEntity')
const AnimationHandler = Java.loadClass('com.github.L_Ender.lionfishapi.server.animation.AnimationHandler')
const TheHarbinger = Java.loadClass('com.github.L_Ender.cataclysm.entity.AnimationMonster.BossMonsters.The_Harbinger_Entity')
const ModEntities = Java.loadClass('com.github.L_Ender.cataclysm.init.ModEntities')
const WitherMissile = Java.loadClass('com.github.L_Ender.cataclysm.entity.projectile.Wither_Missile_Entity')


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
    if (item instanceof SwordItem) {
        global.swordlist.push(itemId);
    }
});
console.log(`食物列表初始化：${global.foodlist.length}`)
console.log(`剑列表初始化：${global.swordlist.length}`)

global.attributes = []; //玩家属性大全

// 属性注册表仅读取，不重新绑定，使用 const 符合项目变量规范。
const attributes = ForgeRegistries.ATTRIBUTES.getValues();

attributes.forEach(attr=>{
    let key = ForgeRegistries.ATTRIBUTES.getKey(attr);
    if (key) {
        global.attributes.push(key.toString());
    }
})
console.log(`属性列表初始化：${global.attributes.length}`)
