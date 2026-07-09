// priority: 5000
/**
 * 玩家受伤后事件
 * @param {Internal.LivingDamageEvent} event
 * @param {Internal.Entity} attacker
 * @param {Internal.Entity} victim
 * @param {Internal.DamageSource} source
 * @param {string[]} range_damage 远程伤害
 * @param {string[]} thrown_damage 投掷伤害
 * @param {string[]} soure_magic 魔法伤害
 * @param {string[]} boom_damage 爆炸伤害
 */
function onPlayerDamaged(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage) {
    if (!victim.isPlayer()) return;

    // --- 大胃王饰品 ---
    // 消耗饱和度抵消伤害
    if (hasCurios(victim, "rainbow:big_stomach")) {
        if (victim.getFoodData().getSaturationLevel() > 0) {
            victim.getFoodData().setSaturation(
                Math.max(victim.getFoodData().getSaturationLevel() - event.getAmount(), 0)
            );
            event.setCanceled(true);
        }
    }
}
