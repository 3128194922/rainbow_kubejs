// Priority: 5000
/**
 * 处理玩家造成伤害时为特定饰品充能
 * @param {Internal.LivingHurtEvent} event
 * @param {Internal.Entity} attacker 伤害来源的致因实体 (如玩家)
 * @param {Internal.Entity} victim 受害者实体
 */
function handleCoreCharging(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage) {
    if (!attacker || !attacker.isAlive()) return;

    // 获取直接造成伤害的实体 (如箭、三叉戟、或玩家本身)
    const directEntity = event.source.immediate;

    const coreIds = ['rainbow:reload_core', 'rainbow:short_core'];
    const amount = event.getAmount();

    coreIds.forEach(id => {
        if(attacker.isPlayer())
            {
                if (hasCurios(attacker, id) && !attacker.cooldowns.isOnCooldown(id)) {
                    let stack = getCuriosItem(attacker, id);
                    if (stack) {
                        let nbt = stack.getOrCreateTag();
                        let energy = nbt.getFloat("Energy") || 0;
                        if (energy < 100) {
                            nbt.putFloat("Energy", Math.min(100, energy + amount));
                        }else
                        {
                            // 播放音效，使用 victim 的位置
                            if (victim) {
                                attacker.level.playSound(null, victim.getX(), victim.getY(), victim.getZ(), "minecraft:ui.button.click", "voice", 1, 1);
                            }
                        }
                    }
                }
            }
    });
}
