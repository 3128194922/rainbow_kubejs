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

}
