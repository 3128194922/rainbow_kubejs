// priority: 5000
/**
 * 绝望徽记：佩戴时受到大于1的伤害直接击杀玩家
 * 在 LivingHurtEvent 中调用，位于核心充能逻辑之后
 */
function handleDespairInsigniaDeath(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage) {
    try{
    // 仅对玩家生效
    if (!victim.isPlayer()) return;
    // 未佩戴绝望徽记则跳过
    if (!hasCurios(victim, 'rainbow:despair_insignia')) return;
    // 伤害≤1时放过（避免虚空/指令等强制伤害误杀）
    if (event.getAmount() < 1) return;
    // 设置巨量伤害让玩家自然死亡，避免 victim.kill() 递归触发 LivingHurtEvent
    event.setAmount(1e10);
    }catch(e){
        console.log('handleDespairInsigniaDeath报错:')
        console.log(e)
    }
}