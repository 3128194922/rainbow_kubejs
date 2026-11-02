// Priority: 5000
/**
 * 自定义属性伤害事件
 * @param {Internal.LivingHurtEvent} event
 * @param {Internal.Entity} attacker
 * @param {Internal.Entity} victim
 * @param {Internal.Entity} source
 * @param {Object} range_damage 远程伤害类型键集合
 * @param {Object} thrown_damage 投掷伤害类型键集合
 * @param {Object} soure_magic 魔法伤害类型键集合
 * @param {Object} boom_damage 爆炸伤害类型键集合
 */
function customAttributeDamage(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage, context) {
    if (!attacker || !attacker.isLiving()) return;
    let damageType = context != null ? context.damageType : String(source.getType());
    let isThrownDamage = context != null ? context.isThrownDamage : thrown_damage[damageType] === true;
    let isExplosionDamage = context != null ? context.isExplosionDamage : boom_damage[damageType] === true;

    if (isThrownDamage) {
        let attributeValue = attacker.getAttributeValue("rainbow:generic.thrown_damage");
        event.setAmount(attributeValue + event.getAmount())
    }
/*
    if (soure_magic.indexOf(source.getType()) != -1) {
        let attributeValue = attacker.getAttributeValue("rainbow:generic.magic_damage");
        event.setAmount(attributeValue * event.getAmount())
    }*/

    if (isExplosionDamage) {
        let attributeValue = attacker.getAttributeValue("rainbow:generic.boom_damage");
        event.setAmount(attributeValue + event.getAmount())
    }
}
