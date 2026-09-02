// priority: 5000
/**
 * 极限证章：佩戴者造成的全部伤害降低50%。
 * 在 LivingHurtEvent 中调用，兼容直接攻击和投射物攻击。
 */
function handleDespairInsigniaDeath(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage, context) {
    try{
    let damagePlayer = attacker;
    if (damagePlayer == null || !damagePlayer.isPlayer()) {
        let directEntity = source != null ? source.immediate : null;
        if (directEntity != null && directEntity.owner != null && directEntity.owner.isPlayer()) {
            damagePlayer = directEntity.owner;
        }
    }
    if (damagePlayer == null || !damagePlayer.isPlayer()) return;
    let hasInsignia = damagePlayer == attacker
        ? hasContextCurio(context, "attacker", damagePlayer, 'rainbow:despair_insignia')
        : getCuriosItem(damagePlayer, 'rainbow:despair_insignia') != null;
    if (!hasInsignia) return;
    if (!(event.getAmount() > 0)) return;
    event.setAmount(event.getAmount() * 0.5);
    }catch(e){
        console.log('handleDespairInsigniaDamage报错:')
        console.log(e)
    }
}
