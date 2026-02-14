// Priority: 5000
/**
 * 非玩家受伤前事件
 * @param {Internal.LivingHurtEvent} event
 * @param {Internal.Entity} attacker
 * @param {Internal.Entity} victim
 * @param {Internal.Entity} source
 * @param {number} range_damage 远程伤害
 * @param {number} thrown_damage 投掷伤害
 * @param {number} soure_magic 魔法伤害
 * @param {number} boom_damage 爆炸伤害
 */
function onBeforeNonPlayerHurt(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage) {
    if (victim.isPlayer()) return;

        
    // --- 防化服套装效果 ---
    if (victim.getItemBySlot("head").id == 'alexscaves:hazmat_mask'
        && victim.getItemBySlot("chest").id == 'alexscaves:hazmat_chestplate'
        && victim.getItemBySlot("legs").id == 'alexscaves:hazmat_leggings'
        && victim.getItemBySlot("feet").id == 'alexscaves:hazmat_boots') {
        if (source.getType() == "poison_cloud" || source.getType() == "wither") {
            event.setCanceled(true)
        }
    }

    // --- 大胃王饰品 ---
    // 消耗饱和度抵消伤害
    if (hasCurios(victim, "rainbow:big_stomach")) {
        if (victim.getFoodData().getSaturationLevel() > 0) {
            victim.getFoodData().setSaturation(
                Math.max(victim.getFoodData().getSaturationLevel() - event.getAmount(), 0)
            );
            event.setAmount(0);
        }
    }

    // --- 暴食护符（免饥饿伤害） ---
    if (source.getType() == "starve" && hasCurios(victim, "rainbow:gluttony_charm")) {
        event.setCanceled(true);
    }
}