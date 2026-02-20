// Priority: 5000
/**
 * 处理玩家造成伤害时为特定饰品充能
 * @param {Internal.LivingHurtEvent} event
 * @param {Internal.Entity} attacker 伤害来源的致因实体 (如玩家)
 * @param {Internal.Entity} victim 受害者实体
 */
function handleCoreCharging(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage) {
    if (!attacker || !attacker.isAlive()) return;

    const MAX_ENERGY = 200;
    // 获取直接造成伤害的实体 (如箭、三叉戟、或玩家本身)
    const directEntity = source.immediate;

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
                        if (energy < MAX_ENERGY) {
                            nbt.putFloat("Energy", Math.min(MAX_ENERGY, energy + amount));
                        }else
                        {
                            // 播放音效，使用 victim 的位置
                            if (victim) {
                                attacker.level.playSound(null, victim.getX(), victim.getY(), victim.getZ(), "minecraft:ui.button.click", "voice", 1, 1);
                            }
                        }
                    }
                }
            }else if(directEntity.owner && directEntity.owner.isPlayer())
                {
                    let Owner = directEntity.owner;
                    if (hasCurios(Owner, id) && !Owner.cooldowns.isOnCooldown(id)) {
                        let stack = getCuriosItem(Owner, id);
                        if (stack) {
                            let nbt = stack.getOrCreateTag();
                            let energy = nbt.getFloat("Energy") || 0;
                            if (energy < MAX_ENERGY) {
                                nbt.putFloat("Energy", Math.min(MAX_ENERGY, energy + amount));
                            }else
                            {
                                // 播放音效，使用 victim 的位置
                                if (victim) {
                                    Owner.level.playSound(null, victim.getX(), victim.getY(), victim.getZ(), "minecraft:ui.button.click", "voice", 1, 1);
                                }
                            }
                        }
                    }
                }
    });
}
