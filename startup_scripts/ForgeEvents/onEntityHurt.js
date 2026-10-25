// priority: 5000
/**
 * 玩家受伤事件
 * @param {Internal.LivingHurtEvent} event
 * @param {Internal.Entity} attacker
 * @param {Internal.Entity} victim
 * @param {Internal.Entity} source
 * @param {string[]} range_damage 远程伤害
 * @param {string[]} thrown_damage 投掷伤害
 * @param {string[]} soure_magic 魔法伤害
 * @param {string[]} boom_damage 爆炸伤害
 */
function onEntityHurt(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage, context) {
    // --- 神射手护符：弹幕爆头后按射手距离计算伤害倍率（实现见 sharpshooter_charm/main.js） ---
    applySharpshooterDamage(event, attacker, victim, source, context);

    // 化学反应：同时存在至少两种指定DOT时，按总等级放大对应DOT伤害。
    let dotMultiplier = rebalanceDotMultiplier(victim, source, attacker);
    if (dotMultiplier > 1) event.setAmount(event.getAmount() * dotMultiplier);

    // --- 划痕之手（hand_of_scratches）：穿戴时，攻击额外对目标造成其最大生命 5% 的额外伤害 ---
    // 穿戴者为攻击者（玩家），额外伤害叠加到本次伤害中，伤害来源仍为攻击者（玩家）
    if (hasContextCurio(context, "attacker", attacker, "rainbow:hand_of_scratches") && attacker && attacker.isPlayer() && victim instanceof LivingEntity && victim.isAlive()) {
        // 原版物品冷却：触发间隔 5s（100 tick），冷却中不额外触发
        if (attacker.cooldowns.isOnCooldown("rainbow:hand_of_scratches")) return;
        attacker.cooldowns.addCooldown("rainbow:hand_of_scratches", 100);
        var extraDamage = victim.getMaxHealth() * 0.05;
        event.setAmount(event.getAmount() + extraDamage);
    }
}
