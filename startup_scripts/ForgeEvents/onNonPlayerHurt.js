// Priority: 5000
/**
 * 非玩家受伤事件
 * @param {Internal.LivingHurtEvent} event
 * @param {Internal.Entity} attacker
 * @param {Internal.Entity} victim
 * @param {Internal.Entity} source
 * @param {number} range_damage 远程伤害
 * @param {number} thrown_damage 投掷伤害
 * @param {number} soure_magic 魔法伤害
 * @param {number} boom_damage 爆炸伤害
 */
function onNonPlayerHurt(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage) {
    if (victim.isPlayer()) return;
    
}