// Priority: 5000
/**
 * 自定义属性伤害事件
 * @param {Internal.LivingHurtEvent} event
 * @param {Internal.Entity} attacker
 * @param {Internal.Entity} victim
 * @param {Internal.Entity} source
 * @param {number} range_damage 远程伤害
 * @param {number} thrown_damage 投掷伤害
 * @param {number} soure_magic 魔法伤害
 * @param {number} boom_damage 爆炸伤害
 */
function customAttributeDamage(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage) {
    if (!attacker || !attacker.isLiving()) return;

    if (thrown_damage.indexOf(source.getType()) != -1) {
        let attributeValue = attacker.getAttributeValue("rainbow:generic.thrown_damage");
        event.setAmount(attributeValue * event.getAmount())
    }

    if (soure_magic.indexOf(source.getType()) != -1) {
        let attributeValue = attacker.getAttributeValue("rainbow:generic.magic_damage");
        event.setAmount(attributeValue * event.getAmount())
    }

    if (boom_damage.indexOf(source.getType()) != -1) {
        let attributeValue = attacker.getAttributeValue("rainbow:generic.boom_damage");
        event.setAmount(attributeValue * event.getAmount())
    }
}