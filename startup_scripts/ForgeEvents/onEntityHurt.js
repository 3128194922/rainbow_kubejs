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

    // --- 毒系药水效果伤害增幅（相乘叠乘，仅限 魔法/毒液/凋零 伤害类型） ---
    // 实体受伤时，若拥有 毒/凋零/流血/毒液 效果，本次伤害乘以 该效果(等级+1) 倍
    // 保底算法：只要检测到任意目标效果，本次伤害类型命中白名单，倍率至少 ×2（防止低等级/检测异常导致无加成）
    try {
        let damageTypeWhiteList = ["magic", "runiclib.venom", "wither"];
        let whiteSegments = ["magic", "venom", "wither"];
        // 1.19.4+ DamageSource 的 msgId 访问器是 msgId()，非 getMsgId()
        let damageMsgId = null;
        try {
            damageMsgId = String(source.msgId());
        } catch (e2) {
            // 兜底：从 toString（形如 "DamageSource (minecraft:magic)"）中提取伤害类型
            let raw = String(source);
            let matchResult = raw.match(/\(([^)]+)\)/);
            if (matchResult != null && matchResult.length > 1) {
                damageMsgId = matchResult[1];
            }
        }
        if (damageMsgId == null) {
            console.log("毒系效果增幅: 无法识别伤害类型 " + String(source));
        } else {
            let lastSegment = damageMsgId.replace(":", ".").split(".").pop(); // 兼容 "runiclib:venom"/"runiclib.venom" 等带前缀写法
            let isDamageTypeMatched = damageTypeWhiteList.indexOf(damageMsgId) != -1
                || whiteSegments.indexOf(lastSegment) != -1;
            if (isDamageTypeMatched) {
                let amplificationEffects = ["effect.minecraft.poison", "effect.minecraft.wither", "effect.attributeslib.bleeding", "effect.runiclib.venom"];
                let activeEffects = victim.getActiveEffects();
                let debuffMultiplier = 1.0;
                let hasDebuff = false;
                if (activeEffects != null && activeEffects.size() > 0) {
                    for (let effectInstance of activeEffects) {
                        let effectId = effectInstance.getDescriptionId();
                        if (amplificationEffects.indexOf(effectId) != -1) {
                            hasDebuff = true;
                            debuffMultiplier *= (effectInstance.getAmplifier() + 2); // 等级 = amplifier+1，故等级+1 = amplifier+2
                        }
                    }
                }
                if (hasDebuff) {
                    debuffMultiplier = Math.max(debuffMultiplier, 2.0); // 保底：至少有 ×2 加成
                    console.log("毒系效果增幅: " + victim.getName().getString() + " 倍率 x" + debuffMultiplier);
                    event.setAmount(event.getAmount() * debuffMultiplier);
                }
            }
        }
    } catch (e) {
        console.log('onEntityHurt 毒系药水效果增幅报错:');
        console.log(e);
    }

    // --- 划痕之手（hand_of_scratches）：穿戴时，攻击额外对目标造成其最大生命 5% 的额外伤害 ---
    // 穿戴者为攻击者（玩家），额外伤害叠加到本次伤害中，伤害来源仍为攻击者（玩家）
    if (hasCurios(attacker, "rainbow:hand_of_scratches") && attacker && attacker.isPlayer() && victim instanceof LivingEntity && victim.isAlive()) {
        // 原版物品冷却：触发间隔 5s（100 tick），冷却中不额外触发
        if (attacker.cooldowns.isOnCooldown("rainbow:hand_of_scratches")) return;
        attacker.cooldowns.addCooldown("rainbow:hand_of_scratches", 100);
        var extraDamage = victim.getMaxHealth() * 0.05;
        event.setAmount(event.getAmount() + extraDamage);
    }
}
