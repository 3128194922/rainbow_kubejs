// Priority: 5000
/**
 * 处理玩家造成伤害时为特定饰品充能
 * @param {Internal.LivingHurtEvent} event
 * @param {Internal.Entity} attacker
 */
function handleCoreCharging(event, attacker) {
    if (!attacker || !attacker.isPlayer()) return;

    const coreIds = ['rainbow:reload_core', 'rainbow:short_core'];
    const amount = event.getAmount();

    coreIds.forEach(id => {
        if (hasCurios(attacker, id) && !attacker.cooldowns.isOnCooldown(id)) {
            let stack = getCuriosItem(attacker, id);
            if (stack) {
                let nbt = stack.getOrCreateTag();
                let energy = nbt.getFloat("Energy") || 0;
                if (energy < 100) {
                    nbt.putFloat("Energy", Math.min(100, energy + amount));
                }
            }
        }
    });
}
