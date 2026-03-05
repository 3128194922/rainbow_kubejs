// Priority: 5000
/**
 * 非玩家受伤前事件
 * @param {Internal.LivingAttackEvent} event
 * @param {Internal.Entity} attacker
 * @param {Internal.Entity} victim
 * @param {Internal.Entity} source
 * @param {number} range_damage 远程伤害
 * @param {number} thrown_damage 投掷伤害
 * @param {number} soure_magic 魔法伤害
 * @param {number} boom_damage 爆炸伤害
 */
function onBeforeNonEntityHurt(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage){
    if(victim.hasEffect("rainbow:void"))
        {
            event.setCanceled(true);
        }
}