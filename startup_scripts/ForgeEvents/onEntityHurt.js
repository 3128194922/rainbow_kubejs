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
function onEntityHurt(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage) {
    // --- 神射手护符（距离越远伤害越高，每格+10%，最高+200%） ---
    if (attacker && hasCurios(attacker, "rainbow:sharpshooter_charm")) {
        if (victim instanceof LivingEntity && victim.isAlive() && range_damage.indexOf(source.getType()) != -1) {
            var dx = attacker.getX() - victim.getX();
            var dy = attacker.getY() - victim.getY();
            var dz = attacker.getZ() - victim.getZ();
            var distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            var multiplier = 1 + Math.min(distance * 0.1, 2.0);
            event.setAmount(event.getAmount() * multiplier);
        }
    }
}
