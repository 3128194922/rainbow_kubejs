// priority: 4000
// ==========================================
// Effectification 兼容效果
// ==========================================
// 将原版抗火效果替换为带有 moreattribute 火焰免疫属性的 Rainbow Power 效果，
// 并把原版抗性效果的每级减伤从 20% 调整为 10%。

const EFFECTIFICATION_FIRE_RESISTANCE_ID = "rainbow:fire_resistance";
const EFFECTIFICATION_RESISTANCE_EFFECT_ID = "rainbow:resistance";
const EFFECTIFICATION_STRENGTH_EFFECT_ID = "rainbow:strength";
const EFFECTIFICATION_STRENGTH_ATTRIBUTE_MODIFIER_ID = "effectification_strength";
const EFFECTIFICATION_RESISTANCE_PER_LEVEL = 0.1;
const EFFECTIFICATION_STRENGTH_ATTACK_SPEED_THRESHOLD = 2.4;
const EFFECTIFICATION_STRENGTH_FAST_DAMAGE_PER_LEVEL = 1.0;
const EFFECTIFICATION_STRENGTH_SLOW_DAMAGE_PER_LEVEL = 3.0;

// 注册自定义抗火效果；图标资源位于 rainbow:textures/mob_effect/fire_resistance.png。
StartupEvents.registry("mob_effect", event => {
    try {
        event.create(EFFECTIFICATION_FIRE_RESISTANCE_ID)
            .beneficial()
            .color(0xE49A3A)
            .modifyAttribute(
                "moreattribute:fire_immunity",
                "effectification_fire_resistance",
                0.8,
                "addition"
            );
    } catch (e) {
        console.log("Effectification 自定义抗火效果注册失败：" + e);
    }
});

// 注册自定义抗性效果；原版效果会通过 effectification 配置替换为此效果。
// 图标内容采用 Minecraft 原版 resistance 图标，资源位于 rainbow:textures/mob_effect/resistance.png。
StartupEvents.registry("mob_effect", event => {
    try {
        event.create(EFFECTIFICATION_RESISTANCE_EFFECT_ID)
            .beneficial()
            .color(0x9146F0);
    } catch (e) {
        console.log("Effectification 自定义抗性效果注册失败：" + e);
    }
});

// 自定义抗性效果在 LivingHurtEvent 中直接按等级减少伤害，避免原版 20%/级逻辑参与计算。
ForgeEvents.onEvent("net.minecraftforge.event.entity.living.LivingHurtEvent", event => {
    try {
        let entity = event.getEntity();
        if (entity == null || entity.level.isClientSide()) return;

        let source = event.getSource();
        if (source == null || source.is(DamageTypeTags.BYPASSES_RESISTANCE)) return;

        let resistance = entity.getEffect(EFFECTIFICATION_RESISTANCE_EFFECT_ID);
        if (resistance == null) return;

        let level = resistance.getAmplifier() + 1;
        if (level <= 0) return;

        let currentAmount = event.getAmount();
        if (!(currentAmount > 0)) return;

        let targetReduction = Math.min(level * EFFECTIFICATION_RESISTANCE_PER_LEVEL, 1.0);
        event.setAmount(currentAmount * (1.0 - targetReduction));
    } catch (e) {
        console.log("Effectification 自定义抗性修正失败：" + e);
    }
});

// 注册自定义力量效果；原版效果会通过 effectification 配置替换为此效果。
// 图标内容采用 Minecraft 原版 strength 图标，资源位于 rainbow:textures/mob_effect/strength.png。
// 每 tick 动态刷新攻击伤害修饰符，使攻速变化立即切换 +1/+3 分支。
StartupEvents.registry("mob_effect", event => {
    try {
        event.create(EFFECTIFICATION_STRENGTH_EFFECT_ID)
            .beneficial()
            .color(0x932423)
            .effectTick((entity, amplifier) => {
                try {
                    if (entity == null || !entity.isPlayer()) return;

                    let attackSpeedAttribute = entity.getAttribute("generic.attack_speed");
                    if (attackSpeedAttribute == null) {
                        console.log("Effectification 无法读取玩家攻速属性，跳过力量属性刷新。");
                        return;
                    }

                    let attackSpeed = attackSpeedAttribute.getValue();
                    let level = amplifier + 1;
                    if (level <= 0) return;

                    let damagePerLevel = attackSpeed > EFFECTIFICATION_STRENGTH_ATTACK_SPEED_THRESHOLD
                        ? EFFECTIFICATION_STRENGTH_FAST_DAMAGE_PER_LEVEL
                        : EFFECTIFICATION_STRENGTH_SLOW_DAMAGE_PER_LEVEL;
                    entity.modifyAttribute(
                        "minecraft:generic.attack_damage",
                        EFFECTIFICATION_STRENGTH_ATTRIBUTE_MODIFIER_ID,
                        damagePerLevel * level,
                        "addition"
                    );
                } catch (tickError) {
                    console.log("Effectification 力量动态属性刷新失败：" + tickError);
                }
            });
    } catch (e) {
        console.log("Effectification 自定义力量效果注册失败：" + e);
    }
});

// 力量效果移除时清理动态攻击伤害修饰符，避免效果结束后属性残留。
ForgeEvents.onEvent("net.minecraftforge.event.entity.living.MobEffectEvent$Remove", event => {
    try {
        let entity = event.getEntity();
        if (entity == null || !entity.isPlayer()) return;

        let effectInstance = event.getEffectInstance();
        if (effectInstance == null) return;
        if (String(effectInstance.getEffect().getDescriptionId()) != "effect.rainbow.strength") return;

        entity.removeAttribute(
            "minecraft:generic.attack_damage",
            EFFECTIFICATION_STRENGTH_ATTRIBUTE_MODIFIER_ID
        );
    } catch (e) {
        console.log("Effectification 力量动态属性清理失败：" + e);
    }
});
